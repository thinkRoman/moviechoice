import { letterboxdUrlForMovie, type DiscoverTitle } from '@/lib/tmdb';

/** Popular US subscription services shown first in Settings. */
export const STREAMING_SERVICES = [
  { id: 8, name: 'Netflix', popular: true },
  { id: 9, name: 'Prime Video', popular: true },
  { id: 337, name: 'Disney+', popular: true },
  { id: 1899, name: 'Max', popular: true },
  { id: 15, name: 'Hulu', popular: true },
  { id: 350, name: 'Apple TV+', popular: true },
  { id: 531, name: 'Paramount+', popular: true },
  { id: 386, name: 'Peacock', popular: true },
  { id: 387, name: 'Peacock Premium Plus' },
  { id: 43, name: 'Starz' },
  { id: 526, name: 'AMC+' },
  { id: 34, name: 'MGM+' },
  { id: 257, name: 'fuboTV' },
  { id: 151, name: 'BritBox' },
  { id: 37, name: 'Showtime' },
  { id: 283, name: 'Crunchyroll' },
  { id: 520, name: 'Discovery+' },
  { id: 258, name: 'Criterion Channel' },
  { id: 99, name: 'Shudder' },
  { id: 188, name: 'YouTube Premium' },
  { id: 73, name: 'Tubi' },
  { id: 207, name: 'The Roku Channel' },
  { id: 300, name: 'Pluto TV' },
  { id: 613, name: 'Freevee' },
  { id: 538, name: 'Plex' },
  { id: 11, name: 'MUBI' },
  { id: 123, name: 'FXNow' },
  { id: 185, name: 'Screambox' },
  { id: 289, name: 'Kanopy' },
] as const;

/** Core affinities shown first; more TMDB genres available via “Add genres”. */
export const PICK_GENRES = [
  { id: 28, name: 'Action', popular: true },
  { id: 35, name: 'Comedy', popular: true },
  { id: 18, name: 'Drama', popular: true },
  { id: 27, name: 'Horror', popular: true },
  { id: 9648, name: 'Mystery', popular: true },
  { id: 10749, name: 'Romance', popular: true },
  { id: 878, name: 'Science Fiction', popular: true },
  { id: 53, name: 'Thriller', popular: true },
  { id: 99, name: 'Documentary', popular: true },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 10402, name: 'Music' },
  { id: 10770, name: 'TV Movie' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 10762, name: 'Kids' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
] as const;

export const MAX_STREAMING_SERVICES = 20;
export const MAX_GENRES = 20;

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
  runtimeMinutes?: number | null;
  episodeCount?: number | null;
  seasonCount?: number | null;
  genreNames?: string[];
  languageName?: string | null;
  primaryProvider?: string | null;
  tmdbUrl?: string;
  letterboxdUrl?: string | null;
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

const KNOWN_PROVIDER_IDS = new Set<number>(STREAMING_SERVICES.map((service) => service.id));
const KNOWN_GENRE_IDS = new Set<number>(PICK_GENRES.map((genre) => genre.id));

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
}

/** Normalize stored settings so Settings / Picks never crash on partial or legacy data. */
export function normalizePickSettings(raw: unknown): PickSettings {
  const stored = (raw && typeof raw === 'object' ? raw : {}) as Partial<PickSettings>;
  const providerIds = asNumberArray(stored.providerIds)
    .filter((id) => KNOWN_PROVIDER_IDS.has(id))
    .slice(0, MAX_STREAMING_SERVICES);
  const genreIds = asNumberArray(stored.genreIds)
    .filter((id) => KNOWN_GENRE_IDS.has(id))
    .slice(0, MAX_GENRES);

  const movieCount = Number.isFinite(stored.movieCount)
    ? Math.min(10, Math.max(0, Number(stored.movieCount)))
    : DEFAULT_PICK_SETTINGS.movieCount;
  const showCount = Number.isFinite(stored.showCount)
    ? Math.min(10, Math.max(0, Number(stored.showCount)))
    : DEFAULT_PICK_SETTINGS.showCount;
  const documentaryCount = Number.isFinite(stored.documentaryCount)
    ? Math.min(10, Math.max(0, Number(stored.documentaryCount)))
    : DEFAULT_PICK_SETTINGS.documentaryCount;
  const yearsBack = Number.isFinite(stored.yearsBack)
    ? Math.min(30, Math.max(1, Number(stored.yearsBack)))
    : DEFAULT_PICK_SETTINGS.yearsBack;

  const normalized: PickSettings = {
    providerIds: providerIds.length ? providerIds : [...DEFAULT_PICK_SETTINGS.providerIds],
    genreIds: genreIds.length ? genreIds : [...DEFAULT_PICK_SETTINGS.genreIds],
    tasteNote: typeof stored.tasteNote === 'string' ? stored.tasteNote.slice(0, 240) : '',
    yearsBack,
    movieCount,
    showCount,
    documentaryCount,
    includeInternational: typeof stored.includeInternational === 'boolean'
      ? stored.includeInternational
      : DEFAULT_PICK_SETTINGS.includeInternational,
    weeklyRefresh: typeof stored.weeklyRefresh === 'boolean'
      ? stored.weeklyRefresh
      : DEFAULT_PICK_SETTINGS.weeklyRefresh,
  };

  if (normalized.movieCount + normalized.showCount + normalized.documentaryCount === 0) {
    normalized.movieCount = DEFAULT_PICK_SETTINGS.movieCount;
    normalized.showCount = DEFAULT_PICK_SETTINGS.showCount;
  }

  return normalized;
}

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}M`;
  if (!mins) return `${hours}H`;
  return `${hours}H ${mins}M`;
}

export function needsWeeklyRefresh(
  weeklyRefresh: boolean,
  lastGeneratedAt: string | Date | null | undefined,
  now = new Date(),
): boolean {
  if (!weeklyRefresh) return false;
  if (!lastGeneratedAt) return true;
  const last = new Date(lastGeneratedAt);
  if (Number.isNaN(last.getTime())) return true;

  // Most recent Friday 00:00 UTC
  const friday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = friday.getUTCDay(); // 0 Sun .. 5 Fri
  const daysSinceFriday = (day + 2) % 7;
  friday.setUTCDate(friday.getUTCDate() - daysSinceFriday);
  friday.setUTCHours(0, 0, 0, 0);
  return last < friday;
}

export function isOnboardingNeeded(
  settings: PickSettings,
  onboardingCompletedAt?: string | Date | null,
  lastGeneratedAt?: string | Date | null,
): boolean {
  if (onboardingCompletedAt || lastGeneratedAt) return false;
  // Only nudge setup when the user has no streaming services chosen.
  return settings.providerIds.length === 0;
}


function stableVariety(id: number, seed: string): number {
  let hash = id;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (Math.abs(hash) % 1000) / 1000;
}

const GENRE_TERMS: Array<{ id: number; exclude: RegExp; terms: RegExp }> = [
  { id: 28, exclude: /\b(?:no|not|avoid|without)\s+action\b/i, terms: /\b(action|adventure|exciting)\b/i },
  { id: 35, exclude: /\b(?:no|not|avoid|without)\s+comed(?:y|ies)\b/i, terms: /\b(comedy|comedies|funny|laugh|lighthearted)\b/i },
  { id: 18, exclude: /\b(?:no|not|avoid|without)\s+drama\b/i, terms: /\b(drama|dramatic|emotional)\b/i },
  { id: 27, exclude: /\b(?:no|not|avoid|without)\s+horror\b/i, terms: /\b(horror|scary|frightening)\b/i },
  { id: 9648, exclude: /\b(?:no|not|avoid|without)\s+myster(?:y|ies)\b/i, terms: /\b(mystery|mysteries|whodunnit)\b/i },
  { id: 10749, exclude: /\b(?:no|not|avoid|without)\s+romance\b/i, terms: /\b(romance|romantic|date night)\b/i },
  { id: 878, exclude: /\b(?:no|not|avoid|without)\s+(?:sci-?fi|science fiction)\b/i, terms: /\b(sci[ -]?fi|science fiction|futuristic)\b/i },
  { id: 53, exclude: /\b(?:no|not|avoid|without)\s+thriller\b/i, terms: /\b(thriller|suspense|tense)\b/i },
  { id: 99, exclude: /\b(?:no|not|avoid|without)\s+documentar(?:y|ies)\b/i, terms: /\b(documentary|documentaries|nonfiction)\b/i },
];

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'can', 'for', 'from', 'have', 'into',
  'only', 'something', 'that', 'the', 'this', 'tonight', 'want', 'watch', 'with',
]);

export function interpretSessionRequest(request: string): SessionIntent {
  const text = typeof request === 'string' ? request : '';
  const excludedGenreIds = GENRE_TERMS
    .filter(({ exclude }) => exclude.test(text))
    .map(({ id }) => id);
  const genreIds = GENRE_TERMS
    .filter(({ id, terms }) => !excludedGenreIds.includes(id) && terms.test(text))
    .map(({ id }) => id);
  const familyFriendly = /\b(family|family-friendly|kids?|children)\b/i.test(text);
  const maxRuntimeMatch = text.match(/\b(?:under|less than|only have|max(?:imum)?)\s*(\d{2,3})\s*(?:minutes?|mins?)\b/i);
  const keywords = text.toLowerCase().match(/[a-z][a-z-]+/g)
    ?.filter((word) => word.length > 3 && !STOP_WORDS.has(word))
    .slice(0, 12) || [];
  return {
    genreIds: familyFriendly ? [...new Set([...genreIds, 10751])] : genreIds,
    excludedGenreIds: [...new Set([...excludedGenreIds, ...(familyFriendly ? [27] : [])])],
    ...(maxRuntimeMatch ? { maxRuntime: Number(maxRuntimeMatch[1]) } : {}),
    surpriseMe: /\b(surprise me|anything|dealer'?s choice)\b/i.test(text),
    familyFriendly,
    preferInternational: /\b(international|foreign|subtitles?|subtitled|korean|spanish|european)\b/i.test(text),
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
  seedBoost = 0,
  softAvoidGenreIds: number[] = [],
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
  const avoidPenalty = title.genreIds.filter((id) => softAvoidGenreIds.includes(id)).length * 3.5;
  return (title.rating - minimumRating) * 12
    + Math.log10(Math.max(title.voteCount, 1)) * 4
    + recency
    + international
    + genreAffinity
    + keywordAffinity
    + Math.min(seedBoost, 4) * 22
    + stableVariety(title.id, seed) * 10
    - avoidPenalty;
}

export function dedupeTitles(candidates: DiscoverTitle[]): DiscoverTitle[] {
  return [...new Map(candidates.map((title) => [`${title.mediaType}:${title.id}`, title])).values()];
}

export function mergeSeedCandidates(
  base: DiscoverTitle[],
  seeded: DiscoverTitle[],
): { candidates: DiscoverTitle[]; boosts: Map<number, number> } {
  const boosts = new Map<number, number>();
  const byId = new Map<number, DiscoverTitle>();
  for (const title of [...base, ...seeded]) {
    byId.set(title.id, title);
    boosts.set(title.id, (boosts.get(title.id) || 0) + (seeded.some((item) => item.id === title.id) ? 1 : 0));
  }
  return { candidates: [...byId.values()], boosts };
}

export function rankRecommendations({
  candidates,
  kind,
  count,
  watchedIds,
  settings,
  seed,
  intent = interpretSessionRequest(''),
  seedBoosts = new Map<number, number>(),
  softAvoidGenreIds = [],
}: {
  candidates: DiscoverTitle[];
  kind: RecommendedTitle['kind'];
  count: number;
  watchedIds: Set<number>;
  settings: PickSettings;
  seed: string;
  intent?: SessionIntent;
  seedBoosts?: Map<number, number>;
  softAvoidGenreIds?: number[];
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
    .map((title) => {
      const titleGenreNames = title.genreIds
        .map((id) => PICK_GENRES.find((genre) => genre.id === id)?.name)
        .filter((name): name is NonNullable<typeof name> => Boolean(name))
        .slice(0, 3);
      return {
        ...title,
        kind,
        providerNames,
        primaryProvider: providerNames[0] || null,
        genreNames: titleGenreNames,
        languageName: null,
        runtimeMinutes: null,
        episodeCount: null,
        seasonCount: null,
        tmdbUrl: title.mediaType === 'movie'
          ? `https://www.themoviedb.org/movie/${title.id}`
          : `https://www.themoviedb.org/tv/${title.id}`,
        letterboxdUrl: title.mediaType === 'movie'
          ? letterboxdUrlForMovie({ title: title.title, year: title.year })
          : null,
        score: titleScore(
          title,
          minimumRating,
          seed,
          settings,
          intent,
          seedBoosts.get(title.id) || 0,
          softAvoidGenreIds,
        ),
        reason: [
          `A ${title.rating.toFixed(1)}-rated ${kind}`,
          providerNames.length ? `available with ${providerNames.join(' or ')}` : 'ready to stream',
          genreNames.length ? `that matches your ${genreNames.slice(0, 2).join(' and ')} mood` : 'chosen for its strong audience trust',
          settings.tasteNote.trim() ? `and your note: “${settings.tasteNote.trim()}”` : '',
        ].filter(Boolean).join(' '),
      };
    })
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
