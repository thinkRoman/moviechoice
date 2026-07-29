import { Schema, model, models } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  phone: string;
  phoneVerified: Date | null;
  image: string | null;
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
    email: { type: String, required: true, sparse: true, index: true },
    emailVerified: { type: Date, default: null },
    phone: { type: String, required: false, sparse: true, index: true },
    phoneVerified: { type: Date, default: null },
    image: { type: String, default: null },
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
