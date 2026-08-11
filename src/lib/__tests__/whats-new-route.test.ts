import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getWhatsNewOnProvider: vi.fn(async () => ([
    {
      id: 1,
      mediaType: 'movie' as const,
      title: 'Fresh',
      overview: 'New',
      posterUrl: null,
      posterPath: null,
      backdropUrl: null,
      releaseDate: '2026-08-01',
      year: '2026',
      rating: 7,
      voteCount: 100,
      popularity: 50,
      genreIds: [],
      international: false,
      originalLanguage: 'en',
    },
  ])),
}));

vi.mock('@/lib/tmdb', () => ({
  WHATS_NEW_LOOKBACK_DAYS: 60,
  getWhatsNewOnProvider: mocks.getWhatsNewOnProvider,
}));

import { GET } from '@/app/api/whats-new/route';

describe('GET /api/whats-new', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unknown providers', async () => {
    const response = await GET(new NextRequest('http://localhost/api/whats-new?providerId=99999'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('streaming') });
    expect(mocks.getWhatsNewOnProvider).not.toHaveBeenCalled();
  });

  it('returns titles for a known provider', async () => {
    const response = await GET(new NextRequest('http://localhost/api/whats-new?providerId=8'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      providerId: 8,
      providerName: 'Netflix',
      lookbackDays: 60,
      titles: [{ id: 1, title: 'Fresh' }],
    });
    expect(mocks.getWhatsNewOnProvider).toHaveBeenCalledWith(8);
  });
});
