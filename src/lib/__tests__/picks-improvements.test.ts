import { describe, expect, it } from 'vitest';
import type { DiscoverTitle } from '@/lib/tmdb';
import {
  DEFAULT_PICK_SETTINGS,
  isOnboardingNeeded,
  mergeSeedCandidates,
  needsWeeklyRefresh,
  rankRecommendations,
} from '@/lib/recommendations';

function candidate(overrides: Partial<DiscoverTitle> = {}): DiscoverTitle {
  return {
    id: 1,
    mediaType: 'movie',
    title: 'A Good Movie',
    overview: 'Worth watching.',
    posterUrl: '/poster.jpg',
    posterPath: '/poster.jpg',
    backdropUrl: '/backdrop.jpg',
    releaseDate: '2025-01-01',
    year: '2025',
    rating: 8,
    voteCount: 1000,
    popularity: 20,
    genreIds: [18],
    international: false,
    originalLanguage: 'en',
    ...overrides,
  };
}

describe('weekly refresh + onboarding helpers', () => {
  it('needs weekly refresh after a new Friday when enabled', () => {
    expect(needsWeeklyRefresh(true, null)).toBe(true);
    expect(needsWeeklyRefresh(false, null)).toBe(false);
    // Thursday Aug 6 2026 — last Friday was July 31
    const thursday = new Date('2026-08-06T12:00:00Z');
    expect(needsWeeklyRefresh(true, '2026-07-30T12:00:00Z', thursday)).toBe(true);
    expect(needsWeeklyRefresh(true, '2026-08-01T12:00:00Z', thursday)).toBe(false);
  });

  it('detects first-run onboarding for default settings', () => {
    expect(isOnboardingNeeded(DEFAULT_PICK_SETTINGS, null)).toBe(true);
    expect(isOnboardingNeeded(DEFAULT_PICK_SETTINGS, new Date())).toBe(false);
    expect(isOnboardingNeeded({ ...DEFAULT_PICK_SETTINGS, providerIds: [8, 337] }, null)).toBe(false);
  });
});

describe('liked-title seeding', () => {
  it('boosts titles that appear in seed recommendations', () => {
    const merged = mergeSeedCandidates(
      [candidate({ id: 1 }), candidate({ id: 2 })],
      [candidate({ id: 2 }), candidate({ id: 3 })],
    );
    expect(merged.candidates).toHaveLength(3);
    expect(merged.boosts.get(2)).toBeGreaterThan(0);
    expect(merged.boosts.get(1)).toBe(0);
  });

  it('ranks seed-boosted titles ahead when quality is equal', () => {
    const result = rankRecommendations({
      candidates: [candidate({ id: 1, rating: 8 }), candidate({ id: 2, rating: 8 })],
      kind: 'movie',
      count: 1,
      watchedIds: new Set(),
      settings: DEFAULT_PICK_SETTINGS,
      seed: 'seed-test',
      seedBoosts: new Map([[2, 2]]),
    });
    expect(result[0]?.id).toBe(2);
  });
});
