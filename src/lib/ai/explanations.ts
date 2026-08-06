/**
 * OpenAI explanation layer for Friday-style picks.
 * Catalog selection stays deterministic (TMDB + ranking); AI only writes blurbs.
 */

export interface ExplainableTitle {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  year: string | null;
  overview: string;
  kind: 'movie' | 'show' | 'documentary';
}

function titleKey(title: ExplainableTitle): string {
  return `${title.mediaType}:${title.id}`;
}

function fallbackReason(title: ExplainableTitle): string {
  const overview = title.overview.trim();
  if (overview.length > 180) return `${overview.slice(0, 177).trimEnd()}…`;
  if (overview) return overview;
  return `A strong ${title.kind} pick that fits your saved preferences.`;
}

export async function explainRecommendations(
  titles: ExplainableTitle[],
  tasteNote: string,
): Promise<Record<string, string>> {
  const fallbacks = Object.fromEntries(titles.map((title) => [titleKey(title), fallbackReason(title)]));
  if (!titles.length) return fallbacks;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbacks;

  const model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o';
  const maxTokens = Number(process.env.OPENAI_MAX_TOKENS || 1000);

  const catalog = titles.map((title) => ({
    key: titleKey(title),
    title: title.title,
    year: title.year,
    kind: title.kind,
    overview: title.overview.slice(0, 280),
  }));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: Math.min(Math.max(maxTokens, 200), 1500),
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'You write warm, concise recommendation blurbs for a family movie night app.',
              'Return JSON only: { "reasons": { "<key>": "<one sentence>" } }.',
              'Each sentence should feel personal, mention vibe or appeal, and stay under 42 words.',
              'Never invent cast, awards, or plot twists not present in the overview.',
              'Use the household taste note when it helps, but do not quote it verbatim.',
            ].join(' '),
          },
          {
            role: 'user',
            content: JSON.stringify({
              tasteNote: tasteNote.trim() || null,
              titles: catalog,
            }),
          },
        ],
      }),
    });

    if (!response.ok) return fallbacks;

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallbacks;

    const parsed = JSON.parse(content) as { reasons?: Record<string, string> };
    const reasons = parsed.reasons || {};
    return Object.fromEntries(
      titles.map((title) => {
        const key = titleKey(title);
        const reason = reasons[key]?.trim();
        return [key, reason || fallbacks[key]];
      }),
    );
  } catch {
    return fallbacks;
  }
}
