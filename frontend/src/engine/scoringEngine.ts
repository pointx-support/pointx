import type {
  ScoringPreset,
  PlacementRule,
  RawMatchTeamResult,
  CalculatedMatchTeamResult,
  ScoringCalculationResult,
  ScoringValidationResult,
  ScoringError,
  TieBreakCriteria
} from '../types/scoring';
import type { Match, CalculatedStanding, TeamMatchResult, Tournament } from '../types/tournament';
import { calculateTournamentStandings } from './standingsEngine';

// ?????????????????????????????????????????????????????????????????????????
// PRESET TEMPLATES
// ?????????????????????????????????????????????????????????????????????????

export const OFFICIAL_FF_PLACEMENT_TABLE: PlacementRule[] = [
  { place: 1, points: 12 },
  { place: 2, points: 9 },
  { place: 3, points: 8 },
  { place: 4, points: 7 },
  { place: 5, points: 6 },
  { place: 6, points: 5 },
  { place: 7, points: 4 },
  { place: 8, points: 3 },
  { place: 9, points: 2 },
  { place: 10, points: 1 },
  { place: 11, points: 0 },
  { place: 12, points: 0 },
];

export const DEFAULT_FREE_FIRE_SCORING: ScoringPreset = {
  id: 'preset-ff-official-v1',
  version: 1,
  name: 'Free Fire Official Standard (12-9-8)',
  game: 'Free Fire',
  isOfficial: true,
  killPoints: 1,
  placementTable: OFFICIAL_FF_PLACEMENT_TABLE,
  booyahBonusPoints: 0,
  tieBreakOrder: ['totalPoints', 'totalKills', 'booyahs', 'highestPlacement'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const FREE_FIRE_AGGRESSIVE_SCORING: ScoringPreset = {
  id: 'preset-ff-aggressive-v1',
  version: 1,
  name: 'Free Fire Aggressive Scrims (2 Pts/Kill)',
  game: 'Free Fire',
  isOfficial: false,
  killPoints: 2,
  placementTable: OFFICIAL_FF_PLACEMENT_TABLE,
  booyahBonusPoints: 0,
  tieBreakOrder: ['totalPoints', 'totalKills', 'booyahs', 'highestPlacement'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const FREE_FIRE_SURVIVAL_BOOST_SCORING: ScoringPreset = {
  id: 'preset-ff-survival-v1',
  version: 1,
  name: 'Free Fire Survival Champion (Booyah +3 Bonus)',
  game: 'Free Fire',
  isOfficial: false,
  killPoints: 1,
  placementTable: [
    { place: 1, points: 15 },
    { place: 2, points: 12 },
    { place: 3, points: 10 },
    { place: 4, points: 8 },
    { place: 5, points: 6 },
    { place: 6, points: 4 },
    { place: 7, points: 2 },
    { place: 8, points: 1 },
    { place: 9, points: 0 },
    { place: 10, points: 0 },
    { place: 11, points: 0 },
    { place: 12, points: 0 },
  ],
  booyahBonusPoints: 3,
  tieBreakOrder: ['totalPoints', 'booyahs', 'totalKills', 'highestPlacement'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ?????????????????????????????????????????????????????????????????????????
// NORMALIZATION & VALIDATION UTILITIES
// ?????????????????????????????????????????????????????????????????????????

/**
 * Normalizes any tournament scoring configuration (MongoDB Mongoose map, custom preset, or official preset)
 * into a strongly typed, deterministic ScoringPreset.
 */
export function normalizeScoringConfig(config?: any): ScoringPreset {
  if (!config) {
    return { ...DEFAULT_FREE_FIRE_SCORING };
  }

  // 1. Placement table normalization
  let placementTable: PlacementRule[] = [];
  if (Array.isArray(config.placementTable) && config.placementTable.length > 0) {
    placementTable = config.placementTable.map((r: any) => ({
      place: Number(r.place),
      points: Math.max(0, Math.floor(Number(r.points) || 0))
    }));
  } else if (config.placementPoints && typeof config.placementPoints === 'object') {
    const rawEntries: [any, any][] = config.placementPoints instanceof Map
      ? Array.from(config.placementPoints.entries())
      : Object.entries(config.placementPoints);

    placementTable = rawEntries.map(([place, points]) => ({
      place: Number(place),
      points: Math.max(0, Math.floor(Number(points) || 0))
    }));
  }

  if (placementTable.length === 0) {
    placementTable = [...OFFICIAL_FF_PLACEMENT_TABLE];
  }

  // 2. Kill points multiplier
  const killPoints = Math.max(0, Math.floor(Number(config.killPoints ?? config.kill_points ?? 1)));

  // 3. Booyah bonus points
  const booyahBonusPoints = Math.max(0, Math.floor(Number(config.booyahBonusPoints ?? config.booyahBonus ?? config.booyah_bonus ?? 0)));

  // 4. Tie break order
  const rawTieBreakers = config.tieBreakOrder || config.tieBreakers || [];
  const tieBreakOrder: TieBreakCriteria[] = Array.isArray(rawTieBreakers) && rawTieBreakers.length > 0
    ? rawTieBreakers.map((t: string) => {
        if (t === 'total_points' || t === 'totalPoints') return 'totalPoints';
        if (t === 'total_kills' || t === 'totalKills') return 'totalKills';
        if (t === 'total_booyahs' || t === 'booyahs') return 'booyahs';
        if (t === 'placement_points' || t === 'placementPoints') return 'placementPoints';
        if (t === 'highest_placement' || t === 'highestPlacement') return 'highestPlacement';
        return 'totalPoints';
      })
    : ['totalPoints', 'totalKills', 'booyahs', 'highestPlacement'];

  return {
    id: config.id || 'preset-custom',
    name: config.name || 'Tournament Scoring Matrix',
    version: Number(config.version) || 1,
    game: config.game || 'Free Fire',
    isOfficial: Boolean(config.isOfficial),
    killPoints,
    placementTable,
    booyahBonusPoints,
    tieBreakOrder,
    createdAt: config.createdAt || new Date().toISOString(),
    updatedAt: config.updatedAt || new Date().toISOString()
  };
}

export function validateScoringConfig(_config?: ScoringPreset | null): ScoringValidationResult {
  return { isValid: true, errors: [] };
}

export function validateRawResult(rawResult: RawMatchTeamResult): ScoringValidationResult {
  const errors: ScoringError[] = [];

  if (!rawResult.teamId) {
    errors.push({
      code: 'INVALID_PLACEMENT',
      message: 'Team identifier (teamId) is required.',
      field: 'teamId'
    });
  }

  return { isValid: errors.length === 0, errors };
}

// ?????????????????????????????????????????????????????????????????????????
// CORE CALCULATION FUNCTIONS (PURE DETERMINISTIC MATHEMATICS)
// ?????????????????????????????????????????????????????????????????????????

export function getPlacementPoints(place: number, config?: any): number {
  if (place < 1) return 0;
  const normalized = normalizeScoringConfig(config);
  const match = normalized.placementTable.find((r) => r.place === place);
  if (match !== undefined) return match.points;

  // Fallback to official standard table
  const fallback = OFFICIAL_FF_PLACEMENT_TABLE.find((r) => r.place === place);
  return fallback ? fallback.points : 0;
}

export function calculateTeamMatchScore(
  rawResult: RawMatchTeamResult,
  config?: ScoringPreset | null
): ScoringCalculationResult {
  const normalizedConfig = normalizeScoringConfig(config);

  const teamId = rawResult.teamId || '';
  if (!teamId) {
    return {
      success: false,
      error: { code: 'INVALID_PLACEMENT', message: 'Team ID is required', field: 'teamId' }
    };
  }

  const placement = Math.max(0, Math.floor(Number(rawResult.placement) || 0));
  const kills = Math.max(0, Math.floor(Number(rawResult.kills) || 0));
  const killMultiplier = normalizedConfig.killPoints;
  const placementPoints = getPlacementPoints(placement, normalizedConfig);
  const killPoints = kills * killMultiplier;

  const isBooyah = Boolean(rawResult.booyah !== undefined ? rawResult.booyah : (placement === 1 && placement > 0));
  const booyahBonusPoints = isBooyah ? normalizedConfig.booyahBonusPoints : 0;

  const customBonusPoints = Math.floor(Number(rawResult.bonusPoints) || 0);
  const penaltyPoints = Math.max(0, Math.floor(Number(rawResult.penaltyPoints) || 0));

  const totalPoints = Math.max(
    0,
    placementPoints + killPoints + booyahBonusPoints + customBonusPoints - penaltyPoints
  );

  const calculatedResult: CalculatedMatchTeamResult = {
    teamId,
    matchId: rawResult.matchId,
    placement,
    kills,
    booyah: isBooyah,
    placementPoints,
    killPoints,
    booyahBonusPoints,
    customBonusPoints,
    penaltyPoints,
    totalPoints,
    scoringConfigId: normalizedConfig.id,
    scoringVersion: normalizedConfig.version,
    breakdown: {
      placement,
      placementPoints,
      kills,
      killMultiplier,
      killPoints,
      booyah: isBooyah,
      booyahBonusPoints,
      customBonusPoints,
      penaltyPoints,
      totalPoints
    },
    calculatedAt: new Date().toISOString()
  };

  return { success: true, data: calculatedResult };
}

// Helper consumed by broadcast overlays & UI
export function computeTeamMatchPoints(
  result: TeamMatchResult,
  scoringPreset: ScoringPreset = DEFAULT_FREE_FIRE_SCORING
): { placementPoints: number; killPoints: number; totalPoints: number } {
  const calc = calculateTeamMatchScore(
    {
      teamId: result.teamId,
      placement: result.placement,
      kills: result.kills,
      booyah: result.isBooyah,
      bonusPoints: result.bonusPoints,
      penaltyPoints: result.penaltyPoints
    },
    scoringPreset
  );

  if (!calc.success || !calc.data) {
    const placement = Math.max(0, Math.floor(Number(result.placement) || 0));
    const kills = Math.max(0, Math.floor(Number(result.kills) || 0));
    const placementPoints = getPlacementPoints(placement, scoringPreset);
    const killMultiplier = Math.max(0, Math.floor(Number(scoringPreset?.killPoints) || 1));
    const killPoints = kills * killMultiplier;
    return { placementPoints, killPoints, totalPoints: placementPoints + killPoints };
  }

  return {
    placementPoints: calc.data.placementPoints,
    killPoints: calc.data.killPoints,
    totalPoints: calc.data.totalPoints
  };
}

export function calculateMatchBatch(
  rawResults: RawMatchTeamResult[],
  config: ScoringPreset = DEFAULT_FREE_FIRE_SCORING
): CalculatedMatchTeamResult[] {
  return rawResults.map((r) => {
    const calc = calculateTeamMatchScore(r, config);
    if (!calc.success || !calc.data) {
      throw new Error(`Scoring calculation failed for team ${r.teamId}: ${calc.error?.message}`);
    }
    return calc.data;
  });
}

// Recalculates historical match
export function recalculateMatchScores(
  match: Match,
  newConfig: ScoringPreset = DEFAULT_FREE_FIRE_SCORING
): Match {
  const normalizedConfig = normalizeScoringConfig(newConfig);

  const recalculatedResults: TeamMatchResult[] = match.results.map((r) => {
    const calc = calculateTeamMatchScore(
      {
        teamId: r.teamId,
        matchId: match.id,
        placement: r.placement,
        kills: r.kills,
        booyah: r.isBooyah,
        bonusPoints: r.bonusPoints,
        penaltyPoints: r.penaltyPoints
      },
      normalizedConfig
    );

    if (!calc.success || !calc.data) {
      const placement = Math.max(0, Math.floor(Number(r.placement) || 0));
      const kills = Math.max(0, Math.floor(Number(r.kills) || 0));
      const placePts = getPlacementPoints(placement, normalizedConfig);
      const killPts = kills * normalizedConfig.killPoints;
      return {
        ...r,
        placement,
        kills,
        placementPoints: placePts,
        killPoints: killPts,
        totalPoints: placePts + killPts
      };
    }

    return {
      ...r,
      placement: calc.data.placement,
      kills: calc.data.kills,
      placementPoints: calc.data.placementPoints,
      killPoints: calc.data.killPoints,
      totalPoints: calc.data.totalPoints,
      isBooyah: calc.data.booyah
    };
  });

  return {
    ...match,
    scoringConfigId: normalizedConfig.id,
    scoringVersion: normalizedConfig.version,
    results: recalculatedResults
  };
}

export function calculateStandings(
  teams: any[],
  matches: Match[],
  scoringConfig: ScoringPreset = DEFAULT_FREE_FIRE_SCORING
): CalculatedStanding[] {
  const mockTournament: Tournament = {
    id: 'temp',
    title: 'Standings',
    organizer: '',
    game: 'Free Fire',
    tournamentType: 'Battle Royale',
    status: 'Live',
    structure: { teamCount: teams.length, matchCount: matches.length, roundRobin: false, slotsPerMatch: 12 },
    scoringPreset: normalizeScoringConfig(scoringConfig),
    teams,
    matches,
    createdAt: '',
    updatedAt: ''
  };

  return calculateTournamentStandings(mockTournament, { includeDrafts: true });
}
