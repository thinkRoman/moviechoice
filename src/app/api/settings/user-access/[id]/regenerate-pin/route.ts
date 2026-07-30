import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { regenerateMemberPin } from '@/lib/access';
import { memberRepository } from '@/lib/member-repository';
import { sendAccessPinEmail } from '@/lib/resend';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const user = await regenerateMemberPin(
      session.user.role,
      id,
      memberRepository,
      sendAccessPinEmail,
    );
    return user
      ? NextResponse.json({ user, message: 'A new PIN was emailed' })
      : NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Could not regenerate PIN' }, { status: 500 });
  }
}
