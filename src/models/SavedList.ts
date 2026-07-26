import { Schema, model, models } from 'mongoose';

export interface ISavedList {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  items: {
    titleId: number;
    titleType: 'movie' | 'show';
    title: string;
    posterUrl?: string;
    addedAt: Date;
  }[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedListSchema = new Schema<ISavedList>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    items: [
      {
        titleId: { type: Number, required: true },
        titleType: { type: String, enum: ['movie', 'show'], required: true },
        title: { type: String, required: true },
        posterUrl: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SavedListSchema.index({ userId: 1 });

export default models.SavedList || model<ISavedList>('SavedList', SavedListSchema);
