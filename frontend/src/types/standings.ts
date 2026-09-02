// Standings and Tournament Statistics Domain Types

export interface MatchPerformanceSnapshot {
  matchNumber: number;
  mapName: string;
  placement: number;
  kills: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  isBooyah: boolean;
}

export interface CalculatedStanding {
  rank: number;
  previousRank: number;
  rankDelta: number; // Positive = gained ranks (e.g. +2), Negative = lost ranks (-1), 0 = no change
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo?: string;
  slotNumber: number;
  matchesPlayed: number;
  booyahs: number;
  totalKills: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  avgKillsPerMatch: number;
  bestPlacement: number;
  bestMatchPoints: number;
  matchHistory: MatchPerformanceSnapshot[];
}

export interface PlayerLeaderboardStats {
  rank: number;
  playerId: string;
  playerName: string;
  inGameId?: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  totalKills: number;
  matchesPlayed: number;
  avgKills: number;
  bestMatchKills: number;
  headshots?: number;
  damage?: number;
}

export interface TournamentStatisticsSummary {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  totalKills: number;
  totalBooyahs: number;
  avgMatchKills: number;
  topScoringTeam?: { teamName: string; teamTag: string; totalPoints: number };
  mostKillsTeam?: { teamName: string; teamTag: string; totalKills: number };
  mostBooyahsTeam?: { teamName: string; teamTag: string; booyahs: number };
  topFragger?: { playerName: string; teamTag: string; totalKills: number };
  highestSingleMatchScore?: { teamName: string; matchNumber: number; points: number };
  highestSingleMatchKills?: { teamName: string; matchNumber: number; kills: number };
}