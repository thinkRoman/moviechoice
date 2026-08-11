'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Save, Sparkles, UserPlus } from 'lucide-react';
import {
  DEFAULT_PICK_SETTINGS,
  MAX_GENRES,
  MAX_STREAMING_SERVICES,
  PICK_GENRES,
  STREAMING_SERVICES,
  normalizePickSettings,
  type PickSettings,
} from '@/lib/recommendations';

function Chip({ active, label, onClick, disabled = false }: { active: boolean; label: string; onClick(): void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
          : 'border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
      }`}
    >
      {active ? <Check className="mr-1.5 inline h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
}

function Stepper({
  label,
  value,
  min = 0,
  max = 10,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange(value: number): void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <span className="font-semibold text-zinc-300">{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="h-9 w-9 rounded-full bg-white/5 text-xl text-violet-300 disabled:opacity-30">−</button>
        <span className="w-6 text-center text-lg font-black">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="h-9 w-9 rounded-full bg-white/5 text-xl text-violet-300 disabled:opacity-30">+</button>
      </div>
    </div>
  );
}

export default function PersonalizationSettings({ isOwner }: { isOwner: boolean }) {
  const [settings, setSettings] = useState<PickSettings>(DEFAULT_PICK_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [message, setMessage] = useState('');
  const [showMoreServices, setShowMoreServices] = useState(false);
  const [showMoreGenres, setShowMoreGenres] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popularServices = STREAMING_SERVICES.filter((service) => 'popular' in service && service.popular);
  const moreServices = STREAMING_SERVICES.filter((service) => !('popular' in service && service.popular));
  const popularGenres = PICK_GENRES.filter((genre) => 'popular' in genre && genre.popular);
  const moreGenres = PICK_GENRES.filter((genre) => !('popular' in genre && genre.popular));

  useEffect(() => {
    let cancelled = false;
    fetch('/api/recommendations', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { settings?: PickSettings; error?: string };
        const next = normalizePickSettings(body.settings || DEFAULT_PICK_SETTINGS);
        if (!cancelled) {
          setSettings(next);
          if (!response.ok && response.status !== 200) {
            setMessage(body.error || 'Showing default settings. Save once to personalize.');
          }
          if (next.providerIds.some((id) => moreServices.some((service) => service.id === id))) {
            setShowMoreServices(true);
          }
          if (next.genreIds.some((id) => moreGenres.some((genre) => genre.id === id))) {
            setShowMoreGenres(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSettings(DEFAULT_PICK_SETTINGS);
          setMessage('Could not reach saved settings. Defaults are shown — save when ready.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function toggle(key: 'providerIds' | 'genreIds', id: number) {
    setSavedFlash(false);
    setSettings((current) => {
      const limit = key === 'providerIds' ? MAX_STREAMING_SERVICES : MAX_GENRES;
      const selected = current[key];
      if (selected.includes(id)) {
        return { ...current, [key]: selected.filter((value) => value !== id) };
      }
      if (selected.length >= limit) {
        setMessage(key === 'providerIds'
          ? `You can choose up to ${MAX_STREAMING_SERVICES} streaming services.`
          : `You can choose up to ${MAX_GENRES} genres.`);
        return current;
      }
      return { ...current, [key]: [...selected, id] };
    });
  }

  async function save() {
    if (settings.providerIds.length === 0) {
      setMessage('Choose at least one streaming service before saving.');
      return;
    }
    setSaving(true);
    setSavedFlash(false);
    setMessage('');
    try {
      const payload = normalizePickSettings(settings);
      const response = await fetch('/api/recommendations', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, completeOnboarding: true }),
      });
      const body = await response.json() as { error?: string; settings?: PickSettings };
      if (!response.ok) throw new Error(body.error || 'Could not save settings.');
      setSettings(normalizePickSettings(body.settings || payload));
      setSavedFlash(true);
      setMessage('Saved — MovieChoice will use these for Recommend Now.');
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedFlash(false), 4000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  const visibleServices = showMoreServices ? STREAMING_SERVICES : popularServices;
  const visibleGenres = showMoreGenres
    ? PICK_GENRES
    : [
        ...popularGenres,
        ...moreGenres.filter((genre) => settings.genreIds.includes(genre.id)),
      ];

  return (
    <section className="mx-auto max-w-4xl px-4 pb-32 pt-24 sm:px-6 sm:pb-24 sm:pt-28">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-violet-300">
        <Sparkles className="h-4 w-4" /> Your MovieChoice
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:mt-4 sm:text-5xl sm:font-black">Settings</h1>
      <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
        Set these once. MovieChoice will remember them whenever you tap Recommend Now.
      </p>

      <div className={`mt-10 space-y-5 transition ${loading ? 'pointer-events-none opacity-50' : ''}`}>
        {isOwner ? (
          <Link href="/settings/user-access" className="flex items-center justify-between gap-5 rounded-[2rem] border border-violet-400/25 bg-violet-500/10 p-5 transition hover:border-violet-400/50 hover:bg-violet-500/15 sm:p-7">
            <div>
              <h2 className="text-xl font-black">Invite people</h2>
              <p className="mt-1 text-sm text-zinc-400">Send access PINs and manage who can use MovieChoice.</p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white">
              <UserPlus className="h-5 w-5" />
            </span>
          </Link>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Weekly mix</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stepper label="Movies" value={settings.movieCount} onChange={(movieCount) => { setSavedFlash(false); setSettings({ ...settings, movieCount }); }} />
            <Stepper label="Shows" value={settings.showCount} onChange={(showCount) => { setSavedFlash(false); setSettings({ ...settings, showCount }); }} />
            <Stepper label="Documentaries" value={settings.documentaryCount} onChange={(documentaryCount) => { setSavedFlash(false); setSettings({ ...settings, documentaryCount }); }} />
          </div>
          <div className="mt-3">
            <Stepper label="How recent (years)" value={settings.yearsBack} min={1} max={30} onChange={(yearsBack) => { setSavedFlash(false); setSettings({ ...settings, yearsBack }); }} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Streaming services</h2>
          <p className="mt-1 text-sm text-zinc-500">
            US services you subscribe to. Pick up to {MAX_STREAMING_SERVICES}. Recommendations stay on these only.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {visibleServices.map((service) => (
              <Chip
                key={service.id}
                active={settings.providerIds.includes(service.id)}
                label={service.name}
                disabled={!settings.providerIds.includes(service.id) && settings.providerIds.length >= MAX_STREAMING_SERVICES}
                onClick={() => toggle('providerIds', service.id)}
              />
            ))}
          </div>
          {!showMoreServices && moreServices.length ? (
            <button
              type="button"
              onClick={() => setShowMoreServices(true)}
              className="mt-4 text-sm font-semibold text-violet-300 hover:text-white"
            >
              + Add more US streaming services ({moreServices.length})
            </button>
          ) : null}
          {showMoreServices ? (
            <button
              type="button"
              onClick={() => setShowMoreServices(false)}
              className="mt-4 text-sm font-semibold text-zinc-500 hover:text-white"
            >
              Show fewer services
            </button>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Genres</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Affinities for picks — add more as you go (up to {MAX_GENRES}).
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {visibleGenres.map((genre) => (
              <Chip
                key={genre.id}
                active={settings.genreIds.includes(genre.id)}
                label={genre.name}
                disabled={!settings.genreIds.includes(genre.id) && settings.genreIds.length >= MAX_GENRES}
                onClick={() => toggle('genreIds', genre.id)}
              />
            ))}
          </div>
          {!showMoreGenres && moreGenres.length ? (
            <button
              type="button"
              onClick={() => setShowMoreGenres(true)}
              className="mt-4 text-sm font-semibold text-violet-300 hover:text-white"
            >
              + Add more genres ({moreGenres.length})
            </button>
          ) : null}
          {showMoreGenres ? (
            <button
              type="button"
              onClick={() => setShowMoreGenres(false)}
              className="mt-4 text-sm font-semibold text-zinc-500 hover:text-white"
            >
              Show fewer genres
            </button>
          ) : null}
          <label className="mt-6 flex items-center gap-3 text-sm font-semibold text-zinc-300">
            <input type="checkbox" checked={settings.includeInternational} onChange={(event) => { setSavedFlash(false); setSettings({ ...settings, includeInternational: event.target.checked }); }} className="h-5 w-5 accent-violet-500" />
            Include international titles
          </label>
          <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-zinc-300">
            <input type="checkbox" checked={settings.weeklyRefresh} onChange={(event) => { setSavedFlash(false); setSettings({ ...settings, weeklyRefresh: event.target.checked }); }} className="h-5 w-5 accent-violet-500" />
            Auto-refresh picks each Friday
          </label>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Taste notes</h2>
          <textarea
            value={settings.tasteNote}
            maxLength={240}
            onChange={(event) => { setSavedFlash(false); setSettings({ ...settings, tasteNote: event.target.value }); }}
            placeholder="Subtitled international titles are favorites. Include them regularly."
            className="mt-5 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
          />
        </section>

        <div className="sticky bottom-20 z-30 space-y-2 rounded-[1.5rem] border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur sm:bottom-4">
          {message ? (
            <p
              role="status"
              className={`rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
                savedFlash
                  ? 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : 'border border-white/10 bg-white/5 text-zinc-200'
              }`}
            >
              {savedFlash ? <Check className="mr-1.5 inline h-4 w-4" /> : null}
              {message}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={save}
              disabled={saving || settings.providerIds.length === 0}
              className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 font-black disabled:opacity-50 ${
                savedFlash
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-violet-500 hover:bg-violet-400'
              }`}
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : savedFlash ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : savedFlash ? 'Saved' : 'Save settings'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setSavedFlash(false);
                const response = await fetch('/api/recommendations', {
                  method: 'PUT',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clearHistory: true }),
                });
                setMessage(response.ok ? 'Pick history cleared. Watched titles still stay excluded.' : 'Could not clear history.');
                setSaving(false);
              }}
              className="px-5 py-3 text-center text-sm font-semibold text-zinc-400 hover:text-white"
            >
              Fresh start
            </button>
            <Link href="/for-you" className="px-5 py-3 text-center text-sm font-semibold text-zinc-400 hover:text-white">Back to Picks</Link>
          </div>
          {settings.providerIds.length === 0 ? (
            <p className="px-2 text-center text-xs text-amber-200/90">Choose at least one streaming service to enable Save.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
