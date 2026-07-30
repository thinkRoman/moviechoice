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

function titleScore(title: DiscoverTitle, minimumRating: number, seed: string): number {
  const year = Number(title.year) || 2000;
  const recency = Math.max(0, year - 2015) * 0.25;
  const international = title.international ? 10 : 0;
  return (title.rating - minimumRating) * 12
    + Math.log10(Math.max(title.voteCount, 1)) * 4
    + recency
    + international
    + stableVariety(title.id, seed) * 6;
}

export function rankRecommendations({
  candidates,
  kind,
  count,
  watchedIds,
  settings,
  seed,
}: {
  candidates: DiscoverTitle[];
  kind: RecommendedTitle['kind'];
  count: number;
  watchedIds: Set<number>;
  settings: PickSettings;
  seed: string;
}): RecommendedTitle[] {
  const minimumRating = kind === 'show' ? 7 : 6.6;
  const minimumVotes = kind === 'show' ? 150 : 300;
  const providerNames = STREAMING_SERVICES
    .filter((provider) => settings.providerIds.includes(provider.id))
    .map((provider) => provider.name);
  const genreNames = PICK_GENRES
    .filter((genre) => settings.genreIds.includes(genre.id))
    .map((genre) => genre.name.toLowerCase());

  return candidates
    .filter((title) => !watchedIds.has(title.id))
    .filter((title) => title.rating >= minimumRating && title.voteCount >= minimumVotes)
    .filter((title) => settings.includeInternational || !title.international)
    .filter((title) => kind !== 'documentary' || title.genreIds.includes(99))
    .map((title) => ({
      ...title,
      kind,
      providerNames,
      score: titleScore(title, minimumRating, seed),
      reason: [
        `A ${title.rating.toFixed(1)}-rated ${kind}`,
        providerNames.length ? `available with ${providerNames.join(' or ')}` : 'ready to stream',
        genreNames.length ? `that matches your ${genreNames.slice(0, 2).join(' and ')} mood` : 'chosen for its strong audience trust',
        settings.tasteNote.trim() ? `and your note: “${settings.tasteNote.trim()}”` : '',
      ].filter(Boolean).join(' '),
    }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, count);
}
