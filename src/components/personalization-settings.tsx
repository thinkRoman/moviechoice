'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, LoaderCircle, Save, Sparkles, UserPlus } from 'lucide-react';
import {
  DEFAULT_PICK_SETTINGS,
  PICK_GENRES,
  STREAMING_SERVICES,
  type PickSettings,
} from '@/lib/recommendations';

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick(): void }) {
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/recommendations', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json() as { settings?: PickSettings; error?: string };
        if (!response.ok || !body.settings) throw new Error(body.error || 'Could not load settings.');
        setSettings(body.settings);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  function toggle(key: 'providerIds' | 'genreIds', id: number) {
    setSettings((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/recommendations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Could not save settings.');
      setMessage('Saved. Future recommendations will use these preferences.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

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
            <Stepper label="Movies" value={settings.movieCount} onChange={(movieCount) => setSettings({ ...settings, movieCount })} />
            <Stepper label="Shows" value={settings.showCount} onChange={(showCount) => setSettings({ ...settings, showCount })} />
            <Stepper label="Documentaries" value={settings.documentaryCount} onChange={(documentaryCount) => setSettings({ ...settings, documentaryCount })} />
          </div>
          <div className="mt-3">
            <Stepper label="How recent (years)" value={settings.yearsBack} min={1} max={30} onChange={(yearsBack) => setSettings({ ...settings, yearsBack })} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Streaming services</h2>
          <p className="mt-1 text-sm text-zinc-500">Recommendations only come from services you can watch.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {STREAMING_SERVICES.map((service) => <Chip key={service.id} active={settings.providerIds.includes(service.id)} label={service.name} onClick={() => toggle('providerIds', service.id)} />)}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Genres</h2>
          <p className="mt-1 text-sm text-zinc-500">These are affinities, not a filter you need to repeat each time.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {PICK_GENRES.map((genre) => <Chip key={genre.id} active={settings.genreIds.includes(genre.id)} label={genre.name} onClick={() => toggle('genreIds', genre.id)} />)}
          </div>
          <label className="mt-6 flex items-center gap-3 text-sm font-semibold text-zinc-300">
            <input type="checkbox" checked={settings.includeInternational} onChange={(event) => setSettings({ ...settings, includeInternational: event.target.checked })} className="h-5 w-5 accent-violet-500" />
            Include international titles
          </label>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <h2 className="text-xl font-black">Taste notes</h2>
          <textarea
            value={settings.tasteNote}
            maxLength={240}
            onChange={(event) => setSettings({ ...settings, tasteNote: event.target.value })}
            placeholder="Subtitled international titles are favorites. Include them regularly."
            className="mt-5 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 outline-none placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
          />
        </section>

        <div className="sticky bottom-20 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-zinc-950/90 p-3 shadow-2xl backdrop-blur sm:bottom-4 sm:flex-row sm:items-center">
          <button type="button" onClick={save} disabled={saving || settings.providerIds.length === 0} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-violet-500 px-6 font-black hover:bg-violet-400 disabled:opacity-50">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <Link href="/for-you" className="px-5 py-3 text-center text-sm font-semibold text-zinc-400 hover:text-white">Back to Picks</Link>
        </div>
        {message ? <p role="status" className="text-center text-sm text-zinc-300">{message}</p> : null}
      </div>
    </section>
  );
}
