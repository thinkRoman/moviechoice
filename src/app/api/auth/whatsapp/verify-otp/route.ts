import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import { verifyOtp, MAX_ATTEMPTS } from '@/lib/otp';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // Check if already authenticated
  const session = await auth();
  if (session?.user?.id) {
    return NextResponse.json(
      { error: 'Already authenticated' },
      { status: 400 }
    );
  }
  try {
    const body = await req.json();
    const { phoneNumber, otp } = body as { phoneNumber?: string; otp?: string };

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find unverified, non-expired code
    const record = await VerificationCode.findOne({
      phoneNumber,
      type: 'whatsapp',
      verified: false,
      expiresAt: { $gte: new Date() },
    }).select('+codeHash +codeSalt');

    if (!record) {
      return NextResponse.json(
        { error: 'No valid OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (record.expiresAt && new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 410 }
      );
    }

    // Check attempt limit
    if (record.attemptCount !== undefined && record.attemptCount >= (record.maxAttempts ?? MAX_ATTEMPTS)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify OTP using constant-time comparison
    const isValid = verifyOtp(otp, record.codeHash, record.codeSalt);

    if (!isValid) {
      // Increment attempt count
      record.attemptCount = (record.attemptCount || 0) + 1;
      record.lastAttemptAt = new Date();
      await record.save();

      const remaining = (record.maxAttempts ?? MAX_ATTEMPTS) - record.attemptCount;
      return NextResponse.json(
        { error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 401 }
      );
    }

    // Mark as verified and consumed
    record.verified = true;
    record.verifiedAt = new Date();
    await record.save();

    // Establish NextAuth session via credentials provider
    const { signIn } = await import('@/lib/auth');
    await signIn('credentials', {
      phoneNumber,
      redirect: false,
      callbackUrl: '/',
    });

    return NextResponse.json({
      message: 'Verification successful',
    });
  } catch (error) {
    console.error('Verify OTP error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
