export type LibraryAction = 'watchlist' | 'watched' | 'favorite';

export interface LibraryMovieInput {
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  releaseYear: string | null;
}

export interface LibraryItem extends LibraryMovieInput {
  id: string;
  inWatchlist: boolean;
  watched: boolean;
  favorite: boolean;
  watchedAt: string | null;
  createdAt: string;
}

export interface MovieLibraryRepository {
  list(userId: string): Promise<LibraryItem[]>;
  setFlag(
    userId: string,
    movie: LibraryMovieInput,
    action: LibraryAction,
    value: boolean,
  ): Promise<LibraryItem | null>;
}

export class UnauthorizedLibraryError extends Error {}

export function requireLibraryUser(userId?: string | null): string {
  if (!userId) throw new UnauthorizedLibraryError('Authentication required');
  return userId;
}

export async function listLibrary(
  userId: string | null | undefined,
  repository: MovieLibraryRepository,
): Promise<LibraryItem[]> {
  return repository.list(requireLibraryUser(userId));
}

export async function updateLibrary(
  userId: string | null | undefined,
  movie: LibraryMovieInput,
  action: LibraryAction,
  value: boolean,
  repository: MovieLibraryRepository,
): Promise<LibraryItem | null> {
  return repository.setFlag(requireLibraryUser(userId), movie, action, value);
}
