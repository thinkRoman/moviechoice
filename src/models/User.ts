import { Schema, model, models } from 'mongoose';
import type { UserRole, UserStatus } from '@/lib/access';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  phone: string;
  phoneVerified: Date | null;
  image: string | null;
  pinHash?: string;
  pinSalt?: string;
  role: UserRole;
  status: UserStatus;
  monthlyAiLimitUsd?: number;
  lastLoginAt: Date | null;
  countryCode: string;
  whatsappNumber: string;
  notifyVia: 'email' | 'whatsapp' | 'both';
  providers: {
    google?: {
      providerAccountId: string;
    };
    whatsapp?: {
      phoneNumber: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    emailVerified: { type: Date, default: null },
    phone: { type: String, required: false, sparse: true, index: true },
    phoneVerified: { type: Date, default: null },
    image: { type: String, default: null },
    pinHash: { type: String, select: false },
    pinSalt: { type: String, select: false },
    role: { type: String, enum: ['OWNER', 'MEMBER'], default: 'MEMBER', required: true },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE', required: true },
    monthlyAiLimitUsd: { type: Number, min: 0 },
    lastLoginAt: { type: Date, default: null },
    countryCode: { type: String, default: '+1' },
    whatsappNumber: { type: String, default: '' },
    notifyVia: { type: String, enum: ['email', 'whatsapp', 'both'], default: 'email' },
    providers: {
      google: {
        providerAccountId: { type: String, sparse: true, index: true },
      },
      whatsapp: {
        phoneNumber: { type: String, sparse: true, index: true },
      },
    },
  },
  { timestamps: true }
);

export default models.User || model<IUser>('User', UserSchema);
