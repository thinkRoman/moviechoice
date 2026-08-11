import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import UserMovie from '@/models/UserMovie';
import type {
  LibraryAction,
  LibraryItem,
  LibraryMovieInput,
  MovieLibraryRepository,
} from '@/lib/movie-library';

function toObjectId(userId: string): mongoose.Types.ObjectId | string {
  if (mongoose.Types.ObjectId.isValid(userId) && String(new mongoose.Types.ObjectId(userId)) === userId) {
    return new mongoose.Types.ObjectId(userId);
  }
  return userId;
}

function serialize(item: {
  _id: { toString(): string };
  tmdbMovieId: number;
  mediaType?: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  releaseYear: string | null;
  inWatchlist: boolean;
  watched: boolean;
  favorite: boolean;
  dismissed: boolean;
  watchedAt: Date | null;
  createdAt: Date;
}): LibraryItem {
  return {
    id: item._id.toString(),
    tmdbMovieId: item.tmdbMovieId,
    mediaType: item.mediaType || 'movie',
    title: item.title,
    posterPath: item.posterPath,
    releaseYear: item.releaseYear,
    inWatchlist: item.inWatchlist,
    watched: item.watched,
    favorite: item.favorite,
    dismissed: Boolean(item.dismissed),
    watchedAt: item.watchedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

const fieldByAction: Record<LibraryAction, 'inWatchlist' | 'watched' | 'favorite' | 'dismissed'> = {
  watchlist: 'inWatchlist',
  watched: 'watched',
  favorite: 'favorite',
  dismissed: 'dismissed',
};

export const movieLibraryRepository: MovieLibraryRepository = {
  async list(userId) {
    await dbConnect();
    const scopedId = toObjectId(userId);
    const items = await UserMovie.find({ userId: scopedId }).sort({ updatedAt: -1 }).lean();
    return items.map(serialize);
  },

  async setFlag(userId, movie, action, value) {
    await dbConnect();
    const scopedId = toObjectId(userId);
    const field = fieldByAction[action];
    const set: Record<string, unknown> = {
      [field]: value,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseYear: movie.releaseYear,
    };
    if (action === 'watched') set.watchedAt = value ? new Date() : null;
    if (action === 'watched' && value) set.inWatchlist = false;
    if (action === 'dismissed' && value) {
      set.inWatchlist = false;
      set.favorite = false;
    }

    const item = await UserMovie.findOneAndUpdate(
      { userId: scopedId, mediaType: movie.mediaType, tmdbMovieId: movie.tmdbMovieId },
      { $set: set, $setOnInsert: { userId: scopedId, mediaType: movie.mediaType, tmdbMovieId: movie.tmdbMovieId } },
      { new: true, upsert: value, runValidators: true },
    );

    if (!item) return null;
    if (!item.inWatchlist && !item.watched && !item.favorite && !item.dismissed) {
      await UserMovie.deleteOne({ _id: item._id, userId: scopedId });
      return null;
    }
    return serialize(item);
  },
};
