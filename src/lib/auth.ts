import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import Profile from '@/models/Profile';

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    phoneNumber?: string;
  }
  interface Session {
    user: {
      id: string;
      phoneNumber?: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY || '',
      from: process.env.EMAIL_FROM || 'admin@mail.thinkroman.com',
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
          expiresAt: { $gte: new Date() },
        }).select('+code');

        if (!record) return null;

        // Find or create user profile
        let profile = await Profile.findOne({
          userId: `whatsapp:${credentials.phoneNumber}`,
        });

        if (!profile) {
          profile = await Profile.create({
            userId: `whatsapp:${credentials.phoneNumber}`,
            name: `User ${credentials.phoneNumber}`,
            isPrimary: (await Profile.countDocuments({ userId: { $ne: credentials.phoneNumber } })) === 0,
            preferences: { genres: [], streamingServices: [] },
            tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
          });
        }

        return {
          id: profile._id.toString(),
          name: profile.name,
          phoneNumber: credentials.phoneNumber as string,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || session.user.id;
        session.user.phoneNumber = token.phoneNumber as string | undefined;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.phoneNumber = (user as any).phoneNumber;
      }
      return token;
    },
  },
});
