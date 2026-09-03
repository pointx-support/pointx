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

export interface CustomGraphicsTemplate {
  id: string;
  name: string;
  description: string;
  category?: GraphicTemplateCategory;
  imageUrl: string;
  aspectRatio: '16:9' | '4:5' | '1:1' | '9:16';
  alignment: TemplateAlignmentConfig;
  isBuiltIn: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
