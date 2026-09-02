import type { GraphicCategory, GraphicTemplateId } from './graphics';

export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type ExportResolution = '1080p' | '4k';

export type ExportStatus =
  | 'idle'
  | 'preparing'
  | 'rendering'
  | 'generating'
  | 'downloading'
  | 'packaging'
  | 'sharing'
  | 'complete'
  | 'error';

export interface GeneratedGraphicRecord {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  templateId: GraphicTemplateId;
  templateName: string;
  graphicType: GraphicCategory;
  customTitle: string;
  customSubtitle?: string;
  pageIndex: number;
  dataScope: string;
  thumbnailDataUrl?: string;
  format: ExportFormat;
  resolution: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  filename: string;
}