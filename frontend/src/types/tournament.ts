// Free Fire Esports Domain Types
import type { ScoringPreset, PlacementRule } from './scoring';
import type {
  CalculatedStanding,
  MatchPerformanceSnapshot,
  PlayerLeaderboardStats,
  TournamentStatisticsSummary
} from './standings';

export type {
  ScoringPreset,
  PlacementRule,
  CalculatedStanding,
  MatchPerformanceSnapshot,
  PlayerLeaderboardStats,
  TournamentStatisticsSummary
};

export interface Player {
  id: string;
  name: string;
  inGameId?: string;
  uid?: string;
  role?: string;
  avatarUrl?: string;
  isCaptain?: boolean;
}

export interface Team {
  id: string;
  globalTeamId?: string; // Reference to GlobalTeam database
  name: string;
  tag: string;
  logoUrl?: string;
  slotNumber: number;
  players: Player[];
  captainName?: string;
  contactEmail?: string;
}

export interface PlayerMatchStats {
  playerId: string;
  kills: number;
  headshots?: number;
  damage?: number;
}

export interface TeamMatchResult {
  teamId: string;
  placement: number;
  kills: number;
  playerStats?: PlayerMatchStats[];
  bonusPoints?: number;
  penaltyPoints?: number;
  placementPoints?: number;
  killPoints?: number;
  totalPoints?: number;
  isBooyah?: boolean;
}

export type MatchStatus = 'Draft' | 'Open' | 'Calculating' | 'Completed' | 'Finalized' | 'Scheduled' | 'Live';

export interface Match {
  id: string;
  tournamentId?: string;
  matchNumber: number;
  customLabel?: string;
  mapName: string;
  status: MatchStatus;
  createdAt: string;
  updatedAt?: string;
  finalizedAt?: string;
  results: TeamMatchResult[];
  scoringConfigId?: string;
  scoringVersion?: number;
  notes?: string;
}

export type TournamentType = 'Battle Royale' | 'Scrim' | 'League' | 'Custom';
export type TournamentStatus = 'Draft' | 'Upcoming' | 'Live' | 'Ongoing' | 'Completed' | 'Archived';

export interface TournamentStructure {
  teamCount: number; // e.g. 12, 18, 24, 48
  matchCount: number; // e.g. 3, 6, 8, 12
  roundRobin: boolean;
  groupsCount?: number;
  slotsPerMatch?: number;
  formatDescription?: string;
}

export interface Tournament {
  id: string;
  title: string;
  organizer: string;
  bannerUrl?: string;
  logoUrl?: string;
  organizerLogoUrl?: string;
  game: string;
  description?: string;
  tournamentType: TournamentType;
  status: TournamentStatus;
  structure: TournamentStructure;
  scoringPreset: ScoringPreset;
  teams: Team[];
  matches: Match[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloneTournamentOptions {
  copySettings: boolean;
  copyScoring: boolean;
  copyTeams: boolean;
  copyPlayers: boolean;
  copyMatches: boolean;
  copyBranding: boolean;
  newTitle: string;
}