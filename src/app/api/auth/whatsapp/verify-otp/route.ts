import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, otp } = body;

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const stored = otpStore.get(phoneNumber);

    if (!stored) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(phoneNumber);
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 410 }
      );
    }

    if (stored.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      );
    }

    // OTP is valid — delete it so it can't be reused
    otpStore.delete(phoneNumber);

    // Create a session token
    const sessionToken = randomBytes(48).toString('hex');

    // Store session in a simple map (use Redis in production)
    const sessionStore = new Map<string, { phoneNumber: string; expiresAt: number }>();
    sessionStore.set(sessionToken, {
      phoneNumber,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return NextResponse.json({
      message: 'Verification successful',
      sessionToken,
      phoneNumber,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
