import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Profile from '@/models/Profile';

// GET /api/user/profile - Get user's profiles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const profiles = await Profile.find({ userId: session.user.id }).sort({ isPrimary: -1, createdAt: 1 });

    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/profile - Create a new profile
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, ageRange, avatar, genres, streamingServices } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await dbConnect();

    // If this is the first profile, make it primary
    const existingProfiles = await Profile.find({ userId: session.user.id });
    const isPrimary = existingProfiles.length === 0;

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
      isPrimary,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
