import { NextRequest, NextResponse } from 'next/server';
import { STREAMING_SERVICES } from '@/lib/recommendations';
import { getWhatsNewOnProvider, WHATS_NEW_LOOKBACK_DAYS } from '@/lib/tmdb';

const KNOWN_PROVIDERS = new Map<number, string>(
  STREAMING_SERVICES.map((service) => [service.id, service.name]),
);

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('providerId');
    const providerId = Number(raw);
    const providerName = KNOWN_PROVIDERS.get(providerId);
    if (!Number.isInteger(providerId) || providerId <= 0 || !providerName) {
      return NextResponse.json(
        { error: 'Choose a known US streaming service.' },
        { status: 400 },
      );
    }

    const titles = await getWhatsNewOnProvider(providerId);
    return NextResponse.json({
      providerId,
      providerName,
      lookbackDays: WHATS_NEW_LOOKBACK_DAYS,
      disclaimer:
        'Recent movies and shows available to stream in the US. Freshness is based on release or premiere date—not the exact day a service added the title.',
      titles,
    });
  } catch (error) {
    console.error('GET /api/whats-new failed', error);
    return NextResponse.json({ error: 'Could not load what’s new right now.' }, { status: 500 });
  }
}
