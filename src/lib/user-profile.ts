import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { DEFAULT_PICK_SETTINGS } from '@/lib/recommendations';
import Profile from '@/models/Profile';

function toObjectId(userId: string): mongoose.Types.ObjectId | string {
  if (mongoose.Types.ObjectId.isValid(userId) && String(new mongoose.Types.ObjectId(userId)) === userId) {
    return new mongoose.Types.ObjectId(userId);
  }
  return userId;
}

/**
 * Every invited PIN user (and the owner) gets their own Profile document.
 * Watched history, recommendation history, and settings live here — scoped by userId.
 */
export async function ensureUserProfile(userId: string, name: string) {
  if (!userId) throw new Error('userId is required');
  await dbConnect();

  const scopedId = toObjectId(userId);

  const profile = await Profile.findOneAndUpdate(
    { userId: scopedId },
    {
      $setOnInsert: {
        userId: scopedId,
        name: name.trim() || 'Movie lover',
        preferences: {
          genres: [],
          streamingServices: [],
          recommendation: { ...DEFAULT_PICK_SETTINGS },
        },
        tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
        recommendationHistory: [],
        isPrimary: true,
      },
    },
    { upsert: true, new: true },
  );

  return profile;
}
