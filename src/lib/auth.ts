import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import VerificationCode from '@/models/VerificationCode';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { normalizePhone } from '@/lib/otp';

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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await dbConnect();

          // account.providerAccountId is the Google OAuth provider account ID
          const providerAccountId = account?.providerAccountId;
          const email = profile?.email || user.email;
          const name = profile?.name || user.name;
          const image = profile?.image || user.image;
          // Google returns email_verified as boolean; we set emailVerified to now if true
          const emailVerified =
            profile?.email_verified === true ? new Date() : null;

          // 1. Match by Google providerAccountId first (canonical link)
          let existingByProvider = await User.findOne({
            'providers.google.providerAccountId': providerAccountId,
          }).lean();

          if (existingByProvider) {
            // Reuse existing User — update profile fields in case they changed
            await User.updateOne(
              { _id: existingByProvider._id },
              {
                $set: {
                  name: name || existingByProvider.name,
                  email: email || existingByProvider.email,
                  emailVerified: emailVerified
                    ? new Date(emailVerified)
                    : existingByProvider.emailVerified,
                  image: image || existingByProvider.image,
                  updatedAt: new Date(),
                },
              },
            );
            user.id = existingByProvider._id.toString();
            return true;
          }

          // 2. Fallback: match by normalized email (controlled fallback)
          if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            const existingByEmail = await User.findOne({
              email: normalizedEmail,
            }).lean();

            if (existingByEmail) {
              // Link Google provider to existing User
              await User.updateOne(
                { _id: existingByEmail._id },
                {
                  $set: {
                    'providers.google.providerAccountId': providerAccountId,
                    name: name || existingByEmail.name,
                    email: existingByEmail.email,
                    emailVerified: emailVerified
                      ? new Date(emailVerified)
                      : existingByEmail.emailVerified,
                    image: image || existingByEmail.image,
                    updatedAt: new Date(),
                  },
                },
              );
              user.id = existingByEmail._id.toString();
              return true;
            }
          }

          // 3. No match found — create new canonical User
          const newUser = await User.create({
            name: name || 'Google User',
            email: email || '',
            emailVerified: emailVerified ? new Date(emailVerified) : null,
            phone: '',
            phoneVerified: null,
            image: image || null,
            providers: {
              google: { providerAccountId },
            },
          });

          user.id = newUser._id.toString();

          // 4. Create canonical profile for this User (idempotent via unique index)
          await Profile.findOneAndUpdate(
            { userId: newUser._id },
            {
              $setOnInsert: {
                name: name || 'Google User',
                isPrimary: true,
                preferences: { genres: [], streamingServices: [] },
                tasteSignals: { thumbsUp: [], thumbsDown: [], ratings: [] },
              },
            },
            { upsert: true, new: true },
          );

          return true;
        } catch (err) {
          console.error('[Google signIn error]', err);
          return '/signin?error=google_auth_failed';
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || '');
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
        session.user.image = (token.image as string | null) ?? session.user.image ?? null;
        session.user.phoneNumber = (token.phoneNumber as string | null) ?? undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        (token as any).phoneNumber = (user as any).phoneNumber ?? null;
        (token as any).name = user.name ?? null;
        (token as any).email = user.email ?? null;
        (token as any).image = user.image ?? null;
      }
      return token;
    },
  },
  trustHost: true,
});
