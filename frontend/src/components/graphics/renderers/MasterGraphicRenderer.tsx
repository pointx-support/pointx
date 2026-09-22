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
import { DynamicCustomTemplate } from '../templates/DynamicCustomTemplate';

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
    tournamentDate?: string;
    tournamentTime?: string;
    standingsData?: GraphicsRenderData;
  };
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  selectedElementKey?: string | string[] | null;
  selectedElementKeys?: string[] | null;
  onSelectElement?: (elementKey: string, e?: React.MouseEvent) => void;
  onSelectMultipleElements?: (elementKeys: string[]) => void;
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
  onSelectMultipleElements,
  onDragElement,
  isInteractive = false
}) => {
  const templateType = template?.templateType;

  if (!templateType || templateType === 'NEEDS_REVIEW') {
    const isPortrait = template?.aspectRatio === '4:5';
    const width = isPortrait ? 1080 : 1920;
    const height = isPortrait ? 1350 : 1080;
    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        className="w-full h-auto block select-none bg-slate-950"
      >
        <rect width={width} height={height} fill="#0b0f19" />
        <rect x="40" y="40" width={width - 80} height={height - 80} rx="20" fill="#1e1528" stroke="#ef4444" strokeWidth="4" strokeDasharray="12 8" />
        <g transform={`translate(${width / 2}, ${height / 2 - 40})`}>
          <circle r="50" fill="#450a0a" stroke="#ef4444" strokeWidth="3" />
          <text x="0" y="16" textAnchor="middle" fill="#ef4444" fontSize="48" fontWeight="bold">⚠️</text>
          <text x="0" y="100" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="900" fontFamily="sans-serif">
            TEMPLATE SECTION NOT ASSIGNED
          </text>
          <text x="0" y="145" textAnchor="middle" fill="#94a3b8" fontSize="20" fontFamily="monospace">
            This template is marked as NEEDS_REVIEW. Please select a valid section in Admin Template Studio.
          </text>
        </g>
      </svg>
    );
  }

  let categoryData: any;
  if (templateType === 'KILL_LEADER') {
    categoryData = getKillLeaderData(tournament, {
      customTitle: options?.customTitle,
      organizerName: options?.organizerName,
      playerId: options?.selectedTeamId
    });
  } else if (templateType === 'TOP_FRAGGERS') {
    categoryData = getTopFraggersData(tournament, {
      customTitle: options?.customTitle,
      organizerName: options?.organizerName
    });
  } else if (templateType === 'TEAM_POSTER') {
    categoryData = getTeamPosterData(tournament, options?.selectedTeamId, {
      customTitle: options?.customTitle,
      organizerName: options?.organizerName
    });
  } else if (templateType === 'SLOTS_LIST') {
    categoryData = getSlotsListData(tournament, {
      customTitle: options?.customTitle,
      organizerName: options?.organizerName
    });
  } else if (templateType === 'VICTORY_CERTIFICATE') {
    categoryData = getVictoryCertificateData(tournament, options?.winnerTeamId, {
      customTitle: options?.customTitle,
      organizerName: options?.organizerName,
      awardTitle: options?.awardTitle,
      awardSubtitle: options?.awardSubtitle,
      tournamentDate: options?.tournamentDate,
      tournamentTime: options?.tournamentTime,
    });
  } else {
    categoryData =
      options?.standingsData ||
      getPointsTableData(tournament, {
        customTitle: options?.customTitle,
        organizerName: options?.organizerName
      });
  }

  return (
    <DynamicCustomTemplate
      template={template}
      data={categoryData}
      svgRef={svgRef}
      selectedElementKey={selectedElementKey}
      selectedElementKeys={selectedElementKeys}
      onSelectElement={onSelectElement}
      onSelectMultipleElements={onSelectMultipleElements}
      onDragElement={onDragElement}
      isInteractive={isInteractive}
      hueRotate={hueRotate}
    />
  );
};
