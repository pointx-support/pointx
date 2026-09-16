import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamStandingReport {
  rank: number;
  teamId: string;
  teamName: string;
  teamTag: string;
  slotNumber: number;
  logoUrl?: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  isBooyah: boolean;
}

export interface IPlayerStatReport {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  kills: number;
  status: string;
}

export interface IMatchReportSummary {
  totalEliminations: number;
  totalPoints: number;
  winningTeam: {
    teamId: string;
    name: string;
    kills: number;
    totalPoints: number;
  };
  killLeader: {
    teamId: string;
    teamName: string;
    kills: number;
  };
  totalTeams: number;
}

export interface IMatchReport extends Document {
  reportId: string;
  tournamentId: string;
  matchId: string;
  organizationId: string;
  matchNumber: number;
  matchTitle: string;
  mapName: string;
  game: string;
  finalizedAt: Date;
  finalizedBy?: string;
  version: number;
  standings: ITeamStandingReport[];
  playerStats: IPlayerStatReport[];
  summary: IMatchReportSummary;
  createdAt: Date;
  updatedAt: Date;
}

const MatchReportSchema = new Schema<IMatchReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    tournamentId: { type: String, required: true, index: true },
    matchId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    matchNumber: { type: Number, required: true },
    matchTitle: { type: String, default: '' },
    mapName: { type: String, default: 'Bermuda' },
    game: { type: String, default: 'Free Fire' },
    finalizedAt: { type: Date, default: Date.now },
    finalizedBy: { type: String, default: 'Operator' },
    version: { type: Number, default: 1 },
    standings: [{ type: Schema.Types.Mixed }],
    playerStats: [{ type: Schema.Types.Mixed }],
    summary: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

MatchReportSchema.index({ tournamentId: 1, matchId: 1, version: -1 });

export const MatchReport = mongoose.model<IMatchReport>('MatchReport', MatchReportSchema);
