import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { discoverTitles } from '@/lib/tmdb';
import {
  DEFAULT_PICK_SETTINGS,
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
  const body = await request.json().catch(() => ({}));
  const overrides = sessionOverridesSchema.safeParse(body.overrides ?? {});
  if (!overrides.success) {
    return NextResponse.json({ error: overrides.error.issues[0]?.message || 'Invalid session preferences' }, { status: 400 });
  }

  await dbConnect();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();
  const settings = { ...profileSettings(profile), ...(overrides.data || {}) };
  const parsed = settingsSchema.safeParse(settings);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings' }, { status: 400 });
  }

  const effectiveSettings = parsed.data;

  const watched = await UserMovie.find({ userId: session.user.id, watched: true })
    .select('tmdbMovieId')
    .lean();
  const watchedIds = new Set(watched.map((item) => item.tmdbMovieId));
  const providerQuery = effectiveSettings.providerIds.join('|');
  const genreQuery = effectiveSettings.genreIds.filter((id) => id !== 99).join('|');
  const earliest = `${new Date().getUTCFullYear() - effectiveSettings.yearsBack}-01-01`;
  const common = {
    with_watch_providers: providerQuery,
    ...(genreQuery ? { with_genres: genreQuery } : {}),
  };
  const [movies, shows, documentaries] = await Promise.all([
    Promise.all([1, 2].map((page) => discoverTitles('movie', {
      ...common,
      'primary_release_date.gte': earliest,
      'vote_count.gte': '300',
      'vote_average.gte': '6.6',
      'with_runtime.gte': '65',
    }, page))).then((pages) => pages.flat()),
    Promise.all([1, 2].map((page) => discoverTitles('tv', {
      ...common,
      'first_air_date.gte': earliest,
      'vote_count.gte': '150',
      'vote_average.gte': '7',
    }, page))).then((pages) => pages.flat()),
    effectiveSettings.documentaryCount
      ? Promise.all([1, 2].map((page) => discoverTitles('movie', {
          with_watch_providers: providerQuery,
          with_genres: '99',
          'primary_release_date.gte': earliest,
          'vote_count.gte': '300',
          'vote_average.gte': '6.6',
        }, page))).then((pages) => pages.flat())
      : Promise.resolve([]),
  ]);
  const seed = `${session.user.id}:${new Date().toISOString().slice(0, 10)}:${JSON.stringify(effectiveSettings)}`;
  const items = [
    ...rankRecommendations({ candidates: movies, kind: 'movie', count: effectiveSettings.movieCount, watchedIds, settings: effectiveSettings, seed }),
    ...rankRecommendations({ candidates: shows, kind: 'show', count: effectiveSettings.showCount, watchedIds: new Set(), settings: effectiveSettings, seed }),
    ...rankRecommendations({ candidates: documentaries, kind: 'documentary', count: effectiveSettings.documentaryCount, watchedIds, settings: effectiveSettings, seed }),
  ];
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
