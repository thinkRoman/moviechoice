import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  UnauthorizedLibraryError,
  updateLibrary,
} from '@/lib/movie-library';
import { movieLibraryRepository } from '@/lib/movie-library-repository';

const updateSchema = z.object({
  action: z.enum(['watchlist', 'watched', 'favorite']),
  value: z.boolean(),
  title: z.string().trim().min(1).max(300),
  posterPath: z.string().nullable(),
  releaseYear: z.string().regex(/^\d{4}$/).nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tmdbMovieId: string }> },
) {
  const { tmdbMovieId } = await params;
  const movieId = Number(tmdbMovieId);
  const parsed = updateSchema.safeParse(await request.json());
  if (!Number.isSafeInteger(movieId) || movieId <= 0 || !parsed.success) {
    return NextResponse.json({ error: 'Invalid movie update' }, { status: 400 });
  }

  try {
    const session = await auth();
    const item = await updateLibrary(
      session?.user?.id,
      {
        tmdbMovieId: movieId,
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
    if (error instanceof UnauthorizedLibraryError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Could not update your movies' }, { status: 500 });
  }
}
