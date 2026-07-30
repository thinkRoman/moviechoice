import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHomeMovies, getMovieDetails, searchMovies } from '@/lib/tmdb';

const movie = {
  id: 27205,
  title: 'Inception',
  overview: 'A thief enters dreams.',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '2010-07-15',
  vote_average: 8.4,
  vote_count: 37000,
  popularity: 120,
};

describe('TMDB server integration', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_API_READ_ACCESS_TOKEN', 'server-only-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('loads all home collections in parallel with Bearer authentication', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify({ page: 1, results: [movie], total_pages: 1, total_results: 1 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getHomeMovies();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.trending[0]).toMatchObject({
      id: 27205,
      title: 'Inception',
      year: '2010',
      rating: 8.4,
    });
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer server-only-token',
    });
  });

  it('searches movies and maps image URLs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ page: 1, results: [movie], total_pages: 2, total_results: 21 })),
    ));

    const result = await searchMovies('Inception');

    expect(result.totalResults).toBe(21);
    expect(result.movies[0].posterUrl).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
  });

  it('returns movie details with top cast and an official YouTube trailer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        ...movie,
        runtime: 148,
        genres: [{ id: 28, name: 'Action' }],
        credits: {
          cast: [{ id: 1, name: 'Leonardo DiCaprio', character: 'Cobb', profile_path: '/leo.jpg', order: 0 }],
        },
        videos: {
          results: [{ id: 'video', key: 'YoHD9XEInc0', name: 'Trailer', site: 'YouTube', type: 'Trailer', official: true }],
        },
      })),
    ));

    const result = await getMovieDetails('27205');

    expect(result).toMatchObject({
      runtime: 148,
      genres: ['Action'],
      trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    });
    expect(result?.cast[0]).toMatchObject({ name: 'Leonardo DiCaprio', character: 'Cobb' });
  });
});
