export type PlayerState = 'alive' | 'knock' | 'eliminated';
export type BroadcastMode = 'NORMAL' | 'FIRE' | 'RUSH' | 'FOCUS';

export interface BroadcastSquadTeam {
  teamId: string;
  name: string;
  tag: string;
  slotNumber: number;
  logoUrl?: string;
  kills: number;
  placement: number;
  placementPoints: number;
  killPoints: number;
  totalPoints: number;
  isBooyah: boolean;
  squadPlayers: [PlayerState, PlayerState, PlayerState, PlayerState];
  alivePlayersCount: number;
  isWiped: boolean;
  isFireActive: boolean;
  isPointRushActive: boolean;
  isFocused: boolean;
  rank: number;
}

export interface BroadcastTournamentInfo {
  id: string;
  title: string;
  organizer?: string;
  logoUrl?: string;
  organizerLogoUrl?: string;
  game: string;
  status: string;
  structure?: any;
  scoringPreset?: any;
}

export interface BroadcastMatchInfo {
  id: string;
  matchNumber: number;
  customLabel?: string;
  mapName: string;
  status: string;
}

export interface AuthoritativeBroadcastState {
  sessionId: string;
  organizationId?: string;
  tournamentId: string;
  matchId: string;
  revision: number;
  tableVisible: boolean;
  activeMode: BroadcastMode;
  pointRushEnabled: boolean;
  fireTeamIds: string[];
  pointRushTeamIds: string[];
  selectedTeamId: string | null;
  selectedPlayerIndex: number | null;
  tournament: BroadcastTournamentInfo;
  match: BroadcastMatchInfo;
  teams: BroadcastSquadTeam[];
  availableMatches: BroadcastMatchInfo[];
  aliveSquadsCount: number;
  isMatchFinished?: boolean;
  isSubmittedToWebsite?: boolean;
  eliminatedTeamOrder?: string[];
}

export type BroadcastSyncStatus = 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'DISCONNECTED';
