import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';

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

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));

    // Store OTP in Redis/memcached or in-memory for verification
    // In production, use Redis with TTL of 5 minutes
    // For now, we'll use a simple approach
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || '';
    const whatsappApiKey = process.env.WHATSAPP_API_KEY || '';
    const whatsappFromNumber = process.env.WHATSAPP_FROM_NUMBER || '';

    if (!whatsappApiUrl || !whatsappApiKey) {
      // Fallback: return OTP in response for development
      console.log('WhatsApp API not configured. OTP for development:', otp);
      return NextResponse.json({
        message: 'OTP sent via WhatsApp',
        developmentOtp: otp, // Remove in production
      });
    }

    // Send OTP via WhatsApp Business API
    const response = await fetch(whatsappApiUrl, {
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

    if (!response.ok) {
      console.error('WhatsApp API error:', await response.text());
      return NextResponse.json(
        { error: 'Failed to send OTP via WhatsApp' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent via WhatsApp',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
