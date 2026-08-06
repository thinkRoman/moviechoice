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
  pin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
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

function isDuplicateKey(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { code?: number; message?: string };
  return maybe.code === 11000 || /duplicate key/i.test(maybe.message || '');
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    return NextResponse.json({ users: [ownerUser(), ...(await listMembers())] });
  } catch (error) {
    console.error('GET /api/settings/user-access failed', error);
    return NextResponse.json({ error: 'Could not load users', users: [ownerUser()] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid user details' },
      { status: 400 },
    );
  }
  if (parsed.data.email === normalizeEmail(process.env.OWNER_EMAIL || '')) {
    return NextResponse.json({ error: 'That email is already the owner account.' }, { status: 400 });
  }

  let created: { user: SafeAccessUser; pin: string };
  try {
    created = await createMember(session.user.role, parsed.data, memberRepository);
  } catch (error) {
    console.error('createMember failed', error);
    if (isDuplicateKey(error)) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Could not create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const loginUrl = request.nextUrl.origin;
  try {
    await sendAccessPinEmail(
      { name: created.user.name, email: created.user.email, pin: created.pin },
      { loginUrl },
    );
    return NextResponse.json({
      user: created.user,
      emailed: true,
      message: 'User added and PIN emailed.',
    }, { status: 201 });
  } catch (error) {
    console.error('sendAccessPinEmail failed', error);
    const emailError = error instanceof Error ? error.message : 'Email failed';
    // User exists — return PIN so the owner can share it manually.
    return NextResponse.json({
      user: created.user,
      emailed: false,
      pin: created.pin,
      message: `User added, but email failed: ${emailError}. Share this PIN with them: ${created.pin}`,
      error: emailError,
    }, { status: 201 });
  }
}
