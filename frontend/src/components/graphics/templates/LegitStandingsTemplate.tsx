import React from 'react';
import type { GraphicsRenderData } from '../../../types/graphics';
import type { CalculatedStanding } from '../../../types/tournament';

export interface LegitStandingsTemplateProps {
  data: GraphicsRenderData;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const LegitStandingsTemplate: React.FC<LegitStandingsTemplateProps> = ({
  data,
  svgRef
}) => {
  const { rows, subtitle } = data;

  const leftRows: (CalculatedStanding | null)[] = [];
  const rightRows: (CalculatedStanding | null)[] = [];

  for (let i = 0; i < 6; i++) {
    leftRows.push(rows[i] || null);
  }
  for (let i = 6; i < 12; i++) {
    rightRows.push(rows[i] || null);
  }

  // Row Renderer for Left & Right Columns
  const renderRow = (
    row: CalculatedStanding | null,
    rowIndex: number,
    isRightColumn: boolean
  ) => {
    const baseY = 538 + rowIndex * 84.5;
    const rank = isRightColumn ? rowIndex + 7 : rowIndex + 1;
    const rankStr = rank.toString().padStart(2, '0');

    const xRank = isRightColumn ? 1048 : 132;
    const xTeam = isRightColumn ? 1122 : 206;
    const xMatch = isRightColumn ? 1446 : 530;
    const xBooyah = isRightColumn ? 1528 : 612;
    const xKills = isRightColumn ? 1610 : 695;
    const xPlace = isRightColumn ? 1692 : 778;
    const xTotal = isRightColumn ? 1775 : 860;

    return (
      <g key={rank}>
        {/* RANK NUMBER */}
        <text
          x={xRank}
          y={baseY + 36}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Rajdhani', 'Teko', sans-serif"
          fontWeight="900"
          fontSize="26"
          letterSpacing="1"
        >
          {rankStr}
        </text>

        {/* TEAM NAME */}
        <text
          x={xTeam}
          y={baseY + 35}
          textAnchor="start"
          fill="#ffffff"
          fontFamily="'Rajdhani', 'Space Grotesk', sans-serif"
          fontWeight="800"
          fontSize="22"
          letterSpacing="0.5"
        >
          {row ? row.teamName.slice(0, 18) : '—'}
        </text>

        {/* MATCH PLAYED */}
        <text
          x={xMatch}
          y={baseY + 36}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Rajdhani', 'Teko', sans-serif"
          fontWeight="800"
          fontSize="24"
        >
          {row ? row.matchesPlayed : '—'}
        </text>

        {/* BOOYAH */}
        <text
          x={xBooyah}
          y={baseY + 36}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Rajdhani', 'Teko', sans-serif"
          fontWeight="800"
          fontSize="24"
        >
          {row ? row.booyahs : '—'}
        </text>

        {/* KILLS */}
        <text
          x={xKills}
          y={baseY + 36}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Rajdhani', 'Teko', sans-serif"
          fontWeight="800"
          fontSize="24"
        >
          {row ? row.totalKills : '—'}
        </text>

        {/* PLACE PTS */}
        <text
          x={xPlace}
          y={baseY + 36}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Rajdhani', 'Teko', sans-serif"
          fontWeight="800"
          fontSize="24"
        >
          {row ? row.placementPoints : '—'}
        </text>

        {/* TOTAL PTS */}
        <text
          x={xTotal}
          y={baseY + 36}
          textAnchor="middle"
          fill="#00f0ff"
          fontFamily="'Rajdhani', 'Teko', sans-serif"
          fontWeight="900"
          fontSize="26"
        >
          {row ? row.totalPoints : '—'}
        </text>
      </g>
    );
  };

  const isCustomSubtitle = subtitle && subtitle !== 'OVERALL';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1920 1080"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block select-none"
    >
      <defs>
        <filter id="legitCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00f0ff" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 1. OFFICIAL MASTER TEMPLATE BACKGROUND IMAGE */}
      <image
        href="/templates/legit_standings.jpg"
        width="1920"
        height="1080"
        preserveAspectRatio="none"
      />

      {/* 2. DYNAMIC SUBTITLE OVERLAY IF MATCH-SPECIFIC */}
      {isCustomSubtitle && (
        <g transform="translate(890, 120)">
          <rect
            x="0"
            y="0"
            width="560"
            height="75"
            rx="12"
            fill="#051d38"
            stroke="#00f0ff"
            strokeWidth="3"
          />
          <text
            x="280"
            y="52"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Rajdhani', sans-serif"
            fontWeight="900"
            fontSize="48"
            letterSpacing="8"
            filter="url(#legitCyanGlow)"
          >
            {subtitle}
          </text>
        </g>
      )}

      {/* 3. ROWS DATA OVERLAY */}
      {leftRows.map((row, idx) => renderRow(row, idx, false))}
      {rightRows.map((row, idx) => renderRow(row, idx, true))}
    </svg>
  );
};