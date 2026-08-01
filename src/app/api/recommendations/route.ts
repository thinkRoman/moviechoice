import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { discoverTitles } from '@/lib/tmdb';
import {
  DEFAULT_PICK_SETTINGS,
  interpretSessionRequest,
  mergeIntents,
  rankRecommendations,
  type PickSettings,
} from '@/lib/recommendations';
import Profile from '@/models/Profile';
import UserMovie from '@/models/UserMovie';

const settingsSchema = z.object({
  providerIds: z.array(z.number().int().positive()).min(1).max(8),
  genreIds: z.array(z.number().int().positive()).max(10),
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
  providerIds: z.array(z.number().int().positive()).min(1).max(8).optional(),
  genreIds: z.array(z.number().int().positive()).max(10).optional(),
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
  refreshToken: z.string().min(1).max(100).optional().default(() => crypto.randomUUID()),
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
    ...broadLanes.map((lane) => discoverTitles(mediaType, { ...params, sort_by: lane.sort_by }, lane.page)),
    ...providerLanes.map((lane) => discoverTitles(mediaType, {
      ...params,
      with_watch_providers: String(lane.providerId),
      sort_by: lane.sort_by,
    }, lane.page)),
  ];
  return Promise.all(lanes).then((results) => results.flat());
}

export function profileSettings(profile: unknown): PickSettings {
  const stored = (profile as { preferences?: { recommendation?: Partial<PickSettings> } } | null)
    ?.preferences?.recommendation;
  return { ...DEFAULT_PICK_SETTINGS, ...stored };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();
  return NextResponse.json({ settings: profileSettings(profile) });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const generation = generationSchema.safeParse(await request.json().catch(() => ({})));
  if (!generation.success) {
    return NextResponse.json({ error: generation.error.issues[0]?.message || 'Invalid session preferences' }, { status: 400 });
  }

  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();
  const settings = { ...profileSettings(profile), ...generation.data.overrides };
  const parsed = settingsSchema.safeParse(settings);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings' }, { status: 400 });
  }

  const effectiveSettings = parsed.data;
  const intent = mergeIntents(
    interpretSessionRequest(effectiveSettings.tasteNote),
    interpretSessionRequest(generation.data.sessionRequest),
  );

  const suppressed = await UserMovie.find({
    userId: session.user.id,
    $or: [{ watched: true }, { dismissed: true }],
  })
    .select('tmdbMovieId mediaType')
    .lean();
  const watchedMovieIds = new Set(suppressed.filter((item) => (item.mediaType || 'movie') === 'movie').map((item) => item.tmdbMovieId));
  const watchedShowIds = new Set(suppressed.filter((item) => item.mediaType === 'tv').map((item) => item.tmdbMovieId));
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
  const [movies, shows, documentaries] = await Promise.all([
    discoverBroadly('movie', movieParams, effectiveSettings.providerIds, generation.data.refreshToken),
    discoverBroadly('tv', showParams, effectiveSettings.providerIds, generation.data.refreshToken),
    effectiveSettings.documentaryCount
      ? discoverBroadly('movie', {
          with_watch_providers: providerQuery,
          with_genres: '99',
          'primary_release_date.gte': earliest,
          'vote_count.gte': '300',
          'vote_average.gte': '6.6',
        }, effectiveSettings.providerIds, `${generation.data.refreshToken}:documentary`)
      : Promise.resolve([]),
  ]);
  const history = new Set((profile as { recommendationHistory?: string[] } | null)?.recommendationHistory || []);
  const movieSuppressed = new Set([...watchedMovieIds, ...[...history].filter((key) => key.startsWith('movie:')).map((key) => Number(key.slice(6)))]);
  const showSuppressed = new Set([...watchedShowIds, ...[...history].filter((key) => key.startsWith('tv:')).map((key) => Number(key.slice(3)))]);
  const seed = `${session.user.id}:${generation.data.refreshToken}:${JSON.stringify(effectiveSettings)}:${generation.data.sessionRequest}`;
  const items = [
    ...rankRecommendations({ candidates: movies, kind: 'movie', count: effectiveSettings.movieCount, watchedIds: movieSuppressed, settings: effectiveSettings, seed, intent }),
    ...rankRecommendations({ candidates: shows, kind: 'show', count: effectiveSettings.showCount, watchedIds: showSuppressed, settings: effectiveSettings, seed, intent }),
    ...rankRecommendations({ candidates: documentaries, kind: 'documentary', count: effectiveSettings.documentaryCount, watchedIds: movieSuppressed, settings: effectiveSettings, seed, intent }),
  ];
  if (items.length) {
    await Profile.updateOne(
      { userId: session.user.id },
      { $push: { recommendationHistory: { $each: items.map((item) => `${item.mediaType}:${item.id}`), $slice: -80 } } },
    );
  }
  return NextResponse.json({ settings: effectiveSettings, items, generatedAt: new Date().toISOString() });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings' }, { status: 400 });
  }

  await dbConnect();
  await Profile.findOneAndUpdate(
    { userId: session.user.id },
    {
      $set: { 'preferences.recommendation': parsed.data },
      $setOnInsert: {
        name: session.user.name || 'Movie lover',
        'preferences.genres': [],
        'preferences.streamingServices': [],
        tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
        isPrimary: true,
      },
    },
    { upsert: true, new: true },
  );
  return NextResponse.json({ settings: parsed.data });
}
