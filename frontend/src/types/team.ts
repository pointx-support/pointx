// Team & Player Domain Types

export interface GlobalPlayer {
  id: string;
  name: string;
  inGameId?: string;
  uid?: string; // Free Fire Player Numeric UID
  avatarUrl?: string;
  teamId?: string;
  isCaptain?: boolean;
  role?: 'Rusher' | 'Sniper' | 'IGL' | 'Support' | 'All-Rounder';
  createdAt: string;
  updatedAt: string;
}

export interface GlobalTeam {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  bannerUrl?: string;
  captainName?: string;
  captainId?: string;
  players: GlobalPlayer[];
  status: 'Active' | 'Inactive';
  contactEmail?: string;
  discordId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentTeamSlot {
  tournamentId: string;
  slotNumber: number;
  teamId: string; // References GlobalTeam ID
  customName?: string; // In case of special tournament tag
  customTag?: string;
  players: GlobalPlayer[];
  captainName?: string;
  status: 'Confirmed' | 'Pending' | 'Disqualified';
  notes?: string;
}
