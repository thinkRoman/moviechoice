import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import FamilyTake from '@/models/FamilyTake';

const createSchema = z.object({
  mediaType: z.enum(['movie', 'tv']),
  tmdbId: z.number().int().positive(),
  body: z.string().trim().min(1).max(280),
  sharedWithFamily: z.boolean().default(true),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('mediaType');
  const tmdbId = Number(searchParams.get('tmdbId'));
  if ((mediaType !== 'movie' && mediaType !== 'tv') || !tmdbId) {
    return NextResponse.json({ error: 'mediaType and tmdbId are required' }, { status: 400 });
  }

  await dbConnect();
  const takes = await FamilyTake.find({
    mediaType,
    tmdbId,
    $or: [{ sharedWithFamily: true }, { userId: session.user.id }],
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({
    takes: takes.map((take) => ({
      id: take._id.toString(),
      authorName: take.authorName,
      body: take.body,
      sharedWithFamily: take.sharedWithFamily,
      mine: take.userId.toString() === session.user.id,
      createdAt: take.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid take' }, { status: 400 });
  }

  await dbConnect();
  const take = await FamilyTake.create({
    userId: session.user.id,
    authorName: session.user.name || 'Family member',
    ...parsed.data,
  });

  return NextResponse.json({
    take: {
      id: take._id.toString(),
      authorName: take.authorName,
      body: take.body,
      sharedWithFamily: take.sharedWithFamily,
      mine: true,
      createdAt: take.createdAt,
    },
  }, { status: 201 });
}
