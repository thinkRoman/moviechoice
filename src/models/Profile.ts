import { Schema, model, models } from 'mongoose';

export interface IProfile {
  _id: string;
  userId: Schema.Types.ObjectId;
  name: string;
  avatar?: string;
  ageRange?: '13+' | '16+' | '18+';
  preferences: {
    genres: string[];
    streamingServices: string[];
  };
  tasteSignals: {
    thumbsUp: number[];
    thumbsDown: number[];
    ratings: { titleId: number; rating: number }[];
  };
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
    ageRange: { type: String, enum: ['13+', '16+', '18+'] },
    preferences: {
      genres: [{ type: String }],
      streamingServices: [{ type: String }],
    },
    tasteSignals: {
      thumbsUp: [{ type: Number }],
      thumbsDown: [{ type: Number }],
      ratings: [
        { titleId: { type: Number }, rating: { type: Number } },
      ],
    },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique index on userId to prevent duplicate profiles
ProfileSchema.index({ userId: 1 }, { unique: true });

export default models.Profile || model<IProfile>('Profile', ProfileSchema);
