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
  itemFor(movieId: number): LibraryItem | undefined;
  pendingKey: string | null;
  toggle(movie: LibraryMovieInput, action: LibraryAction): Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<Record<number, LibraryItem>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/my-movies', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const body = await response.json() as { items: LibraryItem[] };
        setItems(Object.fromEntries(body.items.map((item) => [item.tmdbMovieId, item])));
      })
      .catch(() => setMessage('Could not load your movie library.'));
  }, [status]);

  const toggle = useCallback(async (movie: LibraryMovieInput, action: LibraryAction) => {
    const previous = items[movie.tmdbMovieId];
    const field = action === 'watchlist' ? 'inWatchlist' : action;
    const nextValue = !previous?.[field];
    const optimistic: LibraryItem = {
      id: previous?.id || `optimistic-${movie.tmdbMovieId}`,
      ...movie,
      inWatchlist: previous?.inWatchlist || false,
      watched: previous?.watched || false,
      favorite: previous?.favorite || false,
      watchedAt: previous?.watchedAt || null,
      createdAt: previous?.createdAt || new Date().toISOString(),
      [field]: nextValue,
      ...(action === 'watched' ? { watchedAt: nextValue ? new Date().toISOString() : null } : {}),
    };
    const key = `${movie.tmdbMovieId}:${action}`;
    setPendingKey(key);
    setItems((current) => ({ ...current, [movie.tmdbMovieId]: optimistic }));

    try {
      const response = await fetch(`/api/my-movies/${movie.tmdbMovieId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...movie, action, value: nextValue }),
      });
      if (!response.ok) throw new Error('Update failed');
      const body = await response.json() as { item: LibraryItem | null };
      setItems((current) => {
        const next = { ...current };
        if (body.item) next[movie.tmdbMovieId] = body.item;
        else delete next[movie.tmdbMovieId];
        return next;
      });
      setMessage(
        action === 'watchlist'
          ? nextValue ? 'Saved to your watchlist.' : 'Removed from your watchlist.'
          : action === 'watched'
            ? nextValue ? 'Marked as watched.' : 'Moved back to unwatched.'
            : nextValue ? 'Added to favorites.' : 'Removed from favorites.',
      );
    } catch {
      setItems((current) => {
        const next = { ...current };
        if (previous) next[movie.tmdbMovieId] = previous;
        else delete next[movie.tmdbMovieId];
        return next;
      });
      setMessage('That change could not be saved. Please try again.');
    } finally {
      setPendingKey(null);
    }
  }, [items]);

  const value = useMemo<LibraryContextValue>(() => ({
    authenticated: status === 'authenticated',
    itemFor: (movieId) => items[movieId],
    pendingKey,
    toggle,
  }), [items, pendingKey, status, toggle]);

  return (
    <LibraryContext.Provider value={value}>
      {children}
      {message ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3 text-center text-sm font-medium text-white shadow-2xl backdrop-blur"
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
