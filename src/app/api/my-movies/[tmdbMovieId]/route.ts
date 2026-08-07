import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  UnauthorizedLibraryError,
  updateLibrary,
} from '@/lib/movie-library';
import { movieLibraryRepository } from '@/lib/movie-library-repository';

const updateSchema = z.object({
  action: z.enum(['watchlist', 'watched', 'favorite', 'dismissed']),
  value: z.boolean(),
  title: z.string().trim().min(1).max(300),
  posterPath: z.string().nullish().transform((value) => value ?? null),
  releaseYear: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value == null || value === '') return null;
      const year = String(value).trim().slice(0, 4);
      return /^\d{4}$/.test(year) ? year : null;
    }),
  mediaType: z.enum(['movie', 'tv']).default('movie'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tmdbMovieId: string }> },
) {
  const { tmdbMovieId } = await params;
  const movieId = Number(tmdbMovieId);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(movieId) || movieId <= 0 || !parsed.success) {
    return NextResponse.json({
      error: parsed.success
        ? 'Invalid movie id'
        : (parsed.error.issues[0]?.message || 'Invalid movie update'),
    }, { status: 400 });
  }

  try {
    const session = await auth();
    const item = await updateLibrary(
      session?.user?.id,
      {
        tmdbMovieId: movieId,
        mediaType: parsed.data.mediaType,
        title: parsed.data.title,
        posterPath: parsed.data.posterPath,
        releaseYear: parsed.data.releaseYear,
      },
      parsed.data.action,
      parsed.data.value,
      movieLibraryRepository,
    );
    return NextResponse.json({ item });
  } catch (error) {
    console.error('PUT /api/my-movies failed', error);
    if (error instanceof UnauthorizedLibraryError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Could not update your movies';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
