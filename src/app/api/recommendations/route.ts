import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { explainRecommendations } from '@/lib/ai/explanations';
import { cachedEnrichDiscoverTitle } from '@/lib/catalog-cache';
import { createRequestId } from '@/lib/id';
import dbConnect from '@/lib/mongodb';
import { discoverTitles, getTitleRecommendations } from '@/lib/tmdb';
import {
  DEFAULT_PICK_SETTINGS,
  MAX_GENRES,
  MAX_STREAMING_SERVICES,
  interpretSessionRequest,
  isOnboardingNeeded,
  mergeIntents,
  mergeSeedCandidates,
  needsWeeklyRefresh,
  normalizePickSettings,
  rankRecommendations,
  type PickSettings,
  type RecommendedTitle,
} from '@/lib/recommendations';
import Profile from '@/models/Profile';
import UserMovie from '@/models/UserMovie';
import { ensureUserProfile } from '@/lib/user-profile';

const settingsSchema = z.object({
  providerIds: z.array(z.number().int().positive()).min(1).max(MAX_STREAMING_SERVICES),
  genreIds: z.array(z.number().int().positive()).max(MAX_GENRES),
  tasteNote: z.string().trim().max(240),
  yearsBack: z.number().int().min(1).max(30),
  movieCount: z.number().int().min(0).max(10),
  showCount: z.number().int().min(0).max(10),
  documentaryCount: z.number().int().min(0).max(10),
  includeInternational: z.boolean(),
  weeklyRefresh: z.boolean(),
}).refine((value) => value.movieCount + value.showCount + value.documentaryCount > 0, {
  message: 'Choose at least one recommendation.',
});

const sessionOverridesSchema = z.object({
  providerIds: z.array(z.number().int().positive()).min(1).max(MAX_STREAMING_SERVICES).optional(),
  genreIds: z.array(z.number().int().positive()).max(MAX_GENRES).optional(),
  tasteNote: z.string().trim().max(240).optional(),
  yearsBack: z.number().int().min(1).max(30).optional(),
  movieCount: z.number().int().min(0).max(10).optional(),
  showCount: z.number().int().min(0).max(10).optional(),
  documentaryCount: z.number().int().min(0).max(10).optional(),
  includeInternational: z.boolean().optional(),
});

const generationSchema = z.object({
  overrides: sessionOverridesSchema.optional().default({}),
  sessionRequest: z.string().trim().max(240).optional().default(''),
  refreshToken: z.string().min(1).max(100).optional(),
});

function tokenNumber(token: string): number {
  let hash = 2166136261;
  for (const char of token) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return Math.abs(hash);
}

async function discoverBroadly(
  mediaType: 'movie' | 'tv',
  params: Record<string, string>,
  providerIds: number[],
  token: string,
) {
  const rotation = tokenNumber(`${token}:${mediaType}`);
  const dateSort = mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
  const broadLanes = [
    { sort_by: 'popularity.desc', page: 1 + rotation % 4 },
    { sort_by: 'vote_average.desc', page: 1 + Math.floor(rotation / 7) % 4 },
    { sort_by: dateSort, page: 1 + Math.floor(rotation / 17) % 3 },
  ];
  const providerLanes = providerIds.slice(0, 6).map((providerId, index) => ({
    sort_by: index % 2 ? 'vote_count.desc' : 'popularity.desc',
    page: 1 + Math.floor(rotation / (index + 3)) % 3,
    providerId,
  }));
  const lanes = [
    ...broadLanes.map((lane) =>
      discoverTitles(mediaType, { ...params, sort_by: lane.sort_by }, lane.page).catch(() => []),
    ),
    ...providerLanes.map((lane) =>
      discoverTitles(mediaType, {
        ...params,
        with_watch_providers: String(lane.providerId),
        sort_by: lane.sort_by,
      }, lane.page).catch(() => []),
    ),
  ];
  return Promise.all(lanes).then((results) => results.flat());
}

async function finalizePicks(
  ranked: RecommendedTitle[],
  settings: PickSettings,
  tasteNote: string,
  needed: { movie: number; show: number; documentary: number },
): Promise<RecommendedTitle[]> {
  if (!ranked.length) return [];

  const enriched: RecommendedTitle[] = [];
  for (const item of ranked) {
    const kindNeeded =
      item.kind === 'movie' ? needed.movie
        : item.kind === 'show' ? needed.show
          : needed.documentary;
    const have = enriched.filter((entry) => entry.kind === item.kind).length;
    if (have >= kindNeeded) continue;

    try {
      const details = await cachedEnrichDiscoverTitle(item, settings.providerIds);
      if (settings.providerIds.length && !details.providerNames.length) continue;
      enriched.push({
        ...item,
        ...details,
        kind: item.kind,
        score: item.score,
        reason: item.reason,
        letterboxdUrl: item.mediaType === 'movie'
          ? `https://letterboxd.com/search/${encodeURIComponent(item.title)}/`
          : null,
      });
    } catch {
      // Skip titles that fail enrichment rather than risk bad availability.
    }
  }

  const reasons = await explainRecommendations(
    enriched.map((item) => ({
      id: item.id,
      mediaType: item.mediaType,
      title: item.title,
      year: item.year,
      overview: item.overview,
      kind: item.kind,
    })),
    tasteNote,
  );

  return enriched.map((item) => ({
    ...item,
    reason: reasons[`${item.mediaType}:${item.id}`] || item.reason,
  }));
}

export function profileSettings(profile: unknown): PickSettings {
  const stored = (profile as { preferences?: { recommendation?: Partial<PickSettings> } } | null)
    ?.preferences?.recommendation;
  return normalizePickSettings({ ...DEFAULT_PICK_SETTINGS, ...stored });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', settings: DEFAULT_PICK_SETTINGS }, { status: 401 });
    }

    let profile: Record<string, unknown> | null = null;
    try {
      await dbConnect();
      await ensureUserProfile(session.user.id, session.user.name || 'Movie lover');
      profile = await Profile.findOne({ userId: session.user.id }).lean() as Record<string, unknown> | null;
    } catch (error) {
      console.error('Failed to load recommendation settings profile', error);
    }

    const settings = profileSettings(profile);
    const lastGeneratedAt = (profile?.lastPicksGeneratedAt as Date | null | undefined) || null;
    const onboardingCompletedAt = (profile?.onboardingCompletedAt as Date | null | undefined) || null;

    return NextResponse.json({
      settings,
      lastGeneratedAt,
      needsWeeklyRefresh: needsWeeklyRefresh(settings.weeklyRefresh, lastGeneratedAt),
      needsOnboarding: isOnboardingNeeded(settings, onboardingCompletedAt, lastGeneratedAt),
    });
  } catch (error) {
    console.error('GET /api/recommendations failed', error);
    return NextResponse.json({
      settings: DEFAULT_PICK_SETTINGS,
      needsWeeklyRefresh: false,
      needsOnboarding: false,
      error: 'Could not load settings',
    }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to get picks.' }, { status: 401 });
    }

    const generation = generationSchema.safeParse(await request.json().catch(() => ({})));
    if (!generation.success) {
      return NextResponse.json(
        { error: generation.error.issues[0]?.message || 'Invalid session preferences' },
        { status: 400 },
      );
    }

    const refreshToken = generation.data.refreshToken || createRequestId();

    await dbConnect();
    try {
      await ensureUserProfile(session.user.id, session.user.name || 'Movie lover');
    } catch (error) {
      console.error('ensureUserProfile during picks failed', error);
    }

    const profile = await Profile.findOne({ userId: session.user.id }).lean();
    const settings = { ...profileSettings(profile), ...generation.data.overrides };
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid settings' },
        { status: 400 },
      );
    }

    const effectiveSettings = parsed.data;
    if (!effectiveSettings.providerIds.length) {
      return NextResponse.json(
        { error: 'Choose at least one streaming service in Settings first.' },
        { status: 400 },
      );
    }

    const intent = mergeIntents(
      interpretSessionRequest(effectiveSettings.tasteNote),
      interpretSessionRequest(generation.data.sessionRequest),
    );

    const library = await UserMovie.find({ userId: session.user.id })
      .select('tmdbMovieId mediaType watched dismissed favorite')
      .lean();
    const suppressed = library.filter((item) => item.watched || item.dismissed);
    const favorites = library.filter((item) => item.favorite);
    const softAvoidGenreIds: number[] = [];

    const watchedMovieIds = new Set(
      suppressed
        .filter((item) => (item.mediaType || 'movie') === 'movie')
        .map((item) => item.tmdbMovieId),
    );
    const watchedShowIds = new Set(
      suppressed.filter((item) => item.mediaType === 'tv').map((item) => item.tmdbMovieId),
    );
    const providerQuery = effectiveSettings.providerIds.join('|');
    const requestedGenres = intent.surpriseMe || intent.genreIds.length === 0
      ? effectiveSettings.genreIds
      : intent.genreIds;
    const genreQuery = (intent.surpriseMe ? [] : requestedGenres)
      .filter((id) => id !== 99)
      .join(intent.genreIds.length ? ',' : '|');
    const earliest = `${new Date().getUTCFullYear() - effectiveSettings.yearsBack}-01-01`;
    const common = {
      with_watch_providers: providerQuery,
      ...(genreQuery ? { with_genres: genreQuery } : {}),
    };
    const movieParams = {
      ...common,
      'primary_release_date.gte': earliest,
      'vote_count.gte': '300',
      'vote_average.gte': '6.6',
      'with_runtime.gte': '65',
      ...(intent.maxRuntime ? { 'with_runtime.lte': String(intent.maxRuntime) } : {}),
    };
    const showParams = {
      ...common,
      'first_air_date.gte': earliest,
      'vote_count.gte': '150',
      'vote_average.gte': '7',
    };

    const movieFetchCount = Math.max(effectiveSettings.movieCount * 4, effectiveSettings.movieCount + 6);
    const showFetchCount = Math.max(effectiveSettings.showCount * 4, effectiveSettings.showCount + 6);
    const docFetchCount = Math.max(effectiveSettings.documentaryCount * 3, effectiveSettings.documentaryCount + 3);

    const [moviesRaw, showsRaw, documentaries, movieSeeds, showSeeds] = await Promise.all([
      effectiveSettings.movieCount
        ? discoverBroadly('movie', movieParams, effectiveSettings.providerIds, refreshToken)
        : Promise.resolve([]),
      effectiveSettings.showCount
        ? discoverBroadly('tv', showParams, effectiveSettings.providerIds, refreshToken)
        : Promise.resolve([]),
      effectiveSettings.documentaryCount
        ? discoverBroadly('movie', {
            with_watch_providers: providerQuery,
            with_genres: '99',
            'primary_release_date.gte': earliest,
            'vote_count.gte': '300',
            'vote_average.gte': '6.6',
          }, effectiveSettings.providerIds, `${refreshToken}:documentary`)
        : Promise.resolve([]),
      Promise.all(
        favorites
          .filter((item) => (item.mediaType || 'movie') === 'movie')
          .slice(0, 3)
          .map((item) => getTitleRecommendations('movie', item.tmdbMovieId).catch(() => [])),
      ).then((rows) => rows.flat()),
      Promise.all(
        favorites
          .filter((item) => item.mediaType === 'tv')
          .slice(0, 3)
          .map((item) => getTitleRecommendations('tv', item.tmdbMovieId).catch(() => [])),
      ).then((rows) => rows.flat()),
    ]);

    const moviesMerged = mergeSeedCandidates(moviesRaw, movieSeeds);
    const showsMerged = mergeSeedCandidates(showsRaw, showSeeds);

    const history = new Set(
      (profile as { recommendationHistory?: string[] } | null)?.recommendationHistory || [],
    );
    const movieSuppressed = new Set([
      ...watchedMovieIds,
      ...[...history].filter((key) => key.startsWith('movie:')).map((key) => Number(key.slice(6))),
    ]);
    const showSuppressed = new Set([
      ...watchedShowIds,
      ...[...history].filter((key) => key.startsWith('tv:')).map((key) => Number(key.slice(3))),
    ]);
    const seed = `${session.user.id}:${refreshToken}:${JSON.stringify(effectiveSettings)}:${generation.data.sessionRequest}`;

    const rankedPool = [
      ...rankRecommendations({
        candidates: moviesMerged.candidates,
        kind: 'movie',
        count: movieFetchCount,
        watchedIds: movieSuppressed,
        settings: effectiveSettings,
        seed,
        intent,
        seedBoosts: moviesMerged.boosts,
        softAvoidGenreIds,
      }),
      ...rankRecommendations({
        candidates: showsMerged.candidates,
        kind: 'show',
        count: showFetchCount,
        watchedIds: showSuppressed,
        settings: effectiveSettings,
        seed,
        intent,
        seedBoosts: showsMerged.boosts,
        softAvoidGenreIds,
      }),
      ...rankRecommendations({
        candidates: documentaries,
        kind: 'documentary',
        count: docFetchCount,
        watchedIds: movieSuppressed,
        settings: effectiveSettings,
        seed: `${seed}:doc`,
        intent,
        softAvoidGenreIds,
      }),
    ];

    const finalized = await finalizePicks(
      rankedPool,
      effectiveSettings,
      [effectiveSettings.tasteNote, generation.data.sessionRequest].filter(Boolean).join(' — '),
      {
        movie: effectiveSettings.movieCount,
        show: effectiveSettings.showCount,
        documentary: effectiveSettings.documentaryCount,
      },
    );

    const items = [
      ...finalized.filter((item) => item.kind === 'movie').slice(0, effectiveSettings.movieCount),
      ...finalized.filter((item) => item.kind === 'show').slice(0, effectiveSettings.showCount),
      ...finalized.filter((item) => item.kind === 'documentary').slice(0, effectiveSettings.documentaryCount),
    ];

    const generatedAt = new Date();
    if (items.length) {
      await Profile.updateOne(
        { userId: session.user.id },
        {
          $set: { lastPicksGeneratedAt: generatedAt },
          $push: {
            recommendationHistory: {
              $each: items.map((item) => `${item.mediaType}:${item.id}`),
              $slice: -80,
            },
          },
        },
      );
    }

    return NextResponse.json({
      settings: effectiveSettings,
      items,
      generatedAt: generatedAt.toISOString(),
    });
  } catch (error) {
    console.error('POST /api/recommendations failed', error);
    const message = error instanceof Error ? error.message : 'Could not build picks right now.';
    // Never hide the real failure behind a generic pattern message — that made debugging impossible.
    const friendly = message === 'The string did not match the expected pattern.'
      ? 'Could not build picks (request id / parsing glitch). Tap Recommend Now again.'
      : message;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null) as (Partial<PickSettings> & {
    completeOnboarding?: boolean;
    clearHistory?: boolean;
  }) | null;

  if (body?.clearHistory) {
    await dbConnect();
    await Profile.updateOne(
      { userId: session.user.id },
      { $set: { recommendationHistory: [] } },
    );
    return NextResponse.json({ ok: true, cleared: true });
  }

  const parsed = settingsSchema.safeParse(normalizePickSettings(body));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings' }, { status: 400 });
  }

  try {
    await dbConnect();
    await ensureUserProfile(session.user.id, session.user.name || 'Movie lover');
    await Profile.findOneAndUpdate(
      { userId: session.user.id },
      {
        $set: {
          name: session.user.name || 'Movie lover',
          'preferences.recommendation': parsed.data,
          ...(body?.completeOnboarding ? { onboardingCompletedAt: new Date() } : {}),
        },
        $setOnInsert: {
          'preferences.genres': [],
          'preferences.streamingServices': [],
          tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
          recommendationHistory: [],
          isPrimary: true,
        },
      },
      { upsert: true, new: true },
    );
    return NextResponse.json({ settings: parsed.data });
  } catch (error) {
    console.error('PUT /api/recommendations failed', error);
    return NextResponse.json({ error: 'Could not save settings' }, { status: 500 });
  }
}
