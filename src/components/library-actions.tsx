'use client';

import { Bookmark, Check, Eye, Heart } from 'lucide-react';
import { useLibrary } from '@/components/library-provider';
import type { LibraryAction, LibraryMovieInput } from '@/lib/movie-library';

export default function LibraryActions({
  movie,
  compact = false,
  card = false,
}: {
  movie: LibraryMovieInput;
  compact?: boolean;
  card?: boolean;
}) {
  const { authenticated, itemFor, pendingKey, toggle } = useLibrary();
  if (!authenticated) return null;

  const item = itemFor(movie.tmdbMovieId);
  const actions: Array<{
    action: LibraryAction;
    active: boolean;
    label: string;
    activeLabel: string;
    icon: typeof Bookmark;
  }> = [
    { action: 'watchlist', active: item?.inWatchlist || false, label: 'Save to Watchlist', activeLabel: 'In Watchlist', icon: Bookmark },
    { action: 'watched', active: item?.watched || false, label: 'Mark Watched', activeLabel: 'Watched', icon: Eye },
    { action: 'favorite', active: item?.favorite || false, label: 'Favorite', activeLabel: 'Favorited', icon: Heart },
  ];

  if (compact) {
    const watchlist = actions[0];
    const Icon = watchlist.active ? Check : watchlist.icon;
    return (
      <button
        type="button"
        aria-label={watchlist.active ? 'Remove from watchlist' : 'Save to watchlist'}
        aria-pressed={watchlist.active}
        disabled={pendingKey === `${movie.tmdbMovieId}:watchlist`}
        onClick={() => void toggle(movie, 'watchlist')}
        className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg backdrop-blur transition hover:scale-105 disabled:opacity-50 ${
          watchlist.active
            ? 'border-violet-300/50 bg-violet-500 text-white'
            : 'border-white/15 bg-black/60 text-white hover:bg-black/80'
        }`}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  if (card) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ action, active, label, activeLabel, icon: Icon }) => (
          <button
            key={action}
            type="button"
            aria-label={active ? activeLabel : label}
            aria-pressed={active}
            disabled={pendingKey === `${movie.tmdbMovieId}:${action}`}
            onClick={() => void toggle(movie, action)}
            className={`flex h-11 items-center justify-center rounded-xl transition disabled:opacity-50 ${
              active ? 'bg-violet-500 text-white' : 'bg-white/5 text-zinc-300 active:bg-white/10'
            }`}
          >
            <Icon className={`h-4 w-4 ${action === 'favorite' && active ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-7 flex flex-wrap gap-2">
      {actions.map(({ action, active, label, activeLabel, icon: Icon }) => (
        <button
          key={action}
          type="button"
          aria-pressed={active}
          disabled={pendingKey === `${movie.tmdbMovieId}:${action}`}
          onClick={() => void toggle(movie, action)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50 ${
            active
              ? 'border-violet-300/40 bg-violet-500 text-white'
              : 'border-white/15 bg-white/10 text-white backdrop-blur hover:bg-white/15'
          }`}
        >
          <Icon className={`h-4 w-4 ${action === 'favorite' && active ? 'fill-current' : ''}`} />
          {active ? activeLabel : label}
        </button>
      ))}
    </div>
  );
}
