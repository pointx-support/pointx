import type {
  Tournament,
  CalculatedStanding,
  MatchPerformanceSnapshot,
  PlayerLeaderboardStats,
  TournamentStatisticsSummary
} from '../types/tournament';
import type { TieBreakCriteria } from '../types/scoring';
import { calculateTeamMatchScore } from './scoringEngine';

// Internal accumulator for standings computation
interface TeamStandingAccumulator {
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
  bestPlacement: number;
  bestMatchPoints: number;
  latestMatchPoints: number;
  matchHistory: MatchPerformanceSnapshot[];
}

export function compareAccumulators(
  a: TeamStandingAccumulator,
  b: TeamStandingAccumulator,
  tieBreakOrder: TieBreakCriteria[] = ['totalPoints', 'totalKills', 'booyahs', 'highestPlacement']
): number {
  for (const criteria of tieBreakOrder) {
    if (criteria === 'totalPoints') {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    } else if (criteria === 'totalKills') {
      if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
    } else if (criteria === 'booyahs') {
      if (b.booyahs !== a.booyahs) return b.booyahs - a.booyahs;
    } else if (criteria === 'highestPlacement') {
      if (a.bestPlacement !== b.bestPlacement) return a.bestPlacement - b.bestPlacement;
    } else if (criteria === 'placementPoints') {
      if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
    } else if (criteria === 'latestMatchPoints') {
      if (b.latestMatchPoints !== a.latestMatchPoints) return b.latestMatchPoints - a.latestMatchPoints;
    }
  }

  // Deterministic fallback: slot number ascending
  return a.slotNumber - b.slotNumber;
}

/**
 * Calculates official tournament standings with dynamic rank delta indicators,
 * multi-criteria tie-breaking, and match-by-match histories.
 */
export function calculateTournamentStandings(
  tournament: Tournament,
  options?: {
    matchRange?: { start?: number; end?: number };
    includeDrafts?: boolean;
  }
): CalculatedStanding[] {
  const { teams, matches, scoringPreset } = tournament;
  const includeDrafts = options?.includeDrafts ?? true;

  // Filter eligible matches
  const eligibleMatches = matches
    .filter((m) => {
      if (!includeDrafts && m.status === 'Draft' && (!m.results || m.results.length === 0)) return false;
      if (options?.matchRange?.start && m.matchNumber < options.matchRange.start) return false;
      if (options?.matchRange?.end && m.matchNumber > options.matchRange.end) return false;
      return true;
    })
    .sort((a, b) => a.matchNumber - b.matchNumber);

  // Initialize accumulators for all teams
  const createFreshAccumulators = () => {
    const map = new Map<string, TeamStandingAccumulator>();
    teams.forEach((t) => {
      map.set(t.id, {
        teamId: t.id,
        teamName: t.name,
        teamTag: t.tag,
        teamLogo: t.logoUrl,
        slotNumber: t.slotNumber,
        matchesPlayed: 0,
        booyahs: 0,
        totalKills: 0,
        placementPoints: 0,
        killPoints: 0,
        bonusPoints: 0,
        penaltyPoints: 0,
        totalPoints: 0,
        bestPlacement: 999,
        bestMatchPoints: 0,
        latestMatchPoints: 0,
        matchHistory: []
      });
    });
    return map;
  };

  const currentAccumulators = createFreshAccumulators();

  // Process all eligible matches
  eligibleMatches.forEach((match) => {
    if (!match.results || !Array.isArray(match.results)) return;

    match.results.forEach((res) => {
      const entry = currentAccumulators.get(res.teamId);
      if (!entry) return;

      // Calculate score dynamically through scoring engine
      const calcResult = calculateTeamMatchScore(
        {
          teamId: res.teamId,
          matchId: match.id,
          placement: res.placement,
          kills: res.kills,
          booyah: res.isBooyah,
          bonusPoints: res.bonusPoints,
          penaltyPoints: res.penaltyPoints
        },
        scoringPreset
      );

      if (calcResult.success && calcResult.data) {
        const d = calcResult.data;
        entry.matchesPlayed += 1;
        if (d.booyah) entry.booyahs += 1;
        entry.totalKills += d.kills;
        entry.placementPoints += d.placementPoints;
        entry.killPoints += d.killPoints;
        entry.bonusPoints += d.customBonusPoints;
        entry.penaltyPoints += d.penaltyPoints;
        entry.totalPoints += d.totalPoints;
        entry.bestPlacement = Math.min(entry.bestPlacement, d.placement);
        entry.bestMatchPoints = Math.max(entry.bestMatchPoints, d.totalPoints);
        entry.latestMatchPoints = d.totalPoints;

        entry.matchHistory.push({
          matchNumber: match.matchNumber,
          mapName: match.mapName,
          placement: d.placement,
          kills: d.kills,
          placementPoints: d.placementPoints,
          killPoints: d.killPoints,
          totalPoints: d.totalPoints,
          isBooyah: d.booyah
        });
      } else {
        // Fallback directly to match result values if scoring preset formula was missing or incomplete
        const kills = Math.max(0, Math.floor(Number(res.kills) || 0));
        const placement = Math.max(1, Math.floor(Number(res.placement) || 12));
        const isBooyah = Boolean(res.isBooyah || placement === 1);
        const placePts = res.placementPoints !== undefined
          ? Number(res.placementPoints)
          : (placement === 1 ? 12 : placement === 2 ? 9 : placement === 3 ? 8 : placement === 4 ? 7 : placement === 5 ? 6 : placement === 6 ? 5 : placement === 7 ? 4 : placement === 8 ? 3 : placement === 9 ? 2 : placement === 10 ? 1 : 0);
        const killMultiplier = Number(scoringPreset?.killPoints) || 1;
        const killPts = res.killPoints !== undefined ? Number(res.killPoints) : (kills * killMultiplier);
        const bonus = Number(res.bonusPoints) || 0;
        const penalty = Number(res.penaltyPoints) || 0;
        const total = res.totalPoints !== undefined ? Number(res.totalPoints) : Math.max(0, placePts + killPts + bonus - penalty);

        entry.matchesPlayed += 1;
        if (isBooyah) entry.booyahs += 1;
        entry.totalKills += kills;
        entry.placementPoints += placePts;
        entry.killPoints += killPts;
        entry.bonusPoints += bonus;
        entry.penaltyPoints += penalty;
        entry.totalPoints += total;
        entry.bestPlacement = Math.min(entry.bestPlacement, placement);
        entry.bestMatchPoints = Math.max(entry.bestMatchPoints, total);
        entry.latestMatchPoints = total;

        entry.matchHistory.push({
          matchNumber: match.matchNumber,
          mapName: match.mapName,
          placement,
          kills,
          placementPoints: placePts,
          killPoints: killPts,
          totalPoints: total,
          isBooyah
        });
      }
    });
  });

  const tieBreakOrder = scoringPreset.tieBreakOrder || [
    'totalPoints',
    'totalKills',
    'booyahs',
    'highestPlacement'
  ];

  // Sort current standings
  const sortedCurrent = Array.from(currentAccumulators.values()).sort((a, b) =>
    compareAccumulators(a, b, tieBreakOrder)
  );

  // Compute previous rank (standings excluding the latest match) for rank movement
  const previousRanksMap = new Map<string, number>();

  if (eligibleMatches.length > 1) {
    const prevMatches = eligibleMatches.slice(0, eligibleMatches.length - 1);
    const prevAccumulators = createFreshAccumulators();

    prevMatches.forEach((match) => {
      match.results.forEach((res) => {
        const entry = prevAccumulators.get(res.teamId);
        if (!entry) return;

        const calcResult = calculateTeamMatchScore(
          {
            teamId: res.teamId,
            matchId: match.id,
            placement: res.placement,
            kills: res.kills,
            booyah: res.isBooyah,
            bonusPoints: res.bonusPoints,
            penaltyPoints: res.penaltyPoints
          },
          scoringPreset
        );

        if (calcResult.success && calcResult.data) {
          const d = calcResult.data;
          entry.matchesPlayed += 1;
          if (d.booyah) entry.booyahs += 1;
          entry.totalKills += d.kills;
          entry.placementPoints += d.placementPoints;
          entry.killPoints += d.killPoints;
          entry.totalPoints += d.totalPoints;
          entry.bestPlacement = Math.min(entry.bestPlacement, d.placement);
          entry.latestMatchPoints = d.totalPoints;
        }
      });
    });

    const sortedPrev = Array.from(prevAccumulators.values()).sort((a, b) =>
      compareAccumulators(a, b, tieBreakOrder)
    );

    sortedPrev.forEach((item, index) => {
      previousRanksMap.set(item.teamId, index + 1);
    });
  }

  return sortedCurrent.map((item, index) => {
    const currentRank = index + 1;
    const previousRank = previousRanksMap.get(item.teamId) || currentRank;
    const rankDelta = previousRank - currentRank; // e.g. was #3, now #1 => delta = +2

    const avgPointsPerMatch =
      item.matchesPlayed > 0 ? Number((item.totalPoints / item.matchesPlayed).toFixed(1)) : 0;
    const avgKillsPerMatch =
      item.matchesPlayed > 0 ? Number((item.totalKills / item.matchesPlayed).toFixed(1)) : 0;

    return {
      rank: currentRank,
      previousRank,
      rankDelta,
      teamId: item.teamId,
      teamName: item.teamName,
      teamTag: item.teamTag,
      teamLogo: item.teamLogo,
      slotNumber: item.slotNumber,
      matchesPlayed: item.matchesPlayed,
      booyahs: item.booyahs,
      totalKills: item.totalKills,
      placementPoints: item.placementPoints,
      killPoints: item.killPoints,
      bonusPoints: item.bonusPoints,
      penaltyPoints: item.penaltyPoints,
      totalPoints: item.totalPoints,
      avgPointsPerMatch,
      avgKillsPerMatch,
      bestPlacement: item.bestPlacement === 999 ? 0 : item.bestPlacement,
      bestMatchPoints: item.bestMatchPoints,
      matchHistory: item.matchHistory
    };
  });
}

/**
 * Calculates top fraggers / MVP ranking based on individual player stats.
 */
export function calculateTopFraggers(
  tournament: Tournament,
  options?: {
    matchRange?: { start?: number; end?: number };
  }
): PlayerLeaderboardStats[] {
  const { teams, matches } = tournament;
  const playerMap = new Map<
    string,
    {
      playerId: string;
      playerName: string;
      inGameId?: string;
      teamId: string;
      teamName: string;
      teamTag: string;
      totalKills: number;
      matchesPlayed: number;
      bestMatchKills: number;
      headshots: number;
      damage: number;
    }
  >();

  // Register all known players
  teams.forEach((t) => {
    t.players.forEach((p) => {
      playerMap.set(p.id, {
        playerId: p.id,
        playerName: p.name,
        inGameId: p.inGameId,
        teamId: t.id,
        teamName: t.name,
        teamTag: t.tag,
        totalKills: 0,
        matchesPlayed: 0,
        bestMatchKills: 0,
        headshots: 0,
        damage: 0
      });
    });
  });

  const eligibleMatches = matches.filter((m) => {
    if (m.status === 'Draft') return false;
    if (options?.matchRange?.start && m.matchNumber < options.matchRange.start) return false;
    if (options?.matchRange?.end && m.matchNumber > options.matchRange.end) return false;
    return true;
  });

  eligibleMatches.forEach((match) => {
    match.results.forEach((res) => {
      if (res.playerStats && res.playerStats.length > 0) {
        res.playerStats.forEach((ps) => {
          const entry = playerMap.get(ps.playerId);
          if (entry) {
            entry.matchesPlayed += 1;
            entry.totalKills += ps.kills;
            entry.bestMatchKills = Math.max(entry.bestMatchKills, ps.kills);
            if (ps.headshots) entry.headshots += ps.headshots;
            if (ps.damage) entry.damage += ps.damage;
          }
        });
      }
    });
  });

  const sortedPlayers = Array.from(playerMap.values())
    .filter((p) => p.totalKills > 0 || p.matchesPlayed > 0)
    .sort((a, b) => {
      if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
      return b.bestMatchKills - a.bestMatchKills;
    });

  return sortedPlayers.map((p, index) => ({
    rank: index + 1,
    playerId: p.playerId,
    playerName: p.playerName,
    inGameId: p.inGameId,
    teamId: p.teamId,
    teamName: p.teamName,
    teamTag: p.teamTag,
    totalKills: p.totalKills,
    matchesPlayed: p.matchesPlayed,
    avgKills: p.matchesPlayed > 0 ? Number((p.totalKills / p.matchesPlayed).toFixed(1)) : p.totalKills,
    bestMatchKills: p.bestMatchKills,
    headshots: p.headshots,
    damage: p.damage
  }));
}

/**
 * Calculates tournament overall statistics summary & objective performance insights.
 */
export function calculateTournamentSummary(tournament: Tournament): TournamentStatisticsSummary {
  const standings = calculateTournamentStandings(tournament);
  const topFraggers = calculateTopFraggers(tournament);

  const completedMatches = tournament.matches.filter((m) => m.status === 'Finalized' || m.status === 'Completed');
  const totalKills = standings.reduce((sum, s) => sum + s.totalKills, 0);
  const totalBooyahs = standings.reduce((sum, s) => sum + s.booyahs, 0);
  const avgMatchKills = completedMatches.length > 0 ? Number((totalKills / completedMatches.length).toFixed(1)) : 0;

  const topScoring = standings[0];
  const mostKills = [...standings].sort((a, b) => b.totalKills - a.totalKills)[0];
  const mostBooyahs = [...standings].sort((a, b) => b.booyahs - a.booyahs)[0];
  const topFragger = topFraggers[0];

  // Single-match record highlights
  let highestSingleMatchScore: { teamName: string; matchNumber: number; points: number } | undefined;
  let highestSingleMatchKills: { teamName: string; matchNumber: number; kills: number } | undefined;

  tournament.matches.forEach((m) => {
    m.results.forEach((r) => {
      const team = tournament.teams.find((t) => t.id === r.teamId);
      if (!team) return;

      const pts = r.totalPoints || 0;
      const k = r.kills || 0;

      if (!highestSingleMatchScore || pts > highestSingleMatchScore.points) {
        highestSingleMatchScore = { teamName: team.name, matchNumber: m.matchNumber, points: pts };
      }
      if (!highestSingleMatchKills || k > highestSingleMatchKills.kills) {
        highestSingleMatchKills = { teamName: team.name, matchNumber: m.matchNumber, kills: k };
      }
    });
  });

  return {
    totalTeams: tournament.teams.length,
    totalMatches: tournament.matches.length,
    completedMatches: completedMatches.length,
    totalKills,
    totalBooyahs,
    avgMatchKills,
    topScoringTeam: topScoring ? { teamName: topScoring.teamName, teamTag: topScoring.teamTag, totalPoints: topScoring.totalPoints } : undefined,
    mostKillsTeam: mostKills ? { teamName: mostKills.teamName, teamTag: mostKills.teamTag, totalKills: mostKills.totalKills } : undefined,
    mostBooyahsTeam: mostBooyahs ? { teamName: mostBooyahs.teamName, teamTag: mostBooyahs.teamTag, booyahs: mostBooyahs.booyahs } : undefined,
    topFragger: topFragger ? { playerName: topFragger.playerName, teamTag: topFragger.teamTag, totalKills: topFragger.totalKills } : undefined,
    highestSingleMatchScore,
    highestSingleMatchKills
  };
}