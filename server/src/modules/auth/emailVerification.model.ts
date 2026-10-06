// server/src/modules/auth/emailVerification.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEmailVerification extends Document {
  email: string;
  otpHash: string;
  otpExpiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const emailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Automatic MongoDB TTL index: Document self-destructs after 10 minutes (600 seconds)
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const EmailVerification: Model<IEmailVerification> =
  mongoose.model<IEmailVerification>(
    "EmailVerification",
    emailVerificationSchema,
  );

export default EmailVerification;
