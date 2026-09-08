/**
 * PointX Authoritative Backend Scoring Engine
 */

export interface PlacementRule {
  place: number;
  points: number;
}

export type TieBreakCriteria =
  | 'totalPoints'
  | 'totalKills'
  | 'booyahs'
  | 'placementPoints'
  | 'highestPlacement';

export interface ScoringPreset {
  id: string;
  version: number;
  name: string;
  game: string;
  isOfficial?: boolean;
  killPoints: number;
  placementTable: PlacementRule[];
  booyahBonusPoints: number;
  tieBreakOrder: TieBreakCriteria[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RawMatchTeamResult {
  teamId: string;
  matchId?: string;
  placement?: number;
  kills?: number;
  booyah?: boolean;
  bonusPoints?: number;
  penaltyPoints?: number;
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
  breakdown: {
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
  };
  calculatedAt: string;
}

export interface ScoringCalculationResult {
  success: boolean;
  data?: CalculatedMatchTeamResult;
  error?: { code: string; message: string; field?: string };
}

export interface CalculatedStanding {
  teamId: string;
  rank: number;
  teamName: string;
  tag?: string;
  logoUrl?: string;
  totalPoints: number;
  placementPoints: number;
  killPoints: number;
  totalKills: number;
  booyahs: number;
  matchesPlayed: number;
  bestPlacement: number;
  [key: string]: any;
}

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

export function normalizeScoringConfig(config?: any): ScoringPreset {
  if (!config) {
    return { ...DEFAULT_FREE_FIRE_SCORING };
  }

  let placementTable: PlacementRule[] = [];
  if (Array.isArray(config.placementTable) && config.placementTable.length > 0) {
    placementTable = config.placementTable.map((r: any) => ({
      place: Number(r.place),
      points: Math.max(0, Math.floor(Number(r.points) || 0)),
    }));
  } else if (config.placementPoints && typeof config.placementPoints === 'object') {
    const rawEntries: [any, any][] =
      config.placementPoints instanceof Map
        ? Array.from(config.placementPoints.entries())
        : Object.entries(config.placementPoints);

    placementTable = rawEntries.map(([place, points]) => ({
      place: Number(place),
      points: Math.max(0, Math.floor(Number(points) || 0)),
    }));
  }

  if (placementTable.length === 0) {
    placementTable = [...OFFICIAL_FF_PLACEMENT_TABLE];
  }

  const killPoints = Math.max(
    0,
    Math.floor(Number(config.killPoints ?? config.kill_points ?? 1))
  );

  const booyahBonusPoints = Math.max(
    0,
    Math.floor(
      Number(config.booyahBonusPoints ?? config.booyahBonus ?? config.booyah_bonus ?? 0)
    )
  );

  const rawTieBreakers = config.tieBreakOrder || config.tieBreakers || [];
  const tieBreakOrder: TieBreakCriteria[] =
    Array.isArray(rawTieBreakers) && rawTieBreakers.length > 0
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
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
}

export function getPlacementPoints(place: number, config?: any): number {
  if (place < 1) return 0;
  const normalized = normalizeScoringConfig(config);
  const match = normalized.placementTable.find((r) => r.place === place);
  if (match !== undefined) return match.points;

  const fallback = OFFICIAL_FF_PLACEMENT_TABLE.find((r) => r.place === place);
  return fallback ? fallback.points : 0;
}

export function calculateTeamMatchScore(
  rawResult: RawMatchTeamResult,
  config?: any
): ScoringCalculationResult {
  const teamId = rawResult.teamId || '';
  if (!teamId) {
    return { success: false, error: { code: 'INVALID_PLACEMENT', message: 'Team ID is required.' } };
  }

  if (rawResult.kills !== undefined && (rawResult.kills < 0 || isNaN(rawResult.kills))) {
    return { success: false, error: { code: 'INVALID_KILLS', message: 'Kills cannot be negative.' } };
  }

  if (rawResult.placement !== undefined && (rawResult.placement < 1 || isNaN(rawResult.placement))) {
    return { success: false, error: { code: 'INVALID_PLACEMENT', message: 'Placement must be at least 1.' } };
  }

  const normalizedConfig = normalizeScoringConfig(config);

  const placement = Math.max(0, Math.floor(Number(rawResult.placement) || 0));
  const kills = Math.max(0, Math.floor(Number(rawResult.kills) || 0));
  const killMultiplier = normalizedConfig.killPoints;
  const placementPoints = getPlacementPoints(placement, normalizedConfig);
  const killPoints = kills * killMultiplier;

  const isBooyah = Boolean(
    rawResult.booyah !== undefined ? rawResult.booyah : placement === 1 && placement > 0
  );
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
      totalPoints,
    },
    calculatedAt: new Date().toISOString(),
  };

  return { success: true, data: calculatedResult };
}

export function calculateTacticalModeBonus(
  teamId: string,
  options?: {
    isPointRushActive?: boolean;
    pointRushTeamIds?: string[];
    isFireActive?: boolean;
    fireTeamIds?: string[];
    customBonus?: number;
  }
): number {
  let bonus = Math.floor(Number(options?.customBonus) || 0);

  const isPointRush = Boolean(
    options?.isPointRushActive ||
      (options?.pointRushTeamIds && options.pointRushTeamIds.includes(teamId))
  );
  if (isPointRush) {
    bonus += 1;
  }

  return bonus;
}

export function recalculateMatchScores(match: any, config?: any): any {
  const normalizedConfig = normalizeScoringConfig(config);
  const rawResults: any[] = Array.isArray(match.results) ? match.results : [];

  const recalculatedResults = rawResults.map((r) => {
    const calc = calculateTeamMatchScore(
      {
        teamId: r.teamId,
        matchId: match.id || match.customId,
        placement: r.placement,
        kills: r.kills,
        booyah: r.isBooyah ?? r.booyah,
        bonusPoints: r.bonusPoints,
        penaltyPoints: r.penaltyPoints,
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
        totalPoints: placePts + killPts,
      };
    }

    return {
      ...r,
      placement: calc.data.placement,
      kills: calc.data.kills,
      placementPoints: calc.data.placementPoints,
      killPoints: calc.data.killPoints,
      totalPoints: calc.data.totalPoints,
      isBooyah: calc.data.booyah,
      booyahBonusPoints: calc.data.booyahBonusPoints,
      customBonusPoints: calc.data.customBonusPoints,
      penaltyPoints: calc.data.penaltyPoints,
    };
  });

  return {
    ...match,
    scoringConfigId: normalizedConfig.id,
    scoringVersion: normalizedConfig.version,
    results: recalculatedResults,
  };
}

export function calculateStandings(
  teams: any[],
  matches: any[],
  scoringConfig?: any,
  options: { includeDrafts?: boolean } = { includeDrafts: true }
): CalculatedStanding[] {
  const normalized = normalizeScoringConfig(scoringConfig);
  const effectiveTeams = Array.isArray(teams) ? teams : [];
  const effectiveMatches = Array.isArray(matches)
    ? matches.filter((m) => {
        if (options.includeDrafts) return true;
        const status = (m.status || '').toLowerCase();
        return status === 'completed' || status === 'finalized';
      })
    : [];

  const teamStatsMap = new Map<
    string,
    {
      teamId: string;
      teamName: string;
      tag?: string;
      logoUrl?: string;
      totalPoints: number;
      placementPoints: number;
      killPoints: number;
      totalKills: number;
      booyahs: number;
      matchesPlayed: number;
      bestPlacement: number;
    }
  >();

  for (const team of effectiveTeams) {
    teamStatsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      tag: team.tag,
      logoUrl: team.logoUrl,
      totalPoints: 0,
      placementPoints: 0,
      killPoints: 0,
      totalKills: 0,
      booyahs: 0,
      matchesPlayed: 0,
      bestPlacement: 999,
    });
  }

  for (const match of effectiveMatches) {
    const results: any[] = Array.isArray(match.results) ? match.results : [];
    for (const r of results) {
      if (!teamStatsMap.has(r.teamId)) {
        teamStatsMap.set(r.teamId, {
          teamId: r.teamId,
          teamName: r.teamName || r.teamId,
          tag: r.tag,
          logoUrl: r.logoUrl,
          totalPoints: 0,
          placementPoints: 0,
          killPoints: 0,
          totalKills: 0,
          booyahs: 0,
          matchesPlayed: 0,
          bestPlacement: 999,
        });
      }

      const stat = teamStatsMap.get(r.teamId)!;
      const placement = Math.max(0, Math.floor(Number(r.placement) || 0));
      const kills = Math.max(0, Math.floor(Number(r.kills) || 0));
      const placePts =
        r.placementPoints !== undefined
          ? Number(r.placementPoints)
          : getPlacementPoints(placement, normalized);
      const killPts =
        r.killPoints !== undefined ? Number(r.killPoints) : kills * normalized.killPoints;
      const totalPts =
        r.totalPoints !== undefined ? Number(r.totalPoints) : placePts + killPts;

      stat.matchesPlayed += 1;
      stat.totalKills += kills;
      stat.placementPoints += placePts;
      stat.killPoints += killPts;
      stat.totalPoints += totalPts;
      if (r.isBooyah || placement === 1) {
        stat.booyahs += 1;
      }
      if (placement > 0 && placement < stat.bestPlacement) {
        stat.bestPlacement = placement;
      }
    }
  }

  const standingsList = Array.from(teamStatsMap.values()).map((s) => ({
    ...s,
    bestPlacement: s.bestPlacement === 999 ? 0 : s.bestPlacement,
    rank: 1,
  }));

  standingsList.sort((a, b) => {
    for (const criteria of normalized.tieBreakOrder) {
      if (criteria === 'totalPoints') {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      } else if (criteria === 'totalKills') {
        if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
      } else if (criteria === 'booyahs') {
        if (b.booyahs !== a.booyahs) return b.booyahs - a.booyahs;
      } else if (criteria === 'placementPoints') {
        if (b.placementPoints !== a.placementPoints)
          return b.placementPoints - a.placementPoints;
      } else if (criteria === 'highestPlacement') {
        const placeA = a.bestPlacement > 0 ? a.bestPlacement : 999;
        const placeB = b.bestPlacement > 0 ? b.bestPlacement : 999;
        if (placeA !== placeB) return placeA - placeB;
      }
    }
    return a.teamName.localeCompare(b.teamName);
  });

  for (let i = 0; i < standingsList.length; i++) {
    if (i > 0) {
      const prev = standingsList[i - 1];
      const curr = standingsList[i];
      if (
        curr.totalPoints === prev.totalPoints &&
        curr.totalKills === prev.totalKills &&
        curr.booyahs === prev.booyahs &&
        curr.placementPoints === prev.placementPoints
      ) {
        curr.rank = prev.rank;
      } else {
        curr.rank = i + 1;
      }
    } else {
      standingsList[0].rank = 1;
    }
  }

  return standingsList;
}
