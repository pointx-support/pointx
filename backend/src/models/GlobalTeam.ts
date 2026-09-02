import mongoose, { Document, Schema } from 'mongoose';

export interface IGlobalPlayer {
  id: string;
  name: string;
  inGameId: string;
  uid?: string;
  isCaptain?: boolean;
  role?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGlobalTeam extends Document {
  customId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  tag: string;
  logoUrl?: string;
  status: 'Active' | 'Inactive';
  captainName?: string;
  contactEmail?: string;
  contactPhone?: string;
  players: IGlobalPlayer[];
  createdAt: Date;
  updatedAt: Date;
}

const GlobalPlayerSchema = new Schema<IGlobalPlayer>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    inGameId: { type: String, required: true, trim: true },
    uid: { type: String, default: '' },
    isCaptain: { type: Boolean, default: false },
    role: { type: String, default: 'Player' },
    teamId: { type: String },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { _id: false }
);

const GlobalTeamSchema = new Schema<IGlobalTeam>(
  {
    customId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tag: { type: String, required: true, trim: true, maxlength: 10 },
    logoUrl: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
    captainName: { type: String, default: '', trim: true },
    contactEmail: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    players: { type: [GlobalPlayerSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.customId || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

GlobalTeamSchema.index({ name: 1, tag: 1 });

export const GlobalTeam = mongoose.model<IGlobalTeam>('GlobalTeam', GlobalTeamSchema);
