import dbConnect from '@/lib/mongodb';
import { DEFAULT_PICK_SETTINGS } from '@/lib/recommendations';
import Profile from '@/models/Profile';

/**
 * Every invited PIN user (and the owner) gets their own Profile document.
 * Watched history, recommendation history, and settings live here — scoped by userId.
 */
export async function ensureUserProfile(userId: string, name: string) {
  if (!userId) throw new Error('userId is required');
  await dbConnect();

  const profile = await Profile.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
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
