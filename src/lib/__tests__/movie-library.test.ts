import { describe, expect, it } from 'vitest';
import {
  listLibrary,
  updateLibrary,
  UnauthorizedLibraryError,
  type LibraryAction,
  type LibraryItem,
  type LibraryMovieInput,
  type MovieLibraryRepository,
} from '@/lib/movie-library';

const inception: LibraryMovieInput = {
  tmdbMovieId: 27205,
  title: 'Inception',
  posterPath: '/poster.jpg',
  releaseYear: '2010',
};

function createRepository(): MovieLibraryRepository {
  const records = new Map<string, LibraryItem>();
  const key = (userId: string, movieId: number) => `${userId}:${movieId}`;

  return {
    async list(userId) {
      return [...records.entries()]
        .filter(([recordKey]) => recordKey.startsWith(`${userId}:`))
        .map(([, item]) => ({ ...item }));
    },
    async setFlag(userId, movie, action: LibraryAction, value) {
      const recordKey = key(userId, movie.tmdbMovieId);
      const current = records.get(recordKey);
      const field = action === 'watchlist' ? 'inWatchlist' : action;
      const item: LibraryItem = {
        id: current?.id || recordKey,
        ...movie,
        inWatchlist: current?.inWatchlist || false,
        watched: current?.watched || false,
        favorite: current?.favorite || false,
        dismissed: current?.dismissed || false,
        watchedAt: current?.watchedAt || null,
        createdAt: current?.createdAt || new Date().toISOString(),
        [field]: value,
        ...(action === 'watched' ? { watchedAt: value ? new Date().toISOString() : null } : {}),
        ...(action === 'watched' && value ? { inWatchlist: false } : {}),
        ...(action === 'dismissed' && value ? { inWatchlist: false, favorite: false } : {}),
      };
      if (!item.inWatchlist && !item.watched && !item.favorite && !item.dismissed) {
        records.delete(recordKey);
        return null;
      }
      records.set(recordKey, item);
      return { ...item };
    },
  };
}

describe('personal movie library', () => {
  it('adds a movie to the watchlist', async () => {
    const repository = createRepository();
    const item = await updateLibrary('user-a', inception, 'watchlist', true, repository);
    expect(item?.inWatchlist).toBe(true);
  });

  it('removes a movie from the watchlist', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'watchlist', true, repository);
    expect(await updateLibrary('user-a', inception, 'watchlist', false, repository)).toBeNull();
  });

  it('marks watched and records watchedAt', async () => {
    const repository = createRepository();
    const item = await updateLibrary('user-a', inception, 'watched', true, repository);
    expect(item?.watched).toBe(true);
    expect(item?.watchedAt).toBeTruthy();
  });

  it('removes a watched movie from the watchlist to keep the queue clean', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'watchlist', true, repository);
    const item = await updateLibrary('user-a', inception, 'watched', true, repository);
    expect(item).toMatchObject({ watched: true, inWatchlist: false });
  });

  it('persists a not-for-me signal and clears positive list signals', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'watchlist', true, repository);
    await updateLibrary('user-a', inception, 'favorite', true, repository);
    const item = await updateLibrary('user-a', inception, 'dismissed', true, repository);
    expect(item).toMatchObject({ dismissed: true, inWatchlist: false, favorite: false });
  });

  it('unmarks watched and clears watchedAt', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'favorite', true, repository);
    await updateLibrary('user-a', inception, 'watched', true, repository);
    const item = await updateLibrary('user-a', inception, 'watched', false, repository);
    expect(item).toMatchObject({ watched: false, watchedAt: null, favorite: true });
  });

  it('favorites and unfavorites a movie', async () => {
    const repository = createRepository();
    expect((await updateLibrary('user-a', inception, 'favorite', true, repository))?.favorite).toBe(true);
    expect(await updateLibrary('user-a', inception, 'favorite', false, repository)).toBeNull();
  });

  it('prevents duplicates by keeping one user/movie record', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'watchlist', true, repository);
    await updateLibrary('user-a', inception, 'watchlist', true, repository);
    expect(await listLibrary('user-a', repository)).toHaveLength(1);
  });

  it('rejects unauthenticated reads and writes', async () => {
    const repository = createRepository();
    await expect(listLibrary(null, repository)).rejects.toBeInstanceOf(UnauthorizedLibraryError);
    await expect(updateLibrary(undefined, inception, 'favorite', true, repository)).rejects.toBeInstanceOf(UnauthorizedLibraryError);
  });

  it('rejects cross-user access through mandatory server-side scoping', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'watchlist', true, repository);
    expect(await listLibrary('user-b', repository)).toEqual([]);
    expect(await updateLibrary('user-b', inception, 'watchlist', false, repository)).toBeNull();
    expect(await listLibrary('user-a', repository)).toHaveLength(1);
  });

  it('My Movies returns only the current user’s items', async () => {
    const repository = createRepository();
    await updateLibrary('user-a', inception, 'favorite', true, repository);
    await updateLibrary(
      'user-b',
      { ...inception, tmdbMovieId: 157336, title: 'Interstellar' },
      'watchlist',
      true,
      repository,
    );
    const items = await listLibrary('user-a', repository);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Inception');
  });
});
