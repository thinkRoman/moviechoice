import type { DiscoverTitle } from '@/lib/tmdb';

export const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix' },
  { id: 9, name: 'Prime Video' },
  { id: 337, name: 'Disney+' },
  { id: 1899, name: 'Max' },
  { id: 15, name: 'Hulu' },
  { id: 350, name: 'Apple TV+' },
  { id: 531, name: 'Paramount+' },
  { id: 386, name: 'Peacock' },
] as const;

export const PICK_GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
  { id: 99, name: 'Documentary' },
] as const;

export interface PickSettings {
  providerIds: number[];
  genreIds: number[];
  tasteNote: string;
  yearsBack: number;
  movieCount: number;
  showCount: number;
  documentaryCount: number;
  includeInternational: boolean;
  weeklyRefresh: boolean;
}

export interface RecommendedTitle extends DiscoverTitle {
  kind: 'movie' | 'show' | 'documentary';
  reason: string;
  providerNames: string[];
  score: number;
}

export interface SessionIntent {
  genreIds: number[];
  excludedGenreIds: number[];
  maxRuntime?: number;
  surpriseMe: boolean;
  familyFriendly: boolean;
  preferInternational: boolean;
  keywords: string[];
}

export const DEFAULT_PICK_SETTINGS: PickSettings = {
  providerIds: [8, 9],
  genreIds: [18, 53],
  tasteNote: '',
  yearsBack: 5,
  movieCount: 3,
  showCount: 2,
  documentaryCount: 1,
  includeInternational: true,
  weeklyRefresh: false,
};

function stableVariety(id: number, seed: string): number {
  let hash = id;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (Math.abs(hash) % 1000) / 1000;
}

const GENRE_TERMS: Array<{ id: number; terms: RegExp }> = [
  { id: 28, terms: /\b(action|adventure|exciting)\b/i },
  { id: 35, terms: /\b(comedy|comedies|funny|laugh|lighthearted)\b/i },
  { id: 18, terms: /\b(drama|dramatic|emotional)\b/i },
  { id: 27, terms: /\b(horror|scary|frightening)\b/i },
  { id: 9648, terms: /\b(mystery|mysteries|whodunnit)\b/i },
  { id: 10749, terms: /\b(romance|romantic|date night)\b/i },
  { id: 878, terms: /\b(sci[ -]?fi|science fiction|futuristic)\b/i },
  { id: 53, terms: /\b(thriller|suspense|tense)\b/i },
  { id: 99, terms: /\b(documentary|documentaries|nonfiction)\b/i },
];

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'can', 'for', 'from', 'have', 'into',
  'only', 'something', 'that', 'the', 'this', 'tonight', 'want', 'watch', 'with',
]);

export function interpretSessionRequest(request: string): SessionIntent {
  const excludedGenreIds = GENRE_TERMS
    .filter(({ terms }) => new RegExp(`\\b(?:no|not|avoid|without)\\s+(?:${terms.source.replace(/^\\b|\\b\/?[a-z]*$/g, '')})`, 'i').test(request))
    .map(({ id }) => id);
  const genreIds = GENRE_TERMS
    .filter(({ id, terms }) => !excludedGenreIds.includes(id) && terms.test(request))
    .map(({ id }) => id);
  const familyFriendly = /\b(family|family-friendly|kids?|children)\b/i.test(request);
  const maxRuntimeMatch = request.match(/\b(?:under|less than|only have|max(?:imum)?)\s*(\d{2,3})\s*(?:minutes?|mins?)\b/i);
  const keywords = request.toLowerCase().match(/[a-z][a-z-]+/g)
    ?.filter((word) => word.length > 3 && !STOP_WORDS.has(word))
    .slice(0, 12) || [];
  return {
    genreIds: familyFriendly ? [...new Set([...genreIds, 10751])] : genreIds,
    excludedGenreIds: [...new Set([...excludedGenreIds, ...(familyFriendly ? [27] : [])])],
    ...(maxRuntimeMatch ? { maxRuntime: Number(maxRuntimeMatch[1]) } : {}),
    surpriseMe: /\b(surprise me|anything|dealer'?s choice)\b/i.test(request),
    familyFriendly,
    preferInternational: /\b(international|foreign|subtitles?|subtitled|korean|spanish|european)\b/i.test(request),
    keywords,
  };
}

export function mergeIntents(saved: SessionIntent, session: SessionIntent): SessionIntent {
  return {
    genreIds: session.genreIds.length ? session.genreIds : saved.genreIds,
    excludedGenreIds: [...new Set([...saved.excludedGenreIds, ...session.excludedGenreIds])],
    ...(session.maxRuntime ? { maxRuntime: session.maxRuntime } : saved.maxRuntime ? { maxRuntime: saved.maxRuntime } : {}),
    surpriseMe: session.surpriseMe,
    familyFriendly: saved.familyFriendly || session.familyFriendly,
    preferInternational: saved.preferInternational || session.preferInternational,
    keywords: [...new Set([...saved.keywords, ...session.keywords])].slice(0, 16),
  };
}

function titleScore(
  title: DiscoverTitle,
  minimumRating: number,
  seed: string,
  settings: PickSettings,
  intent: SessionIntent,
): number {
  const year = Number(title.year) || 2000;
  const recency = Math.max(0, year - 2015) * 0.25;
  const international = title.international && settings.includeInternational
    ? intent.preferInternational ? 8 : 2
    : 0;
  const preferredGenres = intent.genreIds.length ? intent.genreIds : settings.genreIds;
  const genreAffinity = title.genreIds.filter((id) => preferredGenres.includes(id)).length * 4;
  const searchable = `${title.title} ${title.overview}`.toLowerCase();
  const keywordAffinity = intent.keywords.filter((keyword) => searchable.includes(keyword)).length * 2.5;
  return (title.rating - minimumRating) * 12
    + Math.log10(Math.max(title.voteCount, 1)) * 4
    + recency
    + international
    + genreAffinity
    + keywordAffinity
    + stableVariety(title.id, seed) * 10;
}

export function dedupeTitles(candidates: DiscoverTitle[]): DiscoverTitle[] {
  return [...new Map(candidates.map((title) => [`${title.mediaType}:${title.id}`, title])).values()];
}

export function rankRecommendations({
  candidates,
  kind,
  count,
  watchedIds,
  settings,
  seed,
  intent = interpretSessionRequest(''),
}: {
  candidates: DiscoverTitle[];
  kind: RecommendedTitle['kind'];
  count: number;
  watchedIds: Set<number>;
  settings: PickSettings;
  seed: string;
  intent?: SessionIntent;
}): RecommendedTitle[] {
  const minimumRating = kind === 'show' ? 7 : 6.6;
  const minimumVotes = kind === 'show' ? 150 : 300;
  const providerNames = STREAMING_SERVICES
    .filter((provider) => settings.providerIds.includes(provider.id))
    .map((provider) => provider.name);
  const genreNames = PICK_GENRES
    .filter((genre) => settings.genreIds.includes(genre.id))
    .map((genre) => genre.name.toLowerCase());

  const ranked = dedupeTitles(candidates)
    .filter((title) => !watchedIds.has(title.id))
    .filter((title) => title.rating >= minimumRating && title.voteCount >= minimumVotes)
    .filter((title) => settings.includeInternational || !title.international)
    .filter((title) => kind !== 'documentary' || title.genreIds.includes(99))
    .filter((title) => intent.genreIds.length === 0 || intent.surpriseMe || title.genreIds.some((id) => intent.genreIds.includes(id)))
    .filter((title) => !title.genreIds.some((id) => intent.excludedGenreIds.includes(id)))
    .map((title) => ({
      ...title,
      kind,
      providerNames,
      score: titleScore(title, minimumRating, seed, settings, intent),
      reason: [
        `A ${title.rating.toFixed(1)}-rated ${kind}`,
        providerNames.length ? `available with ${providerNames.join(' or ')}` : 'ready to stream',
        genreNames.length ? `that matches your ${genreNames.slice(0, 2).join(' and ')} mood` : 'chosen for its strong audience trust',
        settings.tasteNote.trim() ? `and your note: “${settings.tasteNote.trim()}”` : '',
      ].filter(Boolean).join(' '),
    }))
    .toSorted((a, b) => b.score - a.score);

  const selected: RecommendedTitle[] = [];
  const remaining = [...ranked];
  while (selected.length < count && remaining.length) {
    const best = remaining
      .map((title) => ({
        title,
        adjusted: title.score - selected.reduce((penalty, chosen) => {
          const sharedGenres = title.genreIds.filter((id) => chosen.genreIds.includes(id)).length;
          return penalty + sharedGenres * 3 + (title.year === chosen.year ? 1.5 : 0);
        }, 0),
      }))
      .toSorted((a, b) => b.adjusted - a.adjusted)[0].title;
    selected.push(best);
    remaining.splice(remaining.findIndex((title) => title.id === best.id), 1);
  }
  return selected;
}
