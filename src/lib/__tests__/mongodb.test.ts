import { describe, expect, it } from 'vitest';
import { assertMongoUri, normalizeMongoUri } from '@/lib/mongodb';

describe('normalizeMongoUri', () => {
  it('strips wrapping quotes and whitespace', () => {
    expect(normalizeMongoUri('  "mongodb+srv://u:p@cluster.mongodb.net/db"  ')).toBe(
      'mongodb+srv://u:p@cluster.mongodb.net/db',
    );
    expect(normalizeMongoUri("'mongodb://localhost:27017/moviechoice'")).toBe(
      'mongodb://localhost:27017/moviechoice',
    );
  });

  it('extracts uri from pasted clutter', () => {
    expect(normalizeMongoUri('Connection string: mongodb+srv://u:p@host/db?w=majority extra'))
      .toBe('mongodb+srv://u:p@host/db?w=majority');
  });

  it('rejects invalid schemes with a clear error', () => {
    expect(() => assertMongoUri('')).toThrow(/MONGODB_URI is missing/);
    expect(() => assertMongoUri('moviechoice')).toThrow(/must start with mongodb/);
  });
});
