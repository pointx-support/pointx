import { create } from 'zustand';
import type {
  Tournament,
  Team,
  Match,
  MatchStatus,
  ScoringPreset,
  CalculatedStanding,
  PlayerLeaderboardStats,
  TournamentStatisticsSummary,
  CloneTournamentOptions,
  TeamMatchResult
} from '../types/tournament';
import type { RawMatchTeamResult } from '../types/scoring';
import { DEFAULT_FREE_FIRE_SCORING, calculateTeamMatchScore, normalizeScoringConfig, getPlacementPoints } from '../engine/scoringEngine';
import {
  calculateTournamentStandings,
  calculateTopFraggers,
  calculateTournamentSummary
} from '../engine/standingsEngine';
import { broadcastTournamentUpdate } from '../services/broadcastSync';
import { tournamentsApi, adminApi } from '../services/api';

export interface AppState {
  tournaments: Tournament[];
  activeTournamentId: string;
  currentTournament: Tournament;
  isLoadingTournaments: boolean;
  hasLoadedFromDatabase: boolean;
  activeTab: 'overview' | 'matches' | 'teams' | 'players' | 'global-teams' | 'standings' | 'statistics' | 'graphics' | 'broadcast' | 'scoring' | 'settings' | 'account' | 'organization' | 'template-studio';
  previousTab: 'overview' | 'matches' | 'teams' | 'players' | 'global-teams' | 'standings' | 'statistics' | 'graphics' | 'broadcast' | 'scoring' | 'settings' | 'account' | 'organization' | 'template-studio' | null;
  activeGraphicsCategory: 'standings' | 'warheads' | 'fraggers' | 'team-poster' | 'slots-list' | 'certificate';
  setActiveTab: (tab: AppState['activeTab']) => void;
  setActiveGraphicsCategory: (category: AppState['activeGraphicsCategory']) => void;
  goBackTab: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  highlightDashboardAction: boolean;
  triggerDashboardHighlight: () => void;
  isCreateMatchModalOpen: boolean;
  setCreateMatchModalOpen: (open: boolean) => void;
  setCurrentTournamentId: (id: string) => void;
  fetchTournaments: () => Promise<void>;
  createTournament: (tournament: Tournament) => Promise<Tournament>;
  updateTournament: (tournamentId: string, data: Partial<Tournament>) => Promise<void>;
  cloneTournament: (sourceId: string, options: CloneTournamentOptions) => Promise<Tournament>;
  importTournaments: (incoming: Tournament[]) => Promise<number>;
  archiveTournament: (tournamentId: string) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  adminDemoEnabled: boolean;
  isLoadingDemoSetting: boolean;
  fetchAdminDemoSetting: () => Promise<boolean>;
  setAdminDemoEnabled: (enabled: boolean) => Promise<void>;
  loadDemoTournaments: () => void;
  clearAllTournaments: () => void;
  sanitizeTournamentsForRole: (role?: string) => void;
  
  // Active Tournament Shortcuts
  setTournament: (tournament: Tournament) => void;
  clearActiveTournament: () => void;
  updateScoringPreset: (preset: ScoringPreset) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, team: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  
  // Match Management Methods
  createMatch: (tournamentId: string, mapName: string, customLabel?: string) => Match;
  updateMatch: (matchId: string, match: Partial<Match>) => void;
  updateMatchResults: (tournamentId: string, matchId: string, rawResults: RawMatchTeamResult[], status?: MatchStatus, customLabel?: string, mapName?: string) => void;
  finalizeMatch: (tournamentId: string, matchId: string) => { success: boolean; errors?: string[] };
  unfinalizeMatch: (tournamentId: string, matchId: string) => void;
  deleteMatch: (matchId: string) => void;
  
  // Standings & Statistics
  getStandings: (options?: { matchRange?: { start?: number; end?: number }; includeDrafts?: boolean }) => CalculatedStanding[];
  getTopFraggers: (options?: { matchRange?: { start?: number; end?: number } }) => PlayerLeaderboardStats[];
  getTournamentSummary: () => TournamentStatisticsSummary;
  autofillKnownTeams: () => Team[];
}

export const SEED_TEAMS: Team[] = [
  { id: 't1', name: 'Total Gaming Esports', tag: 'TG', slotNumber: 1, players: [{ id: 'p1', name: 'Mafia', inGameId: 'TG_Mafia' }, { id: 'p2', name: 'FozyAjay', inGameId: 'TG_Fozy' }] },
  { id: 't2', name: 'Team Elite', tag: 'TE', slotNumber: 2, players: [{ id: 'p3', name: 'Killer', inGameId: 'TE_Killer' }, { id: 'p4', name: 'Pahari', inGameId: 'TE_Pahari' }] },
  { id: 't3', name: 'Orangutan Elite', tag: 'OG', slotNumber: 3, players: [{ id: 'p5', name: 'Jash', inGameId: 'OG_Jash' }, { id: 'p6', name: 'MrJayYT', inGameId: 'OG_Jay' }] },
  { id: 't4', name: 'GodLike Esports', tag: 'GODL', slotNumber: 4, players: [{ id: 'p7', name: 'Niku', inGameId: 'GL_Niku' }, { id: 'p8', name: 'Ginotra', inGameId: 'GL_Ginotra' }] },
  { id: 't5', name: 'Blind Esports', tag: 'BLIND', slotNumber: 5, players: [{ id: 'p9', name: 'Abhay', inGameId: 'BL_Abhay' }] },
  { id: 't6', name: 'Revenant Esports', tag: 'RNT', slotNumber: 6, players: [{ id: 'p10', name: 'Aayush', inGameId: 'RNT_Aayush' }] },
  { id: 't7', name: 'Chemin Esports', tag: 'CHM', slotNumber: 7, players: [{ id: 'p11', name: 'Swastik', inGameId: 'CHM_Swastik' }] },
  { id: 't8', name: 'TSM FTX India', tag: 'TSM', slotNumber: 8, players: [{ id: 'p12', name: 'OldMonk', inGameId: 'TSM_Monk' }] },
  { id: 't9', name: 'Nigma Galaxy', tag: 'NGX', slotNumber: 9, players: [{ id: 'p13', name: 'VasiyoCRJ7', inGameId: 'NGX_Vasiyo' }] },
  { id: 't10', name: 'Desi Gamers Esports', tag: 'DG', slotNumber: 10, players: [{ id: 'p14', name: 'AmitBhai', inGameId: 'DG_Amit' }] },
  { id: 't11', name: 'Head Hunters', tag: 'HH', slotNumber: 11, players: [{ id: 'p15', name: 'Aasif', inGameId: 'HH_Aasif' }] },
  { id: 't12', name: 'Enigma Gaming', tag: 'EG', slotNumber: 12, players: [{ id: 'p16', name: 'RadheThakur', inGameId: 'EG_Radhe' }] },
];

const SEED_MATCHES: Match[] = [
  {
    id: 'm1',
    tournamentId: 'tour-ff-champ-2026',
    matchNumber: 1,
    customLabel: 'Round 1 — Opening Scrimmage',
    mapName: 'Bermuda',
    status: 'Finalized',
    createdAt: '2026-08-18T18:00:00Z',
    finalizedAt: '2026-08-18T18:35:00Z',
    scoringConfigId: 'preset-ff-official-v1',
    scoringVersion: 1,
    results: [
      { teamId: 't1', placement: 1, kills: 11, placementPoints: 12, killPoints: 11, totalPoints: 23, isBooyah: true, playerStats: [{ playerId: 'p1', kills: 7 }, { playerId: 'p2', kills: 4 }] },
      { teamId: 't2', placement: 2, kills: 7, placementPoints: 9, killPoints: 7, totalPoints: 16, isBooyah: false, playerStats: [{ playerId: 'p3', kills: 4 }, { playerId: 'p4', kills: 3 }] },
      { teamId: 't3', placement: 3, kills: 5, placementPoints: 8, killPoints: 5, totalPoints: 13, isBooyah: false, playerStats: [{ playerId: 'p5', kills: 3 }, { playerId: 'p6', kills: 2 }] },
      { teamId: 't4', placement: 4, kills: 4, placementPoints: 7, killPoints: 4, totalPoints: 11, isBooyah: false, playerStats: [{ playerId: 'p7', kills: 3 }, { playerId: 'p8', kills: 1 }] },
      { teamId: 't5', placement: 5, kills: 3, placementPoints: 6, killPoints: 3, totalPoints: 9, isBooyah: false, playerStats: [{ playerId: 'p9', kills: 3 }] },
      { teamId: 't6', placement: 6, kills: 2, placementPoints: 5, killPoints: 2, totalPoints: 7, isBooyah: false, playerStats: [{ playerId: 'p10', kills: 2 }] },
      { teamId: 't7', placement: 7, kills: 1, placementPoints: 4, killPoints: 1, totalPoints: 5, isBooyah: false, playerStats: [{ playerId: 'p11', kills: 1 }] },
      { teamId: 't8', placement: 8, kills: 2, placementPoints: 3, killPoints: 2, totalPoints: 5, isBooyah: false, playerStats: [{ playerId: 'p12', kills: 2 }] },
      { teamId: 't9', placement: 9, kills: 0, placementPoints: 2, killPoints: 0, totalPoints: 2, isBooyah: false, playerStats: [{ playerId: 'p13', kills: 0 }] },
      { teamId: 't10', placement: 10, kills: 1, placementPoints: 1, killPoints: 1, totalPoints: 2, isBooyah: false, playerStats: [{ playerId: 'p14', kills: 1 }] },
      { teamId: 't11', placement: 11, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0, isBooyah: false, playerStats: [{ playerId: 'p15', kills: 0 }] },
      { teamId: 't12', placement: 12, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0, isBooyah: false, playerStats: [{ playerId: 'p16', kills: 0 }] },
    ]
  },
  {
    id: 'm2',
    tournamentId: 'tour-ff-champ-2026',
    matchNumber: 2,
    customLabel: 'Round 2 - Ridge Battles',
    mapName: 'Purgatory',
    status: 'Finalized',
    createdAt: '2026-08-18T18:45:00Z',
    finalizedAt: '2026-08-18T19:20:00Z',
    scoringConfigId: 'preset-ff-official-v1',
    scoringVersion: 1,
    results: [
      { teamId: 't2', placement: 1, kills: 9, placementPoints: 12, killPoints: 9, totalPoints: 21, isBooyah: true, playerStats: [{ playerId: 'p3', kills: 5 }, { playerId: 'p4', kills: 4 }] },
      { teamId: 't4', placement: 2, kills: 8, placementPoints: 9, killPoints: 8, totalPoints: 17, isBooyah: false, playerStats: [{ playerId: 'p7', kills: 5 }, { playerId: 'p8', kills: 3 }] },
      { teamId: 't1', placement: 3, kills: 4, placementPoints: 8, killPoints: 4, totalPoints: 12, isBooyah: false, playerStats: [{ playerId: 'p1', kills: 3 }, { playerId: 'p2', kills: 1 }] },
      { teamId: 't3', placement: 4, kills: 6, placementPoints: 7, killPoints: 6, totalPoints: 13, isBooyah: false, playerStats: [{ playerId: 'p5', kills: 4 }, { playerId: 'p6', kills: 2 }] },
      { teamId: 't7', placement: 5, kills: 3, placementPoints: 6, killPoints: 3, totalPoints: 9, isBooyah: false, playerStats: [{ playerId: 'p11', kills: 3 }] },
      { teamId: 't5', placement: 6, kills: 2, placementPoints: 5, killPoints: 2, totalPoints: 7, isBooyah: false, playerStats: [{ playerId: 'p9', kills: 2 }] },
      { teamId: 't8', placement: 7, kills: 1, placementPoints: 4, killPoints: 1, totalPoints: 5, isBooyah: false, playerStats: [{ playerId: 'p12', kills: 1 }] },
      { teamId: 't6', placement: 8, kills: 0, placementPoints: 3, killPoints: 0, totalPoints: 3, isBooyah: false, playerStats: [{ playerId: 'p10', kills: 0 }] },
      { teamId: 't9', placement: 9, kills: 1, placementPoints: 2, killPoints: 1, totalPoints: 3, isBooyah: false, playerStats: [{ playerId: 'p13', kills: 1 }] },
      { teamId: 't12', placement: 10, kills: 2, placementPoints: 1, killPoints: 2, totalPoints: 3, isBooyah: false, playerStats: [{ playerId: 'p16', kills: 2 }] },
      { teamId: 't10', placement: 11, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0, isBooyah: false, playerStats: [{ playerId: 'p14', kills: 0 }] },
      { teamId: 't11', placement: 12, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0, isBooyah: false, playerStats: [{ playerId: 'p15', kills: 0 }] },
    ]
  },
  {
    id: 'm3',
    tournamentId: 'tour-ff-champ-2026',
    matchNumber: 3,
    customLabel: 'Round 3 - Desert Storm',
    mapName: 'Kalahari',
    status: 'Finalized',
    createdAt: '2026-08-18T19:30:00Z',
    finalizedAt: '2026-08-18T20:05:00Z',
    scoringConfigId: 'preset-ff-official-v1',
    scoringVersion: 1,
    results: [
      { teamId: 't3', placement: 1, kills: 12, placementPoints: 12, killPoints: 12, totalPoints: 24, isBooyah: true, playerStats: [{ playerId: 'p5', kills: 8 }, { playerId: 'p6', kills: 4 }] },
      { teamId: 't1', placement: 2, kills: 8, placementPoints: 9, killPoints: 8, totalPoints: 17, isBooyah: false, playerStats: [{ playerId: 'p1', kills: 5 }, { playerId: 'p2', kills: 3 }] },
      { teamId: 't2', placement: 3, kills: 5, placementPoints: 8, killPoints: 5, totalPoints: 13, isBooyah: false, playerStats: [{ playerId: 'p3', kills: 3 }, { playerId: 'p4', kills: 2 }] },
      { teamId: 't8', placement: 4, kills: 4, placementPoints: 7, killPoints: 4, totalPoints: 11, isBooyah: false, playerStats: [{ playerId: 'p12', kills: 4 }] },
      { teamId: 't4', placement: 5, kills: 3, placementPoints: 6, killPoints: 3, totalPoints: 9, isBooyah: false, playerStats: [{ playerId: 'p7', kills: 2 }, { playerId: 'p8', kills: 1 }] },
      { teamId: 't6', placement: 6, kills: 2, placementPoints: 5, killPoints: 2, totalPoints: 7, isBooyah: false, playerStats: [{ playerId: 'p10', kills: 2 }] },
      { teamId: 't5', placement: 7, kills: 1, placementPoints: 4, killPoints: 1, totalPoints: 5, isBooyah: false, playerStats: [{ playerId: 'p9', kills: 1 }] },
      { teamId: 't9', placement: 8, kills: 0, placementPoints: 3, killPoints: 0, totalPoints: 3, isBooyah: false, playerStats: [{ playerId: 'p13', kills: 0 }] },
      { teamId: 't7', placement: 9, kills: 2, placementPoints: 2, killPoints: 2, totalPoints: 4, isBooyah: false, playerStats: [{ playerId: 'p11', kills: 2 }] },
      { teamId: 't11', placement: 10, kills: 1, placementPoints: 1, killPoints: 1, totalPoints: 2, isBooyah: false, playerStats: [{ playerId: 'p15', kills: 1 }] },
      { teamId: 't10', placement: 11, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0, isBooyah: false, playerStats: [{ playerId: 'p14', kills: 0 }] },
      { teamId: 't12', placement: 12, kills: 0, placementPoints: 0, killPoints: 0, totalPoints: 0, isBooyah: false, playerStats: [{ playerId: 'p16', kills: 0 }] },
    ]
  }
];

const DEMO_TOURNAMENT_1: Tournament = {
  id: 'tour-ff-champ-2026',
  title: 'Free Fire Grand Championship — Season 5',
  organizer: 'PointX Esports Network',
  game: 'Free Fire',
  description: 'Official Tier-1 National League featuring top 12 pro battle royale rosters.',
  tournamentType: 'Battle Royale',
  status: 'Live',
  structure: {
    teamCount: 12,
    matchCount: 6,
    roundRobin: false,
    slotsPerMatch: 12
  },
  scoringPreset: DEFAULT_FREE_FIRE_SCORING,
  teams: SEED_TEAMS,
  matches: SEED_MATCHES,
  createdAt: '2026-08-18T12:00:00Z',
  updatedAt: '2026-08-18T19:30:00Z',
};

const DEMO_TOURNAMENT_2: Tournament = {
  id: 'tour-ff-night-scrims',
  title: 'Free Fire Tier-1 Pro Scrims — Night Showdown',
  organizer: 'Apex Gaming League',
  game: 'Free Fire',
  description: 'Daily competitive practice scrims for verified tournament squads.',
  tournamentType: 'Scrim',
  status: 'Upcoming',
  structure: {
    teamCount: 12,
    matchCount: 4,
    roundRobin: false,
    slotsPerMatch: 12
  },
  scoringPreset: DEFAULT_FREE_FIRE_SCORING,
  teams: SEED_TEAMS.slice(0, 8),
  matches: [],
  createdAt: '2026-08-17T18:00:00Z',
  updatedAt: '2026-08-18T10:00:00Z',
};

const DEMO_TOURNAMENT_3: Tournament = {
  id: 'tour-ff-summer-finals',
  title: 'PointX Winter Invitational — Season 4',
  organizer: 'PointX Championship Series',
  game: 'Free Fire',
  description: 'Archived season 4 tournament finals results and certificate archives.',
  tournamentType: 'League',
  status: 'Completed',
  structure: {
    teamCount: 12,
    matchCount: 6,
    roundRobin: true,
    groupsCount: 2,
    slotsPerMatch: 12
  },
  scoringPreset: DEFAULT_FREE_FIRE_SCORING,
  teams: SEED_TEAMS,
  matches: SEED_MATCHES,
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-08-05T22:00:00Z',
};

export const DEMO_TOURNAMENTS = [DEMO_TOURNAMENT_1, DEMO_TOURNAMENT_2, DEMO_TOURNAMENT_3];

export function createBlankTournament(): Tournament {
  return {
    id: '',
    title: '',
    organizer: '',
    game: 'Free Fire',
    description: '',
    tournamentType: 'Battle Royale',
    status: 'Upcoming',
    structure: {
      teamCount: 12,
      matchCount: 6,
      roundRobin: false,
      slotsPerMatch: 12
    },
    scoringPreset: DEFAULT_FREE_FIRE_SCORING,
    teams: [],
    matches: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const STORAGE_KEY_PREFIX = 'pointx_tournaments_user_';

function getActiveUserId(): string {
  if (typeof window === 'undefined' || !window.localStorage) return 'guest';
  try {
    const rawUser = window.localStorage.getItem('pointx_auth_session_v1') || window.localStorage.getItem('strikz_auth_session_v1');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return parsed?._id || parsed?.id || parsed?.email || 'guest';
    }
  } catch {}
  return 'guest';
}

function loadStoredTournaments(): { tournaments: Tournament[]; activeTournamentId: string; currentTournament: Tournament } {
  const blank = createBlankTournament();
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      tournaments: [],
      activeTournamentId: '',
      currentTournament: blank
    };
  }

  const userId = getActiveUserId();
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) || window.localStorage.getItem('pointx_tournaments_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip demo tournaments for regular users
        const nonDemo = parsed.filter(
          (t) =>
            t.id !== 'tour-ff-champ-2026' &&
            t.id !== 'tour-ff-night-scrims' &&
            t.id !== 'tour-ff-summer-finals' &&
            !t.id.startsWith('tour-demo-')
        );
        if (nonDemo.length > 0) {
          // Do NOT auto-select a tournament before the user chooses one
          return {
            tournaments: nonDemo,
            activeTournamentId: '',
            currentTournament: blank
          };
        }
      }
    }
  } catch {}

  return {
    tournaments: [],
    activeTournamentId: '',
    currentTournament: blank
  };
}

function persistTournaments(tournaments: Tournament[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const userId = getActiveUserId();
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(tournaments));
      window.localStorage.setItem('pointx_tournaments_state', JSON.stringify(tournaments));
    } catch {}
  }
}

const initialSaved = loadStoredTournaments();

export const useTournamentStore = create<AppState>((set, get) => ({
  tournaments: initialSaved.tournaments,
  activeTournamentId: initialSaved.activeTournamentId,
  currentTournament: initialSaved.currentTournament,
  isLoadingTournaments: false,
  hasLoadedFromDatabase: false,
  adminDemoEnabled: typeof window !== 'undefined' ? window.localStorage.getItem('pointx_admin_demo_enabled') === 'true' : false,
  isLoadingDemoSetting: false,
  activeTab: 'overview',
  previousTab: null,
  activeGraphicsCategory: 'standings',
  isSidebarCollapsed: false,
  highlightDashboardAction: false,
  isCreateMatchModalOpen: false,

  setActiveTab: (tab) =>
    set((state) => {
      if (state.activeTab === tab) return state;
      return {
        previousTab: state.activeTab,
        activeTab: tab
      };
    }),
  setActiveGraphicsCategory: (category) => set({ activeGraphicsCategory: category }),
  goBackTab: () =>
    set((state) => {
      const target = state.previousTab || 'overview';
      return {
        previousTab: state.activeTab,
        activeTab: target
      };
    }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setCreateMatchModalOpen: (open) => set({ isCreateMatchModalOpen: open }),
  triggerDashboardHighlight: () => {
    set({ highlightDashboardAction: true });
    setTimeout(() => {
      set({ highlightDashboardAction: false });
    }, 700);
  },

  setCurrentTournamentId: (id) => {
    const tour = get().tournaments.find((t) => t.id === id) || DEMO_TOURNAMENTS.find((t) => t.id === id) || get().tournaments[0] || get().currentTournament;
    if (tour) {
      set({
        activeTournamentId: tour.id,
        currentTournament: tour
      });
      broadcastTournamentUpdate(tour);
    }
  },

  fetchTournaments: async () => {
    set({ isLoadingTournaments: true });
    try {
      const res = await tournamentsApi.getAll();
      if (res.success && Array.isArray(res.data)) {
        const loadedTournaments = res.data;
        const currentActiveId = get().activeTournamentId;
        const matching = currentActiveId ? loadedTournaments.find((t) => t.id === currentActiveId) : null;
        const active = matching || (currentActiveId ? get().currentTournament : createBlankTournament());

        persistTournaments(loadedTournaments);

        set({
          tournaments: loadedTournaments,
          activeTournamentId: matching ? matching.id : '',
          currentTournament: active,
          isLoadingTournaments: false,
          hasLoadedFromDatabase: true
        });

        if (matching) {
          broadcastTournamentUpdate(matching);
        }
      } else {
        set({ isLoadingTournaments: false, hasLoadedFromDatabase: true });
      }
    } catch {
      set({ isLoadingTournaments: false, hasLoadedFromDatabase: true });
    }
  },

  createTournament: async (newTour) => {
    // 1. Optimistic local update
    set((state) => {
      const updatedTournaments = [newTour, ...state.tournaments];
      broadcastTournamentUpdate(newTour);
      persistTournaments(updatedTournaments);
      return {
        tournaments: updatedTournaments,
        activeTournamentId: newTour.id,
        currentTournament: newTour
      };
    });

    // 2. Persist to MongoDB database
    try {
      const res = await tournamentsApi.create(newTour);
      if (res.success && res.data) {
        const savedTour = res.data;
        set((state) => {
          const reconciled = state.tournaments.map((t) =>
            t.id === newTour.id ? { ...t, ...savedTour } : t
          );
          persistTournaments(reconciled);
          return {
            tournaments: reconciled,
            activeTournamentId: savedTour.id || newTour.id,
            currentTournament: { ...newTour, ...savedTour }
          };
        });
        return { ...newTour, ...savedTour };
      }
    } catch {}

    return newTour;
  },

  updateTournament: async (tournamentId, data) => {
    set((state) => {
      const updatedTournaments = state.tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, ...data, updatedAt: new Date().toISOString() }
          : t
      );
      const updatedCurrent =
        state.currentTournament.id === tournamentId
          ? { ...state.currentTournament, ...data, updatedAt: new Date().toISOString() }
          : state.currentTournament;

      if (state.currentTournament.id === tournamentId) {
        broadcastTournamentUpdate(updatedCurrent);
      }

      persistTournaments(updatedTournaments);

      return {
        tournaments: updatedTournaments,
        currentTournament: updatedCurrent
      };
    });

    try {
      await tournamentsApi.update(tournamentId, data);
    } catch {}
  },

  cloneTournament: async (sourceId, options) => {
    const source = get().tournaments.find((t) => t.id === sourceId) || get().currentTournament;
    const newId = `tour-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const clonedTeams: Team[] = options.copyTeams
      ? source.teams.map((t, idx) => ({
          ...t,
          id: `team-${newId}-${idx + 1}`,
          players: options.copyPlayers
            ? t.players.map((p, pIdx) => ({ ...p, id: `p-${newId}-${idx + 1}-${pIdx + 1}` }))
            : []
        }))
      : [];

    const clonedTournament: Tournament = {
      id: newId,
      title: options.newTitle.trim() || `${source.title} (Clone)`,
      organizer: source.organizer,
      game: source.game,
      description: options.copySettings ? source.description : '',
      tournamentType: source.tournamentType,
      status: 'Draft',
      structure: options.copySettings ? { ...source.structure } : { teamCount: 12, matchCount: 6, roundRobin: false, slotsPerMatch: 12 },
      scoringPreset: options.copyScoring ? { ...source.scoringPreset } : DEFAULT_FREE_FIRE_SCORING,
      bannerUrl: options.copyBranding ? source.bannerUrl : undefined,
      logoUrl: options.copyBranding ? source.logoUrl : undefined,
      teams: clonedTeams,
      matches: options.copyMatches ? JSON.parse(JSON.stringify(source.matches)) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => {
      const updated = [clonedTournament, ...state.tournaments];
      persistTournaments(updated);
      return {
        tournaments: updated,
        activeTournamentId: clonedTournament.id,
        currentTournament: clonedTournament
      };
    });

    broadcastTournamentUpdate(clonedTournament);

    try {
      const res = await tournamentsApi.clone({ sourceId, ...options });
      if (res.success && res.data) {
        const saved = res.data;
        set((state) => {
          const reconciled = state.tournaments.map((t) =>
            t.id === clonedTournament.id ? { ...t, ...saved } : t
          );
          persistTournaments(reconciled);
          return {
            tournaments: reconciled,
            activeTournamentId: saved.id || clonedTournament.id,
            currentTournament: { ...clonedTournament, ...saved }
          };
        });
        return { ...clonedTournament, ...saved };
      }
    } catch {}

    return clonedTournament;
  },

  importTournaments: async (incoming) => {
    if (!incoming || !Array.isArray(incoming) || incoming.length === 0) return 0;

    let addedCount = 0;
    set((state) => {
      const existingIds = new Set(state.tournaments.map((t) => t.id));
      const newItems: Tournament[] = [];

      incoming.forEach((item) => {
        if (item && item.title) {
          const uniqueId = existingIds.has(item.id)
            ? `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
            : item.id || `tour-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          
          existingIds.add(uniqueId);
          newItems.push({
            ...item,
            id: uniqueId,
            updatedAt: new Date().toISOString()
          });
          addedCount++;
        }
      });

      if (newItems.length === 0) return state;

      const mergedTournaments = [...newItems, ...state.tournaments];
      const nextActive = newItems[0] || state.currentTournament;
      persistTournaments(mergedTournaments);
      broadcastTournamentUpdate(nextActive);

      return {
        tournaments: mergedTournaments,
        activeTournamentId: nextActive.id,
        currentTournament: nextActive
      };
    });

    try {
      await tournamentsApi.importBatch(incoming);
      get().fetchTournaments().catch(() => {});
    } catch {}

    return addedCount;
  },

  archiveTournament: async (tournamentId) => {
    set((state) => {
      const updatedTournaments = state.tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, status: 'Archived' as const, updatedAt: new Date().toISOString() }
          : t
      );
      const updatedCurrent =
        state.currentTournament.id === tournamentId
          ? { ...state.currentTournament, status: 'Archived' as const, updatedAt: new Date().toISOString() }
          : state.currentTournament;

      persistTournaments(updatedTournaments);

      return {
        tournaments: updatedTournaments,
        currentTournament: updatedCurrent
      };
    });
    try {
      await tournamentsApi.update(tournamentId, { status: 'Archived' });
    } catch {}
  },

  deleteTournament: async (tournamentId) => {
    set((state) => {
      const filtered = state.tournaments.filter((t) => t.id !== tournamentId);
      const nextActive = filtered[0] || createBlankTournament();
      persistTournaments(filtered);
      return {
        tournaments: filtered,
        activeTournamentId: filtered.length > 0 ? nextActive.id : '',
        currentTournament: nextActive
      };
    });
    try {
      await tournamentsApi.delete(tournamentId);
    } catch {}
  },

  fetchAdminDemoSetting: async () => {
    const userRole = typeof window !== 'undefined' ? (() => {
      try {
        const raw = window.localStorage.getItem('pointx_auth_storage_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed?.state?.user?.role;
        }
      } catch {}
      return null;
    })() : null;

    if (userRole !== 'admin') {
      set({ adminDemoEnabled: false, isLoadingDemoSetting: false });
      return false;
    }

    set({ isLoadingDemoSetting: true });
    try {
      const res = await adminApi.getSettings();
      if (res.success && res.data) {
        const isEnabled = Boolean(res.data.demoTournamentsEnabled);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('pointx_admin_demo_enabled', String(isEnabled));
        }
        set({ adminDemoEnabled: isEnabled, isLoadingDemoSetting: false });
        return isEnabled;
      }
    } catch {}
    set({ isLoadingDemoSetting: false });
    return get().adminDemoEnabled;
  },

  setAdminDemoEnabled: async (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pointx_admin_demo_enabled', String(enabled));
    }
    set({ adminDemoEnabled: enabled });

    // Persist authoritatively to database platform settings in MongoDB
    try {
      await adminApi.saveSettings({ demoTournamentsEnabled: enabled });
    } catch {}
  },

  loadDemoTournaments: () => {
    persistTournaments(DEMO_TOURNAMENTS);
    set({
      tournaments: DEMO_TOURNAMENTS,
      activeTournamentId: DEMO_TOURNAMENTS[0].id,
      currentTournament: DEMO_TOURNAMENTS[0],
      hasLoadedFromDatabase: true
    });
  },

  clearAllTournaments: () => {
    const blank = createBlankTournament();
    persistTournaments([]);
    set({
      tournaments: [],
      activeTournamentId: '',
      currentTournament: blank,
      hasLoadedFromDatabase: false
    });
  },

  sanitizeTournamentsForRole: (role?: string) => {
    const isAdmin = role === 'admin';
    if (!isAdmin) {
      set((state) => {
        const nonDemo = state.tournaments.filter(
          (t) =>
            t.id !== 'tour-ff-champ-2026' &&
            t.id !== 'tour-ff-night-scrims' &&
            t.id !== 'tour-ff-summer-finals' &&
            !t.id.startsWith('tour-demo-')
        );
        const matching = state.activeTournamentId ? nonDemo.find((t) => t.id === state.activeTournamentId) : null;
        const activeId = matching ? matching.id : '';
        const current = matching || createBlankTournament();
        persistTournaments(nonDemo);
        return {
          tournaments: nonDemo,
          activeTournamentId: activeId,
          currentTournament: current
        };
      });
    }
  },

  setTournament: (tournament) => {
    set((state) => {
      const isDemo =
        tournament.id.startsWith('tour-demo-') ||
        tournament.id === 'tour-ff-champ-2026' ||
        tournament.id === 'tour-ff-night-scrims' ||
        tournament.id === 'tour-ff-summer-finals';

      const exists = state.tournaments.some((t) => t.id === tournament.id);
      const updatedTournaments = exists
        ? state.tournaments.map((t) => (t.id === tournament.id ? tournament : t))
        : [tournament, ...state.tournaments];

      if (!isDemo) {
        const nonDemo = updatedTournaments.filter(
          (t) =>
            t.id !== 'tour-ff-champ-2026' &&
            t.id !== 'tour-ff-night-scrims' &&
            t.id !== 'tour-ff-summer-finals' &&
            !t.id.startsWith('tour-demo-')
        );
        persistTournaments(nonDemo);
      }
      broadcastTournamentUpdate(tournament);
      return {
        tournaments: updatedTournaments,
        activeTournamentId: tournament.id,
        currentTournament: tournament
      };
    });
  },

  clearActiveTournament: () => {
    set({
      activeTournamentId: '',
      currentTournament: createBlankTournament()
    });
  },

  updateScoringPreset: (preset) => {
    const current = get().currentTournament;
    get().updateTournament(current.id, { scoringPreset: preset });
  },

  addTeam: (team) => {
    const current = get().currentTournament;
    get().updateTournament(current.id, { teams: [...current.teams, team] });
  },

  updateTeam: (teamId, updatedFields) => {
    const current = get().currentTournament;
    const updatedTeams = current.teams.map((t) => (t.id === teamId ? { ...t, ...updatedFields } : t));
    get().updateTournament(current.id, { teams: updatedTeams });
  },

  deleteTeam: (teamId) => {
    const current = get().currentTournament;
    get().updateTournament(current.id, { teams: current.teams.filter((t) => t.id !== teamId) });
  },

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // MATCH MANAGEMENT OPERATIONS
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

  createMatch: (tournamentId, mapName, customLabel) => {
    const targetTournament = get().tournaments.find((t) => t.id === tournamentId) || get().currentTournament;
    
    // Automatically determine next available match number
    const existingNumbers = targetTournament.matches.map((m) => m.matchNumber);
    const nextMatchNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const matchId = `match-${tournamentId}-${nextMatchNumber}-${Date.now().toString(36)}`;

    // Automatically initialize results for all registered tournament teams
    const initialResults: TeamMatchResult[] = targetTournament.teams.map((t) => ({
      teamId: t.id,
      placement: 0,
      kills: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      isBooyah: false
    }));

    const newMatch: Match = {
      id: matchId,
      tournamentId,
      matchNumber: nextMatchNumber,
      customLabel: customLabel?.trim() || `Match ${nextMatchNumber.toString().padStart(2, '0')} (${mapName})`,
      mapName,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scoringConfigId: targetTournament.scoringPreset.id,
      scoringVersion: targetTournament.scoringPreset.version,
      results: initialResults
    };

    const updatedMatches = [...targetTournament.matches, newMatch];
    get().updateTournament(tournamentId, { matches: updatedMatches });

    return newMatch;
  },

  updateMatch: (matchId, updatedFields) => {
    const current = get().currentTournament;
    const updatedMatches = current.matches.map((m) =>
      m.id === matchId ? { ...m, ...updatedFields, updatedAt: new Date().toISOString() } : m
    );
    get().updateTournament(current.id, { matches: updatedMatches });
  },

  updateMatchResults: (tournamentId, matchId, rawResults, status = 'Completed', customLabel, mapName) => {
    const targetTournament = get().tournaments.find((t) => t.id === tournamentId) || get().currentTournament;
    const targetMatch = targetTournament.matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    // Execute raw results strictly through normalized scoring engine
    const normalizedPreset = normalizeScoringConfig(targetTournament.scoringPreset);

    const calculatedTeamResults: TeamMatchResult[] = rawResults.map((raw) => {
      const calc = calculateTeamMatchScore(
        {
          teamId: raw.teamId,
          matchId,
          placement: raw.placement,
          kills: raw.kills,
          booyah: raw.booyah,
          bonusPoints: raw.bonusPoints,
          penaltyPoints: raw.penaltyPoints
        },
        normalizedPreset
      );

      const d = calc.success && calc.data ? calc.data : null;
      const placement = d ? d.placement : Math.max(0, Math.floor(Number(raw.placement) || 0));
      const kills = d ? d.kills : Math.max(0, Math.floor(Number(raw.kills) || 0));
      const placePts = d ? d.placementPoints : getPlacementPoints(placement, normalizedPreset);
      const killPts = d ? d.killPoints : (kills * normalizedPreset.killPoints);
      const bonus = d ? d.customBonusPoints : Math.floor(Number(raw.bonusPoints) || 0);
      const penalty = d ? d.penaltyPoints : Math.max(0, Math.floor(Number(raw.penaltyPoints) || 0));
      const total = d ? d.totalPoints : Math.max(0, placePts + killPts + bonus - penalty);
      const isBooyah = d ? d.booyah : Boolean(raw.booyah || (placement === 1 && placement > 0));

      return {
        teamId: raw.teamId,
        placement,
        kills,
        isBooyah,
        bonusPoints: bonus,
        penaltyPoints: penalty,
        placementPoints: placePts,
        killPoints: killPts,
        totalPoints: total,
        playerStats: raw.playerKills?.map((pk) => ({ playerId: pk.playerId, kills: pk.kills }))
      };
    });

    const updatedMatches = targetTournament.matches.map((m) =>
      m.id === matchId
        ? {
            ...m,
            customLabel: customLabel !== undefined ? customLabel : m.customLabel,
            mapName: mapName !== undefined ? mapName : m.mapName,
            status,
            results: calculatedTeamResults,
            scoringConfigId: normalizedPreset.id,
            scoringVersion: normalizedPreset.version,
            updatedAt: new Date().toISOString()
          }
        : m
    );

    get().updateTournament(tournamentId, { matches: updatedMatches });
  },

  finalizeMatch: (tournamentId, matchId) => {
    const targetTournament = get().tournaments.find((t) => t.id === tournamentId) || get().currentTournament;
    const targetMatch = targetTournament.matches.find((m) => m.id === matchId);
    if (!targetMatch) return { success: false, errors: ['Match not found.'] };

    const errors: string[] = [];
    const usedPlacements = new Set<number>();

    targetMatch.results.forEach((r) => {
      const team = targetTournament.teams.find((t) => t.id === r.teamId);
      const teamName = team ? team.name : r.teamId;

      if (!r.placement || r.placement < 1) {
        errors.push(`Missing valid placement for "${teamName}".`);
      } else {
        if (usedPlacements.has(r.placement)) {
          errors.push(`Duplicate placement #${r.placement} detected for "${teamName}".`);
        }
        usedPlacements.add(r.placement);
      }

      if (r.kills < 0 || isNaN(r.kills)) {
        errors.push(`Invalid kills (${r.kills}) for "${teamName}".`);
      }
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Set finalized status
    const updatedMatches = targetTournament.matches.map((m) =>
      m.id === matchId
        ? {
            ...m,
            status: 'Finalized' as const,
            finalizedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : m
    );

    get().updateTournament(tournamentId, { matches: updatedMatches });
    return { success: true };
  },

  unfinalizeMatch: (tournamentId, matchId) => {
    const targetTournament = get().tournaments.find((t) => t.id === tournamentId) || get().currentTournament;
    const updatedMatches = targetTournament.matches.map((m) =>
      m.id === matchId
        ? {
            ...m,
            status: 'Completed' as const,
            updatedAt: new Date().toISOString()
          }
        : m
    );

    get().updateTournament(tournamentId, { matches: updatedMatches });
  },

  deleteMatch: (matchId) => {
    const current = get().currentTournament;
    get().updateTournament(current.id, { matches: current.matches.filter((m) => m.id !== matchId) });
  },

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // STANDINGS & STATISTICAL AGGREGATIONS
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

  getStandings: (options) => {
    const current = get().currentTournament;
    return calculateTournamentStandings(current, options);
  },

  getTopFraggers: (options) => {
    const current = get().currentTournament;
    return calculateTopFraggers(current, options);
  },

  getTournamentSummary: () => {
    const current = get().currentTournament;
    return calculateTournamentSummary(current);
  },

  autofillKnownTeams: () => SEED_TEAMS
}));