export interface TextElementStyle {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  glowColor?: string;
  letterSpacing?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  visible?: boolean;
  customText?: string;
}

export interface SlotElementOverride {
  x?: number;
  y?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  glowColor?: string;
  letterSpacing?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  visible?: boolean;
  customText?: string;
}

export interface SlotRowOverride {
  xOffset?: number;
  yOffset?: number;
  rank?: SlotElementOverride;
  logo?: SlotElementOverride;
  teamName?: SlotElementOverride;
  match?: SlotElementOverride;
  booyah?: SlotElementOverride;
  kills?: SlotElementOverride;
  place?: SlotElementOverride;
  total?: SlotElementOverride;
}

export interface TemplateAlignmentConfig {
  // Dimensions & Aspect Ratio
  aspectRatio: '16:9' | '4:5' | '1:1' | '9:16';
  width: number;
  height: number;
  layoutMode?: 'dual-column' | 'single-column';

  // Vertical Row Spacing
  baseY: number;
  rowGap: number;

  // Global defaults fallback
  fontFamily: string;
  rankFontSize: number;
  teamFontSize: number;
  statFontSize: number;
  totalFontSize: number;
  teamFontWeight: string;

  rankColor: string;
  teamColor: string;
  statColor: string;
  totalColor: string;
  totalGlowColor?: string;

  // Left Column X offsets (fallback & primary)
  leftRankX: number;
  leftTeamX: number;
  leftMatchX: number;
  leftBooyahX: number;
  leftKillsX: number;
  leftPlaceX: number;
  leftTotalX: number;

  // Right Column X offsets (for dual-column layouts)
  rightRankX: number;
  rightTeamX: number;
  rightMatchX: number;
  rightBooyahX: number;
  rightKillsX: number;
  rightPlaceX: number;
  rightTotalX: number;

  // Dynamic Subtitle / Scope Banner
  showSubtitleBanner: boolean;
  subtitleX: number;
  subtitleY: number;
  subtitleWidth: number;
  subtitleHeight: number;
  subtitleFontSize: number;
  subtitleBgColor: string;
  subtitleBorderColor: string;
  subtitleTextColor: string;

  // Titles
  showOrganizerHeader?: boolean;
  organizerX?: number;
  organizerY?: number;
  organizerFontSize?: number;
  organizerColor?: string;

  showTournamentHeader?: boolean;
  tournamentX?: number;
  tournamentY?: number;
  tournamentFontSize?: number;
  tournamentColor?: string;

  // Granular Column & Header Overrides
  elements?: {
    [elementKey: string]: Partial<TextElementStyle> | undefined;
  };

  // 100% Individual Slot & Per-Team Overrides (Slots 1 to 16)
  slots?: {
    [slotIndex: number]: SlotRowOverride;
  };
}

export type GraphicTemplateCategory = 'standings' | 'warheads' | 'fraggers' | 'team-poster' | 'slots-list' | 'certificate';

export type TemplateType =
  | 'POINTS_TABLE'
  | 'KILL_LEADER'
  | 'TOP_FRAGGERS'
  | 'TEAM_POSTER'
  | 'SLOTS_LIST'
  | 'VICTORY_CERTIFICATE'
  | 'NEEDS_REVIEW';

export const VALID_TEMPLATE_TYPES: TemplateType[] = [
  'POINTS_TABLE',
  'KILL_LEADER',
  'TOP_FRAGGERS',
  'TEAM_POSTER',
  'SLOTS_LIST',
  'VICTORY_CERTIFICATE',
  'NEEDS_REVIEW',
];

export function normalizeTemplateType(val?: string): TemplateType {
  if (!val || !val.trim()) return 'NEEDS_REVIEW';
  const clean = val.trim();
  if (VALID_TEMPLATE_TYPES.includes(clean as TemplateType)) {
    return clean as TemplateType;
  }
  const lower = clean.toLowerCase();
  if (lower === 'standings' || lower === 'overall-standings' || lower === 'point-table' || lower === 'point_table' || lower === 'points_table') {
    return 'POINTS_TABLE';
  }
  if (lower === 'warheads' || lower === 'kill-leader' || lower === 'kill_leader') {
    return 'KILL_LEADER';
  }
  if (lower === 'fraggers' || lower === 'top-fraggers' || lower === 'top_fraggers' || lower === 'mvp') {
    return 'TOP_FRAGGERS';
  }
  if (lower === 'team-poster' || lower === 'team_poster' || lower === 'roster') {
    return 'TEAM_POSTER';
  }
  if (lower === 'slots-list' || lower === 'slot-list' || lower === 'slots_list' || lower === 'slots') {
    return 'SLOTS_LIST';
  }
  if (lower === 'certificate' || lower === 'victory-certificate' || lower === 'victory_certificate' || lower === 'winner') {
    return 'VICTORY_CERTIFICATE';
  }
  return 'NEEDS_REVIEW';
}

// ==========================================
// SECTION-SPECIFIC RENDER DATA INTERFACES
// ==========================================

export interface KillLeaderRenderData {
  tournamentTitle: string;
  tournamentLogo?: string;
  organizerName: string;
  organizerLogo?: string;
  player: {
    id: string;
    name: string;
    avatarUrl?: string;
    teamId: string;
    teamName: string;
    teamTag?: string;
    teamLogo?: string;
    totalKills: number;
    damage: number;
    avgKills: number;
    matchesPlayed: number;
    rank?: number;
  };
}

export interface TopFraggersRenderData {
  tournamentTitle: string;
  tournamentLogo?: string;
  organizerName: string;
  organizerLogo?: string;
  players: Array<{
    rank: number;
    id: string;
    name: string;
    avatarUrl?: string;
    teamId: string;
    teamName: string;
    teamTag?: string;
    teamLogo?: string;
    totalKills: number;
    damage: number;
    avgKills?: number;
  }>;
}

export interface TeamPosterRenderData {
  tournamentTitle: string;
  tournamentLogo?: string;
  organizerName: string;
  organizerLogo?: string;
  team: {
    id: string;
    name: string;
    tag: string;
    logoUrl?: string;
    slogan?: string;
    players: Array<{
      id: string;
      name: string;
      role?: string;
      photoUrl?: string;
    }>;
  };
}

export interface SlotsListRenderData {
  tournamentTitle: string;
  tournamentLogo?: string;
  organizerName: string;
  organizerLogo?: string;
  slots: Array<{
    slotNumber: number;
    teamId?: string;
    teamName: string;
    teamTag?: string;
    logoUrl?: string;
    isConfirmed: boolean;
  }>;
}

export interface VictoryCertificateRenderData {
  tournamentTitle: string;
  tournamentDate: string;
  organizerName: string;
  organizerLogo?: string;
  organizerSignature?: string;
  winner: {
    teamId: string;
    teamName: string;
    teamTag?: string;
    logoUrl?: string;
  };
  awardTitle: string;
  awardSubtitle?: string;
  certificateId?: string;
}

export interface CustomGraphicsTemplate {
  id: string;
  name: string;
  description: string;
  category?: GraphicTemplateCategory;
  templateType?: TemplateType;
  imageUrl: string;
  aspectRatio: '16:9' | '4:5' | '1:1' | '9:16';
  alignment: TemplateAlignmentConfig;
  isBuiltIn: boolean;
  isPublished: boolean;
  visibility?: 'GLOBAL' | 'ORGANIZATION_RESTRICTED';
  allowedOrganizationIds?: string[];
  active?: boolean;
  version?: number;
  createdAt: string;
  updatedAt: string;
}
