import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { changeMemberStatus } from '@/lib/access';
import { memberRepository } from '@/lib/member-repository';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { normalizeEmail } from '@/lib/pin';

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });

const editSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().transform(normalizeEmail).optional(),
  countryCode: z.string().optional(),
  whatsappNumber: z.string().optional(),
  notifyVia: z.enum(['email', 'whatsapp', 'both']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { id } = await params;

  // Status update (suspend/reactivate)
  const statusParsed = statusSchema.safeParse(body);
  if (statusParsed.success) {
    try {
      const user = await changeMemberStatus(
        session.user.role,
        id,
        statusParsed.data.status,
        memberRepository,
      );
      return user
        ? NextResponse.json({ user })
        : NextResponse.json({ error: 'User not found' }, { status: 404 });
    } catch {
      return NextResponse.json({ error: 'Could not update user' }, { status: 500 });
    }
  }

  // Profile edit (name, whatsapp, notification prefs)
  const editParsed = editSchema.safeParse(body);
  if (editParsed.success) {
    try {
      await dbConnect();
      const updates: Record<string, string> = {};
      if (editParsed.data.name !== undefined) updates.name = editParsed.data.name;
      if (editParsed.data.email !== undefined) updates.email = editParsed.data.email;
      if (editParsed.data.countryCode !== undefined) updates.countryCode = editParsed.data.countryCode;
      if (editParsed.data.whatsappNumber !== undefined) updates.whatsappNumber = editParsed.data.whatsappNumber;
      if (editParsed.data.notifyVia !== undefined) updates.notifyVia = editParsed.data.notifyVia;

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
      }

      const user = await User.findOneAndUpdate(
        { _id: id, role: 'MEMBER' },
        { $set: updates },
        { new: true },
      );

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          countryCode: user.countryCode || '+1',
          whatsappNumber: user.whatsappNumber || '',
          notifyVia: user.notifyVia || 'email',
        },
      });
    } catch (error) {
      console.error('PATCH user edit failed', error);
      return NextResponse.json({ error: 'Could not update user' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
