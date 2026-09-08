import React from 'react';
import type { CustomGraphicsTemplate } from '../../../types/customTemplate';
import type { Tournament } from '../../../types/tournament';
import type { GraphicsRenderData } from '../../../types/graphics';
import {
  getPointsTableData,
  getKillLeaderData,
  getTopFraggersData,
  getTeamPosterData,
  getSlotsListData,
  getVictoryCertificateData
} from '../../../engine/sectionDataProviders';
import { PointsTableRenderer } from './PointsTableRenderer';
import { KillLeaderRenderer } from './KillLeaderRenderer';
import { TopFraggersRenderer } from './TopFraggersRenderer';
import { TeamPosterRenderer } from './TeamPosterRenderer';
import { SlotsListRenderer } from './SlotsListRenderer';
import { VictoryCertificateRenderer } from './VictoryCertificateRenderer';

export interface MasterGraphicRendererProps {
  template: CustomGraphicsTemplate;
  tournament: Tournament;
  options?: {
    customTitle?: string;
    organizerName?: string;
    selectedTeamId?: string;
    winnerTeamId?: string;
    awardTitle?: string;
    awardSubtitle?: string;
    standingsData?: GraphicsRenderData;
  };
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  selectedElementKey?: string | string[] | null;
  selectedElementKeys?: string[] | null;
  onSelectElement?: (elementKey: string, e?: React.MouseEvent) => void;
  onDragElement?: (key: string, deltaX: number, deltaY: number) => void;
  isInteractive?: boolean;
}

export const MasterGraphicRenderer: React.FC<MasterGraphicRendererProps> = ({
  template,
  tournament,
  options,
  hueRotate = 0,
  svgRef,
  selectedElementKey,
  selectedElementKeys,
  onSelectElement,
  onDragElement,
  isInteractive = false
}) => {
  const templateType = template.templateType || 'POINTS_TABLE';

  switch (templateType) {
    case 'KILL_LEADER': {
      const data = getKillLeaderData(tournament, {
        customTitle: options?.customTitle,
        organizerName: options?.organizerName,
        playerId: options?.selectedTeamId
      });
      return (
        <KillLeaderRenderer
          data={data}
          artworkUrl={template.imageUrl}
          aspectRatio={template.aspectRatio}
          hueRotate={hueRotate}
          svgRef={svgRef}
        />
      );
    }

    case 'TOP_FRAGGERS': {
      const data = getTopFraggersData(tournament, {
        customTitle: options?.customTitle,
        organizerName: options?.organizerName
      });
      return (
        <TopFraggersRenderer
          data={data}
          artworkUrl={template.imageUrl}
          aspectRatio={template.aspectRatio}
          hueRotate={hueRotate}
          svgRef={svgRef}
        />
      );
    }

    case 'TEAM_POSTER': {
      const data = getTeamPosterData(tournament, options?.selectedTeamId, {
        customTitle: options?.customTitle,
        organizerName: options?.organizerName
      });
      return (
        <TeamPosterRenderer
          data={data}
          artworkUrl={template.imageUrl}
          aspectRatio={template.aspectRatio}
          hueRotate={hueRotate}
          svgRef={svgRef}
        />
      );
    }

    case 'SLOTS_LIST': {
      const data = getSlotsListData(tournament, {
        customTitle: options?.customTitle,
        organizerName: options?.organizerName
      });
      return (
        <SlotsListRenderer
          data={data}
          artworkUrl={template.imageUrl}
          aspectRatio={template.aspectRatio}
          hueRotate={hueRotate}
          svgRef={svgRef}
        />
      );
    }

    case 'VICTORY_CERTIFICATE': {
      const data = getVictoryCertificateData(tournament, options?.winnerTeamId, {
        customTitle: options?.customTitle,
        organizerName: options?.organizerName,
        awardTitle: options?.awardTitle,
        awardSubtitle: options?.awardSubtitle
      });
      return (
        <VictoryCertificateRenderer
          data={data}
          artworkUrl={template.imageUrl}
          aspectRatio={template.aspectRatio}
          hueRotate={hueRotate}
          svgRef={svgRef}
        />
      );
    }

    case 'POINTS_TABLE':
    default: {
      const data =
        options?.standingsData ||
        getPointsTableData(tournament, {
          customTitle: options?.customTitle,
          organizerName: options?.organizerName
        });
      return (
        <PointsTableRenderer
          template={template}
          data={data}
          svgRef={svgRef}
          selectedElementKey={selectedElementKey}
          selectedElementKeys={selectedElementKeys}
          onSelectElement={onSelectElement}
          onDragElement={onDragElement}
          isInteractive={isInteractive}
          hueRotate={hueRotate}
        />
      );
    }
  }
};
