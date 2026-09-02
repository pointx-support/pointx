// Scoring Engine Domain Types & Schemas

export interface PlacementRule {
  place: number;
  points: number;
}

export interface CustomBonusRule {
  id: string;
  name: string;
  description: string;
  points: number;
}

export type TieBreakCriteria =
  | 'totalPoints'
  | 'totalKills'
  | 'booyahs'
  | 'highestPlacement'
  | 'placementPoints'
  | 'latestMatchPoints';

export interface ScoringPreset {
  id: string;
  version: number;
  name: string;
  game: string;
  isOfficial?: boolean;
  killPoints: number; // e.g. 1 point per kill or 2 points
  placementTable: PlacementRule[]; // Map place #1..#N to points
  booyahBonusPoints: number; // Additional bonus points for #1 / Booyah
  customBonuses?: CustomBonusRule[];
  tieBreakOrder: TieBreakCriteria[];
  createdAt: string;
  updatedAt: string;
}

export interface RawMatchTeamResult {
  teamId: string;
  matchId?: string;
  placement: number;
  kills: number;
  booyah?: boolean;
  bonusPoints?: number;
  penaltyPoints?: number;
  appliedBonusIds?: string[];
  playerKills?: { playerId: string; kills: number }[];
}

export interface ScoringBreakdown {
  placement: number;
  placementPoints: number;
  kills: number;
  killMultiplier: number;
  killPoints: number;
  booyah: boolean;
  booyahBonusPoints: number;
  customBonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
}

export interface CalculatedMatchTeamResult {
  teamId: string;
  matchId?: string;
  placement: number;
  kills: number;
  booyah: boolean;
  placementPoints: number;
  killPoints: number;
  booyahBonusPoints: number;
  customBonusPoints: number;
  penaltyPoints: number;
  totalPoints: number;
  scoringConfigId: string;
  scoringVersion: number;
  breakdown: ScoringBreakdown;
  calculatedAt: string;
}

export type ScoringErrorCode =
  | 'INVALID_KILLS'
  | 'INVALID_PLACEMENT'
  | 'MISSING_CONFIG'
  | 'CORRUPTED_TABLE'
  | 'INVALID_PENALTY'
  | 'UNKNOWN_ERROR';

export interface ScoringError {
  code: ScoringErrorCode;
  message: string;
  field?: string;
  receivedValue?: any;
}

export interface ScoringCalculationResult {
  success: boolean;
  data?: CalculatedMatchTeamResult;
  error?: ScoringError;
}

export interface ScoringValidationResult {
  isValid: boolean;
  errors: ScoringError[];
}
