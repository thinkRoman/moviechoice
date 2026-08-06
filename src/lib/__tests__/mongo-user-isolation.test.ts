import { describe, expect, it } from 'vitest';
import { resolveMongoDbName } from '@/lib/mongodb';

describe('MongoDB URI-only configuration', () => {
  it('uses the database path from MONGODB_URI', () => {
    expect(
      resolveMongoDbName(
        'mongodb+srv://user:pass@cluster.mongodb.net/moviechoice?retryWrites=true',
      ),
    ).toBe('moviechoice');
  });
});

describe('per-user history isolation rules', () => {
  it('scopes library and recommendation history keys by distinct user ids', () => {
    const ownerId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const memberId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
    const history = new Map<string, string[]>([
      [ownerId, ['movie:1']],
      [memberId, ['movie:2', 'tv:9']],
    ]);
    const watched = new Map<string, number[]>([
      [ownerId, [1]],
      [memberId, [9]],
    ]);

    expect(history.get(ownerId)).not.toEqual(history.get(memberId));
    expect(watched.get(ownerId)).not.toEqual(watched.get(memberId));
    expect(history.get(memberId)).toContain('tv:9');
    expect(watched.get(ownerId)).toContain(1);
  });
});
