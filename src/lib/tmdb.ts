const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  runtime?: number | null;
  original_language?: string;
}

interface TmdbTv {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
}

interface TmdbListResponse<T = TmdbMovie> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
}

interface TmdbVideos {
  results: Array<{
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
  }>;
}

interface TmdbMovieDetails extends TmdbMovie {
  genres: TmdbGenre[];
  runtime: number | null;
  credits: TmdbCredits;
  videos: TmdbVideos;
}

export interface MovieSummary {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  posterPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  year: string | null;
  rating: number;
  voteCount: number;
  popularity: number;
}

export interface MovieDetails extends MovieSummary {
  runtime: number | null;
  genres: string[];
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profileUrl: string | null;
  }>;
  trailerUrl: string | null;
}

export interface MovieSearchResult {
  movies: MovieSummary[];
  page: number;
  totalPages: number;
  totalResults: number;
}

function imageUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original'): string | null {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

function toMovieSummary(movie: TmdbMovie): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterUrl: imageUrl(movie.poster_path, 'w500'),
    posterPath: movie.poster_path,
    backdropUrl: imageUrl(movie.backdrop_path, 'original'),
    releaseDate: movie.release_date || null,
    year: movie.release_date?.slice(0, 4) || null,
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    popularity: movie.popularity,
  };
}

async function tmdbFetch<T>(
  path: string,
  searchParams: Record<string, string> = {},
  revalidate = 3600,
): Promise<T> {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (!token) {
    throw new Error('TMDB_API_READ_ACCESS_TOKEN is not configured');
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export interface DiscoverTitle {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  overview: string;
  posterUrl: string | null;
  posterPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  year: string | null;
  rating: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  international: boolean;
  originalLanguage: string | null;
}

export interface EnrichedTitle extends DiscoverTitle {
  runtimeMinutes: number | null;
  episodeCount: number | null;
  seasonCount: number | null;
  genreNames: string[];
  languageName: string | null;
  providerNames: string[];
  primaryProvider: string | null;
  tmdbUrl: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ar: 'Arabic',
  tr: 'Turkish',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  uk: 'Ukrainian',
};

const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

const PROVIDER_ALIASES: Record<number, string> = {
  8: 'Netflix',
  9: 'Prime Video',
  337: 'Disney+',
  1899: 'Max',
  15: 'Hulu',
  350: 'Apple TV+',
  531: 'Paramount+',
  386: 'Peacock',
};

interface TmdbWatchProviderResult {
  results?: {
    US?: {
      flatrate?: Array<{ provider_id: number; provider_name: string }>;
    };
  };
}

interface TmdbMovieEnrichment extends TmdbMovie {
  genres: TmdbGenre[];
  runtime: number | null;
  number_of_episodes?: never;
  number_of_seasons?: never;
}

interface TmdbTvEnrichment extends TmdbTv {
  genres: TmdbGenre[];
  episode_run_time?: number[];
  number_of_episodes?: number | null;
  number_of_seasons?: number | null;
}

function languageName(code: string | null | undefined): string | null {
  if (!code) return null;
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

function toDiscoverTitle(item: TmdbMovie | TmdbTv, mediaType: 'movie' | 'tv'): DiscoverTitle {
  const isMovie = mediaType === 'movie';
  const movie = item as TmdbMovie;
  const tv = item as TmdbTv;
  const releaseDate = isMovie ? movie.release_date || null : tv.first_air_date || null;
  const originalLanguage = item.original_language || null;
  return {
    id: item.id,
    mediaType,
    title: isMovie ? movie.title : tv.name,
    overview: item.overview,
    posterUrl: imageUrl(item.poster_path, 'w500'),
    posterPath: item.poster_path,
    backdropUrl: imageUrl(item.backdrop_path, 'original'),
    releaseDate,
    year: releaseDate?.slice(0, 4) || null,
    rating: item.vote_average,
    voteCount: item.vote_count,
    popularity: item.popularity,
    genreIds: item.genre_ids || [],
    originalLanguage,
    international: originalLanguage
      ? originalLanguage !== 'en'
      : mediaType === 'tv'
        ? Boolean(tv.origin_country?.length && !tv.origin_country.includes('US'))
        : false,
  };
}

function pickProviders(
  flatrate: Array<{ provider_id: number; provider_name: string }> | undefined,
  preferredProviderIds: number[],
): { providerNames: string[]; primaryProvider: string | null } {
  const available = flatrate || [];
  const preferred = preferredProviderIds.length
    ? available.filter((provider) => preferredProviderIds.includes(provider.provider_id))
    : available;
  const chosen = (preferred.length ? preferred : available).slice(0, 3);
  const providerNames = chosen.map(
    (provider) => PROVIDER_ALIASES[provider.provider_id] || provider.provider_name,
  );
  return {
    providerNames,
    primaryProvider: providerNames[0] || null,
  };
}

export async function enrichDiscoverTitle(
  title: DiscoverTitle,
  preferredProviderIds: number[] = [],
): Promise<EnrichedTitle> {
  const path = title.mediaType === 'movie' ? `/movie/${title.id}` : `/tv/${title.id}`;
  const [details, providers] = await Promise.all([
    tmdbFetch<TmdbMovieEnrichment | TmdbTvEnrichment>(path, { language: 'en-US' }, 86400),
    tmdbFetch<TmdbWatchProviderResult>(`${path}/watch/providers`, {}, 86400),
  ]);

  const { providerNames, primaryProvider } = pickProviders(
    providers.results?.US?.flatrate,
    preferredProviderIds,
  );

  if (title.mediaType === 'movie') {
    const movie = details as TmdbMovieEnrichment;
    return {
      ...title,
      overview: movie.overview || title.overview,
      rating: movie.vote_average || title.rating,
      voteCount: movie.vote_count || title.voteCount,
      genreIds: movie.genres?.map((genre) => genre.id) || title.genreIds,
      genreNames: (movie.genres || []).map((genre) => genre.name).slice(0, 3),
      originalLanguage: movie.original_language || title.originalLanguage,
      languageName: languageName(movie.original_language || title.originalLanguage),
      runtimeMinutes: movie.runtime ?? null,
      episodeCount: null,
      seasonCount: null,
      providerNames,
      primaryProvider,
      tmdbUrl: `https://www.themoviedb.org/movie/${title.id}`,
      international: (movie.original_language || title.originalLanguage || 'en') !== 'en',
    };
  }

  const show = details as TmdbTvEnrichment;
  return {
    ...title,
    overview: show.overview || title.overview,
    rating: show.vote_average || title.rating,
    voteCount: show.vote_count || title.voteCount,
    genreIds: show.genres?.map((genre) => genre.id) || title.genreIds,
    genreNames: (show.genres || []).map((genre) => genre.name).slice(0, 3),
    originalLanguage: show.original_language || title.originalLanguage,
    languageName: languageName(show.original_language || title.originalLanguage),
    runtimeMinutes: show.episode_run_time?.[0] ?? null,
    episodeCount: show.number_of_episodes ?? null,
    seasonCount: show.number_of_seasons ?? null,
    providerNames,
    primaryProvider,
    tmdbUrl: `https://www.themoviedb.org/tv/${title.id}`,
    international: (show.original_language || title.originalLanguage || 'en') !== 'en',
  };
}

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}M`;
  if (!mins) return `${hours}H`;
  return `${hours}H ${mins}M`;
}

export function genreName(id: number): string | undefined {
  return GENRE_NAMES[id];
}

export async function discoverTitles(
  mediaType: 'movie' | 'tv',
  params: Record<string, string>,
  page = 1,
): Promise<DiscoverTitle[]> {
  const data = await tmdbFetch<TmdbListResponse<TmdbMovie | TmdbTv>>(
    `/discover/${mediaType}`,
    {
      include_adult: 'false',
      include_video: 'false',
      language: 'en-US',
      page: String(page),
      sort_by: 'vote_average.desc',
      watch_region: 'US',
      with_watch_monetization_types: 'flatrate',
      ...params,
    },
    1800,
  );
  return data.results
    .filter((title) => title.poster_path && title.overview)
    .map((title) => toDiscoverTitle(title, mediaType));
}

async function movieList(path: string): Promise<MovieSummary[]> {
  const data = await tmdbFetch<TmdbListResponse>(path);
  return data.results.filter((movie) => movie.poster_path).map(toMovieSummary);
}

export async function getHomeMovies() {
  const [trending, popular, topRated, upcoming] = await Promise.all([
    movieList('/trending/movie/week'),
    movieList('/movie/popular'),
    movieList('/movie/top_rated'),
    movieList('/movie/upcoming'),
  ]);

  return { trending, popular, topRated, upcoming };
}

export async function searchMovies(query: string, page = 1): Promise<MovieSearchResult> {
  const data = await tmdbFetch<TmdbListResponse>(
    '/search/movie',
    {
      query,
      page: String(page),
      include_adult: 'false',
    },
    300,
  );

  return {
    movies: data.results.map(toMovieSummary),
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export async function getMovieDetails(id: string): Promise<MovieDetails | null> {
  try {
    const movie = await tmdbFetch<TmdbMovieDetails>(
      `/movie/${encodeURIComponent(id)}`,
      { append_to_response: 'credits,videos' },
      86400,
    );

    const trailer = movie.videos.results.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official,
    ) || movie.videos.results.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer',
    );

    return {
      ...toMovieSummary(movie),
      runtime: movie.runtime,
      genres: movie.genres.map((genre) => genre.name),
      cast: movie.credits.cast
        .toSorted((a, b) => a.order - b.order)
        .slice(0, 8)
        .map((person) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          profileUrl: imageUrl(person.profile_path, 'w342'),
        })),
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('(404)')) return null;
    throw error;
  }
}
