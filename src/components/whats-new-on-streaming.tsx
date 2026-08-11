'use client';

import { useEffect, useState } from 'react';
import { STREAMING_SERVICES } from '@/lib/recommendations';
import type { DiscoverTitle } from '@/lib/tmdb';
import MediaCard from '@/components/media-card';

const STORAGE_KEY = 'moviechoice:whats-new-provider';
const POPULAR = STREAMING_SERVICES.filter((service) => 'popular' in service && service.popular);

type WhatsNewResponse = {
  providerId: number;
  providerName: string;
  lookbackDays: number;
  disclaimer: string;
  titles: DiscoverTitle[];
  error?: string;
};

type BatchWhatsNewResponse = {
  lookbackDays: number;
  disclaimer: string;
  providers: Array<{
    providerId: number;
    providerName: string;
    titles: DiscoverTitle[];
    error?: string;
  }>;
};

function readStoredProvider(): number {
  if (typeof window === 'undefined') return POPULAR[0]?.id || 8;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const id = Number(raw);
    if (POPULAR.some((service) => service.id === id) || STREAMING_SERVICES.some((s) => s.id === id)) {
      return id;
    }
  } catch {
    // ignore storage failures
  }
  return POPULAR[0]?.id || 8;
}

export default function WhatsNewOnStreaming() {
  const [providerId, setProviderId] = useState<number>(POPULAR[0]?.id || 8);
  const [titles, setTitles] = useState<DiscoverTitle[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [lookbackDays, setLookbackDays] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [preferredIds, setPreferredIds] = useState<number[]>([]);
  const [batchCache, setBatchCache] = useState<Map<number, DiscoverTitle[]>>(new Map());

  // Load user's preferred providers and set initial provider
  useEffect(() => {
    let cancelled = false;
    fetch('/api/recommendations')
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ settings?: { providerIds?: number[] } }>;
      })
      .then((data) => {
        if (cancelled || !data?.settings?.providerIds?.length) return;
        const ids = data.settings.providerIds;
        setPreferredIds(ids);

        // Set initial provider to first preferred if no stored choice
        const stored = readStoredProvider();
        const hasStoredChoice = ids.includes(stored)
          || STREAMING_SERVICES.some((s) => s.id === stored);
        if (!hasStoredChoice || !window.localStorage.getItem(STORAGE_KEY)) {
          const firstPreferred = ids[0];
          if (firstPreferred) setProviderId(firstPreferred);
        }

        // Pre-fetch all subscribed providers via batch API
        const batchIds = ids.slice(0, 5).join(',');
        fetch(`/api/whats-new?providerIds=${batchIds}`)
          .then(async (res) => {
            if (!res.ok) return null;
            return res.json() as Promise<BatchWhatsNewResponse>;
          })
          .then((batch) => {
            if (cancelled || !batch?.providers) return;
            const cache = new Map<number, DiscoverTitle[]>();
            for (const provider of batch.providers) {
              cache.set(provider.providerId, provider.titles);
            }
            setBatchCache(cache);
            setDisclaimer(batch.disclaimer || '');
            setLookbackDays(batch.lookbackDays || 60);
          })
          .catch(() => {
            // Batch pre-fetch is optional — single fetch still works.
          });
      })
      .catch(() => {
        // Guests still get popular services.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch titles for selected provider (uses batch cache if available)
  useEffect(() => {
    // If we have batch-cached data for this provider, use it instantly
    const cached = batchCache.get(providerId);
    if (cached) {
      setTitles(cached);
      setError(null);
      setLoading(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(providerId));
      } catch {
        // ignore
      }
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/whats-new?providerId=${providerId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as WhatsNewResponse;
        if (!response.ok) throw new Error(data.error || 'Could not load what\'s new.');
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setTitles(data.titles || []);
        setDisclaimer(data.disclaimer || '');
        setLookbackDays(data.lookbackDays || 60);
        try {
          window.localStorage.setItem(STORAGE_KEY, String(providerId));
        } catch {
          // ignore
        }
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setTitles([]);
        setError(err instanceof Error ? err.message : 'Could not load what\'s new.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [providerId, batchCache]);

  const preferredServices = STREAMING_SERVICES.filter((service) => preferredIds.includes(service.id));
  const chipServices = showMore
    ? STREAMING_SERVICES
    : [
        ...preferredServices,
        ...POPULAR.filter((service) => !preferredIds.includes(service.id)),
      ].filter((service, index, list) => list.findIndex((entry) => entry.id === service.id) === index);

  const providerName = STREAMING_SERVICES.find((service) => service.id === providerId)?.name || 'Streaming';

  return (
    <section
      aria-labelledby="whats-new-on-streaming"
      className="animate-rise-in py-5 sm:py-7"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="whats-new-on-streaming" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          What&apos;s new on streaming
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Pick a service to browse recent movies and shows available in the US
          {lookbackDays ? ` from the last ${lookbackDays} days` : ''}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {chipServices.map((service) => {
            const active = service.id === providerId;
            return (
              <button
                key={service.id}
                type="button"
                aria-pressed={active}
                onClick={() => setProviderId(service.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                  active
                    ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                    : 'border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {service.name}
              </button>
            );
          })}
          {!showMore ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="rounded-full border border-dashed border-white/15 px-3.5 py-1.5 text-sm font-semibold text-zinc-500 hover:border-white/30 hover:text-white"
            >
              More services
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowMore(false)}
              className="rounded-full border border-dashed border-white/15 px-3.5 py-1.5 text-sm font-semibold text-zinc-500 hover:border-white/30 hover:text-white"
            >
              Fewer
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex gap-3 overflow-hidden px-4 sm:px-6 lg:px-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] w-[42vw] max-w-[180px] shrink-0 animate-pulse rounded-2xl bg-zinc-900/80 ring-1 ring-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <p className="mx-auto mt-4 max-w-7xl px-4 text-sm text-amber-200/90 sm:px-6 lg:px-8">{error}</p>
      ) : titles.length === 0 ? (
        <p className="mx-auto mt-4 max-w-7xl px-4 text-sm text-zinc-500 sm:px-6 lg:px-8">
          No recent titles found on {providerName} right now. Try another service.
        </p>
      ) : (
        <div className="scrollbar-hide mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:gap-4 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-6 lg:overflow-visible lg:px-8 xl:mx-auto">
          {titles.slice(0, 12).map((title) => (
            <div key={`${title.mediaType}-${title.id}`} className="w-[42vw] max-w-[180px] shrink-0 snap-start lg:w-auto">
              <MediaCard title={title} />
            </div>
          ))}
        </div>
      )}

      {disclaimer ? (
        <p className="mx-auto mt-1 max-w-7xl px-4 text-xs text-zinc-600 sm:px-6 lg:px-8">{disclaimer}</p>
      ) : null}
    </section>
  );
}
