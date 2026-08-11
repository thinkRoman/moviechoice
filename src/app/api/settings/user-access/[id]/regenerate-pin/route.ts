import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { regenerateMemberPin } from '@/lib/access';
import { memberRepository } from '@/lib/member-repository';
import { sendAccessPinEmail } from '@/lib/resend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const result = await regenerateMemberPin(session.user.role, id, memberRepository);
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    try {
      await sendAccessPinEmail(
        { name: result.user.name, email: result.user.email, pin: result.pin },
        { loginUrl: request.nextUrl.origin },
      );
      return NextResponse.json({
        user: result.user,
        emailed: true,
        message: 'A new PIN was emailed',
      });
    } catch (error) {
      const emailError = error instanceof Error ? error.message : 'Email failed';
      return NextResponse.json({
        user: result.user,
        emailed: false,
        pin: result.pin,
        message: `PIN updated, but email failed: ${emailError}. New PIN: ${result.pin}`,
      });
    }
  } catch (error) {
    console.error('regenerate PIN failed', error);
    const message = error instanceof Error ? error.message : 'Could not regenerate PIN';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
