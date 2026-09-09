import type { Tournament } from '../types/tournament';
import type { GraphicsRenderData, GraphicsRenderOptions } from '../types/graphics';
import type {
  KillLeaderRenderData,
  TopFraggersRenderData,
  TeamPosterRenderData,
  SlotsListRenderData,
  VictoryCertificateRenderData
} from '../types/customTemplate';
import { calculateTournamentStandings, calculateTopFraggers } from './standingsEngine';
import { prepareGraphicsRenderData } from './graphicsEngine';

/**
 * 1. POINTS TABLE DATA PROVIDER
 * Full tournament standings matrix with ranks, teams, alive count, kills, and points.
 */
export function getPointsTableData(
  tournament: Tournament,
  options?: GraphicsRenderOptions
): GraphicsRenderData {
  return prepareGraphicsRenderData(tournament, 'overall-standings-legit', options);
}

/**
 * 2. KILL LEADER (WARHEADS) DATA PROVIDER
 * Dedicated single player graphic. Shows ONLY the tournament kill leader.
 * Does NOT include the 12-team points table.
 */
export function getKillLeaderData(
  tournament: Tournament,
  options?: { customTitle?: string; organizerName?: string; playerId?: string }
): KillLeaderRenderData {
  const topFraggers = calculateTopFraggers(tournament);
  const completedMatches = tournament.matches?.filter(
    (m) => m.status === 'Finalized' || m.status === 'Completed'
  ) || [];
  const matchesCount = Math.max(1, completedMatches.length || tournament.matches?.length || 1);

  let selected = topFraggers[0];
  if (options?.playerId) {
    const found = topFraggers.find((p) => p.playerId === options.playerId);
    if (found) selected = found;
  }

  // Fallback if no player stats are logged yet
  if (!selected) {
    const firstTeam = tournament.teams[0];
    const firstPlayer = firstTeam?.players?.[0];
    selected = {
      rank: 1,
      playerId: firstPlayer?.id || 'demo-leader',
      playerName: firstPlayer?.name || 'ViperX',
      teamId: firstTeam?.id || 't1',
      teamName: firstTeam?.name || 'Alpha Squad',
      teamTag: firstTeam?.tag || 'ALP',
      totalKills: 0,
      matchesPlayed: matchesCount,
      avgKills: 0,
      bestMatchKills: 0,
      headshots: 0,
      damage: 0
    };
  }

  const team = tournament.teams.find((t) => t.id === selected.teamId);
  const rosterPlayer = team?.players?.find((p) => p.id === selected.playerId);

  return {
    tournamentTitle: options?.customTitle?.trim() || tournament.title || 'FREE FIRE CHAMPIONSHIP',
    tournamentLogo: tournament.logoUrl,
    organizerName: options?.organizerName?.trim() || tournament.organizer || 'POINTX ESPORTS',
    organizerLogo: tournament.organizerLogoUrl,
    player: {
      id: selected.playerId,
      name: selected.playerName,
      avatarUrl: (selected as any).avatarUrl || rosterPlayer?.avatarUrl || (rosterPlayer as any)?.photoUrl,
      teamId: selected.teamId,
      teamName: selected.teamName || team?.name || 'Squad',
      teamTag: selected.teamTag || team?.tag || 'TM',
      teamLogo: team?.logoUrl,
      totalKills: selected.totalKills,
      damage: selected.damage || selected.totalKills * 185,
      avgKills: selected.avgKills || Number((selected.totalKills / matchesCount).toFixed(1)),
      matchesPlayed: selected.matchesPlayed || matchesCount,
      rank: 1
    }
  };
}

/**
 * 3. TOP FRAGGERS (MVP) DATA PROVIDER
 * Exactly TOP 3 players by tournament kills.
 * Gracefully handles tournaments with fewer than 3 players.
 * Does NOT include the 12-team points table.
 */
export function getTopFraggersData(
  tournament: Tournament,
  options?: { customTitle?: string; organizerName?: string }
): TopFraggersRenderData {
  const topFraggers = calculateTopFraggers(tournament);
  const completedMatches = tournament.matches?.filter(
    (m) => m.status === 'Finalized' || m.status === 'Completed'
  ) || [];
  const matchesCount = Math.max(1, completedMatches.length || tournament.matches?.length || 1);

  // Take up to 3 players
  const topThree = topFraggers.slice(0, 3);

  // If tournament has teams but no player match logs, synthesize from available rosters
  const players = (topThree.length > 0 ? topThree : tournament.teams.slice(0, 3).map((team, idx) => {
    const p = team.players?.[0];
    return {
      rank: idx + 1,
      playerId: p?.id || `player-${idx + 1}`,
      playerName: p?.name || `Player ${idx + 1}`,
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag || 'TEAM',
      totalKills: Math.max(0, 10 - idx * 3),
      matchesPlayed: matchesCount,
      avgKills: Number(((10 - idx * 3) / matchesCount).toFixed(1)),
      bestMatchKills: Math.max(0, 5 - idx),
      headshots: 2,
      damage: (10 - idx * 3) * 180
    };
  })).slice(0, 3).map((p, idx) => {
    const team = tournament.teams.find((t) => t.id === p.teamId);
    const rosterPlayer = team?.players?.find((pl) => pl.id === p.playerId);
    return {
      rank: idx + 1,
      id: p.playerId,
      name: p.playerName,
      avatarUrl: (p as any).avatarUrl || rosterPlayer?.avatarUrl || (rosterPlayer as any)?.photoUrl,
      teamId: p.teamId,
      teamName: p.teamName || team?.name || 'Squad',
      teamTag: p.teamTag || team?.tag || 'TM',
      teamLogo: team?.logoUrl,
      totalKills: p.totalKills,
      damage: p.damage || p.totalKills * 185,
      avgKills: p.avgKills
    };
  });

  return {
    tournamentTitle: options?.customTitle?.trim() || tournament.title || 'FREE FIRE CHAMPIONSHIP',
    tournamentLogo: tournament.logoUrl,
    organizerName: options?.organizerName?.trim() || tournament.organizer || 'POINTX ESPORTS',
    organizerLogo: tournament.organizerLogoUrl,
    players
  };
}

/**
 * 4. TEAM POSTER DATA PROVIDER
 * Dedicated to ONE selected team and their 4-player roster.
 * Does NOT show all tournament teams.
 */
export function getTeamPosterData(
  tournament: Tournament,
  selectedTeamId?: string,
  options?: { customTitle?: string; organizerName?: string }
): TeamPosterRenderData {
  const team =
    tournament.teams.find((t) => t.id === selectedTeamId) ||
    tournament.teams[0] || {
      id: 'team-fallback',
      name: 'Alpha Esports',
      tag: 'ALP',
      players: [
        { id: 'p1', name: 'AlphaCaptain' },
        { id: 'p2', name: 'GhostSniper' },
        { id: 'p3', name: 'NeonRusher' },
        { id: 'p4', name: 'ShadowSupport' }
      ]
    };

  const defaultRoles = [
    'CAPTAIN / IGL',
    'PRIMARY RUSHER',
    'MARKSMAN / SNIPER',
    'SUPPORT / FLANKER'
  ];

  const players = Array.from({ length: 4 }).map((_, idx) => {
    const existingPlayer = team.players?.[idx];
    return {
      id: existingPlayer?.id || `player-${idx + 1}`,
      name: existingPlayer?.name || `Player ${idx + 1}`,
      role: (existingPlayer as any)?.role || defaultRoles[idx],
      photoUrl: (existingPlayer as any)?.photoUrl || (existingPlayer as any)?.avatarUrl
    };
  });

  return {
    tournamentTitle: options?.customTitle?.trim() || tournament.title || 'FREE FIRE CHAMPIONSHIP',
    tournamentLogo: tournament.logoUrl,
    organizerName: options?.organizerName?.trim() || tournament.organizer || 'POINTX ESPORTS',
    organizerLogo: tournament.organizerLogoUrl,
    team: {
      id: team.id,
      name: team.name,
      tag: team.tag || 'TEAM',
      logoUrl: team.logoUrl,
      slogan: (team as any).slogan || 'VICTORY THROUGH SKILL',
      players
    }
  };
}

/**
 * 5. SLOTS LIST DATA PROVIDER
 * Tournament team slot matrix (Slots 1..12 or 1..N).
 * Strictly NO kills, NO points, NO alive count, NO standings.
 */
export function getSlotsListData(
  tournament: Tournament,
  options?: { customTitle?: string; organizerName?: string; totalSlots?: number }
): SlotsListRenderData {
  const slotCount = options?.totalSlots || Math.max(12, tournament.teams.length || 12);

  const slots = Array.from({ length: slotCount }).map((_, idx) => {
    const team = tournament.teams[idx];
    const slotNumber = idx + 1;
    return {
      slotNumber,
      teamId: team?.id,
      teamName: team ? team.name : `Slot ${slotNumber.toString().padStart(2, '0')} (Open)`,
      teamTag: team?.tag || '',
      logoUrl: team?.logoUrl,
      isConfirmed: Boolean(team)
    };
  });

  return {
    tournamentTitle: options?.customTitle?.trim() || tournament.title || 'FREE FIRE CHAMPIONSHIP',
    tournamentLogo: tournament.logoUrl,
    organizerName: options?.organizerName?.trim() || tournament.organizer || 'POINTX ESPORTS',
    organizerLogo: tournament.organizerLogoUrl,
    slots
  };
}

/**
 * 6. VICTORY CERTIFICATE DATA PROVIDER
 * Official certificate for ONE winner or recipient.
 * Strictly NO 12-team points table or standings list.
 */
export function getVictoryCertificateData(
  tournament: Tournament,
  winnerTeamId?: string,
  options?: {
    customTitle?: string;
    organizerName?: string;
    awardTitle?: string;
    awardSubtitle?: string;
    date?: string;
    tournamentDate?: string;
    tournamentTime?: string;
    certificateId?: string;
    signature?: string;
  }
): VictoryCertificateRenderData {
  const standings = calculateTournamentStandings(tournament);
  let winnerTeam = tournament.teams.find((t) => t.id === winnerTeamId);

  if (!winnerTeam && standings.length > 0) {
    const topStanding = standings[0];
    winnerTeam = tournament.teams.find((t) => t.id === topStanding.teamId);
  }

  if (!winnerTeam) {
    winnerTeam = tournament.teams[0] || {
      id: 'team-winner',
      name: 'Alpha Champions',
      tag: 'ALP'
    };
  }

  const certDate =
    options?.tournamentDate ||
    options?.date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const certTime = options?.tournamentTime || (tournament as any).startTime || '18:00 UTC';

  const certId =
    options?.certificateId ||
    `PTX-CERT-${tournament.id || '2026'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  return {
    tournamentTitle: options?.customTitle?.trim() || tournament.title || 'GRAND CHAMPIONSHIP FINALS',
    tournamentDate: certDate,
    tournamentTime: certTime,
    organizerName: options?.organizerName?.trim() || tournament.organizer || 'POINTX ESPORTS ARENA',
    organizerLogo: tournament.organizerLogoUrl,
    organizerSignature: options?.signature || options?.organizerName || tournament.organizer || 'Official Host',
    winner: {
      teamId: winnerTeam.id,
      teamName: winnerTeam.name,
      teamTag: winnerTeam.tag || 'TEAM',
      logoUrl: winnerTeam.logoUrl
    },
    awardTitle: options?.awardTitle?.trim() || 'CHAMPION',
    awardSubtitle: options?.awardSubtitle?.trim() || 'For Outstanding Battle Royale Performance & Tactical Supremacy',
    certificateId: certId
  };
}
