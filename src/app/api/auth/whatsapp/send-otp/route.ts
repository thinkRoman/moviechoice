import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import { normalizePhone, generateOtp, hashOtp, RESEND_COOLDOWN_MS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '@/lib/otp';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(phone);

  if (!entry) {
    return { allowed: true };
  }

  if (now > entry.resetAt) {
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: entry.resetAt - now };
  }

  return { allowed: true };
}

function recordRateLimit(phone: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(phone);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(phone, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  entry.count += 1;
  rateLimitStore.set(phone, entry);
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const body = await req.json();
    const { phoneNumber } = body as { phoneNumber?: string };

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phoneNumber);

    // Validate phone format (E.164)
    if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please include country code (e.g., +14155550123).' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check rate limit
    const rateLimit = checkRateLimit(normalizedPhone);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.retryAfter ? Math.ceil(rateLimit.retryAfter / 1000) : undefined,
        },
        { status: 429 }
      );
    }
    recordRateLimit(normalizedPhone);

    // Check resend cooldown
    const recentCode = await VerificationCode.findOne({
      phoneNumber: normalizedPhone,
      type: 'whatsapp',
      expiresAt: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    if (recentCode && recentCode.createdAt) {
      const timeSinceLast = Date.now() - recentCode.createdAt.getTime();
      if (timeSinceLast < RESEND_COOLDOWN_MS) {
        const remaining = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${remaining} seconds before requesting a new code.`,
            retryAfter: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Generate and hash OTP
    const otp = generateOtp();
    const { hash: codeHash, salt: codeSalt } = hashOtp(otp);

    // Reuse or create a new verification code
    await VerificationCode.findOneAndUpdate(
      { phoneNumber: normalizedPhone, type: 'whatsapp' },
      {
        phoneNumber: normalizedPhone,
        codeHash,
        codeSalt,
        type: 'whatsapp',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
        verifiedAt: null,
        attemptCount: 0,
        lastAttemptAt: null,
      },
      { upsert: true, new: true }
    );

    // Send via WhatsApp Business API
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const whatsappFromNumber = process.env.WHATSAPP_FROM_NUMBER;

    if (whatsappApiUrl && whatsappApiKey) {
      try {
        await Promise.race([
          fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${whatsappApiKey}`,
            },
            body: JSON.stringify({
              to: normalizedPhone,
              from: whatsappFromNumber,
              type: 'text',
              text: {
                body: `Your MovieChoice verification code is: ${otp}. This code expires in 5 minutes.`,
              },
            }),
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('WhatsApp API timeout')), 10000)
          ),
        ]);
      } catch (sendError) {
        console.error('Failed to send WhatsApp message:', sendError instanceof Error ? sendError.message : sendError);
        // OTP is still stored for development fallback
      }
    }

    // Development fallback: display OTP in response
    const isDev = process.env.NODE_ENV === 'development' || process.env.OTP_DEV_MODE === 'true';

    return NextResponse.json({
      message: 'OTP sent via WhatsApp',
      ...(isDev && { developmentOtp: otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
