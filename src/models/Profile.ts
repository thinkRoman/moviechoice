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
    recommendation?: {
      providerIds: number[];
      genreIds: number[];
      tasteNote: string;
      yearsBack: number;
      movieCount: number;
      showCount: number;
      documentaryCount: number;
      includeInternational: boolean;
      weeklyRefresh: boolean;
    };
  };
  tasteSignals: {
    thumbsUp: number[];
    thumbsDown: number[];
    ratings: { titleId: number; rating: number }[];
  };
  recommendationHistory: string[];
  lastPicksGeneratedAt?: Date | null;
  onboardingCompletedAt?: Date | null;
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
      recommendation: {
        providerIds: [{ type: Number }],
        genreIds: [{ type: Number }],
        tasteNote: { type: String, default: '' },
        yearsBack: { type: Number, default: 5 },
        movieCount: { type: Number, default: 3 },
        showCount: { type: Number, default: 2 },
        documentaryCount: { type: Number, default: 1 },
        includeInternational: { type: Boolean, default: true },
        weeklyRefresh: { type: Boolean, default: false },
      },
    },
    tasteSignals: {
      thumbsUp: [{ type: Number }],
      thumbsDown: [{ type: Number }],
      ratings: [
        { titleId: { type: Number }, rating: { type: Number } },
      ],
    },
    recommendationHistory: [{ type: String }],
    lastPicksGeneratedAt: { type: Date, default: null },
    onboardingCompletedAt: { type: Date, default: null },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Profile || model<IProfile>('Profile', ProfileSchema);
