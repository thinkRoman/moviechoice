'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  LoaderCircle,
  RotateCw,
  Settings,
  Share2,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import LibraryActions from '@/components/library-actions';
import {
  DEFAULT_PICK_SETTINGS,
  STREAMING_SERVICES,
  type PickSettings,
  type RecommendedTitle,
} from '@/lib/recommendations';

interface PicksResponse {
  settings: PickSettings;
  items: RecommendedTitle[];
  generatedAt: string;
}

function PickCard({ item, featured = false }: { item: RecommendedTitle; featured?: boolean }) {
  const href = item.mediaType === 'movie'
    ? `/movies/${item.id}`
    : `https://www.themoviedb.org/tv/${item.id}`;
  return (
    <article className={`group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111016] shadow-xl shadow-black/20 ${featured ? 'md:col-span-2' : ''}`}>
      <div className={`relative hidden overflow-hidden sm:block ${featured ? 'aspect-[16/10] sm:aspect-[16/8]' : 'aspect-[2/3]'}`}>
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
      <div className="p-4 sm:hidden">
        <div className="flex gap-4">
          <div className="relative aspect-[2/3] w-[108px] shrink-0 overflow-hidden rounded-2xl bg-zinc-900 shadow-lg">
            {item.posterUrl ? <Image src={item.posterUrl} alt={`${item.title} poster`} fill sizes="108px" className="object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1 py-1">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-violet-400">{item.providerNames[0] || item.kind} · {item.year}</p>
            <h3 className="mt-1 font-serif text-[1.35rem] font-bold leading-tight text-white">{item.title}</h3>
            <p className="mt-2 text-sm font-bold text-amber-400">★ <span className="text-white">{item.rating.toFixed(1)}</span></p>
            <span className="mt-3 inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold capitalize text-violet-300">{item.kind}</span>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-6 text-zinc-400">{item.reason}</p>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 pt-4">
          <div className="min-w-0">
            {item.mediaType === 'movie' ? (
              <LibraryActions
                card
                movie={{ tmdbMovieId: item.id, title: item.title, posterPath: item.posterPath, releaseYear: item.year }}
              />
            ) : <span className="flex h-11 items-center px-4 text-sm font-semibold text-zinc-500">Show</span>}
          </div>
          <Link href={href} target={item.mediaType === 'tv' ? '_blank' : undefined} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-violet-500 px-4 text-sm font-bold text-white">
            Details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {!featured ? <p className="hidden p-4 text-sm leading-6 text-zinc-400 sm:block">{item.reason}</p> : null}
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
  const [showOverride, setShowOverride] = useState(false);
  const [sessionNote, setSessionNote] = useState('');

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
        body: JSON.stringify(sessionNote.trim()
          ? { overrides: { tasteNote: [settings.tasteNote, sessionNote.trim()].filter(Boolean).join(' Session request: ') } }
          : {}),
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
      <section className="relative border-b border-white/10 px-4 pb-10 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.20),transparent_38%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-violet-300">
            <Sparkles className="h-4 w-4" /> Chosen around you
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:mt-4 sm:text-6xl sm:font-black">
            What should I watch?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            One tap. A considered shortlist shaped by the preferences you’ve already saved.
          </p>

          <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-violet-950/10 backdrop-blur sm:mt-10 sm:rounded-[2rem] sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-white">Ready with your saved settings</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {settings.movieCount} movies · {settings.showCount} shows · {settings.documentaryCount} docs · last {settings.yearsBack} years
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {STREAMING_SERVICES.filter((service) => settings.providerIds.includes(service.id)).map((service) => service.name).join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={createPicks}
                disabled={creating || loading || settings.providerIds.length === 0}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-black text-zinc-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <WandSparkles className="h-5 w-5" />}
                {creating ? 'Finding the right ones…' : 'Recommend Now'}
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-sm">
              <button type="button" onClick={() => setShowOverride((current) => !current)} className="font-semibold text-violet-300 hover:text-white">
                {showOverride ? 'Remove one-time request' : 'Something different tonight?'}
              </button>
              <Link href="/settings" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white">
                <Settings className="h-4 w-4" /> Edit saved settings
              </Link>
            </div>
            {showOverride ? <label className="mt-5 block">
              <span className="text-sm font-bold text-white">One-time request <span className="font-normal text-zinc-600">(not saved)</span></span>
              <textarea
                value={sessionNote}
                maxLength={240}
                onChange={(event) => setSessionNote(event.target.value)}
                placeholder="I’m watching with the family, only comedies tonight, surprise me…"
                className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
              />
            </label> : null}
            {error ? <p role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          </div>
        </div>
      </section>

      <section id="your-picks" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-28 pt-10 sm:px-6 sm:py-20">
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
            <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-7 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
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
