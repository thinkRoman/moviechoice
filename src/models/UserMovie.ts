import { Schema, model, models } from 'mongoose';

export interface IUserMovie {
  _id: string;
  userId: Schema.Types.ObjectId;
  tmdbMovieId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  releaseYear: string | null;
  inWatchlist: boolean;
  watched: boolean;
  favorite: boolean;
  dismissed: boolean;
  watchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserMovieSchema = new Schema<IUserMovie>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tmdbMovieId: { type: Number, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], default: 'movie', required: true },
    title: { type: String, required: true, trim: true },
    posterPath: { type: String, default: null },
    releaseYear: { type: String, default: null },
    inWatchlist: { type: Boolean, default: false },
    watched: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    watchedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserMovieSchema.index({ userId: 1, mediaType: 1, tmdbMovieId: 1 }, { unique: true });

export default models.UserMovie || model<IUserMovie>('UserMovie', UserMovieSchema);
