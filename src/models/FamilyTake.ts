import { Schema, model, models } from 'mongoose';

export interface IFamilyTake {
  _id: string;
  userId: Schema.Types.ObjectId;
  authorName: string;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  body: string;
  sharedWithFamily: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyTakeSchema = new Schema<IFamilyTake>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    tmdbId: { type: Number, required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 280 },
    sharedWithFamily: { type: Boolean, default: true },
  },
  { timestamps: true },
);

FamilyTakeSchema.index({ mediaType: 1, tmdbId: 1, createdAt: -1 });

export default models.FamilyTake || model<IFamilyTake>('FamilyTake', FamilyTakeSchema);
