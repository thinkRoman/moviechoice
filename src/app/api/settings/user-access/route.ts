import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createMember, ownerId, type SafeAccessUser } from '@/lib/access';
import { listMembers, memberRepository } from '@/lib/member-repository';
import { normalizeEmail } from '@/lib/pin';
import { sendAccessPinEmail } from '@/lib/resend';

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().transform(normalizeEmail),
  monthlyAiLimitUsd: z.number().min(0).max(10000).optional(),
});

function ownerUser(): SafeAccessUser {
  const email = normalizeEmail(process.env.OWNER_EMAIL || '');
  return {
    id: ownerId(email),
    name: 'Owner',
    email,
    role: 'OWNER',
    status: 'ACTIVE',
    monthlyAiLimitUsd: null,
    createdAt: '',
    lastLoginAt: null,
  };
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ users: [ownerUser(), ...(await listMembers())] });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.email === normalizeEmail(process.env.OWNER_EMAIL || '')) {
    return NextResponse.json({ error: 'Invalid user details' }, { status: 400 });
  }

  try {
    const user = await createMember(
      session.user.role,
      parsed.data,
      memberRepository,
      sendAccessPinEmail,
    );
    return NextResponse.json({ user, message: 'Invitation sent' }, { status: 201 });
  } catch (error) {
    const duplicate =
      error instanceof Error &&
      ('code' in error ? (error as Error & { code?: number }).code === 11000 : false);
    return NextResponse.json(
      { error: duplicate ? 'A user with that email already exists' : 'Could not create and invite user' },
      { status: duplicate ? 409 : 500 },
    );
  }
}
