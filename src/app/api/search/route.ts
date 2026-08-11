import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchMovies, enrichDiscoverTitle, type MovieSummary, type DiscoverTitle } from '@/lib/tmdb';
import { STREAMING_SERVICES } from '@/lib/recommendations';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';
    const filterStreaming = request.nextUrl.searchParams.get('filterStreaming') === 'true';

    if (!query) {
      return NextResponse.json({ movies: [], page: 1, totalPages: 0, totalResults: 0 });
    }

    const result = await searchMovies(query);

    if (!filterStreaming) {
      return NextResponse.json(result);
    }

    // Get user's subscribed services
    let providerIds: number[] = [];
    try {
      const session = await auth();
      if (session?.user?.id) {
        await dbConnect();
        const profile = await Profile.findOne({ userId: session.user.id })
          .select('preferences.recommendation.providerIds')
          .lean();
        providerIds = profile?.preferences?.recommendation?.providerIds || [];
      }
    } catch {
      // Not authenticated or DB error — return unfiltered results
    }

    if (providerIds.length === 0) {
      return NextResponse.json(result);
    }

    // Enrich each result with streaming availability (limit to first 20 for performance)
    const sliced = result.movies.slice(0, 20);
    const enriched = await Promise.allSettled(
      sliced.map(async (movie) => {
        const discover: DiscoverTitle = {
          id: movie.id,
          mediaType: 'movie',
          title: movie.title,
          overview: movie.overview || '',
          posterUrl: movie.posterUrl,
          posterPath: movie.posterPath,
          backdropUrl: movie.backdropUrl,
          releaseDate: movie.releaseDate,
          year: movie.year,
          rating: movie.rating,
          voteCount: movie.voteCount,
          popularity: movie.popularity,
          genreIds: [],
          international: false,
          originalLanguage: null,
        };
        const details = await enrichDiscoverTitle(discover, providerIds);
        return {
          ...movie,
          availableOnUserServices: details.providerNames.length > 0,
          availableProviders: details.providerNames,
        };
      }),
    );

    const movies = enriched.map((settlement, index) => {
      if (settlement.status === 'fulfilled') return settlement.value;
      const original = sliced[index];
      return { ...original, availableOnUserServices: false, availableProviders: [] as string[] };
    });

    return NextResponse.json({
      ...result,
      movies,
    });
  } catch (error) {
    console.error('GET /api/search failed', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
