import { MatchReport, IMatchReport, ITeamStandingReport, IPlayerStatReport } from '../models/MatchReport';
import { CanonicalLiveMatchState } from './liveStateStore';

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

  // Build sorted standings
  const teamList = Object.values(liveState.teams);
  const sortedTeams = [...teamList].sort((a, b) => {
    const placeA = a.placement || 999;
    const placeB = b.placement || 999;
    if (placeA !== placeB) return placeA - placeB;
    if (b.points !== a.points) return b.points - a.points;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return (a.slotNumber || 0) - (b.slotNumber || 0);
  });

  const standings: ITeamStandingReport[] = sortedTeams.map((team, idx) => ({
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
    totalPoints: team.points,
    isBooyah: team.isBooyah || team.placement === 1,
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
  const query: any = { tournamentId, matchId };
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
