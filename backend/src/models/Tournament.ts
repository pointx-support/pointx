import mongoose, { Document, Schema } from 'mongoose';

export interface ITournament extends Document {
  customId: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  organizer: string;
  organizerLogoUrl?: string;
  game: string;
  description: string;
  tournamentType: string;
  status: 'Draft' | 'Upcoming' | 'Live' | 'Completed' | 'Archived';
  structure: {
    teamCount: number;
    matchCount: number;
    roundRobin?: boolean;
    groupsCount?: number;
    slotsPerMatch: number;
  };
  scoringPreset: {
    id: string;
    name: string;
    version: number;
    killPoints: number;
    placementPoints: Record<number, number>;
    booyahBonus: number;
    tieBreakers: string[];
  };
  bannerUrl?: string;
  logoUrl?: string;
  teams: any[];
  matches: any[];
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
  {
    customId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    organizer: { type: String, default: '', trim: true, maxlength: 150 },
    organizerLogoUrl: { type: String, default: '' },
    game: { type: String, default: 'Free Fire', trim: true },
    description: { type: String, default: '', maxlength: 2000 },
    tournamentType: { type: String, default: 'Battle Royale' },
    status: {
      type: String,
      enum: ['Draft', 'Upcoming', 'Live', 'Completed', 'Archived'],
      default: 'Upcoming',
      index: true,
    },
    structure: {
      teamCount: { type: Number, default: 12 },
      matchCount: { type: Number, default: 6 },
      roundRobin: { type: Boolean, default: false },
      groupsCount: { type: Number, default: 1 },
      slotsPerMatch: { type: Number, default: 12 },
    },
    scoringPreset: {
      id: { type: String, default: 'preset-ff-official-v1' },
      name: { type: String, default: 'Official Free Fire Scoring' },
      version: { type: Number, default: 1 },
      killPoints: { type: Number, default: 1 },
      placementPoints: { type: Map, of: Number, default: () => ({ '1': 12, '2': 9, '3': 8, '4': 7, '5': 6, '6': 5, '7': 4, '8': 3, '9': 2, '10': 1, '11': 0, '12': 0 }) },
      booyahBonus: { type: Number, default: 0 },
      tieBreakers: { type: [String], default: ['total_points', 'total_booyahs', 'placement_points', 'kill_points'] },
    },
    bannerUrl: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    teams: { type: [Schema.Types.Mixed], default: [] } as any,
    matches: { type: [Schema.Types.Mixed], default: [] } as any,
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

TournamentSchema.index({ userId: 1, status: 1 });
TournamentSchema.index({ userId: 1, createdAt: -1 });

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);
