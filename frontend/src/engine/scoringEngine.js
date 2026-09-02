import { calculateTournamentStandings } from './standingsEngine';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESET TEMPLATES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const OFFICIAL_FF_PLACEMENT_TABLE = [
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
export const DEFAULT_FREE_FIRE_SCORING = {
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
export const FREE_FIRE_AGGRESSIVE_SCORING = {
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
export const FREE_FIRE_SURVIVAL_BOOST_SCORING = {
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
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VALIDATION UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function validateScoringConfig(config) {
    const errors = [];
    if (!config) {
        errors.push({
            code: 'MISSING_CONFIG',
            message: 'Scoring configuration is missing or undefined.'
        });
        return { isValid: false, errors };
    }
    if (typeof config.killPoints !== 'number' || isNaN(config.killPoints) || config.killPoints < 0) {
        errors.push({
            code: 'CORRUPTED_TABLE',
            message: 'Kill points multiplier must be a non-negative number.',
            field: 'killPoints',
            receivedValue: config.killPoints
        });
    }
    if (!Array.isArray(config.placementTable) || config.placementTable.length === 0) {
        errors.push({
            code: 'CORRUPTED_TABLE',
            message: 'Placement rules table is missing or empty.',
            field: 'placementTable'
        });
    }
    return { isValid: errors.length === 0, errors };
}
export function validateRawResult(rawResult) {
    const errors = [];
    if (!rawResult.teamId) {
        errors.push({
            code: 'INVALID_PLACEMENT',
            message: 'Team identifier (teamId) is required.',
            field: 'teamId'
        });
    }
    if (typeof rawResult.placement !== 'number' ||
        isNaN(rawResult.placement) ||
        !Number.isInteger(rawResult.placement) ||
        rawResult.placement < 1) {
        errors.push({
            code: 'INVALID_PLACEMENT',
            message: 'Placement must be a positive integer greater than or equal to 1.',
            field: 'placement',
            receivedValue: rawResult.placement
        });
    }
    if (typeof rawResult.kills !== 'number' ||
        isNaN(rawResult.kills) ||
        !Number.isInteger(rawResult.kills) ||
        rawResult.kills < 0) {
        errors.push({
            code: 'INVALID_KILLS',
            message: 'Kills must be a non-negative integer (0 or greater).',
            field: 'kills',
            receivedValue: rawResult.kills
        });
    }
    if (rawResult.penaltyPoints !== undefined && (isNaN(rawResult.penaltyPoints) || rawResult.penaltyPoints < 0)) {
        errors.push({
            code: 'INVALID_PENALTY',
            message: 'Penalty points must be a non-negative number.',
            field: 'penaltyPoints',
            receivedValue: rawResult.penaltyPoints
        });
    }
    return { isValid: errors.length === 0, errors };
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE CALCULATION FUNCTIONS (PURE MATHEMATICS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function getPlacementPoints(place, config) {
    if (!config?.placementTable || place < 1)
        return 0;
    const match = config.placementTable.find((r) => r.place === place);
    return match ? Math.max(0, Math.floor(match.points)) : 0;
}
export function calculateTeamMatchScore(rawResult, config) {
    // Validate configuration
    const configValidation = validateScoringConfig(config);
    if (!configValidation.isValid || !config) {
        return { success: false, error: configValidation.errors[0] };
    }
    // Validate raw match entry
    const resultValidation = validateRawResult(rawResult);
    if (!resultValidation.isValid) {
        return { success: false, error: resultValidation.errors[0] };
    }
    // Pure integer calculations
    const placement = Math.floor(rawResult.placement);
    const kills = Math.floor(rawResult.kills);
    const killMultiplier = Math.floor(config.killPoints);
    const placementPoints = getPlacementPoints(placement, config);
    const killPoints = kills * killMultiplier;
    // Booyah logic
    const isBooyah = rawResult.booyah !== undefined ? rawResult.booyah : placement === 1;
    const booyahBonusPoints = isBooyah ? Math.floor(config.booyahBonusPoints || 0) : 0;
    const customBonusPoints = Math.floor(rawResult.bonusPoints || 0);
    const penaltyPoints = Math.floor(rawResult.penaltyPoints || 0);
    const totalPoints = Math.max(0, placementPoints + killPoints + booyahBonusPoints + customBonusPoints - penaltyPoints);
    const calculatedResult = {
        teamId: rawResult.teamId,
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
        scoringConfigId: config.id,
        scoringVersion: config.version || 1,
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
export function computeTeamMatchPoints(result, scoringPreset = DEFAULT_FREE_FIRE_SCORING) {
    const calc = calculateTeamMatchScore({
        teamId: result.teamId,
        placement: result.placement,
        kills: result.kills,
        booyah: result.isBooyah,
        bonusPoints: result.bonusPoints,
        penaltyPoints: result.penaltyPoints
    }, scoringPreset);
    if (!calc.success || !calc.data) {
        const placementPoints = getPlacementPoints(result.placement, scoringPreset);
        const killPoints = result.kills * scoringPreset.killPoints;
        return { placementPoints, killPoints, totalPoints: placementPoints + killPoints };
    }
    return {
        placementPoints: calc.data.placementPoints,
        killPoints: calc.data.killPoints,
        totalPoints: calc.data.totalPoints
    };
}
export function calculateMatchBatch(rawResults, config = DEFAULT_FREE_FIRE_SCORING) {
    return rawResults.map((r) => {
        const calc = calculateTeamMatchScore(r, config);
        if (!calc.success || !calc.data) {
            throw new Error(`Scoring calculation failed for team ${r.teamId}: ${calc.error?.message}`);
        }
        return calc.data;
    });
}
// Recalculates historical match
export function recalculateMatchScores(match, newConfig = DEFAULT_FREE_FIRE_SCORING) {
    const recalculatedResults = match.results.map((r) => {
        const calc = calculateTeamMatchScore({
            teamId: r.teamId,
            matchId: match.id,
            placement: r.placement,
            kills: r.kills,
            booyah: r.isBooyah,
            bonusPoints: r.bonusPoints,
            penaltyPoints: r.penaltyPoints
        }, newConfig);
        if (!calc.success || !calc.data)
            return r;
        return {
            ...r,
            placementPoints: calc.data.placementPoints,
            killPoints: calc.data.killPoints,
            totalPoints: calc.data.totalPoints,
            isBooyah: calc.data.booyah
        };
    });
    return {
        ...match,
        scoringConfigId: newConfig.id,
        scoringVersion: newConfig.version,
        results: recalculatedResults
    };
}
export function calculateStandings(teams, matches, scoringConfig = DEFAULT_FREE_FIRE_SCORING) {
    const mockTournament = {
        id: 'temp',
        title: 'Standings',
        organizer: '',
        game: 'Free Fire',
        tournamentType: 'Battle Royale',
        status: 'Live',
        structure: { teamCount: teams.length, matchCount: matches.length, roundRobin: false },
        scoringPreset: scoringConfig,
        teams,
        matches,
        createdAt: '',
        updatedAt: ''
    };
    return calculateTournamentStandings(mockTournament, { includeDrafts: true });
}
