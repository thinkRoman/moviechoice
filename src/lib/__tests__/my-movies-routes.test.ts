import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  setFlag: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/movie-library-repository', () => ({
  movieLibraryRepository: {
    list: mocks.list,
    setFlag: mocks.setFlag,
  },
}));

import { GET } from '@/app/api/my-movies/route';
import { PUT } from '@/app/api/my-movies/[tmdbMovieId]/route';

describe('My Movies API authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an unauthenticated request', async () => {
    mocks.auth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('returns only records scoped to the session user', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-a' } });
    mocks.list.mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith('user-a');
  });

  it('ignores attempted cross-user input and scopes writes to the session user', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-a' } });
    mocks.setFlag.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/my-movies/27205', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-b',
        action: 'watchlist',
        value: true,
        title: 'Inception',
        posterPath: '/poster.jpg',
        releaseYear: '2010',
      }),
    });
    const response = await PUT(request, {
      params: Promise.resolve({ tmdbMovieId: '27205' }),
    });
    expect(response.status).toBe(200);
    expect(mocks.setFlag).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({ tmdbMovieId: 27205 }),
      'watchlist',
      true,
    );
  });
});
