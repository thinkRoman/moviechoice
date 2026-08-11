import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterFutureReleases,
  getComingSoonMovies,
  getHomeMovies,
  getMovieDetails,
  getWhatsNewOnProvider,
  letterboxdUrlForMovie,
  searchMovies,
  utcDateString,
  whatsNewDateWindow,
} from '@/lib/tmdb';

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
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/discover/movie')) {
        return new Response(JSON.stringify({
          page: 1,
          results: [{
            ...movie,
            id: 99,
            title: 'Future Film',
            release_date: '2026-09-01',
          }],
          total_pages: 1,
          total_results: 1,
        }));
      }
      return new Response(JSON.stringify({ page: 1, results: [movie], total_pages: 1, total_results: 1 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const today = new Date('2026-08-07T12:00:00Z');
    const result = await getHomeMovies(today);

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(result.trending[0]).toMatchObject({
      id: 27205,
      title: 'Inception',
      year: '2010',
      rating: 8.4,
    });
    expect(result.upcoming.every((item) => (item.releaseDate || '') >= '2026-08-07')).toBe(true);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer server-only-token',
    });
  });

  it('coming soon requests US theatrical releases from today forward', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get('region')).toBe('US');
      expect(url.searchParams.get('with_release_type')).toBe('2|3');
      expect(url.searchParams.get('primary_release_date.gte')).toBe('2026-08-07');
      return new Response(JSON.stringify({
        page: 1,
        results: [
          { ...movie, id: 1, title: 'Already Out', release_date: '2026-07-10' },
          { ...movie, id: 2, title: 'Next Week', release_date: '2026-08-14' },
        ],
        total_pages: 1,
        total_results: 2,
      }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const upcoming = await getComingSoonMovies(new Date('2026-08-07T12:00:00Z'));
    expect(upcoming.map((item) => item.title)).toEqual(['Next Week']);
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

describe('coming soon date helpers', () => {
  it('uses UTC calendar dates', () => {
    expect(utcDateString(new Date('2026-08-07T01:00:00Z'))).toBe('2026-08-07');
  });

  it('drops already-released titles', () => {
    expect(filterFutureReleases([
      { releaseDate: '2026-07-01' },
      { releaseDate: '2026-08-07' },
      { releaseDate: null },
    ], '2026-08-07')).toEqual([{ releaseDate: '2026-08-07' }]);
  });
});

describe('letterboxdUrlForMovie', () => {
  it('prefers the IMDb redirect that lands on the film page', () => {
    expect(letterboxdUrlForMovie({ title: 'Inception', year: '2010', imdbId: 'tt1375666' }))
      .toBe('https://letterboxd.com/imdb/tt1375666/');
  });

  it('falls back to a films search with title and year', () => {
    expect(letterboxdUrlForMovie({ title: 'Inception', year: '2010' }))
      .toBe('https://letterboxd.com/search/films/Inception%202010/');
  });
});

describe('whats new on streaming', () => {
  beforeEach(() => {
    vi.stubEnv('TMDB_API_READ_ACCESS_TOKEN', 'server-only-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('builds a lookback window ending today', () => {
    expect(whatsNewDateWindow(new Date('2026-08-10T12:00:00Z'), 60)).toEqual({
      todayStr: '2026-08-10',
      sinceStr: '2026-06-11',
      lookbackDays: 60,
    });
  });

  it('discovers recent movies and shows for a US provider', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get('with_watch_providers')).toBe('8');
      expect(url.searchParams.get('watch_region')).toBe('US');
      expect(url.searchParams.get('with_watch_monetization_types')).toBe('flatrate');

      if (url.pathname.endsWith('/discover/movie')) {
        expect(url.searchParams.get('primary_release_date.gte')).toBe('2026-06-11');
        expect(url.searchParams.get('primary_release_date.lte')).toBe('2026-08-10');
        return new Response(JSON.stringify({
          page: 1,
          results: [{
            ...movie,
            id: 101,
            title: 'Fresh Movie',
            release_date: '2026-07-20',
            popularity: 90,
            overview: 'A new streamer.',
          }],
          total_pages: 1,
          total_results: 1,
        }));
      }

      expect(url.searchParams.get('first_air_date.gte')).toBe('2026-06-11');
      expect(url.searchParams.get('first_air_date.lte')).toBe('2026-08-10');
      return new Response(JSON.stringify({
        page: 1,
        results: [{
          id: 202,
          name: 'Fresh Show',
          overview: 'A new series.',
          poster_path: '/show.jpg',
          backdrop_path: '/show-bg.jpg',
          first_air_date: '2026-08-01',
          vote_average: 7.8,
          vote_count: 400,
          popularity: 110,
        }],
        total_pages: 1,
        total_results: 1,
      }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const titles = await getWhatsNewOnProvider(8, new Date('2026-08-10T12:00:00Z'));

    expect(titles).toHaveLength(2);
    expect(titles[0]).toMatchObject({ id: 202, mediaType: 'tv', title: 'Fresh Show' });
    expect(titles[1]).toMatchObject({ id: 101, mediaType: 'movie', title: 'Fresh Movie' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
