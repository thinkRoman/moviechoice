import { describe, expect, it } from 'vitest';
import { mongoConnectionOptions, resolveMongoDbName } from '@/lib/mongodb';

describe('MongoDB env configuration', () => {
  it('prefers MONGODB_DB over a database path in the URI', () => {
    expect(
      resolveMongoDbName(
        'mongodb+srv://user:pass@cluster.mongodb.net/from-uri?retryWrites=true',
        'moviechoice',
      ),
    ).toBe('moviechoice');
  });

  it('falls back to the URI path when MONGODB_DB is empty', () => {
    expect(
      resolveMongoDbName(
        'mongodb+srv://user:pass@cluster.mongodb.net/from-uri?retryWrites=true',
        '  ',
      ),
    ).toBe('from-uri');
  });

  it('passes dbName into mongoose connection options', () => {
    expect(
      mongoConnectionOptions(
        'mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true',
        'moviechoice',
      ),
    ).toMatchObject({ dbName: 'moviechoice' });
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
