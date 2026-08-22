import type { CalculatedStanding } from './standings';

export type GraphicCategory =
  | 'overall-standings'
  | 'warheads'
  | 'top-fraggers'
  | 'team-poster'
  | 'slot-list'
  | 'certificate';

export type GraphicTemplateId = 'overall-standings-legit' | 'overall-standings-strikz';

export interface GraphicsTemplateDefinition {
  id: GraphicTemplateId;
  name: string;
  category: GraphicCategory;
  description: string;
  aspectRatio: '16:9';
  width: number;
  height: number;
  maxRowsPerPage: number;
  previewThumbnail?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundGradient: string;
    badgeStyle: string;
  };
}

export interface GraphicsRenderOptions {
  customTitle?: string;
  customSubtitle?: string;
  organizerName?: string;
  showLogos?: boolean;
  pageIndex?: number;
  rowsPerPage?: number;
}

export interface GraphicsRenderData {
  tournamentTitle: string;
  tournamentLogo?: string;
  organizerName: string;
  organizerLogo?: string;
  subtitle?: string;
  page: number;
  totalPages: number;
  rows: CalculatedStanding[];
  totalMatchesCount: number;
}