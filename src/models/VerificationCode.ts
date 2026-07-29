import { Schema, model, models } from 'mongoose';

export interface IVerificationCode {
  _id: string;
  phoneNumber: string;
  email: string;
  code: string;
  type: 'whatsapp' | 'email';
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    phoneNumber: { type: String, select: false },
    email: { type: String, select: false },
    code: { type: String, required: true, select: false },
    type: { type: String, enum: ['whatsapp', 'email'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: '0s' } },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent looking up by code directly — always filter by phone/email + type
VerificationCodeSchema.index({ phoneNumber: 1, type: 1, expiresAt: -1 });
VerificationCodeSchema.index({ email: 1, type: 1, expiresAt: -1 });

// TTL expiration
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.VerificationCode || model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
