import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateAccess, ownerId, type UserRole } from '@/lib/access';
import { ensureUserProfile } from '@/lib/user-profile';

// Extended session shape
declare module 'next-auth' {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

async function persistOwnerIdentity(email: string, name: string, preferredId: string) {
  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          name,
          role: 'OWNER',
          status: 'ACTIVE',
          lastLoginAt: new Date(),
        },
      },
    );
    return existing._id.toString();
  }

  const objectId = mongoose.Types.ObjectId.isValid(preferredId)
    ? new mongoose.Types.ObjectId(preferredId)
    : new mongoose.Types.ObjectId();

  await User.create({
    _id: objectId,
    email,
    name,
    emailVerified: new Date(),
    role: 'OWNER',
    status: 'ACTIVE',
    lastLoginAt: new Date(),
  });
  return objectId.toString();
}

async function bootstrapAfterLogin(id: string, name: string, role: UserRole, email: string) {
  // Never let profile bootstrap break an otherwise valid sign-in.
  try {
    if (role === 'OWNER') {
      // Owner identity already persisted in authorize path.
    } else {
      await User.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } });
    }
    await ensureUserProfile(id, name || email || 'Movie lover');
  } catch (error) {
    console.error('Post-login profile bootstrap failed', { id, email, error });
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Email and PIN',
      credentials: {
        email: { label: 'Email', type: 'email' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.pin) return null;

        const principal = await authenticateAccess(
          String(credentials.email),
          String(credentials.pin),
          {
            async findCredentialsByEmail(email) {
              await dbConnect();
              const member = await User.findOne({ email })
                .select('+pinHash +pinSalt')
                .lean();
              if (!member?.pinHash || !member?.pinSalt) return null;
              return {
                id: member._id.toString(),
                name: member.name,
                email: member.email,
                pinHash: member.pinHash,
                pinSalt: member.pinSalt,
                role: member.role,
                status: member.status,
              };
            },
          },
        );

        if (!principal) return null;

        let id = principal.id;
        try {
          if (principal.role === 'OWNER') {
            const preferredId = principal.id || ownerId(principal.email);
            id = await persistOwnerIdentity(principal.email, principal.name, preferredId);
          }
        } catch (error) {
          console.error('Owner identity persistence failed', error);
          // Keep synthetic owner id so JWT still has a stable subject.
          id = principal.id || ownerId(principal.email);
        }

        await bootstrapAfterLogin(id, principal.name, principal.role, principal.email);

        return {
          id,
          name: principal.name,
          email: principal.email,
          role: principal.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const id = user.id || token.sub || '';
        token.sub = id;
        token.id = id;
        token.role = user.role;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.picture = user.image ?? null;
      }
      if (!token.id && token.sub) token.id = token.sub;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const id = String(token.id || token.sub || '');
        session.user.id = id;
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
        session.user.image = (token.picture as string | null) ?? session.user.image ?? null;
        session.user.role = (token.role as UserRole) || 'MEMBER';
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
