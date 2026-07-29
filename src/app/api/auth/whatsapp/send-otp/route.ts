import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));

    // Reuse or create a new verification code
    await VerificationCode.findOneAndUpdate(
      { phoneNumber, type: 'whatsapp', verified: false },
      {
        phoneNumber,
        code: otp,
        type: 'whatsapp',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        verified: false,
      },
      { upsert: true, new: true }
    );

    // In production, send via WhatsApp Business API
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const whatsappFromNumber = process.env.WHATSAPP_FROM_NUMBER;

    if (whatsappApiUrl && whatsappApiKey) {
      try {
        await fetch(whatsappApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${whatsappApiKey}`,
          },
          body: JSON.stringify({
            to: phoneNumber,
            from: whatsappFromNumber,
            type: 'text',
            text: {
              body: `Your MovieChoice verification code is: ${otp}. This code expires in 5 minutes.`,
            },
          }),
        });
      } catch (sendError) {
        console.error('Failed to send WhatsApp message:', sendError);
        // Still return success — OTP is stored for dev fallback
      }
    }

    return NextResponse.json({
      message: 'OTP sent via WhatsApp',
      developmentOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
