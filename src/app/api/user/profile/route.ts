import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';
import User from '@/models/User';

// Zod schemas
const profileNameSchema = z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less');
const ageRangeSchema = z.enum(['13+', '16+', '18+']).optional();
const genresSchema = z.array(z.string().max(50)).max(50);
const streamingServicesSchema = z.array(z.string().max(50)).max(20);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find profile by canonical userId (ObjectId)
    const profiles = await Profile.find({ userId: session.user.id })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Get profiles error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = z.object({
      name: profileNameSchema,
      ageRange: ageRangeSchema,
      avatar: z.string().max(500).optional(),
      genres: genresSchema.optional(),
      streamingServices: streamingServicesSchema.optional(),
    }).safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e: { path: PropertyKey[]; message: string }) => ({
        field: (e.path as (string | number)[]).join('.'),
        message: e.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { name, ageRange, avatar, genres, streamingServices } = parsed.data;

    await dbConnect();

    // Check if user already has a profile
    const existingProfile = await Profile.findOne({ userId: session.user.id });

    if (existingProfile) {
      // Update existing profile
      existingProfile.name = name;
      if (ageRange) existingProfile.ageRange = ageRange;
      if (avatar) existingProfile.avatar = avatar;
      if (genres) existingProfile.preferences.genres = genres;
      if (streamingServices) existingProfile.preferences.streamingServices = streamingServices;
      await existingProfile.save();

      return NextResponse.json({ profile: existingProfile });
    }

    // Create first profile (primary)
    const profile = await Profile.create({
      userId: session.user.id,
      name,
      ageRange,
      avatar,
      preferences: {
        genres: genres || [],
        streamingServices: streamingServices || [],
      },
      tasteSignals: {
        thumbsUp: [],
        thumbsDown: [],
        ratings: [],
      },
      isPrimary: true,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = z.object({
      name: profileNameSchema.optional(),
      ageRange: ageRangeSchema.optional(),
      avatar: z.string().max(500).optional(),
      genres: genresSchema.optional(),
      streamingServices: streamingServicesSchema.optional(),
    }).safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e: { path: PropertyKey[]; message: string }) => ({
        field: (e.path as (string | number)[]).join('.'),
        message: e.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find and update user's profile
    const profile = await Profile.findOne({ userId: session.user.id });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only allow updating own profile
    if (profile.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update only provided fields
    if (parsed.data.name !== undefined) profile.name = parsed.data.name;
    if (parsed.data.ageRange !== undefined) profile.ageRange = parsed.data.ageRange;
    if (parsed.data.avatar !== undefined) profile.avatar = parsed.data.avatar;
    if (parsed.data.genres !== undefined) profile.preferences.genres = parsed.data.genres;
    if (parsed.data.streamingServices !== undefined) profile.preferences.streamingServices = parsed.data.streamingServices;

    await profile.save();

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Update profile error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
