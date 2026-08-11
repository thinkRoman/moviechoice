import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createMember, ownerId, type SafeAccessUser } from '@/lib/access';
import { listMembers, memberRepository } from '@/lib/member-repository';
import { normalizeEmail } from '@/lib/pin';
import { sendAccessPinEmail } from '@/lib/resend';
import { sendWhatsAppTemplate, formatWhatsAppNumber } from '@/lib/whatsapp';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().transform(normalizeEmail),
  pin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
  countryCode: z.string().default('+1'),
  whatsappNumber: z.string().default(''),
  notifyVia: z.enum(['email', 'whatsapp', 'both']).default('email'),
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
    countryCode: '+1',
    whatsappNumber: '',
    notifyVia: 'email',
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

    // Store additional fields (countryCode, whatsappNumber, notifyVia)
    await dbConnect();
    await User.updateOne(
      { _id: created.user.id },
      {
        $set: {
          countryCode: parsed.data.countryCode,
          whatsappNumber: parsed.data.whatsappNumber,
          notifyVia: parsed.data.notifyVia,
        },
      },
    );
  } catch (error) {
    console.error('createMember failed', error);
    if (isDuplicateKey(error)) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Could not create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const loginUrl = request.nextUrl.origin;
  let emailed = false;
  let whatsappSent = false;
  let lastError = '';

  // Send via email
  if (parsed.data.notifyVia === 'email' || parsed.data.notifyVia === 'both') {
    try {
      await sendAccessPinEmail(
        { name: created.user.name, email: created.user.email, pin: created.pin },
        { loginUrl },
      );
      emailed = true;
    } catch (error) {
      console.error('sendAccessPinEmail failed', error);
      lastError = error instanceof Error ? error.message : 'Email failed';
    }
  }

  // Send via WhatsApp
  if ((parsed.data.notifyVia === 'whatsapp' || parsed.data.notifyVia === 'both') && parsed.data.whatsappNumber) {
    try {
      const fullNumber = formatWhatsAppNumber(parsed.data.countryCode, parsed.data.whatsappNumber);
      const waResult = await sendWhatsAppTemplate(
        fullNumber,
        'access_pin',
        'en',
        [
          {
            type: 'body',
            index: '0',
            parameters: [
              { type: 'text', text: created.user.name },
              { type: 'text', text: created.pin },
              { type: 'text', text: loginUrl },
            ],
          },
        ],
      );
      whatsappSent = waResult.success;
      if (!waResult.success && waResult.error) {
        lastError = lastError ? `${lastError}; WA: ${waResult.error}` : waResult.error;
      }
    } catch (error) {
      console.error('sendWhatsAppTemplate failed', error);
      lastError = lastError ? `${lastError}; WA: ${error instanceof Error ? error.message : 'WhatsApp failed'}` : 'WhatsApp failed';
    }
  }

  // Build response message
  const channels: string[] = [];
  if (emailed) channels.push('emailed');
  if (whatsappSent) channels.push('WhatsApp');
  const channelText = channels.length ? channels.join(' and ') : 'no notification sent';

  if (!emailed && !whatsappSent && lastError) {
    // Both failed — return PIN so owner can share manually
    return NextResponse.json({
      user: created.user,
      emailed: false,
      whatsappSent: false,
      pin: created.pin,
      message: `User added, but ${channelText}: ${lastError}. Share this PIN with them: ${created.pin}`,
      error: lastError,
    }, { status: 201 });
  }

  return NextResponse.json({
    user: created.user,
    emailed,
    whatsappSent,
    message: `User added and PIN ${channelText}.`,
  }, { status: 201 });
}
