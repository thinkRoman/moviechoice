'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  LoaderCircle,
  RotateCw,
  Share2,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import LibraryActions from '@/components/library-actions';
import {
  DEFAULT_PICK_SETTINGS,
  PICK_GENRES,
  STREAMING_SERVICES,
  type PickSettings,
  type RecommendedTitle,
} from '@/lib/recommendations';

interface PicksResponse {
  settings: PickSettings;
  items: RecommendedTitle[];
  generatedAt: string;
}

function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
          : 'border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
      }`}
    >
      {active ? <Check className="mr-1.5 inline h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}

function CountControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange(value: number): void;
}) {
  return (
    <label className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <span className="block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full bg-transparent text-lg font-bold text-white outline-none"
      >
        {[0, 1, 2, 3, 4, 5].map((count) => <option key={count} className="bg-zinc-900">{count}</option>)}
      </select>
    </label>
  );
}

function PickCard({ item, featured = false }: { item: RecommendedTitle; featured?: boolean }) {
  const href = item.mediaType === 'movie'
    ? `/movies/${item.id}`
    : `https://www.themoviedb.org/tv/${item.id}`;
  return (
    <article className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 ${featured ? 'md:col-span-2' : ''}`}>
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/10] sm:aspect-[16/8]' : 'aspect-[2/3]'}`}>
        {featured && item.backdropUrl ? (
          <Image src={item.backdropUrl} alt="" fill sizes="(max-width: 768px) 100vw, 66vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : item.posterUrl ? (
          <Image src={item.posterUrl} alt={`${item.title} poster`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
        {item.mediaType === 'movie' ? (
          <LibraryActions
            compact
            movie={{
              tmdbMovieId: item.id,
              title: item.title,
              posterPath: item.posterPath,
              releaseYear: item.year,
            }}
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-violet-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-950">
              {featured ? 'Tonight’s choice' : item.kind}
            </span>
            <span className="text-xs font-semibold text-zinc-300">{item.rating.toFixed(1)} rating</span>
          </div>
          <h3 className={`${featured ? 'text-3xl sm:text-4xl' : 'text-xl'} font-black tracking-tight`}>{item.title}</h3>
          {featured ? <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-zinc-300">{item.reason}</p> : null}
          <Link href={href} target={item.mediaType === 'tv' ? '_blank' : undefined} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white">
            See why it fits <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {!featured ? <p className="p-4 text-sm leading-6 text-zinc-400">{item.reason}</p> : null}
    </article>
  );
}

export default function RecommendationStudio() {
  const [settings, setSettings] = useState<PickSettings>(DEFAULT_PICK_SETTINGS);
  const [picks, setPicks] = useState<PicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [spotlight, setSpotlight] = useState(0);

  useEffect(() => {
    fetch('/api/recommendations', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const body = await response.json() as { settings: PickSettings };
        setSettings(body.settings);
      })
      .catch(() => setError('Your preferences could not be loaded. You can still choose them below.'))
      .finally(() => setLoading(false));
  }, []);

  function toggleList(key: 'providerIds' | 'genreIds', value: number) {
    setSettings((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  async function createPicks() {
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const body = await response.json() as PicksResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || 'MovieChoice could not create your picks.');
      setPicks(body);
      setSpotlight(0);
      requestAnimationFrame(() => document.querySelector('#your-picks')?.scrollIntoView({ behavior: 'smooth' }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'MovieChoice could not create your picks.');
    } finally {
      setCreating(false);
    }
  }

  function spin() {
    if (!picks?.items.length) return;
    setSpotlight((current) => (current + 1 + Math.floor(Math.random() * (picks.items.length - 1))) % picks.items.length);
  }

  async function share() {
    if (!picks?.items.length) return;
    const titles = picks.items.map((item) => item.title).join(', ');
    await navigator.share?.({ title: 'My MovieChoice picks', text: `MovieChoice picked: ${titles}` });
  }

  const ordered = picks?.items.length
    ? [picks.items[spotlight], ...picks.items.filter((_, index) => index !== spotlight)]
    : [];

  return (
    <>
      <section className="relative border-b border-white/10 px-4 pb-12 pt-28 sm:px-6 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.20),transparent_38%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-violet-300">
            <Sparkles className="h-4 w-4" /> Chosen around you
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.045em] sm:text-6xl">
            What should I watch?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            Tell MovieChoice what tonight feels like. We’ll narrow the catalog to a small set worth your time.
          </p>

          <div className="mt-10 space-y-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-violet-950/10 backdrop-blur sm:p-8">
            <fieldset>
              <legend className="text-sm font-bold text-white">Where can you watch?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {STREAMING_SERVICES.map((service) => (
                  <ToggleChip key={service.id} active={settings.providerIds.includes(service.id)} onClick={() => toggleList('providerIds', service.id)}>
                    {service.name}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-bold text-white">What feels right?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {PICK_GENRES.map((genre) => (
                  <ToggleChip key={genre.id} active={settings.genreIds.includes(genre.id)} onClick={() => toggleList('genreIds', genre.id)}>
                    {genre.name}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-sm font-bold text-white">A little guidance <span className="font-normal text-zinc-600">(optional)</span></span>
              <textarea
                value={settings.tasteNote}
                maxLength={240}
                onChange={(event) => setSettings((current) => ({ ...current, tasteNote: event.target.value }))}
                placeholder="Smart, tense, not too bleak. Something we can finish tonight."
                className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <CountControl label="Movies" value={settings.movieCount} onChange={(movieCount) => setSettings((current) => ({ ...current, movieCount }))} />
              <CountControl label="Shows" value={settings.showCount} onChange={(showCount) => setSettings((current) => ({ ...current, showCount }))} />
              <CountControl label="Docs" value={settings.documentaryCount} onChange={(documentaryCount) => setSettings((current) => ({ ...current, documentaryCount }))} />
            </div>
            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.weeklyRefresh}
                  onChange={(event) => setSettings((current) => ({ ...current, weeklyRefresh: event.target.checked }))}
                  className="h-5 w-5 accent-violet-500"
                />
                <CalendarClock className="h-4 w-4 text-violet-300" />
                Make these my Friday settings
              </label>
              <button
                type="button"
                onClick={createPicks}
                disabled={creating || loading || settings.providerIds.length === 0}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-zinc-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                {creating ? 'Finding the right ones…' : 'Create my picks'}
              </button>
            </div>
            {error ? <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          </div>
        </div>
      </section>

      <section id="your-picks" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
        {ordered.length ? (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-400">A short list, on purpose</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your picks</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={spin} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-bold text-white" aria-label="Spin for one pick">
                  <RotateCw className="h-4 w-4" /> <span className="hidden sm:inline">Pick one</span>
                </button>
                <button onClick={share} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white" aria-label="Share picks">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3">
              {ordered.map((item, index) => <PickCard key={`${item.mediaType}-${item.id}`} item={item} featured={index === 0} />)}
            </div>
          </>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/10 px-6 py-14 text-center">
            <WandSparkles className="mx-auto h-7 w-7 text-violet-400" />
            <h2 className="mt-4 text-xl font-bold">Your shortlist will appear here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">No endless feed. Just a few considered choices from the services you already have.</p>
          </div>
        )}
      </section>
    </>
  );
}
