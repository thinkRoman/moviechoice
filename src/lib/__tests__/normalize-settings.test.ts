import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PICK_SETTINGS,
  normalizePickSettings,
} from '@/lib/recommendations';

describe('normalizePickSettings', () => {
  it('returns defaults for empty or invalid input', () => {
    expect(normalizePickSettings(null)).toEqual(DEFAULT_PICK_SETTINGS);
    expect(normalizePickSettings({})).toMatchObject({
      providerIds: DEFAULT_PICK_SETTINGS.providerIds,
      genreIds: DEFAULT_PICK_SETTINGS.genreIds,
    });
  });

  it('keeps valid saved providers and genres', () => {
    expect(normalizePickSettings({
      providerIds: [8, 1899, 99999],
      genreIds: [18, 10765, -1],
      movieCount: 4,
      showCount: 3,
      documentaryCount: 0,
      yearsBack: 10,
      tasteNote: 'Korean dramas',
      includeInternational: true,
      weeklyRefresh: true,
    })).toMatchObject({
      providerIds: [8, 1899],
      genreIds: [18, 10765],
      movieCount: 4,
      showCount: 3,
      tasteNote: 'Korean dramas',
      weeklyRefresh: true,
    });
  });

  it('keeps Sundance Now and ChaiFlicks provider ids', () => {
    expect(normalizePickSettings({
      providerIds: [143, 438],
      genreIds: [18],
    }).providerIds).toEqual([143, 438]);
  });

  it('repairs a zeroed recommendation mix', () => {
    const result = normalizePickSettings({
      providerIds: [8],
      genreIds: [35],
      movieCount: 0,
      showCount: 0,
      documentaryCount: 0,
    });
    expect(result.movieCount + result.showCount + result.documentaryCount).toBeGreaterThan(0);
  });
});
