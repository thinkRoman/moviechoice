'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import type {
  LibraryAction,
  LibraryItem,
  LibraryMovieInput,
} from '@/lib/movie-library';

interface LibraryContextValue {
  authenticated: boolean;
  ready: boolean;
  itemFor(mediaType: LibraryMovieInput['mediaType'], movieId: number): LibraryItem | undefined;
  pendingKey: string | null;
  toggle(movie: LibraryMovieInput, action: LibraryAction): Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function normalizeReleaseYear(value: string | null | undefined): string | null {
  if (!value) return null;
  const year = String(value).trim().slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<Record<string, LibraryItem>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') {
      setItems({});
      return;
    }
    fetch('/api/my-movies', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          setMessage(response.status === 401
            ? 'Sign in again to sync your watchlist.'
            : 'Could not load your movie library.');
          return;
        }
        const body = await response.json() as { items: LibraryItem[] };
        setItems(Object.fromEntries(body.items.map((item) => [`${item.mediaType}:${item.tmdbMovieId}`, item])));
      })
      .catch(() => setMessage('Could not load your movie library.'));
  }, [status]);

  const toggle = useCallback(async (movie: LibraryMovieInput, action: LibraryAction) => {
    if (status !== 'authenticated') {
      setMessage('Sign in to use Watchlist, Favorites, and Watched.');
      return;
    }

    const itemKey = `${movie.mediaType}:${movie.tmdbMovieId}`;
    const previous = items[itemKey];
    const field = action === 'watchlist' ? 'inWatchlist' : action;
    const nextValue = !previous?.[field];
    const payload = {
      ...movie,
      posterPath: movie.posterPath ?? null,
      releaseYear: normalizeReleaseYear(movie.releaseYear),
      action,
      value: nextValue,
    };
    const optimistic: LibraryItem = {
      id: previous?.id || `optimistic-${movie.tmdbMovieId}`,
      ...movie,
      releaseYear: payload.releaseYear,
      inWatchlist: previous?.inWatchlist || false,
      watched: previous?.watched || false,
      favorite: previous?.favorite || false,
      dismissed: previous?.dismissed || false,
      watchedAt: previous?.watchedAt || null,
      createdAt: previous?.createdAt || new Date().toISOString(),
      [field]: nextValue,
      ...(action === 'watched' ? { watchedAt: nextValue ? new Date().toISOString() : null } : {}),
      ...(action === 'watched' && nextValue ? { inWatchlist: false } : {}),
      ...(action === 'dismissed' && nextValue ? { inWatchlist: false, favorite: false } : {}),
    };
    const key = `${movie.mediaType}:${movie.tmdbMovieId}:${action}`;
    setPendingKey(key);
    setItems((current) => ({ ...current, [itemKey]: optimistic }));

    try {
      const response = await fetch(`/api/my-movies/${movie.tmdbMovieId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as { item?: LibraryItem | null; error?: string };
      if (!response.ok) {
        throw new Error(body.error || `Could not update (${response.status})`);
      }
      setItems((current) => {
        const next = { ...current };
        if (body.item) next[itemKey] = body.item;
        else delete next[itemKey];
        return next;
      });
      setMessage(
        action === 'watchlist'
          ? nextValue ? 'Saved to your watchlist.' : 'Removed from your watchlist.'
          : action === 'watched'
            ? nextValue ? 'Marked as watched.' : 'Moved back to unwatched.'
            : action === 'favorite'
              ? nextValue ? 'Added to favorites.' : 'Removed from favorites.'
              : nextValue ? 'Got it — we won’t recommend this again.' : 'This title can be recommended again.',
      );
    } catch (error) {
      setItems((current) => {
        const next = { ...current };
        if (previous) next[itemKey] = previous;
        else delete next[itemKey];
        return next;
      });
      setMessage(error instanceof Error ? error.message : 'That change could not be saved. Please try again.');
    } finally {
      setPendingKey(null);
    }
  }, [items, status]);

  const value = useMemo<LibraryContextValue>(() => ({
    authenticated: status === 'authenticated',
    ready: status !== 'loading',
    itemFor: (mediaType, movieId) => items[`${mediaType}:${movieId}`],
    pendingKey,
    toggle,
  }), [items, pendingKey, status, toggle]);

  return (
    <LibraryContext.Provider value={value}>
      {children}
      {message ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3 text-center text-sm font-medium text-white shadow-2xl backdrop-blur sm:bottom-5"
        >
          {message}
          <button onClick={() => setMessage('')} className="ml-3 text-violet-300" aria-label="Dismiss notification">×</button>
        </div>
      ) : null}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
}
