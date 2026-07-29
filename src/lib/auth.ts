import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { normalizePhone, generateOtp, hashOtp, verifyOtp } from '@/lib/otp';

// Extended session shape
declare module 'next-auth' {
  interface User {
    phoneNumber?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phoneNumber?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    phoneNumber?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'WhatsApp OTP',
      credentials: {
        phoneNumber: { label: 'Phone Number', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber) return null;

        await dbConnect();

        // Find verified code
        const record = await VerificationCode.findOne({
          phoneNumber: credentials.phoneNumber as string,
          type: 'whatsapp',
          verified: true,
        }).select('+codeHash +codeSalt');

        if (!record) return null;

        // Find or create canonical User
        const normalizedPhone = normalizePhone(credentials.phoneNumber as string);
        let user = await User.findOne({ 'providers.whatsapp.phoneNumber': normalizedPhone });

        if (!user) {
          // Fallback: find by phone field
          user = await User.findOne({ phone: normalizedPhone });
        }

        if (!user) {
          user = await User.create({
            name: `User ${normalizedPhone}`,
            email: '',
            phone: normalizedPhone,
            phoneVerified: new Date(),
            providers: { whatsapp: { phoneNumber: normalizedPhone } },
          });
        } else {
          // Link WhatsApp provider if not already linked
          if (!user.providers?.whatsapp) {
            user.providers = {
              ...(user.providers || {}),
              whatsapp: { phoneNumber: normalizedPhone },
            };
            await user.save();
          }
        }

        // Ensure profile exists
        let profile = await Profile.findOne({ userId: user._id.toString() });
        if (!profile) {
          profile = await Profile.create({
            userId: user._id.toString(),
            name: user.name || `User ${normalizedPhone}`,
            isPrimary: true,
            preferences: { genres: [], streamingServices: [] },
            tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
          });
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email || undefined,
          image: user.image || undefined,
          phoneNumber: normalizedPhone,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        void dbConnect();
        // Find or create canonical User
        let profile = await Profile.findOne({ userId: user?.id });
        if (!profile && user?.id) {
          profile = await Profile.create({
            userId: user.id,
            name: user.name || 'Google User',
            isPrimary: true,
            preferences: { genres: [], streamingServices: [] },
            tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || session.user.id;
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.email = token.email ?? session.user.email ?? null;
        session.user.image = token.image ?? session.user.image ?? null;
        session.user.phoneNumber = token.phoneNumber ?? null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phoneNumber = (user as any).phoneNumber ?? null;
        token.name = user.name ?? null;
        token.email = user.email ?? null;
        token.image = user.image ?? null;
      }
      return token;
    },
  },
  trustHost: true,
});
