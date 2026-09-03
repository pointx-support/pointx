import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomGraphicsTemplate, TemplateAlignmentConfig, GraphicTemplateCategory } from '../types/customTemplate';

export const DEFAULT_LEGIT_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,

  showOrganizerHeader: false,
  showTournamentHeader: false,

  baseY: 538,
  rowGap: 84.5,
  layoutMode: 'dual-column',

  leftRankX: 132,
  leftTeamX: 206,
  leftMatchX: 530,
  leftBooyahX: 612,
  leftKillsX: 695,
  leftPlaceX: 778,
  leftTotalX: 860,

  rightRankX: 1048,
  rightTeamX: 1122,
  rightMatchX: 1446,
  rightBooyahX: 1528,
  rightKillsX: 1610,
  rightPlaceX: 1692,
  rightTotalX: 1775,

  fontFamily: 'Rajdhani',
  rankFontSize: 26,
  teamFontSize: 22,
  statFontSize: 24,
  totalFontSize: 26,
  teamFontWeight: '800',

  rankColor: '#ffffff',
  teamColor: '#ffffff',
  statColor: '#ffffff',
  totalColor: '#00f0ff',
  totalGlowColor: '#00f0ff',

  showSubtitleBanner: true,
  subtitleX: 890,
  subtitleY: 120,
  subtitleWidth: 560,
  subtitleHeight: 75,
  subtitleFontSize: 48,
  subtitleBgColor: '#051d38',
  subtitleBorderColor: '#00f0ff',
  subtitleTextColor: '#ffffff'
};

export const DEFAULT_POINTX_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,

  showOrganizerHeader: false,
  showTournamentHeader: false,

  baseY: 548,
  rowGap: 84,
  layoutMode: 'dual-column',

  leftRankX: 138,
  leftTeamX: 212,
  leftMatchX: 538,
  leftBooyahX: 620,
  leftKillsX: 704,
  leftPlaceX: 788,
  leftTotalX: 870,

  rightRankX: 1045,
  rightTeamX: 1120,
  rightMatchX: 1445,
  rightBooyahX: 1528,
  rightKillsX: 1612,
  rightPlaceX: 1695,
  rightTotalX: 1778,

  fontFamily: 'Teko',
  rankFontSize: 36,
  teamFontSize: 24,
  statFontSize: 30,
  totalFontSize: 32,
  teamFontWeight: '800',

  rankColor: '#1c0700',
  teamColor: '#110500',
  statColor: '#1c0700',
  totalColor: '#ffffff',

  showSubtitleBanner: true,
  subtitleX: 1080,
  subtitleY: 215,
  subtitleWidth: 600,
  subtitleHeight: 80,
  subtitleFontSize: 64,
  subtitleBgColor: '#7f1d1d',
  subtitleBorderColor: '#fbbf24',
  subtitleTextColor: '#ffffff'
};

// 1. NEON PURPLE POSTER (4:5 Portrait)
export const DEFAULT_NEON_PURPLE_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1350,

  showOrganizerHeader: true,
  organizerX: 655,
  organizerY: 45,
  organizerFontSize: 24,
  organizerColor: '#ffffff',

  showTournamentHeader: true,
  tournamentX: 655,
  tournamentY: 200,
  tournamentFontSize: 44,
  tournamentColor: '#ffffff',

  baseY: 550,
  rowGap: 85,
  layoutMode: 'dual-column',

  leftRankX: 70,
  leftTeamX: 140,
  leftMatchX: 350,
  leftBooyahX: 390,
  leftKillsX: 430,
  leftPlaceX: 470,
  leftTotalX: 505,

  rightRankX: 550,
  rightTeamX: 640,
  rightMatchX: 890,
  rightBooyahX: 935,
  rightKillsX: 975,
  rightPlaceX: 1015,
  rightTotalX: 1045,

  fontFamily: 'Space Grotesk',
  rankFontSize: 24,
  teamFontSize: 22,
  statFontSize: 22,
  totalFontSize: 24,
  teamFontWeight: '800',

  rankColor: '#ffffff',
  teamColor: '#ffffff',
  statColor: '#ffffff',
  totalColor: '#d946ef',
  totalGlowColor: '#c026d3',

  showSubtitleBanner: false,
  subtitleX: 655,
  subtitleY: 450,
  subtitleWidth: 300,
  subtitleHeight: 50,
  subtitleFontSize: 28,
  subtitleBgColor: 'transparent',
  subtitleBorderColor: 'transparent',
  subtitleTextColor: '#ffffff'
};

// 2. DARK MINT POSTER (4:5 Portrait)
export const DEFAULT_DARK_MINT_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1220,

  showOrganizerHeader: true,
  organizerX: 540,
  organizerY: 75,
  organizerFontSize: 22,
  organizerColor: '#ffffff',

  showTournamentHeader: true,
  tournamentX: 540,
  tournamentY: 185,
  tournamentFontSize: 42,
  tournamentColor: '#ffffff',

  baseY: 690,
  rowGap: 78,
  layoutMode: 'dual-column',

  leftRankX: 105,
  leftTeamX: 200,
  leftMatchX: 360,
  leftBooyahX: 405,
  leftKillsX: 445,
  leftPlaceX: 485,
  leftTotalX: 515,

  rightRankX: 590,
  rightTeamX: 685,
  rightMatchX: 845,
  rightBooyahX: 890,
  rightKillsX: 930,
  rightPlaceX: 970,
  rightTotalX: 1000,

  fontFamily: 'Rajdhani',
  rankFontSize: 24,
  teamFontSize: 22,
  statFontSize: 22,
  totalFontSize: 24,
  teamFontWeight: '800',

  rankColor: '#ffffff',
  teamColor: '#ffffff',
  statColor: '#ffffff',
  totalColor: '#10b981',
  totalGlowColor: '#059669',

  showSubtitleBanner: false,
  subtitleX: 540,
  subtitleY: 280,
  subtitleWidth: 300,
  subtitleHeight: 45,
  subtitleFontSize: 24,
  subtitleBgColor: 'transparent',
  subtitleBorderColor: 'transparent',
  subtitleTextColor: '#10b981'
};

// 3. GLACIER FROST POSTER (4:5 Portrait)
export const DEFAULT_GLACIER_FROST_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1350,

  showOrganizerHeader: true,
  organizerX: 540,
  organizerY: 105,
  organizerFontSize: 22,
  organizerColor: '#0f172a',

  showTournamentHeader: true,
  tournamentX: 540,
  tournamentY: 195,
  tournamentFontSize: 44,
  tournamentColor: '#0f172a',

  baseY: 485,
  rowGap: 66,
  layoutMode: 'single-column',

  leftRankX: 185,
  leftTeamX: 420,
  leftMatchX: 675,
  leftBooyahX: 745,
  leftKillsX: 815,
  leftPlaceX: 885,
  leftTotalX: 940,

  rightRankX: 185,
  rightTeamX: 420,
  rightMatchX: 675,
  rightBooyahX: 745,
  rightKillsX: 815,
  rightPlaceX: 885,
  rightTotalX: 940,

  fontFamily: 'Space Grotesk',
  rankFontSize: 22,
  teamFontSize: 20,
  statFontSize: 20,
  totalFontSize: 22,
  teamFontWeight: '800',

  rankColor: '#0f172a',
  teamColor: '#0f172a',
  statColor: '#0f172a',
  totalColor: '#0284c7',

  showSubtitleBanner: false,
  subtitleX: 540,
  subtitleY: 260,
  subtitleWidth: 300,
  subtitleHeight: 40,
  subtitleFontSize: 22,
  subtitleBgColor: 'transparent',
  subtitleBorderColor: 'transparent',
  subtitleTextColor: '#0284c7'
};

// 4. RED SAMURAI POSTER (4:5 Portrait)
export const DEFAULT_RED_SAMURAI_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1350,

  showOrganizerHeader: true,
  organizerX: 540,
  organizerY: 105,
  organizerFontSize: 24,
  organizerColor: '#fbbf24',

  showTournamentHeader: true,
  tournamentX: 540,
  tournamentY: 215,
  tournamentFontSize: 44,
  tournamentColor: '#ffffff',

  baseY: 535,
  rowGap: 72,
  layoutMode: 'dual-column',

  leftRankX: 75,
  leftTeamX: 205,
  leftMatchX: 350,
  leftBooyahX: 388,
  leftKillsX: 428,
  leftPlaceX: 468,
  leftTotalX: 500,

  rightRankX: 580,
  rightTeamX: 710,
  rightMatchX: 855,
  rightBooyahX: 893,
  rightKillsX: 933,
  rightPlaceX: 973,
  rightTotalX: 1005,

  fontFamily: 'Rajdhani',
  rankFontSize: 26,
  teamFontSize: 22,
  statFontSize: 22,
  totalFontSize: 24,
  teamFontWeight: '800',

  rankColor: '#1c0700',
  teamColor: '#ffffff',
  statColor: '#ffffff',
  totalColor: '#fbbf24',

  showSubtitleBanner: false,
  subtitleX: 540,
  subtitleY: 415,
  subtitleWidth: 260,
  subtitleHeight: 45,
  subtitleFontSize: 22,
  subtitleBgColor: '#fbbf24',
  subtitleBorderColor: '#fbbf24',
  subtitleTextColor: '#000000'
};

// 5. RED THUNDER POSTER (4:5 Portrait)
export const DEFAULT_RED_THUNDER_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1350,

  showOrganizerHeader: true,
  organizerX: 540,
  organizerY: 55,
  organizerFontSize: 22,
  organizerColor: '#fbbf24',

  showTournamentHeader: true,
  tournamentX: 540,
  tournamentY: 115,
  tournamentFontSize: 42,
  tournamentColor: '#ffffff',

  baseY: 375,
  rowGap: 58,
  layoutMode: 'single-column',

  leftRankX: 165,
  leftTeamX: 345,
  leftMatchX: 565,
  leftBooyahX: 625,
  leftKillsX: 690,
  leftPlaceX: 755,
  leftTotalX: 865,

  rightRankX: 165,
  rightTeamX: 345,
  rightMatchX: 565,
  rightBooyahX: 625,
  rightKillsX: 690,
  rightPlaceX: 755,
  rightTotalX: 865,

  fontFamily: 'Teko',
  rankFontSize: 30,
  teamFontSize: 22,
  statFontSize: 26,
  totalFontSize: 28,
  teamFontWeight: '800',

  rankColor: '#1c0700',
  teamColor: '#110500',
  statColor: '#1c0700',
  totalColor: '#ffffff',

  showSubtitleBanner: false,
  subtitleX: 540,
  subtitleY: 260,
  subtitleWidth: 320,
  subtitleHeight: 45,
  subtitleFontSize: 24,
  subtitleBgColor: '#fbbf24',
  subtitleBorderColor: '#fbbf24',
  subtitleTextColor: '#000000'
};

// 6. EMERALD CRYSTAL POSTER (4:5 Portrait)
export const DEFAULT_EMERALD_CRYSTAL_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1350,

  showOrganizerHeader: true,
  organizerX: 540,
  organizerY: 115,
  organizerFontSize: 22,
  organizerColor: '#00ff88',

  showTournamentHeader: true,
  tournamentX: 540,
  tournamentY: 235,
  tournamentFontSize: 46,
  tournamentColor: '#ffffff',

  baseY: 645,
  rowGap: 57,
  layoutMode: 'single-column',

  leftRankX: 150,
  leftTeamX: 350,
  leftMatchX: 620,
  leftBooyahX: 675,
  leftKillsX: 785,
  leftPlaceX: 730,
  leftTotalX: 920,

  rightRankX: 150,
  rightTeamX: 350,
  rightMatchX: 620,
  rightBooyahX: 675,
  rightKillsX: 785,
  rightPlaceX: 730,
  rightTotalX: 920,

  fontFamily: 'Rajdhani',
  rankFontSize: 24,
  teamFontSize: 22,
  statFontSize: 22,
  totalFontSize: 24,
  teamFontWeight: '800',

  rankColor: '#ffffff',
  teamColor: '#ffffff',
  statColor: '#ffffff',
  totalColor: '#00ff88',
  totalGlowColor: '#00ff88',

  showSubtitleBanner: false,
  subtitleX: 540,
  subtitleY: 340,
  subtitleWidth: 300,
  subtitleHeight: 40,
  subtitleFontSize: 22,
  subtitleBgColor: 'transparent',
  subtitleBorderColor: 'transparent',
  subtitleTextColor: '#00ff88'
};

// 7. ROYAL PURPLE CYBER POSTER (4:5 Portrait)
export const DEFAULT_ROYAL_PURPLE_ALIGNMENT: TemplateAlignmentConfig = {
  aspectRatio: '4:5',
  width: 1080,
  height: 1350,

  showOrganizerHeader: true,
  organizerX: 540,
  organizerY: 65,
  organizerFontSize: 22,
  organizerColor: '#ffffff',

  showTournamentHeader: true,
  tournamentX: 540,
  tournamentY: 215,
  tournamentFontSize: 64,
  tournamentColor: '#fbbf24',

  baseY: 540,
  rowGap: 52,
  layoutMode: 'single-column',

  leftRankX: 215,
  leftTeamX: 380,
  leftMatchX: 590,
  leftBooyahX: 590,
  leftKillsX: 770,
  leftPlaceX: 680,
  leftTotalX: 860,

  rightRankX: 215,
  rightTeamX: 380,
  rightMatchX: 590,
  rightBooyahX: 590,
  rightKillsX: 770,
  rightPlaceX: 680,
  rightTotalX: 860,

  fontFamily: 'Bebas Neue',
  rankFontSize: 28,
  teamFontSize: 24,
  statFontSize: 26,
  totalFontSize: 28,
  teamFontWeight: '800',

  rankColor: '#ffffff',
  teamColor: '#ffffff',
  statColor: '#ffffff',
  totalColor: '#fbbf24',
  totalGlowColor: '#f59e0b',

  showSubtitleBanner: false,
  subtitleX: 540,
  subtitleY: 345,
  subtitleWidth: 340,
  subtitleHeight: 40,
  subtitleFontSize: 24,
  subtitleBgColor: 'transparent',
  subtitleBorderColor: 'transparent',
  subtitleTextColor: '#ffffff'
};

const BUILTIN_TEMPLATES: CustomGraphicsTemplate[] = [
  // 1. Point Tables (Standings)
  {
    id: 'legit-pro',
    name: 'Legit Showdown Pro (16:9)',
    description: 'Official Legit Showdown cyberpunk theme with neon cyan gradients (16:9 Full HD & 4K).',
    category: 'standings',
    imageUrl: '/templates/legit_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_LEGIT_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z'
  },
  {
    id: 'strikz-scrims',
    name: 'PointX Scrims (Orange Gold 16:9)',
    description: 'Official PointX Scrims gold & orange theme with white team plates (16:9 Full HD & 4K).',
    category: 'standings',
    imageUrl: '/templates/strikz_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_POINTX_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z'
  },
  {
    id: 'emerald-crystal-poster',
    name: 'Emerald Crystal Dark Scrims (4:5 Poster)',
    description: 'Emerald green crystal battle royale layout with top 1 champion spotlight and 11 team standings.',
    category: 'standings',
    imageUrl: '/templates/emerald_crystal_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_EMERALD_CRYSTAL_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:28:00Z',
    updatedAt: '2026-08-19T13:28:00Z'
  },
  {
    id: 'royal-purple-poster',
    name: 'Royal Cyber Purple & Gold (4:5 Poster)',
    description: 'Deep royal purple esports poster with bold gold event typography and clean 12-row standings.',
    category: 'standings',
    imageUrl: '/templates/royal_purple_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_ROYAL_PURPLE_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:28:00Z',
    updatedAt: '2026-08-19T13:28:00Z'
  },
  {
    id: 'neon-purple-poster',
    name: 'Neon Cyber Purple Scrims (4:5 Poster)',
    description: 'Free Fire purple cyber glow poster format with top 3 podium & 12 squad standings.',
    category: 'standings',
    imageUrl: '/templates/neon_purple_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_NEON_PURPLE_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:20:00Z',
    updatedAt: '2026-08-19T13:20:00Z'
  },
  {
    id: 'dark-mint-poster',
    name: 'Dark Mint Tactical Scrims (4:5 Poster)',
    description: 'Dark obsidian & emerald tactical military scrims poster with top 3 champion cards.',
    category: 'standings',
    imageUrl: '/templates/dark_mint_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_DARK_MINT_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:20:00Z',
    updatedAt: '2026-08-19T13:20:00Z'
  },
  {
    id: 'glacier-frost-poster',
    name: 'Glacier Frost Scrims (4:5 Poster)',
    description: 'Ice blue winter battle royale poster layout with clean single-column standings.',
    category: 'standings',
    imageUrl: '/templates/glacier_frost_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_GLACIER_FROST_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:20:00Z',
    updatedAt: '2026-08-19T13:20:00Z'
  },
  {
    id: 'red-samurai-poster',
    name: 'Red Samurai Dual-Column (4:5 Poster)',
    description: 'Free Fire MAX crimson samurai theme with yellow rank tags and dual 6-row columns.',
    category: 'standings',
    imageUrl: '/templates/red_samurai_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_RED_SAMURAI_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:20:00Z',
    updatedAt: '2026-08-19T13:20:00Z'
  },
  {
    id: 'red-thunder-poster',
    name: 'Red Thunder Scrims (4:5 Poster)',
    description: 'Free Fire MAX thunder theme with central torn paper strips for all 12 teams.',
    category: 'standings',
    imageUrl: '/templates/red_thunder_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_RED_THUNDER_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-19T13:20:00Z',
    updatedAt: '2026-08-19T13:20:00Z'
  },

  // 2. Warheads / Kill Leader
  {
    id: 'warheads-cyber-predator',
    name: 'Warheads Cyber Predator (4:5 Poster)',
    description: 'Neon orange & crimson kill leader highlight with dynamic MVP portraits.',
    category: 'warheads',
    imageUrl: '/templates/emerald_crystal_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_EMERALD_CRYSTAL_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'warheads-broadcast-leader',
    name: 'Warheads Stream Overlord (16:9 Broadcast)',
    description: 'Widescreen broadcast kill leader banner with match telemetry and frag counts.',
    category: 'warheads',
    imageUrl: '/templates/legit_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_LEGIT_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },

  // 3. Top Fraggers / MVP
  {
    id: 'fraggers-gold-mvp',
    name: 'Top Fraggers / MVP Elite (4:5 Poster)',
    description: 'Gold champion spotlight featuring top 5 kill fraggers with K/D ratio.',
    category: 'fraggers',
    imageUrl: '/templates/royal_purple_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_ROYAL_PURPLE_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'fraggers-champion-showcase',
    name: 'MVP Stage Champion (16:9 Broadcast)',
    description: 'Broadcast stage MVP banner with high impact damage and survival time telemetry.',
    category: 'fraggers',
    imageUrl: '/templates/strikz_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_POINTX_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },

  // 4. Team Poster
  {
    id: 'team-poster-battle',
    name: 'Team Battle Lineup (4:5 Poster)',
    description: 'Full team 4-man roster poster with official team crest and jersey badges.',
    category: 'team-poster',
    imageUrl: '/templates/red_samurai_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_RED_SAMURAI_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'team-roster-banner',
    name: 'Squad Roster Banner (16:9 Broadcast)',
    description: 'Widescreen squad roster card with captain badge and player IDs.',
    category: 'team-poster',
    imageUrl: '/templates/strikz_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_POINTX_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },

  // 5. Slots List
  {
    id: 'slots-list-schedule',
    name: 'Official 12-Slot Schedule (4:5 Poster)',
    description: 'Complete 12-team slot allocation matrix with group tags and seed numbers.',
    category: 'slots-list',
    imageUrl: '/templates/glacier_frost_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_GLACIER_FROST_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'slots-broadcast-grid',
    name: 'Broadcast Slots Grid (16:9 Broadcast)',
    description: 'Clean widescreen broadcast table displaying 12 slot teams and lobby passwords.',
    category: 'slots-list',
    imageUrl: '/templates/legit_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_LEGIT_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },

  // 6. Victory Certificate
  {
    id: 'certificate-gold-booyah',
    name: 'Champion Victory Certificate (16:9 Landscape)',
    description: 'Official tournament champion diploma with gold seal, signatures, and Booyah insignia.',
    category: 'certificate',
    imageUrl: '/templates/legit_standings.jpg',
    aspectRatio: '16:9',
    alignment: DEFAULT_LEGIT_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'certificate-master-award',
    name: 'Booyah Master Certificate (4:5 Portrait)',
    description: 'Vertical presentation certificate with high-res gold borders and custom MVP title.',
    category: 'certificate',
    imageUrl: '/templates/royal_purple_poster.jpg',
    aspectRatio: '4:5',
    alignment: DEFAULT_ROYAL_PURPLE_ALIGNMENT,
    isBuiltIn: true,
    isPublished: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  }
];

export interface TemplateStoreState {
  templates: CustomGraphicsTemplate[];
  activeTemplateId: string;

  // Actions
  setActiveTemplateId: (id: string) => void;
  createCustomTemplate: (name: string, imageUrl: string, baseAlignment?: TemplateAlignmentConfig, category?: GraphicTemplateCategory) => string;
  updateTemplateAlignment: (id: string, alignment: Partial<TemplateAlignmentConfig>) => void;
  updateTemplateMetadata: (id: string, metadata: { name?: string; description?: string; imageUrl?: string; aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16'; category?: GraphicTemplateCategory }) => void;
  publishTemplate: (id: string) => void;
  unpublishTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  cloneTemplate: (id: string) => string;
  replaceTemplateImage: (id: string, imageUrl: string) => void;
  resetTemplateToDefault: (id: string) => void;
  restoreAllDefaults: () => void;
  getActiveTemplate: () => CustomGraphicsTemplate;
}

export const useTemplateStore = create<TemplateStoreState>()(
  persist(
    (set, get) => ({
      templates: BUILTIN_TEMPLATES,
      activeTemplateId: 'emerald-crystal-poster',

      setActiveTemplateId: (id: string) => set({ activeTemplateId: id }),

      createCustomTemplate: (name: string, imageUrl: string, baseAlignment, category = 'standings') => {
        const id = `custom-tmpl-${Date.now()}`;
        const newTemplate: CustomGraphicsTemplate = {
          id,
          name: name.trim() || 'Custom Tournament Template',
          description: 'Custom tournament background calibrated by Admin.',
          category,
          imageUrl,
          aspectRatio: baseAlignment?.aspectRatio || '16:9',
          alignment: baseAlignment || { ...DEFAULT_LEGIT_ALIGNMENT },
          isBuiltIn: false,
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
          activeTemplateId: id
        }));

        return id;
      },

      cloneTemplate: (id: string) => {
        const target = get().templates.find((t) => t.id === id) || BUILTIN_TEMPLATES[0];
        const newId = `custom-clone-${Date.now()}`;
        const cloned: CustomGraphicsTemplate = {
          ...target,
          id: newId,
          name: `${target.name} (Copy)`,
          isBuiltIn: false,
          isPublished: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          templates: [...state.templates, cloned],
          activeTemplateId: newId
        }));

        return newId;
      },

      replaceTemplateImage: (id: string, imageUrl: string) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  imageUrl,
                  updatedAt: new Date().toISOString()
                }
              : t
          )
        }));
      },

      updateTemplateAlignment: (id: string, alignment: Partial<TemplateAlignmentConfig>) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  alignment: { ...t.alignment, ...alignment },
                  updatedAt: new Date().toISOString()
                }
              : t
          )
        }));
      },

      updateTemplateMetadata: (id, metadata) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...metadata,
                  updatedAt: new Date().toISOString()
                }
              : t
          )
        }));
      },

      publishTemplate: (id: string) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, isPublished: true, updatedAt: new Date().toISOString() } : t
          )
        }));
      },

      unpublishTemplate: (id: string) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, isPublished: false, updatedAt: new Date().toISOString() } : t
          )
        }));
      },

      deleteTemplate: (id: string) => {
        set((state) => {
          const remaining = state.templates.filter((t) => t.id !== id);
          const fallback = remaining.length > 0 ? remaining[0].id : BUILTIN_TEMPLATES[0].id;
          return {
            templates: remaining.length > 0 ? remaining : BUILTIN_TEMPLATES,
            activeTemplateId: state.activeTemplateId === id ? fallback : state.activeTemplateId
          };
        });
      },

      resetTemplateToDefault: (id: string) => {
        const defaultMatch = BUILTIN_TEMPLATES.find((b) => b.id === id);
        if (!defaultMatch) return;

        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  alignment: { ...defaultMatch.alignment },
                  updatedAt: new Date().toISOString()
                }
              : t
          )
        }));
      },

      restoreAllDefaults: () => {
        set({
          templates: BUILTIN_TEMPLATES,
          activeTemplateId: BUILTIN_TEMPLATES[0].id
        });
      },

      getActiveTemplate: () => {
        const { templates, activeTemplateId } = get();
        return templates.find((t) => t.id === activeTemplateId) || templates[0] || BUILTIN_TEMPLATES[0];
      }
    }),
    {
      name: 'pointx_custom_templates_v5'
    }
  )
);
