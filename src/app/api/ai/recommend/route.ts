import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { cachedEnrichDiscoverTitle } from '@/lib/catalog-cache';
import { createRequestId } from '@/lib/id';
import { interpretQuery } from '@/lib/ai/natural-language-recommendations';
import { checkRateLimit } from '@/lib/rate-limit';
import dbConnect from '@/lib/mongodb';
import { discoverTitles, letterboxdUrlForMovie } from '@/lib/tmdb';
import {
  MAX_GENRES,
  MAX_STREAMING_SERVICES,
  normalizePickSettings,
  rankRecommendations,
  type PickSettings,
  type RecommendedTitle,
} from '@/lib/recommendations';
import Profile from '@/models/Profile';
import UserMovie from '@/models/UserMovie';
import { ensureUserProfile } from '@/lib/user-profile';
import { profileSettings } from '@/app/api/recommendations/route';

const AI_RATE_LIMIT_MAX = 10; // requests
const AI_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const querySchema = z.object({
  query: z.string().trim().min(1).max(300),
  movieCount: z.number().int().min(1).max(5).optional().default(3),
  showCount: z.number().int().min(0).max(5).optional().default(2),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to use AI recommendations.' }, { status: 401 });
    }

    // Rate limit: 10 AI requests per hour per user
    const rateLimit = checkRateLimit(`ai:${session.user.id}`, AI_RATE_LIMIT_MAX, AI_RATE_LIMIT_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'AI recommendation limit reached. Try again later or use the standard picks.',
          resetMs: rateLimit.resetMs,
        },
        { status: 429 },
      );
    }

    const body = querySchema.safeParse(await request.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.issues[0]?.message || 'Invalid request' },
        { status: 400 },
      );
    }

    const { query, movieCount, showCount } = body.data;

    // Interpret the natural language query with AI
    const nlpResult = await interpretQuery(query);

    await dbConnect();
    await ensureUserProfile(session.user.id, session.user.name || 'Movie lover');
    const profile = await Profile.findOne({ userId: session.user.id }).lean();
    const settings = profileSettings(profile);

    // Merge AI intent with saved settings
    const intent = nlpResult.intent;
    const providerQuery = settings.providerIds.join('|');
    const requestedGenres = intent.surpriseMe || intent.genreIds.length === 0
      ? settings.genreIds
      : intent.genreIds;
    const genreQuery = (intent.surpriseMe ? [] : requestedGenres)
      .filter((id) => id !== 99)
      .join(intent.genreIds.length ? ',' : '|');

    const earliest = `${new Date().getUTCFullYear() - settings.yearsBack}-01-01`;
    const common = {
      with_watch_providers: providerQuery,
      ...(genreQuery ? { with_genres: genreQuery } : {}),
    };

    const [moviesRaw, showsRaw] = await Promise.all([
      discoverTitles('movie', {
        ...common,
        'primary_release_date.gte': earliest,
        'vote_count.gte': '200',
        'vote_average.gte': '6.5',
        'with_runtime.gte': '65',
        ...(intent.maxRuntime ? { 'with_runtime.lte': String(intent.maxRuntime) } : {}),
      }).catch(() => []),
      discoverTitles('tv', {
        ...common,
        'first_air_date.gte': earliest,
        'vote_count.gte': '100',
        'vote_average.gte': '7',
      }).catch(() => []),
    ]);

    // Load user's library for suppression
    const library = await UserMovie.find({ userId: session.user.id })
      .select('tmdbMovieId mediaType watched dismissed')
      .lean();
    const suppressed = library.filter((item) => item.watched || item.dismissed);
    const watchedMovieIds = new Set(
      suppressed.filter((item) => (item.mediaType || 'movie') === 'movie').map((item) => item.tmdbMovieId),
    );
    const watchedShowIds = new Set(
      suppressed.filter((item) => item.mediaType === 'tv').map((item) => item.tmdbMovieId),
    );

    const seed = `ai:${session.user.id}:${createRequestId()}:${query}`;

    const rankedMovies = rankRecommendations({
      candidates: moviesRaw,
      kind: 'movie',
      count: movieCount * 3,
      watchedIds: watchedMovieIds,
      settings,
      seed,
      intent,
    });

    const rankedShows = rankRecommendations({
      candidates: showsRaw,
      kind: 'show',
      count: showCount * 3,
      watchedIds: watchedShowIds,
      settings,
      seed,
      intent,
    });

    // Enrich top picks
    const enriched: RecommendedTitle[] = [];
    for (const item of [...rankedMovies.slice(0, movieCount), ...rankedShows.slice(0, showCount)]) {
      try {
        const details = await cachedEnrichDiscoverTitle(item, settings.providerIds);
        enriched.push({
          ...item,
          ...details,
          kind: item.kind,
          score: item.score,
          reason: item.reason,
          letterboxdUrl: item.mediaType === 'movie'
            ? letterboxdUrlForMovie({ title: item.title, year: item.year, imdbId: details.imdbId })
            : null,
        });
      } catch {
        // Skip titles that fail enrichment
      }
    }

    return NextResponse.json({
      items: enriched,
      interpretation: nlpResult.interpretation,
      query: nlpResult.raw,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetMs: rateLimit.resetMs,
      },
    });
  } catch (error) {
    console.error('POST /api/ai/recommend failed', error);
    return NextResponse.json(
      { error: 'AI recommendations unavailable. Try standard picks instead.' },
      { status: 500 },
    );
  }
}
