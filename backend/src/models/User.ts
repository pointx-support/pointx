import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'organizer';
export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'rejected';

export interface IUserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultScoringPreset: string;
  defaultMatchSlots: number;
  soundEffects: boolean;
  broadcastResolution: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  organizationName: string;
  organizationLogoUrl?: string;
  defaultTournamentTitle?: string;
  tournamentLogoUrl?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'prefer-not-to-say' | '';
  orgSize?: string;
  heardFrom?: string;
  isOnboarded: boolean;
  preferences: IUserPreferences;
  loginCount: number;
  lastLoginAt?: Date;
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    defaultScoringPreset: { type: String, default: 'preset-ff-official-v1' },
    defaultMatchSlots: { type: Number, default: 12 },
    soundEffects: { type: Boolean, default: true },
    broadcastResolution: { type: String, default: '1080p' },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 255,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'organizer'], default: 'organizer', index: true },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending_verification', 'rejected'],
      default: 'active',
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    organizationName: { type: String, default: '', trim: true, maxlength: 150 },
    organizationLogoUrl: { type: String, default: '' },
    defaultTournamentTitle: { type: String, default: '' },
    tournamentLogoUrl: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    phoneNumber: { type: String, default: '', trim: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'prefer-not-to-say', ''],
      default: '',
    },
    orgSize: { type: String, default: '' },
    heardFrom: { type: String, default: '' },
    isOnboarded: { type: Boolean, default: false },
    preferences: { type: UserPreferencesSchema, default: () => ({}) },
    loginCount: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
    suspendedAt: { type: Date },
    suspensionReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
