import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpVerification extends Document {
  email: string;
  otpHash: string;
  purpose: 'signup' | 'forgot_password';
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  lastResentAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['signup', 'forgot_password'],
      required: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    resendCount: { type: Number, default: 0 },
    lastResentAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to automatically purge expired records
    },
    isUsed: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound index for querying active OTPs quickly
OtpVerificationSchema.index({ email: 1, purpose: 1, isUsed: 1 });

export const OtpVerification = mongoose.model<IOtpVerification>('OtpVerification', OtpVerificationSchema);
