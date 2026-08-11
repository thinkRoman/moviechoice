import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ensureUserProfile } from '@/lib/user-profile';
import type {
  MemberCredentials,
  MemberRepository,
  SafeAccessUser,
  UserStatus,
} from '@/lib/access';

function toSafeUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  status: UserStatus;
  monthlyAiLimitUsd?: number;
  countryCode?: string;
  whatsappNumber?: string;
  notifyVia?: 'email' | 'whatsapp' | 'both';
  createdAt: Date;
  lastLoginAt?: Date | null;
}): SafeAccessUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    monthlyAiLimitUsd: user.monthlyAiLimitUsd ?? null,
    countryCode: user.countryCode ?? '+1',
    whatsappNumber: user.whatsappNumber ?? '',
    notifyVia: user.notifyVia ?? 'email',
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export const memberRepository: MemberRepository = {
  async findCredentialsByEmail(email): Promise<MemberCredentials | null> {
    await dbConnect();
    const user = await User.findOne({ email }).select('+pinHash +pinSalt').lean();
    if (!user?.pinHash || !user.pinSalt) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      pinHash: user.pinHash,
      pinSalt: user.pinSalt,
      role: user.role,
      status: user.status,
      };
  },

  async create(input) {
    await dbConnect();
    const user = await User.create(input);
    // Each invited PIN user gets their own Profile for settings + recommendation history.
    try {
      await ensureUserProfile(user._id.toString(), user.name);
    } catch (error) {
      console.error('ensureUserProfile after invite failed', error);
    }
    return toSafeUser(user);
  },

  async setStatus(id, status) {
    await dbConnect();
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'MEMBER' },
      { $set: { status } },
      { new: true },
    );
    return user ? toSafeUser(user) : null;
  },

  async setPin(id, pinHash, pinSalt) {
    await dbConnect();
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'MEMBER' },
      { $set: { pinHash, pinSalt } },
      { new: true },
    );
    return user ? toSafeUser(user) : null;
  },
};

export async function listMembers(): Promise<SafeAccessUser[]> {
  await dbConnect();
  const users = await User.find({ role: 'MEMBER' }).sort({ createdAt: 1 }).lean();
  return users.map(toSafeUser);
}
