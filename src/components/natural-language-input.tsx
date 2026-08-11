'use client';

import { LoaderCircle, Sparkles, WandSparkles } from 'lucide-react';
import { useState } from 'react';

interface AiRecommendation {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  year: string | null;
  rating: number;
  overview: string;
  posterUrl: string | null;
  primaryProvider: string | null;
  reason: string;
  kind: 'movie' | 'show';
}

interface AiResponse {
  items: AiRecommendation[];
  interpretation: string;
  query: string;
  rateLimit: { remaining: number; resetMs: number };
  error?: string;
}

const SUGGESTIONS = [
  'Something funny for date night',
  'Family-friendly adventure, no horror',
  'Korean thriller, subtitled',
  'Quick watch under 90 minutes',
  'Mind-bending sci-fi',
  'Surprise me!',
];

interface NaturalLanguageInputProps {
  onResults: (items: AiRecommendation[], interpretation: string) => void;
  disabled?: boolean;
}

export default function NaturalLanguageInput({ onResults, disabled }: NaturalLanguageInputProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [error, setError] = useState('');
  const [rateRemaining, setRateRemaining] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    setInterpretation('');

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await response.json() as AiResponse & { error?: string };

      if (response.status === 429) {
        setError('You\'ve used your AI recommendations for this hour. Try the standard picks or come back later.');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'AI recommendations unavailable.');
        return;
      }

      setInterpretation(data.interpretation || '');
      setRateRemaining(data.rateLimit?.remaining ?? null);

      if (data.items?.length) {
        onResults(data.items, data.interpretation || '');
      } else {
        setError('No matches found. Try rephrasing your request.');
      }
    } catch {
      setError('Could not reach AI. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(suggestion: string) {
    setQuery(suggestion);
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
        <WandSparkles className="h-4 w-4" />
        Ask AI for recommendations
      </div>
      <p className="mt-1 text-xs text-violet-500/80">
        Describe what you&apos;re in the mood for — AI picks from your streaming services.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Funny, not scary, under 2 hours"
          maxLength={300}
          disabled={disabled || loading}
          className="flex-1 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading || !query.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-300/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {!query && !loading && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestion(suggestion)}
              className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-600 transition hover:bg-violet-100 hover:text-violet-800"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {interpretation && !error && (
        <p className="mt-3 text-xs font-medium text-violet-600">
          {interpretation}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}

      {rateRemaining !== null && rateRemaining < 3 && (
        <p className="mt-2 text-[10px] text-violet-400">
          {rateRemaining} AI requests remaining this hour.
        </p>
      )}
    </div>
  );
}
