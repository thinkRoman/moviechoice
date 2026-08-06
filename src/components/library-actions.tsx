'use client';

import { Bookmark, Check, Eye, Heart, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useLibrary } from '@/components/library-provider';
import type { LibraryAction, LibraryMovieInput } from '@/lib/movie-library';

export default function LibraryActions({
  movie,
  compact = false,
  card = false,
  friday = false,
  listAction,
}: {
  movie: LibraryMovieInput;
  compact?: boolean;
  card?: boolean;
  friday?: boolean;
  listAction?: LibraryAction;
}) {
  const { authenticated, itemFor, pendingKey, toggle } = useLibrary();
  if (!authenticated) return null;

  const item = itemFor(movie.mediaType, movie.tmdbMovieId);
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
    { action: 'dismissed', active: item?.dismissed || false, label: 'Not for me', activeLabel: 'Hidden', icon: ThumbsDown },
  ];

  if (friday) {
    const watchlist = actions[0];
    const watched = actions[1];
    const favorite = actions[2];
    const dismissed = actions[3];
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={favorite.active ? 'Remove thumbs up' : 'Thumbs up'}
          aria-pressed={favorite.active}
          disabled={pendingKey === `${movie.tmdbMovieId}:favorite`}
          onClick={() => void toggle(movie, 'favorite')}
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-50 ${
            favorite.active
              ? 'border-violet-500 bg-violet-500 text-white'
              : 'border-zinc-200 bg-white text-zinc-500 hover:border-violet-300 hover:text-violet-600'
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${favorite.active ? 'fill-current' : ''}`} />
        </button>
        <button
          type="button"
          aria-label={dismissed.active ? 'Undo thumbs down' : 'Thumbs down'}
          aria-pressed={dismissed.active}
          disabled={pendingKey === `${movie.tmdbMovieId}:dismissed`}
          onClick={() => void toggle(movie, 'dismissed')}
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition disabled:opacity-50 ${
            dismissed.active
              ? 'border-rose-500 bg-rose-500 text-white'
              : 'border-zinc-200 bg-white text-zinc-500 hover:border-rose-300 hover:text-rose-600'
          }`}
        >
          <ThumbsDown className={`h-4 w-4 ${dismissed.active ? 'fill-current' : ''}`} />
        </button>
        <button
          type="button"
          aria-pressed={watchlist.active}
          disabled={pendingKey === `${movie.tmdbMovieId}:watchlist`}
          onClick={() => void toggle(movie, 'watchlist')}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-50 ${
            watchlist.active
              ? 'border-violet-500 bg-violet-500 text-white'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:text-violet-700'
          }`}
        >
          {watchlist.active ? <Check className="h-4 w-4" /> : <span className="text-base leading-none">+</span>}
          Watchlist
        </button>
        <button
          type="button"
          aria-pressed={watched.active}
          disabled={pendingKey === `${movie.tmdbMovieId}:watched`}
          onClick={() => void toggle(movie, 'watched')}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition disabled:opacity-50 ${
            watched.active
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700'
          }`}
        >
          <Eye className="h-4 w-4" />
          Seen it
        </button>
      </div>
    );
  }

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
    const recommendationActions = actions.filter(({ action }) =>
      action === 'watchlist' || action === 'watched' || action === 'dismissed');
    return (
      <div className="grid grid-cols-3 gap-2">
        {recommendationActions.map(({ action, active, label, activeLabel, icon: Icon }) => (
          <button
            key={action}
            type="button"
            aria-label={active ? activeLabel : label}
            aria-pressed={active}
            disabled={pendingKey === `${movie.tmdbMovieId}:${action}`}
            onClick={() => void toggle(movie, action)}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition disabled:opacity-50 ${
              active ? 'bg-violet-500 text-white' : 'bg-white/5 text-zinc-300 active:bg-white/10'
            }`}
          >
            <Icon className={`h-4 w-4 ${action === 'favorite' && active ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold">{active ? activeLabel : label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (listAction) {
    const selected = actions.find(({ action }) => action === listAction);
    if (!selected) return null;
    const { action, active, label, activeLabel, icon: Icon } = selected;
    const removeLabel = action === 'watchlist'
      ? 'Remove from watchlist'
      : action === 'watched'
        ? 'Mark as not watched'
        : action === 'favorite'
          ? 'Remove from favorites'
          : activeLabel;
    return (
      <button
        type="button"
        disabled={pendingKey === `${movie.tmdbMovieId}:${action}`}
        onClick={() => void toggle(movie, action)}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <Icon className="h-4 w-4" />
        {active ? removeLabel : label}
      </button>
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
