import { create } from 'zustand';
import type { GlobalTeam, GlobalPlayer } from '../types/team';

export interface TeamStoreState {
  globalTeams: GlobalTeam[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  createGlobalTeam: (team: Omit<GlobalTeam, 'id' | 'createdAt' | 'updatedAt'>) => GlobalTeam;
  updateGlobalTeam: (id: string, updates: Partial<GlobalTeam>) => void;
  deleteGlobalTeam: (id: string) => void;
  addGlobalPlayer: (teamId: string, player: Omit<GlobalPlayer, 'id' | 'createdAt' | 'updatedAt' | 'teamId'>) => GlobalPlayer;
  updateGlobalPlayer: (teamId: string, playerId: string, updates: Partial<GlobalPlayer>) => void;
  deleteGlobalPlayer: (teamId: string, playerId: string) => void;
  searchGlobalTeams: (query: string) => GlobalTeam[];
  findDuplicateTeam: (name: string, tag: string, excludeId?: string) => GlobalTeam | undefined;
}

const SEED_GLOBAL_TEAMS: GlobalTeam[] = [
  {
    id: 'gt-total-gaming',
    name: 'Total Gaming Esports',
    tag: 'TG',
    status: 'Active',
    captainName: 'Mafia',
    contactEmail: 'contact@totalgaming.in',
    players: [
      { id: 'gp-tg-1', name: 'Mafia', inGameId: 'TG_Mafia', uid: '184920491', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-tg-2', name: 'FozyAjay', inGameId: 'TG_Fozy', uid: '920481923', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-tg-3', name: 'Delete', inGameId: 'TG_Delete', uid: '849102948', isCaptain: false, role: 'Sniper', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-tg-4', name: 'Java', inGameId: 'TG_Java', uid: '481902849', isCaptain: false, role: 'Support', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-team-elite',
    name: 'Team Elite',
    tag: 'TE',
    status: 'Active',
    captainName: 'Killer',
    contactEmail: 'mgmt@teamelite.gg',
    players: [
      { id: 'gp-te-1', name: 'Killer', inGameId: 'TE_Killer', uid: '839201948', isCaptain: true, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-te-2', name: 'Pahari', inGameId: 'TE_Pahari', uid: '394829104', isCaptain: false, role: 'Sniper', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-te-3', name: 'RDP', inGameId: 'TE_RDP', uid: '592019482', isCaptain: false, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-te-4', name: 'Iconic', inGameId: 'TE_Iconic', uid: '920184920', isCaptain: false, role: 'Support', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-orangutan',
    name: 'Orangutan Elite',
    tag: 'OG',
    status: 'Active',
    captainName: 'Jash',
    players: [
      { id: 'gp-og-1', name: 'Jash', inGameId: 'OG_Jash', uid: '482019482', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-og-2', name: 'MrJayYT', inGameId: 'OG_Jay', uid: '839201840', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-og-3', name: 'Lokesh', inGameId: 'OG_Lokesh', uid: '192049182', isCaptain: false, role: 'Support', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-og-4', name: 'Viper', inGameId: 'OG_Viper', uid: '394810294', isCaptain: false, role: 'Sniper', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-godlike',
    name: 'GodLike Esports',
    tag: 'GODL',
    status: 'Active',
    captainName: 'Niku',
    players: [
      { id: 'gp-gl-1', name: 'Niku', inGameId: 'GL_Niku', uid: '592019482', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-gl-2', name: 'Ginotra', inGameId: 'GL_Ginotra', uid: '294819204', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-gl-3', name: 'Pawan', inGameId: 'GL_Pawan', uid: '839201948', isCaptain: false, role: 'Sniper', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-gl-4', name: 'Aman', inGameId: 'GL_Aman', uid: '194820194', isCaptain: false, role: 'Support', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-blind',
    name: 'Blind Esports',
    tag: 'BLIND',
    status: 'Active',
    captainName: 'Abhay',
    players: [
      { id: 'gp-bl-1', name: 'Abhay', inGameId: 'BL_Abhay', uid: '492019482', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-bl-2', name: 'Max', inGameId: 'BL_Max', uid: '849201948', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-revenant',
    name: 'Revenant Esports',
    tag: 'RNT',
    status: 'Active',
    captainName: 'Aayush',
    players: [
      { id: 'gp-rnt-1', name: 'Aayush', inGameId: 'RNT_Aayush', uid: '948201948', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-rnt-2', name: 'Bapun', inGameId: 'RNT_Bapun', uid: '194820194', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-chemin',
    name: 'Chemin Esports',
    tag: 'CHM',
    status: 'Active',
    captainName: 'Swastik',
    players: [
      { id: 'gp-chm-1', name: 'Swastik', inGameId: 'CHM_Swastik', uid: '849201948', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-chm-2', name: 'Radhe', inGameId: 'CHM_Radhe', uid: '394820194', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-tsm',
    name: 'TSM FTX India',
    tag: 'TSM',
    status: 'Active',
    captainName: 'OldMonk',
    players: [
      { id: 'gp-tsm-1', name: 'OldMonk', inGameId: 'TSM_Monk', uid: '592019482', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-tsm-2', name: 'Mr1', inGameId: 'TSM_Mr1', uid: '294819204', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-nigma',
    name: 'Nigma Galaxy',
    tag: 'NGX',
    status: 'Active',
    captainName: 'VasiyoCRJ7',
    players: [
      { id: 'gp-ngx-1', name: 'VasiyoCRJ7', inGameId: 'NGX_Vasiyo', uid: '948201948', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-ngx-2', name: 'Tahil', inGameId: 'NGX_Tahil', uid: '194820194', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-desi-gamers',
    name: 'Desi Gamers Esports',
    tag: 'DG',
    status: 'Active',
    captainName: 'AmitBhai',
    players: [
      { id: 'gp-dg-1', name: 'AmitBhai', inGameId: 'DG_Amit', uid: '849201948', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 'gp-dg-2', name: 'Survival', inGameId: 'DG_Survival', uid: '394820194', isCaptain: false, role: 'Rusher', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-head-hunters',
    name: 'Head Hunters',
    tag: 'HH',
    status: 'Active',
    captainName: 'Aasif',
    players: [
      { id: 'gp-hh-1', name: 'Aasif', inGameId: 'HH_Aasif', uid: '592019482', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  },
  {
    id: 'gt-enigma',
    name: 'Enigma Gaming',
    tag: 'EG',
    status: 'Active',
    captainName: 'RadheThakur',
    players: [
      { id: 'gp-eg-1', name: 'RadheThakur', inGameId: 'EG_Radhe', uid: '294819204', isCaptain: true, role: 'IGL', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z'
  }
];

export const useTeamStore = create<TeamStoreState>((set, get) => ({
  globalTeams: SEED_GLOBAL_TEAMS,
  selectedTeamId: null,

  setSelectedTeamId: (id) => set({ selectedTeamId: id }),

  createGlobalTeam: (teamData) => {
    const id = `gt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newTeam: GlobalTeam = {
      ...teamData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({ globalTeams: [newTeam, ...state.globalTeams] }));
    return newTeam;
  },

  updateGlobalTeam: (id, updates) => {
    set((state) => ({
      globalTeams: state.globalTeams.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    }));
  },

  deleteGlobalTeam: (id) => {
    set((state) => ({
      globalTeams: state.globalTeams.filter((t) => t.id !== id)
    }));
  },

  addGlobalPlayer: (teamId, playerData) => {
    const playerId = `gp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newPlayer: GlobalPlayer = {
      ...playerData,
      id: playerId,
      teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      globalTeams: state.globalTeams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            players: [...team.players, newPlayer],
            updatedAt: new Date().toISOString()
          };
        }
        return team;
      })
    }));

    return newPlayer;
  },

  updateGlobalPlayer: (teamId, playerId, updates) => {
    set((state) => ({
      globalTeams: state.globalTeams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.map((p) =>
              p.id === playerId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return team;
      })
    }));
  },

  deleteGlobalPlayer: (teamId, playerId) => {
    set((state) => ({
      globalTeams: state.globalTeams.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.filter((p) => p.id !== playerId),
            updatedAt: new Date().toISOString()
          };
        }
        return team;
      })
    }));
  },

  searchGlobalTeams: (query) => {
    if (!query.trim()) return get().globalTeams;
    const lower = query.toLowerCase().trim();
    return get().globalTeams.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.tag.toLowerCase().includes(lower) ||
        t.players.some(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.inGameId?.toLowerCase().includes(lower) ||
            p.uid?.includes(lower)
        )
    );
  },

  findDuplicateTeam: (name, tag, excludeId) => {
    const lowerName = name.toLowerCase().trim();
    const lowerTag = tag.toLowerCase().trim();
    return get().globalTeams.find(
      (t) =>
        t.id !== excludeId &&
        (t.name.toLowerCase().trim() === lowerName || t.tag.toLowerCase().trim() === lowerTag)
    );
  }
}));
