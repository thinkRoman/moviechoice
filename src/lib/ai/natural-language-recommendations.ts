/**
 * AI-powered natural language interpretation for MovieChoice.
 *
 * Architecture:
 *   User query → OpenAI structured extraction → SessionIntent → existing ranking pipeline.
 *
 * The catalog selection stays deterministic (TMDB + ranking); AI only interprets the
 * user's natural language into structured filters the existing engine already understands.
 */

import { interpretSessionRequest, type SessionIntent } from '@/lib/recommendations';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export interface NlpResult {
  intent: SessionIntent;
  interpretation: string;
  raw: string;
}

function fallbackInterpretation(query: string): NlpResult {
  return {
    intent: interpretSessionRequest(query),
    interpretation: 'Using basic keyword matching (AI unavailable).',
    raw: query,
  };
}

/**
 * Ask OpenAI to extract a structured SessionIntent from natural language.
 * Falls back to the existing regex-based interpreter if the API is unavailable.
 */
export async function interpretQuery(query: string): Promise<NlpResult> {
  const trimmed = query.trim();
  if (!trimmed) return fallbackInterpretation('');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackInterpretation(trimmed);

  const model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o';

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'You interpret natural language movie/TV requests into structured filters.',
              'Return JSON only with this exact shape:',
              '{',
              '  "genres": ["Action", "Comedy"],',
              '  "excludeGenres": ["Horror"],',
              '  "keywords": ["heist", "twist ending"],',
              '  "maxRuntime": null,',
              '  "familyFriendly": false,',
              '  "surpriseMe": false,',
              '  "preferInternational": false,',
              '  "interpretation": "One sentence summarizing what the user wants."',
              '}',
              '',
              'Rules:',
              '- Map natural language to TMDB genre names (Action, Comedy, Drama, Horror, Mystery, Romance, Science Fiction, Thriller, Documentary, Adventure, Animation, Crime, Family, Fantasy, History, Music, War, Western).',
              '- "scary" → Horror, "funny" → Comedy, "date night" → Romance, "mind-bending" → Science Fiction + Mystery.',
              '- "family friendly" or "kids" → familyFriendly: true, exclude Horror.',
              '- "surprise me" or "anything" → surpriseMe: true.',
              '- "foreign" or "Korean" or "subtitled" → preferInternational: true.',
              '- Extract specific keywords from the query (mood, theme, plot elements).',
              '- maxRuntime: extract minutes if user says "under X minutes" or "short".',
              '- Keep interpretation under 20 words.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: trimmed,
          },
        ],
      }),
    });

    if (!response.ok) return fallbackInterpretation(trimmed);

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallbackInterpretation(trimmed);

    const parsed = JSON.parse(content) as {
      genres?: string[];
      excludeGenres?: string[];
      keywords?: string[];
      maxRuntime?: number | null;
      familyFriendly?: boolean;
      surpriseMe?: boolean;
      preferInternational?: boolean;
      interpretation?: string;
    };

    // Convert genre names to IDs
    const GENRE_NAME_TO_ID: Record<string, number> = {
      'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35, 'Crime': 80,
      'Documentary': 99, 'Drama': 18, 'Family': 10751, 'Fantasy': 14, 'History': 36,
      'Horror': 27, 'Music': 10402, 'Mystery': 9648, 'Romance': 10749,
      'Science Fiction': 878, 'TV Movie': 10770, 'Thriller': 53, 'War': 10752,
      'Western': 37,
    };

    const genreIds = (parsed.genres || [])
      .map((name) => GENRE_NAME_TO_ID[name])
      .filter((id): id is number => id !== undefined);

    const excludedGenreIds = (parsed.excludeGenres || [])
      .map((name) => GENRE_NAME_TO_ID[name])
      .filter((id): id is number => id !== undefined);

    const intent: SessionIntent = {
      genreIds,
      excludedGenreIds,
      keywords: (parsed.keywords || []).slice(0, 12),
      familyFriendly: Boolean(parsed.familyFriendly),
      surpriseMe: Boolean(parsed.surpriseMe),
      preferInternational: Boolean(parsed.preferInternational),
      ...(parsed.maxRuntime ? { maxRuntime: parsed.maxRuntime } : {}),
    };

    // Also merge with regex-based extraction for anything the AI missed
    const regexIntent = interpretSessionRequest(trimmed);
    const merged: SessionIntent = {
      genreIds: intent.genreIds.length ? intent.genreIds : regexIntent.genreIds,
      excludedGenreIds: [...new Set([...intent.excludedGenreIds, ...regexIntent.excludedGenreIds])],
      keywords: [...new Set([...intent.keywords, ...regexIntent.keywords])].slice(0, 16),
      familyFriendly: intent.familyFriendly || regexIntent.familyFriendly,
      surpriseMe: intent.surpriseMe || regexIntent.surpriseMe,
      preferInternational: intent.preferInternational || regexIntent.preferInternational,
      maxRuntime: intent.maxRuntime || regexIntent.maxRuntime,
    };

    return {
      intent: merged,
      interpretation: parsed.interpretation || `Looking for: ${trimmed}`,
      raw: trimmed,
    };
  } catch {
    return fallbackInterpretation(trimmed);
  }
}
