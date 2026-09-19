import { MatchReport, IMatchReport, ITeamStandingReport, IPlayerStatReport } from '../models/MatchReport';
import { Tournament } from '../models/Tournament';
import { LiveStateStore, CanonicalLiveMatchState, computeAuthoritativePlacements } from './liveStateStore';

export { computeAuthoritativePlacements };

export async function generateAndSaveMatchReport(
  liveState: CanonicalLiveMatchState,
  tournament: any,
  user?: { _id?: any; name?: string; email?: string }
): Promise<IMatchReport> {
  const tournamentId = liveState.tournamentId;
  const matchId = liveState.matchId;
  const orgId = liveState.organizationId || tournament?.organizationId?.toString() || 'org-default';

  // Find previous reports to increment version
  const latestPrev = await MatchReport.findOne({ tournamentId, matchId })
    .sort({ version: -1 })
    .lean();

  const nextVersion = latestPrev ? (latestPrev.version || 1) + 1 : 1;
  const reportId = `rep_${tournamentId}_${matchId}_v${nextVersion}_${Date.now()}`;

  // Default official Free Fire placement points scale: 12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0
  const defaultPlacementPts: Record<number, number> = {
    1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0,
  };
  const scoringPlacements = tournament?.scoringPreset?.placementPoints || defaultPlacementPts;
  const booyahBonus = tournament?.scoringPreset?.booyahBonus ?? 0;
  const killRate = tournament?.scoringPreset?.killPoints ?? 1;

  const placementMap = computeAuthoritativePlacements(liveState, scoringPlacements, booyahBonus);

  // Build sorted standings
  const teamList = Object.values(liveState.teams);
  const preparedTeams = teamList.map((team) => {
    const pInfo = placementMap.get(team.teamId);
    const placement = team.placement || pInfo?.placement || 12;
    const placementPoints = team.placementPoints !== undefined && team.placementPoints > 0 ? team.placementPoints : (pInfo?.placementPoints || 0);
    const teamKillPoints = team.killPoints !== undefined && team.killPoints > 0 ? team.killPoints : (team.kills * killRate);
    const isBooyah = team.isBooyah || pInfo?.isBooyah || placement === 1;
    const matchTotalPoints = placementPoints + teamKillPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);
    const totalPoints = matchTotalPoints;
    const priorPoints = team.priorTotalPoints || 0;
    const cumulativePoints = priorPoints + matchTotalPoints;

    return {
      ...team,
      placement,
      placementPoints,
      killPoints: teamKillPoints,
      matchPoints: matchTotalPoints,
      priorPoints,
      cumulativePoints,
      totalPoints,
      isBooyah,
    };
  });

  const sortedTeams = [...preparedTeams].sort((a, b) => {
    if (a.placement !== b.placement) return a.placement - b.placement;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return (a.slotNumber || 0) - (b.slotNumber || 0);
  });

  const standings: (ITeamStandingReport & { matchPoints?: number; priorPoints?: number; cumulativePoints?: number })[] = sortedTeams.map((team, idx) => ({
    rank: idx + 1,
    teamId: team.teamId,
    teamName: team.name || `Team ${team.slotNumber || idx + 1}`,
    teamTag: team.tag || `T${team.slotNumber || idx + 1}`,
    slotNumber: team.slotNumber || idx + 1,
    logoUrl: team.logoUrl || '',
    placement: team.placement || idx + 1,
    kills: team.kills,
    placementPoints: team.placementPoints,
    killPoints: team.killPoints,
    bonusPoints: team.bonusPoints || 0,
    penaltyPoints: team.penaltyPoints || 0,
    matchPoints: (team as any).matchPoints ?? team.totalPoints,
    priorPoints: (team as any).priorPoints ?? 0,
    cumulativePoints: (team as any).cumulativePoints ?? team.totalPoints,
    totalPoints: team.totalPoints,
    isBooyah: idx === 0,
  }));

  // Build player stats
  const playerStats: IPlayerStatReport[] = [];
  for (const team of sortedTeams) {
    if (team.players) {
      for (const [pId, pStatus] of Object.entries(team.players)) {
        playerStats.push({
          playerId: pId,
          playerName: pId.split('-').pop() || pId,
          teamId: team.teamId,
          teamName: team.name || `Team ${team.slotNumber || 1}`,
          kills: 0, // In standard live scoring, team kills are tracked; player kills are recorded if individual
          status: pStatus.status,
        });
      }
    }
  }

  // Calculate summary metrics
  const totalEliminations = standings.reduce((acc, t) => acc + t.kills, 0);
  const totalPoints = standings.reduce((acc, t) => acc + t.totalPoints, 0);

  const winningTeam = standings.find((t) => t.isBooyah || t.placement === 1) || standings[0] || {
    teamId: '',
    teamName: 'Unknown',
    kills: 0,
    totalPoints: 0,
  };

  const killLeaderTeam = [...standings].sort((a, b) => b.kills - a.kills)[0] || standings[0] || {
    teamId: '',
    teamName: 'Unknown',
    kills: 0,
  };

  const currentMatch = Array.isArray(tournament?.matches)
    ? tournament.matches.find((m: any) => (m.id || m.customId) === matchId)
    : null;

  const matchTitle = currentMatch?.customLabel || `Match ${liveState.matchNumber || 1}`;
  const mapName = currentMatch?.mapName || 'Bermuda';

  const report = new MatchReport({
    reportId,
    tournamentId,
    matchId,
    organizationId: orgId,
    matchNumber: liveState.matchNumber || 1,
    matchTitle,
    mapName,
    game: tournament?.game || 'Free Fire',
    finalizedAt: new Date(),
    finalizedBy: user?.name || user?.email || 'Tournament Admin',
    version: nextVersion,
    standings,
    playerStats,
    summary: {
      totalEliminations,
      totalPoints,
      winningTeam: {
        teamId: winningTeam.teamId,
        name: winningTeam.teamName,
        kills: winningTeam.kills,
        totalPoints: winningTeam.totalPoints,
      },
      killLeader: {
        teamId: killLeaderTeam.teamId,
        teamName: killLeaderTeam.teamName,
        kills: killLeaderTeam.kills,
      },
      totalTeams: standings.length,
    },
  });

  await report.save();
  return report;
}

export async function getMatchReport(
  tournamentId: string,
  matchId: string,
  version?: number
): Promise<IMatchReport | null> {
  const numMatch = matchId.match(/match.*?(\d+)/i) || matchId.match(/^m(\d+)$/i);
  const parsedNum = numMatch ? parseInt(numMatch[1], 10) : null;

  const matchConditions: any[] = [{ matchId }];
  if (parsedNum !== null) {
    matchConditions.push({ matchNumber: parsedNum });
    matchConditions.push({ matchId: `live-match-${parsedNum}` });
  }

  const query: any = {
    tournamentId,
    $or: matchConditions,
  };
  if (version && version > 0) {
    query.version = version;
  }
  return await MatchReport.findOne(query).sort({ version: -1 });
}

export async function getAllMatchReportsForTournament(
  tournamentId: string
): Promise<IMatchReport[]> {
  return await MatchReport.find({ tournamentId }).sort({ matchNumber: 1, version: -1 });
}

export function formatMatchReportCsv(report: IMatchReport): string {
  const lines: string[] = [];
  lines.push(`POINTX TOURNAMENT MATCH REPORT`);
  lines.push(`Tournament ID:,${report.tournamentId}`);
  lines.push(`Match:,${report.matchTitle} (Match ${report.matchNumber})`);
  lines.push(`Map:,${report.mapName}`);
  lines.push(`Game:,${report.game}`);
  lines.push(`Finalized At:,${report.finalizedAt.toISOString()}`);
  lines.push(`Finalized By:,${report.finalizedBy}`);
  lines.push(`Report Version:,${report.version}`);
  lines.push(``);

  lines.push(`STANDINGS`);
  lines.push(`Rank,Slot,Team,Tag,Placement,Elims,Placement Pts,Kill Pts,Bonus,Penalty,Total Pts,Booyah`);
  for (const s of report.standings) {
    lines.push(
      `${s.rank},${s.slotNumber},"${s.teamName.replace(/"/g, '""')}","${s.teamTag}",${s.placement},${s.kills},${s.placementPoints},${s.killPoints},${s.bonusPoints},${s.penaltyPoints},${s.totalPoints},${s.isBooyah ? 'YES' : 'NO'}`
    );
  }
  lines.push(``);

  lines.push(`SUMMARY`);
  lines.push(`Winning Team:,${report.summary.winningTeam.name}`);
  lines.push(`Total Eliminations:,${report.summary.totalEliminations}`);
  lines.push(`Total Points Awarded:,${report.summary.totalPoints}`);
  lines.push(`Kill Leader Team:,${report.summary.killLeader.teamName} (${report.summary.killLeader.kills} elims)`);
  lines.push(`Total Teams:,${report.summary.totalTeams}`);

  return lines.join('\n');
}

/**
 * Generate a transient preview of the match report directly from live state (without requiring prior DB finalization)
 */
export async function generateMatchReportPreview(
  tournamentId: string,
  matchId: string
): Promise<IMatchReport | null> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }
  const tour = await Tournament.findOne({ $or: idQueries }).lean();
  const orgId = tour?.organizationId ? String(tour.organizationId) : 'org-default';

  const liveState = await LiveStateStore.getInstance().getOrCreateLiveState(orgId, tournamentId, matchId);
  if (!liveState || Object.keys(liveState.teams).length === 0) {
    return null;
  }

  // Generate the report object without persisting it to the database
  const defaultPlacementPts: Record<number, number> = {
    1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0,
  };
  const scoringPlacements: any = tour?.scoringPreset?.placementPoints || defaultPlacementPts;
  const booyahBonus = tour?.scoringPreset?.booyahBonus ?? 0;
  const killRate = tour?.scoringPreset?.killPoints ?? 1;

  const placementMap = computeAuthoritativePlacements(liveState, scoringPlacements, booyahBonus);

  const teamList = Object.values(liveState.teams);
  const preparedTeams = teamList.map((team) => {
    const pInfo = placementMap.get(team.teamId);
    const placement = team.placement || pInfo?.placement || 12;
    const placementPoints = team.placementPoints !== undefined && team.placementPoints > 0 ? team.placementPoints : (pInfo?.placementPoints || 0);
    const teamKillPoints = team.killPoints !== undefined && team.killPoints > 0 ? team.killPoints : (team.kills * killRate);
    const isBooyah = team.isBooyah || pInfo?.isBooyah || placement === 1;
    const matchTotalPoints = placementPoints + teamKillPoints + (team.bonusPoints || 0) - (team.penaltyPoints || 0);
    const totalPoints = matchTotalPoints;
    const priorPoints = team.priorTotalPoints || 0;
    const cumulativePoints = priorPoints + matchTotalPoints;

    return {
      ...team,
      placement,
      placementPoints,
      killPoints: teamKillPoints,
      matchPoints: matchTotalPoints,
      priorPoints,
      cumulativePoints,
      totalPoints,
      isBooyah,
    };
  });

  const sortedTeams = [...preparedTeams].sort((a, b) => {
    if (a.placement !== b.placement) return a.placement - b.placement;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return (a.slotNumber || 0) - (b.slotNumber || 0);
  });

  const standings: (ITeamStandingReport & { matchPoints?: number; priorPoints?: number; cumulativePoints?: number })[] = sortedTeams.map((team, idx) => ({
    rank: idx + 1,
    teamId: team.teamId,
    teamName: team.name || `Team ${team.slotNumber || idx + 1}`,
    teamTag: team.tag || `T${team.slotNumber || idx + 1}`,
    slotNumber: team.slotNumber || idx + 1,
    logoUrl: team.logoUrl || '',
    placement: team.placement || idx + 1,
    kills: team.kills,
    placementPoints: team.placementPoints,
    killPoints: team.killPoints,
    bonusPoints: team.bonusPoints || 0,
    penaltyPoints: team.penaltyPoints || 0,
    matchPoints: (team as any).matchPoints ?? team.totalPoints,
    priorPoints: (team as any).priorPoints ?? 0,
    cumulativePoints: (team as any).cumulativePoints ?? team.totalPoints,
    totalPoints: team.totalPoints,
    isBooyah: idx === 0,
  }));

  const totalEliminations = standings.reduce((acc, t) => acc + t.kills, 0);
  const totalPoints = standings.reduce((acc, t) => acc + t.totalPoints, 0);

  const winningTeam = standings.find((t) => t.isBooyah || t.placement === 1) || standings[0] || {
    teamId: '',
    name: 'Unknown',
    kills: 0,
    totalPoints: 0,
  };

  const killLeaderTeam = [...standings].sort((a, b) => b.kills - a.kills)[0] || standings[0] || {
    teamId: '',
    name: 'Unknown',
    kills: 0,
  };

  const currentMatch = Array.isArray(tour?.matches)
    ? tour.matches.find((m: any) => (m.id || m.customId) === matchId)
    : null;

  const matchTitle = currentMatch?.customLabel || `Match ${liveState.matchNumber || 1}`;
  const mapName = currentMatch?.mapName || 'Bermuda';

  const previewReport: any = {
    reportId: `preview_${tournamentId}_${matchId}_${Date.now()}`,
    tournamentId,
    matchId,
    organizationId: orgId,
    matchNumber: liveState.matchNumber || 1,
    matchTitle,
    mapName,
    game: tour?.game || 'Free Fire',
    finalizedAt: new Date(),
    finalizedBy: 'Live Match Controller',
    version: 1,
    standings,
    playerStats: [],
    summary: {
      totalEliminations,
      totalPoints,
      winningTeam: {
        teamId: winningTeam.teamId,
        name: (winningTeam as any).teamName || (winningTeam as any).name || 'Unknown',
        kills: winningTeam.kills,
        totalPoints: winningTeam.totalPoints,
      },
      killLeader: {
        teamId: killLeaderTeam.teamId,
        teamName: (killLeaderTeam as any).teamName || (killLeaderTeam as any).name || 'Unknown',
        kills: killLeaderTeam.kills,
      },
      totalTeams: standings.length,
    },
  };

  return previewReport;
}

/**
 * Publish the verified match report directly into the tournament on the website / database
 */
export async function publishMatchReport(
  tournamentId: string,
  matchId: string,
  user?: { _id?: any; name?: string; email?: string },
  customResults?: any[],
  customMapName?: string
): Promise<{ success: boolean; match: any; report: any; message?: string }> {
  const idQueries: any[] = [{ customId: tournamentId }];
  if (tournamentId.match(/^[0-9a-fA-F]{24}$/)) {
    idQueries.push({ _id: tournamentId });
  }

  const tour = await Tournament.findOne({ $or: idQueries });
  if (!tour) {
    throw new Error(`Tournament "${tournamentId}" not found`);
  }

  const orgId = tour.organizationId ? String(tour.organizationId) : 'org-default';
  const liveState = await LiveStateStore.getInstance().getOrCreateLiveState(orgId, tournamentId, matchId);

  // Generate and save official immutable MatchReport record
  const report = await generateAndSaveMatchReport(liveState, tour, user);
  if (customMapName) {
    report.mapName = customMapName;
    await (report as any).save?.().catch(() => {});
  }

  if (!Array.isArray(tour.matches)) tour.matches = [];

  let parsedMatchNum: number | null = null;
  if (typeof matchId === 'string') {
    const numMatch = matchId.match(/match.*?(\d+)/i) || matchId.match(/^m(\d+)$/i);
    if (numMatch) {
      parsedMatchNum = parseInt(numMatch[1], 10);
    }
  }
  const targetMatchNum = liveState.matchNumber || parsedMatchNum;

  // Search existing match by ID OR by matchNumber
  let match = tour.matches.find((m: any) =>
    (m.id || m.customId) === matchId ||
    (targetMatchNum && m.matchNumber === targetMatchNum)
  );
  const matchNumber = match?.matchNumber || targetMatchNum || (tour.matches.length + 1);

  let booyahAlreadySet = false;
  const results = (Array.isArray(customResults) && customResults.length > 0)
    ? customResults.map((s, idx) => {
        const isBooyah = (s.isBooyah === true || s.placement === 1) && !booyahAlreadySet;
        if (isBooyah) booyahAlreadySet = true;
        const pPts = s.placementPoints !== undefined ? Number(s.placementPoints) : 0;
        const kPts = s.killPoints !== undefined ? Number(s.killPoints) : (Number(s.kills) || 0);
        const bPts = Number(s.bonusPoints) || 0;
        const penPts = Number(s.penaltyPoints) || 0;
        // Total points of a match result must ALWAYS be strictly for this match (never cumulative)
        const matchTotalPoints = pPts + kPts + bPts - penPts;
        return {
          teamId: s.teamId,
          placement: s.placement || idx + 1,
          kills: Number(s.kills) || 0,
          placementPoints: pPts,
          killPoints: kPts,
          totalPoints: matchTotalPoints,
          isBooyah,
          bonusPoints: bPts,
          penaltyPoints: penPts,
        };
      })
    : report.standings.map((s, idx) => ({
        teamId: s.teamId,
        placement: s.placement,
        kills: s.kills,
        placementPoints: s.placementPoints,
        killPoints: s.killPoints,
        totalPoints: (s.placementPoints || 0) + (s.killPoints || 0) + (s.bonusPoints || 0) - (s.penaltyPoints || 0),
        isBooyah: idx === 0,
        bonusPoints: s.bonusPoints,
        penaltyPoints: s.penaltyPoints,
      }));

  if (match) {
    match.status = 'Completed';
    match.results = results;
    if (customMapName) {
      match.mapName = customMapName;
    } else if (report.mapName) {
      match.mapName = report.mapName;
    }
    match.updatedAt = new Date().toISOString();
  } else {
    const generatedId = matchId.startsWith('live-match-')
      ? `match-${tour.customId || tour.id || tournamentId}-${matchNumber}-${Date.now().toString(36)}`
      : matchId;
    match = {
      id: generatedId,
      customId: generatedId,
      tournamentId: tour.customId || tournamentId,
      matchNumber,
      customLabel: report.matchTitle || `Match ${String(matchNumber).padStart(2, '0')}`,
      mapName: customMapName || report.mapName || 'Bermuda',
      status: 'Completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scoringConfigId: tour.scoringPreset?.id || 'preset-ff-official-v1',
      scoringVersion: tour.scoringPreset?.version || 1,
      results,
    };
    tour.matches.push(match);
  }

  // Deduplicate matches so that NO two matches can ever share the same matchNumber
  const seenNumbers = new Set<number>();
  const deduplicatedMatches: any[] = [];
  for (const m of tour.matches) {
    if (!m) continue;
    const mNum = m.matchNumber;
    if (mNum === matchNumber && m !== match) {
      // Drop any old duplicate of this same matchNumber
      continue;
    }
    if (mNum !== undefined && mNum !== null) {
      if (seenNumbers.has(mNum)) continue;
      seenNumbers.add(mNum);
    }
    deduplicatedMatches.push(m);
  }
  tour.matches = deduplicatedMatches.sort((a: any, b: any) => (a.matchNumber || 0) - (b.matchNumber || 0));

  tour.status = 'Live';
  await Tournament.updateOne({ $or: idQueries }, { $set: { matches: tour.matches, status: 'Live' } });

  // Update LiveStateStore in memory so any immediate reads of this match return completed state with Booyah team alive
  try {
    const eliminationOrder: string[] = [];
    const eliminated = results
      .filter((r: any) => !r.isBooyah && r.placement > 1)
      .sort((a: any, b: any) => (b.placement || 12) - (a.placement || 12));
    for (const r of eliminated) {
      if (r.teamId) eliminationOrder.push(r.teamId);
    }

    for (const [teamId, teamState] of Object.entries(liveState.teams)) {
      const res = results.find((r: any) => r.teamId === teamId);
      if (res) {
        teamState.kills = res.kills;
        teamState.placement = res.placement;
        teamState.placementPoints = res.placementPoints;
        teamState.killPoints = res.killPoints;
        teamState.isBooyah = Boolean(res.isBooyah || res.placement === 1);
        teamState.points = (teamState.priorTotalPoints || 0) + res.totalPoints;
        const playerStatus: any = teamState.isBooyah ? 'alive' : 'eliminated';
        if (teamState.players) {
          for (const p of Object.values(teamState.players)) {
            p.status = playerStatus;
            p.updatedAt = Date.now();
          }
        }
      }
    }
    liveState.eliminationOrder = eliminationOrder;
    liveState.isMatchFinished = true;
    liveState.revision += 1;
    liveState.updatedAt = Date.now();

    const lStore = LiveStateStore.getInstance();
    const k1 = lStore.getKey(orgId, tournamentId, matchId);
    const k2 = lStore.getKey(orgId, tour.customId || tournamentId, matchId);
    (lStore as any).inMemoryStore?.set(k1, liveState);
    (lStore as any).inMemoryStore?.set(k2, liveState);
    if (match.id && match.id !== matchId) {
      const k3 = lStore.getKey(orgId, tournamentId, match.id);
      const k4 = lStore.getKey(orgId, tour.customId || tournamentId, match.id);
      (lStore as any).inMemoryStore?.set(k3, liveState);
      (lStore as any).inMemoryStore?.set(k4, liveState);
    }
    // Update and link priorTotalPoints for all future matches in memory
    LiveStateStore.getInstance().onMatchPublished(tournamentId, matchNumber, tour).catch(() => {});
  } catch {}

  // Broadcast update to all rooms with properly formatted JSON
  try {
    const { getRoomAliases, broadcastToRooms, updateAuthoritativeState } = require('./realtimeSync');
    const tourJson: any = tour.toJSON ? tour.toJSON() : {
      ...(tour.toObject ? tour.toObject() : tour),
      id: tour.customId || (tour._id ? tour._id.toString() : tournamentId),
      matches: tour.matches,
    };
    if (!tourJson.id) {
      tourJson.id = tour.customId || (tour._id ? tour._id.toString() : tournamentId);
    }
    await updateAuthoritativeState(tournamentId, { tournament: tourJson });
    const aliasRooms = getRoomAliases(tournamentId, tour);
    broadcastToRooms(aliasRooms, {
      type: 'TOURNAMENT_UPDATED',
      tournamentId,
      tournament: tourJson,
      data: tourJson,
      timestamp: Date.now(),
    });
  } catch {}

  return {
    success: true,
    match,
    report,
  };
}
