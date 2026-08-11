import dbConnect from '@/lib/mongodb';
import CatalogCache from '@/models/CatalogCache';
import {
  enrichDiscoverTitle,
  getWhatsNewOnProvider,
  type DiscoverTitle,
  type EnrichedTitle,
} from '@/lib/tmdb';

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL || 3600);
const WHATS_NEW_TTL_SECONDS = 6 * 60 * 60; // 6 hours — new releases update daily

export async function cachedEnrichDiscoverTitle(
  title: DiscoverTitle,
  preferredProviderIds: number[] = [],
): Promise<EnrichedTitle> {
  const key = `enrich:${title.mediaType}:${title.id}:providers:${preferredProviderIds.slice().sort((a, b) => a - b).join(',') || 'any'}`;
  try {
    await dbConnect();
    const cached = await CatalogCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
    if (cached?.data) return cached.data as unknown as EnrichedTitle;
  } catch {
    // Cache miss / DB unavailable — fall through to live TMDB.
  }

  const enriched = await enrichDiscoverTitle(title, preferredProviderIds);

  try {
    const ttl = DEFAULT_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await CatalogCache.findOneAndUpdate(
      { key },
      { $set: { key, data: enriched, ttl, expiresAt } },
      { upsert: true },
    );
  } catch {
    // Non-fatal: picks still work without cache writes.
  }

  return enriched;
}

/**
 * Cached version of getWhatsNewOnProvider.
 * What's New data refreshes daily, so we cache for 6 hours to reduce TMDB calls.
 */
export async function cachedGetWhatsNewOnProvider(
  providerId: number,
  today = new Date(),
  options: { lookbackDays?: number; limit?: number } = {},
): Promise<DiscoverTitle[]> {
  const lookbackDays = options.lookbackDays ?? 60;
  const limit = options.limit ?? 18;
  const key = `whats-new:${providerId}:${lookbackDays}:${limit}`;

  try {
    await dbConnect();
    const cached = await CatalogCache.findOne({ key, expiresAt: { $gt: today } }).lean();
    if (cached?.data) return cached.data as unknown as DiscoverTitle[];
  } catch {
    // Cache miss / DB unavailable — fall through to live TMDB.
  }

  const titles = await getWhatsNewOnProvider(providerId, today, { lookbackDays, limit });

  try {
    const expiresAt = new Date(today.getTime() + WHATS_NEW_TTL_SECONDS * 1000);
    await CatalogCache.findOneAndUpdate(
      { key },
      { $set: { key, data: titles, ttl: WHATS_NEW_TTL_SECONDS, expiresAt } },
      { upsert: true },
    );
  } catch {
    // Non-fatal: What's New still works without cache writes.
  }

  return titles;
}
