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
}

interface TmdbListResponse {
  page: number;
  results: TmdbMovie[];
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
