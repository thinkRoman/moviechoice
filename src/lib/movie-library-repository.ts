import dbConnect from '@/lib/mongodb';
import UserMovie from '@/models/UserMovie';
import type {
  LibraryAction,
  LibraryItem,
  LibraryMovieInput,
  MovieLibraryRepository,
} from '@/lib/movie-library';

function serialize(item: {
  _id: { toString(): string };
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  releaseYear: string | null;
  inWatchlist: boolean;
  watched: boolean;
  favorite: boolean;
  watchedAt: Date | null;
  createdAt: Date;
}): LibraryItem {
  return {
    id: item._id.toString(),
    tmdbMovieId: item.tmdbMovieId,
    title: item.title,
    posterPath: item.posterPath,
    releaseYear: item.releaseYear,
    inWatchlist: item.inWatchlist,
    watched: item.watched,
    favorite: item.favorite,
    watchedAt: item.watchedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

const fieldByAction: Record<LibraryAction, 'inWatchlist' | 'watched' | 'favorite'> = {
  watchlist: 'inWatchlist',
  watched: 'watched',
  favorite: 'favorite',
};

export const movieLibraryRepository: MovieLibraryRepository = {
  async list(userId) {
    await dbConnect();
    const items = await UserMovie.find({ userId }).sort({ updatedAt: -1 }).lean();
    return items.map(serialize);
  },

  async setFlag(userId, movie, action, value) {
    await dbConnect();
    const field = fieldByAction[action];
    const set: Record<string, unknown> = {
      [field]: value,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseYear: movie.releaseYear,
    };
    if (action === 'watched') set.watchedAt = value ? new Date() : null;

    const item = await UserMovie.findOneAndUpdate(
      { userId, tmdbMovieId: movie.tmdbMovieId },
      { $set: set, $setOnInsert: { userId, tmdbMovieId: movie.tmdbMovieId } },
      { new: true, upsert: value, runValidators: true },
    );

    if (!item) return null;
    if (!item.inWatchlist && !item.watched && !item.favorite) {
      await UserMovie.deleteOne({ _id: item._id, userId });
      return null;
    }
    return serialize(item);
  },
};
