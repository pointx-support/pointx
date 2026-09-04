import type {
  Tournament,
  CalculatedStanding,
  MatchPerformanceSnapshot,
  PlayerLeaderboardStats,
  TournamentStatisticsSummary
} from '../types/tournament';
import type { TieBreakCriteria } from '../types/scoring';
import { calculateTeamMatchScore, normalizeScoringConfig } from './scoringEngine';

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
  if (!tournament) return [];

  const teams = Array.isArray(tournament.teams) ? tournament.teams : [];
  const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  const scoringPreset = normalizeScoringConfig(tournament.scoringPreset);
  const includeDrafts = options?.includeDrafts ?? false;

  // Filter eligible matches
  const eligibleMatches = matches
    .filter((m) => {
      if (!m) return false;
      if (!includeDrafts && m.status === 'Draft') return false;
      if (options?.matchRange?.start && m.matchNumber < options.matchRange.start) return false;
      if (options?.matchRange?.end && m.matchNumber > options.matchRange.end) return false;
      return true;
    })
    .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));

  // Initialize accumulators for all teams
  const createFreshAccumulators = () => {
    const map = new Map<string, TeamStandingAccumulator>();
    teams.forEach((t) => {
      if (!t || !t.id) return;
      map.set(t.id, {
        teamId: t.id,
        teamName: t.name || 'Unnamed Team',
        teamTag: t.tag || 'TEAM',
        teamLogo: t.logoUrl,
        slotNumber: t.slotNumber || 1,
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

    // Track teams seen in this match to prevent duplicate result corruption
    const seenTeamsInMatch = new Set<string>();

    match.results.forEach((res) => {
      if (!res || !res.teamId) return;
      if (seenTeamsInMatch.has(res.teamId)) return; // Prevent double-counting duplicate records
      seenTeamsInMatch.add(res.teamId);

      let entry = currentAccumulators.get(res.teamId);
      if (!entry) {
        // Dynamically add team if result exists for unregistered team ID
        entry = {
          teamId: res.teamId,
          teamName: res.teamId,
          teamTag: 'TEAM',
          slotNumber: currentAccumulators.size + 1,
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
        };
        currentAccumulators.set(res.teamId, entry);
      }

      // Calculate score deterministically through central scoring engine
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
        if (d.placement > 0) {
          entry.bestPlacement = Math.min(entry.bestPlacement, d.placement);
        }
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
      const seen = new Set<string>();
      match.results.forEach((res) => {
        if (!res?.teamId || seen.has(res.teamId)) return;
        seen.add(res.teamId);

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
          entry.bonusPoints += d.customBonusPoints;
          entry.penaltyPoints += d.penaltyPoints;
          entry.totalPoints += d.totalPoints;
          if (d.placement > 0) {
            entry.bestPlacement = Math.min(entry.bestPlacement, d.placement);
          }
          entry.bestMatchPoints = Math.max(entry.bestMatchPoints, d.totalPoints);
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

  // Format final standings
  return sortedCurrent.map((acc, index) => {
    const rank = index + 1;
    const previousRank = previousRanksMap.get(acc.teamId) || rank;
    const rankDelta = previousRank - rank;

    const avgPointsPerMatch = acc.matchesPlayed > 0 ? Number((acc.totalPoints / acc.matchesPlayed).toFixed(1)) : 0;
    const avgKillsPerMatch = acc.matchesPlayed > 0 ? Number((acc.totalKills / acc.matchesPlayed).toFixed(1)) : 0;

    return {
      rank,
      previousRank,
      rankDelta,
      teamId: acc.teamId,
      teamName: acc.teamName,
      teamTag: acc.teamTag,
      teamLogo: acc.teamLogo,
      slotNumber: acc.slotNumber,
      matchesPlayed: acc.matchesPlayed,
      booyahs: acc.booyahs,
      totalKills: acc.totalKills,
      placementPoints: acc.placementPoints,
      killPoints: acc.killPoints,
      bonusPoints: acc.bonusPoints,
      penaltyPoints: acc.penaltyPoints,
      totalPoints: acc.totalPoints,
      avgPointsPerMatch,
      avgKillsPerMatch,
      bestPlacement: acc.bestPlacement === 999 ? 0 : acc.bestPlacement,
      bestMatchPoints: acc.bestMatchPoints,
      matchHistory: acc.matchHistory
    };
  });
}

/**
 * Calculates MVP and Individual Player Leaderboards across tournament matches
 */
export function calculatePlayerLeaderboard(
  tournament: Tournament,
  options?: {
    matchRange?: { start?: number; end?: number };
  }
): PlayerLeaderboardStats[] {
  const { teams, matches } = tournament;
  const playerMap = new Map<string, {
    playerId: string;
    playerName: string;
    inGameId?: string;
    teamId: string;
    teamName: string;
    teamTag: string;
    totalKills: number;
    matchesPlayed: number;
    bestMatchKills: number;
    headshots?: number;
    damage?: number;
  }>();

  // Initialize registered players
  (teams || []).forEach((t) => {
    if (t && t.players) {
      t.players.forEach((p) => {
        if (!p) return;
        playerMap.set(p.id, {
          playerId: p.id,
          playerName: p.name || 'Player',
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
    }
  });

  // Accumulate player kills
  (matches || []).forEach((m) => {
    if (!m) return;
    if (options?.matchRange?.start && m.matchNumber < options.matchRange.start) return;
    if (options?.matchRange?.end && m.matchNumber > options.matchRange.end) return;

    if (m.results) {
      m.results.forEach((r) => {
        if (r && r.playerStats) {
          r.playerStats.forEach((ps) => {
            if (!ps || !ps.playerId) return;
            let player = playerMap.get(ps.playerId);
            if (!player) {
              const team = teams?.find((t) => t.id === r.teamId);
              player = {
                playerId: ps.playerId,
                playerName: ps.playerId,
                teamId: r.teamId,
                teamName: team?.name || r.teamId,
                teamTag: team?.tag || 'TEAM',
                totalKills: 0,
                matchesPlayed: 0,
                bestMatchKills: 0,
                headshots: 0,
                damage: 0
              };
              playerMap.set(ps.playerId, player);
            }
            const kills = Math.max(0, Number(ps.kills) || 0);
            player.totalKills += kills;
            player.matchesPlayed += 1;
            player.bestMatchKills = Math.max(player.bestMatchKills, kills);
            player.headshots = (player.headshots || 0) + (Number(ps.headshots) || 0);
            player.damage = (player.damage || 0) + (Number(ps.damage) || 0);
          });
        }
      });
    }
  });

  return Array.from(playerMap.values())
    .sort((a, b) => b.totalKills - a.totalKills || b.bestMatchKills - a.bestMatchKills)
    .map((p, index) => ({
      rank: index + 1,
      playerId: p.playerId,
      playerName: p.playerName,
      inGameId: p.inGameId,
      teamId: p.teamId,
      teamName: p.teamName,
      teamTag: p.teamTag,
      totalKills: p.totalKills,
      matchesPlayed: p.matchesPlayed,
      avgKills: p.matchesPlayed > 0 ? Number((p.totalKills / p.matchesPlayed).toFixed(1)) : 0,
      bestMatchKills: p.bestMatchKills,
      headshots: p.headshots,
      damage: p.damage
    }));
}

export const calculateTopFraggers = calculatePlayerLeaderboard;

/**
 * High-level tournament statistics summary (Totals, Averages, Highlights)
 */
export function calculateTournamentSummary(tournament: Tournament): TournamentStatisticsSummary {
  const standings = calculateTournamentStandings(tournament);
  const players = calculatePlayerLeaderboard(tournament);

  const completedMatches = tournament.matches?.filter((m) => m && (m.status === 'Completed' || m.status === 'Finalized')).length || 0;
  const totalMatches = tournament.matches?.length || 0;
  const totalKills = standings.reduce((sum, s) => sum + s.totalKills, 0);
  const totalBooyahs = standings.reduce((sum, s) => sum + s.booyahs, 0);
  const avgMatchKills = completedMatches > 0 ? Number((totalKills / completedMatches).toFixed(1)) : 0;

  const topScoringTeam = standings.length > 0
    ? { teamName: standings[0].teamName, teamTag: standings[0].teamTag, totalPoints: standings[0].totalPoints }
    : undefined;

  const mostKillsTeam = standings.length > 0
    ? (() => {
        const sorted = [...standings].sort((a, b) => b.totalKills - a.totalKills);
        return { teamName: sorted[0].teamName, teamTag: sorted[0].teamTag, totalKills: sorted[0].totalKills };
      })()
    : undefined;

  const mostBooyahsTeam = standings.length > 0
    ? (() => {
        const sorted = [...standings].sort((a, b) => b.booyahs - a.booyahs);
        return { teamName: sorted[0].teamName, teamTag: sorted[0].teamTag, booyahs: sorted[0].booyahs };
      })()
    : undefined;

  const topFragger = players.length > 0
    ? { playerName: players[0].playerName, teamTag: players[0].teamTag, totalKills: players[0].totalKills }
    : undefined;

  let highestSingleMatchKills: { teamName: string; matchNumber: number; kills: number } | undefined;
  (tournament.matches || [])
    .filter((m) => m && (m.status === 'Completed' || m.status === 'Finalized'))
    .forEach((m) => {
      (m.results || []).forEach((r) => {
        const kills = Number(r.kills) || 0;
        if (!highestSingleMatchKills || kills > highestSingleMatchKills.kills) {
          const team = (tournament.teams || []).find((t) => t.id === r.teamId);
          highestSingleMatchKills = {
            teamName: team?.name || r.teamId,
            matchNumber: m.matchNumber || 1,
            kills,
          };
        }
      });
    });

  return {
    totalTeams: tournament.teams?.length || 0,
    totalMatches,
    completedMatches,
    totalKills,
    totalBooyahs,
    avgMatchKills,
    topScoringTeam,
    mostKillsTeam,
    mostBooyahsTeam,
    topFragger,
    highestSingleMatchKills,
  };
}
