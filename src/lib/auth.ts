import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
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

  await User.create({
    _id: preferredId,
    email,
    name,
    emailVerified: new Date(),
    role: 'OWNER',
    status: 'ACTIVE',
    lastLoginAt: new Date(),
  });
  return preferredId;
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

        if (principal.role === 'OWNER') {
          const preferredId = principal.id || ownerId(principal.email);
          const id = await persistOwnerIdentity(principal.email, principal.name, preferredId);
          await ensureUserProfile(id, principal.name);
          return { ...principal, id };
        }

        await User.updateOne({ _id: principal.id }, { $set: { lastLoginAt: new Date() } });
        await ensureUserProfile(principal.id, principal.name);
        return principal;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || '');
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
        session.user.image = (token.image as string | null) ?? session.user.image ?? null;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.image = user.image ?? null;
      }
      return token;
    },
  },
  trustHost: true,
});
