'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Globe2,
  LoaderCircle,
  Menu,
  RefreshCw,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react';
import LibraryActions from '@/components/library-actions';
import { useLibrary } from '@/components/library-provider';
import {
  DEFAULT_PICK_SETTINGS,
  STREAMING_SERVICES,
  formatRuntime,
  type PickSettings,
  type RecommendedTitle,
} from '@/lib/recommendations';

interface PicksResponse {
  settings: PickSettings;
  items: RecommendedTitle[];
  generatedAt: string;
}

function weekLabel(date = new Date()) {
  const start = new Date(date);
  const day = start.getUTCDay();
  const diffToFriday = (day + 2) % 7;
  start.setUTCDate(start.getUTCDate() - diffToFriday);
  return start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).toUpperCase();
}

function metaLine(item: RecommendedTitle) {
  const parts = [item.year].filter(Boolean) as string[];
  if (item.kind === 'show' || item.mediaType === 'tv') {
    if (item.episodeCount) parts.push(`${item.episodeCount} episodes`);
    else if (item.seasonCount) parts.push(`${item.seasonCount} seasons`);
  } else {
    const runtime = formatRuntime(item.runtimeMinutes ?? null);
    if (runtime) parts.push(runtime);
  }
  return parts.join(' · ');
}

function PickCard({ item, onHidden }: { item: RecommendedTitle; onHidden(id: number, mediaType: 'movie' | 'tv'): void }) {
  const { itemFor } = useLibrary();
  const libraryItem = itemFor(item.mediaType, item.id);
  const detailsHref = item.mediaType === 'movie' ? `/movies/${item.id}` : (item.tmdbUrl || `https://www.themoviedb.org/tv/${item.id}`);
  const whereToWatch = item.tmdbUrl
    ? `${item.tmdbUrl}/watch`
    : detailsHref;

  useEffect(() => {
    if (libraryItem?.watched || libraryItem?.dismissed) {
      onHidden(item.id, item.mediaType);
    }
  }, [libraryItem?.watched, libraryItem?.dismissed, item.id, item.mediaType, onHidden]);

  return (
    <article className="animate-rise-in overflow-hidden rounded-[1.75rem] border border-violet-100/80 bg-white shadow-[0_18px_50px_-28px_rgba(91,33,182,0.35)]">
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          <div className="relative aspect-[2/3] w-[104px] shrink-0 overflow-hidden rounded-2xl bg-violet-50 shadow-md sm:w-[118px]">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={`${item.title} poster`}
                fill
                sizes="118px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-600">
              {item.primaryProvider || item.providerNames[0] || 'Streaming'}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {metaLine(item)}
            </p>
            <h3 className="mt-2 font-serif text-[1.55rem] font-bold leading-[1.1] tracking-tight text-zinc-950">
              {item.title}
            </h3>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-zinc-700">
              <span className="inline-flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-zinc-900">{item.rating.toFixed(1)}</span>
              </span>
              <span className="text-zinc-400">{item.voteCount.toLocaleString()} ratings</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(item.genreNames || []).slice(0, 3).map((genre) => (
                <span key={genre} className="text-sm font-medium text-zinc-500">{genre}</span>
              ))}
              {item.languageName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <Globe2 className="h-3 w-3" />
                  {item.languageName}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[15px] leading-6 text-zinc-600">{item.reason}</p>

        <div className="mt-4">
          <LibraryActions
            friday
            movie={{
              tmdbMovieId: item.id,
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath,
              releaseYear: item.year,
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-violet-50 pt-4 text-sm font-semibold text-violet-700">
          <a href={whereToWatch} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-violet-900">
            Where to watch <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          {item.letterboxdUrl ? (
            <a href={item.letterboxdUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-violet-900">
              Letterboxd <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <Link
            href={detailsHref}
            target={item.mediaType === 'tv' ? '_blank' : undefined}
            className="inline-flex items-center gap-1 hover:text-violet-900"
          >
            Details <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Section({
  title,
  items,
  onHidden,
}: {
  title: string;
  items: RecommendedTitle[];
  onHidden(id: number, mediaType: 'movie' | 'tv'): void;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h2 className="font-serif text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">{title}</h2>
      <div className="mt-5 space-y-5">
        {items.map((item) => (
          <PickCard key={`${item.mediaType}-${item.id}`} item={item} onHidden={onHidden} />
        ))}
      </div>
    </section>
  );
}

export default function RecommendationStudio() {
  const [settings, setSettings] = useState<PickSettings>(DEFAULT_PICK_SETTINGS);
  const [picks, setPicks] = useState<PicksResponse | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/recommendations', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = await response.json() as { settings: PickSettings };
        setSettings(body.settings);
      })
      .catch(() => setError('Your saved settings could not be loaded. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  async function createPicks() {
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionRequest: sessionNote.trim(),
          refreshToken: crypto.randomUUID(),
        }),
      });
      const body = await response.json() as PicksResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || 'MovieChoice could not create your picks.');
      setPicks(body);
      setHiddenKeys(new Set());
      requestAnimationFrame(() => document.querySelector('#your-picks')?.scrollIntoView({ behavior: 'smooth' }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'MovieChoice could not create your picks.');
    } finally {
      setCreating(false);
    }
  }

  const hideTitle = useCallback((id: number, mediaType: 'movie' | 'tv') => {
    setHiddenKeys((current) => {
      const key = `${mediaType}:${id}`;
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  const visibleItems = useMemo(
    () => (picks?.items || []).filter((item) => !hiddenKeys.has(`${item.mediaType}:${item.id}`)),
    [picks?.items, hiddenKeys],
  );
  const movies = visibleItems.filter((item) => item.kind === 'movie');
  const shows = visibleItems.filter((item) => item.kind === 'show');
  const documentaries = visibleItems.filter((item) => item.kind === 'documentary');
  const services = STREAMING_SERVICES
    .filter((service) => settings.providerIds.includes(service.id))
    .map((service) => service.name)
    .join(' · ');

  return (
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#f3eefc_0%,#f7f4ff_38%,#fbfaff_100%)] text-zinc-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(167,139,250,0.35),transparent_55%)]" />

      <header className="sticky top-0 z-40 border-b border-violet-100/80 bg-[#f3eefc]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-black text-white shadow-md shadow-violet-300/50">
            MC
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black tracking-tight text-zinc-950">MovieChoice Picks</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-500">Week of {weekLabel()}</p>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-300/40"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {menuOpen ? (
          <div className="mx-auto max-w-3xl space-y-1 border-t border-violet-100 px-4 py-3 sm:px-6">
            <Link href="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-white">
              <Settings className="h-4 w-4 text-violet-600" /> Edit saved settings
            </Link>
            <Link href="/my-movies" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-white">
              <Sparkles className="h-4 w-4 text-violet-600" /> My Movies
            </Link>
            <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-white">
              Home
            </Link>
          </div>
        ) : null}
      </header>

      <div className="relative mx-auto max-w-3xl px-4 pb-36 pt-8 sm:px-6">
        <section className="rounded-[1.75rem] border border-violet-100 bg-white/80 p-5 shadow-[0_18px_50px_-30px_rgba(91,33,182,0.45)] backdrop-blur sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-500">Family watch night</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            What should we watch?
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {settings.movieCount} movies · {settings.showCount} shows
            {settings.documentaryCount ? ` · ${settings.documentaryCount} docs` : ''} · last {settings.yearsBack} years
          </p>
          <p className="mt-1 text-xs font-semibold text-zinc-400">{services || 'Choose streaming services in settings'}</p>

          <button
            type="button"
            onClick={createPicks}
            disabled={creating || loading || settings.providerIds.length === 0}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-6 text-sm font-black text-white shadow-lg shadow-violet-300/50 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {creating ? 'Finding your picks…' : picks ? 'Refresh picks' : 'Recommend Now'}
          </button>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <button
              type="button"
              onClick={() => setShowOverride((current) => !current)}
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              {showOverride ? 'Hide one-time request' : 'Something different tonight?'}
            </button>
            <Link href="/settings" className="font-semibold text-zinc-500 hover:text-zinc-800">
              Edit settings
            </Link>
          </div>

          {showOverride ? (
            <label className="mt-4 block">
              <span className="text-sm font-bold text-zinc-800">
                One-time request <span className="font-normal text-zinc-400">(not saved)</span>
              </span>
              <textarea
                value={sessionNote}
                maxLength={240}
                onChange={(event) => setSessionNote(event.target.value)}
                placeholder="Family comedies, only Korean titles, surprise me…"
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
              />
            </label>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        <div id="your-picks" className="scroll-mt-24">
          {visibleItems.length ? (
            <>
              <Section title="Movies" items={movies} onHidden={hideTitle} />
              <Section title="Shows" items={shows} onHidden={hideTitle} />
              <Section title="Documentaries" items={documentaries} onHidden={hideTitle} />
              <p className="mt-10 text-center text-sm leading-6 text-zinc-500">
                👍/👎 and your Watched list shape the next round of picks. Mark something Seen it and it won’t come back.
              </p>
            </>
          ) : (
            <div className="mt-10 rounded-[1.75rem] border border-dashed border-violet-200 bg-white/60 px-6 py-14 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-violet-500" />
              <h2 className="mt-4 text-xl font-bold text-zinc-900">Your shortlist will appear here</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Movies and shows from the services you pay for — in the counts you set in Settings.
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label="Refresh recommendations"
        onClick={createPicks}
        disabled={creating || loading || settings.providerIds.length === 0}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-400/40 transition hover:scale-105 hover:bg-violet-500 disabled:opacity-50 sm:bottom-8"
      >
        {creating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
      </button>
    </div>
  );
}
