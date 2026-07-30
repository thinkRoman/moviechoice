import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { changeMemberStatus } from '@/lib/access';
import { memberRepository } from '@/lib/member-repository';

const schema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const { id } = await params;
  try {
    const user = await changeMemberStatus(
      session.user.role,
      id,
      parsed.data.status,
      memberRepository,
    );
    return user
      ? NextResponse.json({ user })
      : NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Could not update user' }, { status: 500 });
  }
}
