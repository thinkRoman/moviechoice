'use client';

import { useState } from 'react';
import { Check, ChevronRight, LoaderCircle, Sparkles, Tv } from 'lucide-react';
import {
  DEFAULT_PICK_SETTINGS,
  MAX_GENRES,
  MAX_STREAMING_SERVICES,
  PICK_GENRES,
  STREAMING_SERVICES,
  normalizePickSettings,
  type PickSettings,
} from '@/lib/recommendations';

const STEPS = ['services', 'genres', 'picks'] as const;
type Step = (typeof STEPS)[number];

function Chip({ active, label, onClick, disabled = false }: { active: boolean; label: string; onClick(): void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
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

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('services');
  const [settings, setSettings] = useState<PickSettings>({
    ...DEFAULT_PICK_SETTINGS,
    providerIds: [],
    genreIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const popularServices = STREAMING_SERVICES.filter((s) => 'popular' in s && s.popular);
  const popularGenres = PICK_GENRES.filter((g) => 'popular' in g && g.popular);

  function toggle(key: 'providerIds' | 'genreIds', id: number) {
    setSettings((current) => {
      const limit = key === 'providerIds' ? MAX_STREAMING_SERVICES : MAX_GENRES;
      const selected = current[key];
      if (selected.includes(id)) {
        return { ...current, [key]: selected.filter((v) => v !== id) };
      }
      if (selected.length >= limit) return current;
      return { ...current, [key]: [...selected, id] };
    });
  }

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function finish() {
    if (settings.providerIds.length === 0) {
      setError('Pick at least one streaming service.');
      setStep('services');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = normalizePickSettings(settings);
      const response = await fetch('/api/recommendations', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, completeOnboarding: true }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save.');
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const stepIdx = STEPS.indexOf(step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-lg px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/30">
          MC
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Welcome to MovieChoice</h1>
        <p className="mt-2 text-sm text-zinc-400">Let&apos;s set up your picks in 3 quick steps.</p>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
        {step === 'services' && (
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              <Tv className="h-4 w-4" /> Step 1 of 3
            </div>
            <h2 className="mt-3 text-xl font-black">Your streaming services</h2>
            <p className="mt-1 text-sm text-zinc-500">Pick the services you subscribe to. We&apos;ll only recommend things you can actually watch.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {popularServices.map((service) => (
                <Chip
                  key={service.id}
                  active={settings.providerIds.includes(service.id)}
                  label={service.name}
                  onClick={() => toggle('providerIds', service.id)}
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-600">Don&apos;t see yours? You can add more later in Settings.</p>
          </div>
        )}

        {step === 'genres' && (
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              <Sparkles className="h-4 w-4" /> Step 2 of 3
            </div>
            <h2 className="mt-3 text-xl font-black">What do you enjoy?</h2>
            <p className="mt-1 text-sm text-zinc-500">Pick genres you like. This shapes the vibe of your picks.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {popularGenres.map((genre) => (
                <Chip
                  key={genre.id}
                  active={settings.genreIds.includes(genre.id)}
                  label={genre.name}
                  onClick={() => toggle('genreIds', genre.id)}
                />
              ))}
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={settings.includeInternational}
                onChange={(e) => setSettings({ ...settings, includeInternational: e.target.checked })}
                className="h-5 w-5 accent-violet-500"
              />
              Include international titles
            </label>
          </div>
        )}

        {step === 'picks' && (
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-violet-300">
              <Sparkles className="h-4 w-4" /> Step 3 of 3
            </div>
            <h2 className="mt-3 text-xl font-black">Your weekly mix</h2>
            <p className="mt-1 text-sm text-zinc-500">How many picks do you want each week?</p>
            <div className="mt-5 space-y-3">
              <Stepper
                label="Movies"
                value={settings.movieCount}
                onChange={(movieCount) => setSettings({ ...settings, movieCount })}
              />
              <Stepper
                label="Shows"
                value={settings.showCount}
                onChange={(showCount) => setSettings({ ...settings, showCount })}
              />
              <Stepper
                label="Documentaries"
                value={settings.documentaryCount}
                onChange={(documentaryCount) => setSettings({ ...settings, documentaryCount })}
              />
              <Stepper
                label="How recent (years)"
                value={settings.yearsBack}
                min={1}
                max={30}
                onChange={(yearsBack) => setSettings({ ...settings, yearsBack })}
              />
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-zinc-300">
              <input
                type="checkbox"
                checked={settings.weeklyRefresh}
                onChange={(e) => setSettings({ ...settings, weeklyRefresh: e.target.checked })}
                className="h-5 w-5 accent-violet-500"
              />
              Auto-refresh picks each Friday
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {stepIdx > 0 && (
          <button
            type="button"
            onClick={back}
            disabled={saving}
            className="flex-1 rounded-full border border-white/10 bg-white/[0.035] py-3.5 text-sm font-semibold text-zinc-400 hover:text-white"
          >
            Back
          </button>
        )}
        {stepIdx < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={step === 'services' && settings.providerIds.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-500 disabled:opacity-50"
          >
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Get my picks'}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={saving}
        className="mt-4 w-full text-center text-xs font-semibold text-zinc-600 hover:text-zinc-400"
      >
        Skip for now
      </button>
    </div>
  );
}
