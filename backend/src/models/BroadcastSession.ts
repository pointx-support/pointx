import mongoose, { Document, Schema } from 'mongoose';

export type BroadcastMode = 'NORMAL' | 'FIRE' | 'RUSH' | 'FOCUS';
export type PlayerState = 'alive' | 'knock' | 'eliminated';

export interface IBroadcastSession extends Document {
  sessionId: string;
  organizationId: string;
  tournamentId: string;
  matchId: string;
  templateId: string;
  activeMode: BroadcastMode;
  selectedTeamId?: string | null;
  selectedPlayerIndex?: number | null;
  tableVisible: boolean;
  pointRushEnabled: boolean;
  fireTeamIds: string[];
  pointRushTeamIds: string[];
  squads: Record<string, [PlayerState, PlayerState, PlayerState, PlayerState]>;
  teamStats: Record<string, { kills: number; bonusPoints?: number; isBooyah?: boolean; manualPlacement?: number }>;
  eliminatedTeamOrder: string[];
  isMatchFinished: boolean;
  isSubmittedToWebsite: boolean;
  revision: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastSessionSchema = new Schema<IBroadcastSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    tournamentId: { type: String, required: true, index: true },
    matchId: { type: String, required: true, index: true },
    templateId: { type: String, default: 'default' },
    activeMode: {
      type: String,
      enum: ['NORMAL', 'FIRE', 'RUSH', 'FOCUS'],
      default: 'NORMAL',
    },
    selectedTeamId: { type: String, default: null },
    selectedPlayerIndex: { type: Number, default: null },
    tableVisible: { type: Boolean, default: true },
    pointRushEnabled: { type: Boolean, default: false },
    fireTeamIds: { type: [String], default: [] },
    pointRushTeamIds: { type: [String], default: [] },
    squads: { type: Schema.Types.Mixed, default: {} },
    teamStats: { type: Schema.Types.Mixed, default: {} },
    eliminatedTeamOrder: { type: [String], default: [] },
    isMatchFinished: { type: Boolean, default: false },
    isSubmittedToWebsite: { type: Boolean, default: false },
    revision: { type: Number, default: 1, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.sessionId || ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const BroadcastSession = mongoose.model<IBroadcastSession>(
  'BroadcastSession',
  BroadcastSessionSchema
);
