import { Schema, model, models } from 'mongoose';

export interface ITasteSignal {
  _id: string;
  userId: string;
  titleId: number;
  titleType: 'movie' | 'show';
  signalType: 'thumbs_up' | 'thumbs_down' | 'rating';
  value?: number; // for rating (1-5)
  createdAt: Date;
}

const TasteSignalSchema = new Schema<ITasteSignal>(
  {
    userId: { type: String, required: true, index: true },
    titleId: { type: Number, required: true },
    titleType: { type: String, enum: ['movie', 'show'], required: true },
    signalType: {
      type: String,
      enum: ['thumbs_up', 'thumbs_down', 'rating'],
      required: true,
    },
    value: { type: Number },
  },
  { timestamps: true }
);

TasteSignalSchema.index({ userId: 1, createdAt: -1 });
TasteSignalSchema.index({ userId: 1, titleId: 1 }, { unique: true });

export default models.TasteSignal || model<ITasteSignal>('TasteSignal', TasteSignalSchema);
