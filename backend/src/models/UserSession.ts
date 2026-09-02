import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: Date;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    deviceName: { type: String, default: 'Desktop Browser' },
    browser: { type: String, default: 'Chrome' },
    ipAddress: { type: String, default: '127.0.0.1' },
    location: { type: String, default: 'Local' },
    lastActive: { type: Date, default: Date.now },
    isRevoked: { type: Boolean, default: false, index: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.tokenHash;
        return ret;
      },
    },
  }
);

export const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);
