import { describe, expect, it } from 'vitest';
import type { DiscoverTitle } from '@/lib/tmdb';
import {
  DEFAULT_PICK_SETTINGS,
  dedupeTitles,
  interpretSessionRequest,
  mergeIntents,
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

describe('rankRecommendations', () => {
  it('excludes watched titles', () => {
    const result = rankRecommendations({
      candidates: [candidate({ id: 1 }), candidate({ id: 2 })],
      kind: 'movie',
      count: 2,
      watchedIds: new Set([1]),
      settings: DEFAULT_PICK_SETTINGS,
      seed: 'today',
    });
    expect(result.map((item) => item.id)).toEqual([2]);
  });

  it('applies the Friday Picks quality floor', () => {
    const result = rankRecommendations({
      candidates: [
        candidate({ id: 1, rating: 6.5 }),
        candidate({ id: 2, voteCount: 299 }),
        candidate({ id: 3, rating: 7.5, voteCount: 300 }),
      ],
      kind: 'movie',
      count: 3,
      watchedIds: new Set(),
      settings: DEFAULT_PICK_SETTINGS,
      seed: 'today',
    });
    expect(result.map((item) => item.id)).toEqual([3]);
  });

  it('only admits documentaries to a documentary set', () => {
    const result = rankRecommendations({
      candidates: [candidate({ id: 1, genreIds: [18] }), candidate({ id: 2, genreIds: [99] })],
      kind: 'documentary',
      count: 2,
      watchedIds: new Set(),
      settings: DEFAULT_PICK_SETTINGS,
      seed: 'today',
    });
    expect(result.map((item) => item.id)).toEqual([2]);
  });

  it('is deterministic for the same person, settings, and day', () => {
    const input = {
      candidates: [candidate({ id: 1 }), candidate({ id: 2 }), candidate({ id: 3 })],
      kind: 'movie' as const,
      count: 3,
      watchedIds: new Set<number>(),
      settings: DEFAULT_PICK_SETTINGS,
      seed: 'person:2026-07-30',
    };
    expect(rankRecommendations(input).map((item) => item.id))
      .toEqual(rankRecommendations(input).map((item) => item.id));
  });

  it('turns a one-time request into retrieval constraints', () => {
    expect(interpretSessionRequest('Family comedies under 90 minutes tonight')).toMatchObject({
      genreIds: expect.arrayContaining([35, 10751]),
      excludedGenreIds: [27],
      maxRuntime: 90,
      familyFriendly: true,
    });
  });

  it('applies requested genres to the candidate set', () => {
    const result = rankRecommendations({
      candidates: [candidate({ id: 1, genreIds: [18] }), candidate({ id: 2, genreIds: [35] })],
      kind: 'movie',
      count: 2,
      watchedIds: new Set(),
      settings: DEFAULT_PICK_SETTINGS,
      seed: 'fresh-request',
      intent: interpretSessionRequest('Only comedies tonight'),
    });
    expect(result.map((item) => item.id)).toEqual([2]);
  });

  it('deduplicates titles returned by multiple provider and sort lanes', () => {
    expect(dedupeTitles([candidate({ id: 1 }), candidate({ id: 1 }), candidate({ id: 2 })]))
      .toHaveLength(2);
  });

  it('combines persistent taste with a stronger request for tonight', () => {
    const intent = mergeIntents(
      interpretSessionRequest('I love subtitled international drama'),
      interpretSessionRequest('Only comedies tonight'),
    );
    expect(intent).toMatchObject({ genreIds: [35], preferInternational: true });
  });
});
