import { describe, expect, it, vi, afterEach } from 'vitest';
import { explainRecommendations } from '@/lib/ai/explanations';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('explainRecommendations', () => {
  it('falls back to overview text when OpenAI is not configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const reasons = await explainRecommendations(
      [{
        id: 10,
        mediaType: 'movie',
        title: 'Past Lives',
        year: '2023',
        overview: 'Two childhood friends reconnect in New York decades later.',
        kind: 'movie',
      }],
      'Prefer intimate dramas',
    );
    expect(reasons['movie:10']).toContain('childhood friends');
  });

  it('uses OpenAI JSON reasons when available', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              reasons: {
                'movie:10': 'A tender reunion story that fits your taste for intimate dramas.',
              },
            }),
          },
        }],
      }),
    }));

    const reasons = await explainRecommendations(
      [{
        id: 10,
        mediaType: 'movie',
        title: 'Past Lives',
        year: '2023',
        overview: 'Two childhood friends reconnect in New York decades later.',
        kind: 'movie',
      }],
      'Prefer intimate dramas',
    );

    expect(reasons['movie:10']).toContain('tender reunion');
    expect(fetch).toHaveBeenCalled();
  });

  it('falls back when OpenAI returns an error', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const reasons = await explainRecommendations(
      [{
        id: 22,
        mediaType: 'tv',
        title: 'The Bear',
        year: '2022',
        overview: 'A young chef returns home to run his family sandwich shop.',
        kind: 'show',
      }],
      '',
    );
    expect(reasons['tv:22']).toContain('sandwich shop');
  });
});
