import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listLibrary, UnauthorizedLibraryError } from '@/lib/movie-library';
import { movieLibraryRepository } from '@/lib/movie-library-repository';

export async function GET() {
  try {
    const session = await auth();
    const items = await listLibrary(session?.user?.id, movieLibraryRepository);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedLibraryError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Could not load your movies' }, { status: 500 });
  }
}
