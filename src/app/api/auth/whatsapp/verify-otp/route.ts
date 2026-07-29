import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import { signIn } from '@/lib/auth';

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

    await dbConnect();

    // Find unverified, non-expired code
    const record = await VerificationCode.findOne({
      phoneNumber,
      type: 'whatsapp',
      verified: false,
      expiresAt: { $gte: new Date() },
    }).select('+code');

    if (!record) {
      return NextResponse.json(
        { error: 'No valid OTP found. Please request a new one.' },
        { status: 404 }
      );
    }

    if (record.code !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      );
    }

    // Mark as verified
    record.verified = true;
    await record.save();

    // Create NextAuth session via credentials provider
    const result = await signIn('credentials', {
      phoneNumber,
      redirect: false,
      callbackUrl: '/',
    });

    return NextResponse.json({
      message: 'Verification successful',
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
