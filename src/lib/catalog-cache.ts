import dbConnect from '@/lib/mongodb';
import CatalogCache from '@/models/CatalogCache';
import { enrichDiscoverTitle, type DiscoverTitle, type EnrichedTitle } from '@/lib/tmdb';

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL || 3600);

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
