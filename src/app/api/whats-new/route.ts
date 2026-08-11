import { NextRequest, NextResponse } from 'next/server';
import { STREAMING_SERVICES } from '@/lib/recommendations';
import { cachedGetWhatsNewOnProvider } from '@/lib/catalog-cache';
import type { DiscoverTitle } from '@/lib/tmdb';

const KNOWN_PROVIDERS = new Map<number, string>(
  STREAMING_SERVICES.map((service) => [service.id, service.name]),
);

const MAX_PROVIDERS = 5;

type ProviderResult = {
  providerId: number;
  providerName: string;
  titles: DiscoverTitle[];
  error?: string;
};

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('providerId');
    const rawMulti = request.nextUrl.searchParams.get('providerIds');
    const userId = request.nextUrl.searchParams.get('userId');

    // If we have a user ID, prefer the new streaming-based approach
    if (userId) {
      // For now, let's just return an error to indicate this functionality is being extended
      // In the future, this would be enhanced with actual user profile logic
      return NextResponse.json({
        message: 'Use /api/whats-new/streaming for user-specific content',
        userId,
        support: '/api/whats-new/streaming'
      });
    }

    // Single provider (backwards-compatible)
    if (raw) {
      const providerId = Number(raw);
      const providerName = KNOWN_PROVIDERS.get(providerId);
      if (!Number.isInteger(providerId) || providerId <= 0 || !providerName) {
        return NextResponse.json(
          { error: 'Choose a known US streaming service.' },
          { status: 400 },
        );
      }

      const titles = await cachedGetWhatsNewOnProvider(providerId);
      return NextResponse.json({
        providerId,
        providerName,
        lookbackDays: 60,
        disclaimer:
          'Recent movies and shows available to stream in the US. Freshness is based on release or premiere date—not the exact day a service added the title.',
        titles,
      });
    }

    // Multiple providers (batch mode)
    if (rawMulti) {
      const ids = rawMulti
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((id) => Number.isInteger(id) && id > 0 && KNOWN_PROVIDERS.has(id))
        .slice(0, MAX_PROVIDERS);

      if (ids.length === 0) {
        return NextResponse.json(
          { error: 'No valid streaming services provided.' },
          { status: 400 },
        );
      }

      const results = await Promise.allSettled(
        ids.map(async (providerId): Promise<ProviderResult> => {
          const titles = await cachedGetWhatsNewOnProvider(providerId);
          return {
            providerId,
            providerName: KNOWN_PROVIDERS.get(providerId)!,
            titles,
          };
        }),
      );

      const providers = results.map((result, index) => {
        if (result.status === 'fulfilled') return result.value;
        return {
          providerId: ids[index],
          providerName: KNOWN_PROVIDERS.get(ids[index]) || 'Unknown',
          titles: [],
          error: 'Could not load titles for this service.',
        };
      });

      return NextResponse.json({
        lookbackDays: 60,
        disclaimer:
          'Recent movies and shows available to stream in the US. Freshness is based on release or premiere date—not the exact day a service added the title.',
        providers,
      });
    }

    return NextResponse.json(
      { error: 'Provide providerId, providerIds parameter, or userId for user-specific content.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('GET /api/whats-new failed', error);
    return NextResponse.json({ error: 'Could not load what\'s new right now.' }, { status: 500 });
  }
}
