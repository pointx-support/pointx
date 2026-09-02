import React from 'react';
import type { GraphicsRenderData } from '../../../types/graphics';
import type { CalculatedStanding } from '../../../types/tournament';

export interface StrikzStandingsTemplateProps {
  data: GraphicsRenderData;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const StrikzStandingsTemplate: React.FC<StrikzStandingsTemplateProps> = ({
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
    const baseY = 548 + rowIndex * 84;
    const rank = isRightColumn ? rowIndex + 7 : rowIndex + 1;
    const rankStr = rank.toString().padStart(2, '0');

    const xRank = isRightColumn ? 1045 : 138;
    const xTeam = isRightColumn ? 1120 : 212;
    const xMatch = isRightColumn ? 1445 : 538;
    const xBooyah = isRightColumn ? 1528 : 620;
    const xKills = isRightColumn ? 1612 : 704;
    const xPlace = isRightColumn ? 1695 : 788;
    const xTotal = isRightColumn ? 1778 : 870;

    return (
      <g key={rank}>
        {/* RANK NUMBER */}
        <text
          x={xRank}
          y={baseY + 36}
          textAnchor="middle"
          fill="#1c0700"
          fontFamily="'Teko', 'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize="36"
          letterSpacing="1"
        >
          {rankStr}
        </text>

        {/* TEAM NAME */}
        <text
          x={xTeam}
          y={baseY + 36}
          textAnchor="start"
          fill="#110500"
          fontFamily="'Rajdhani', 'Space Grotesk', sans-serif"
          fontWeight="800"
          fontSize="24"
          letterSpacing="0.5"
        >
          {row ? row.teamName.slice(0, 18) : '—'}
        </text>

        {/* MATCH PLAYED */}
        <text
          x={xMatch}
          y={baseY + 36}
          textAnchor="middle"
          fill="#1c0700"
          fontFamily="'Teko', 'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize="30"
        >
          {row ? row.matchesPlayed : '—'}
        </text>

        {/* BOOYAH */}
        <text
          x={xBooyah}
          y={baseY + 36}
          textAnchor="middle"
          fill="#1c0700"
          fontFamily="'Teko', 'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize="30"
        >
          {row ? row.booyahs : '—'}
        </text>

        {/* KILLS */}
        <text
          x={xKills}
          y={baseY + 36}
          textAnchor="middle"
          fill="#1c0700"
          fontFamily="'Teko', 'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize="30"
        >
          {row ? row.totalKills : '—'}
        </text>

        {/* PLACE PTS */}
        <text
          x={xPlace}
          y={baseY + 36}
          textAnchor="middle"
          fill="#1c0700"
          fontFamily="'Teko', 'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize="30"
        >
          {row ? row.placementPoints : '—'}
        </text>

        {/* TOTAL PTS (White Text in Red/Gold Tab) */}
        <text
          x={xTotal}
          y={baseY + 36}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Teko', 'Rajdhani', sans-serif"
          fontWeight="700"
          fontSize="32"
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
        <filter id="strikzTextGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 1. OFFICIAL MASTER TEMPLATE BACKGROUND IMAGE */}
      <image
        href="/templates/strikz_standings.jpg"
        width="1920"
        height="1080"
        preserveAspectRatio="none"
      />

      {/* 2. DYNAMIC SUBTITLE OVERLAY IF MATCH-SPECIFIC */}
      {isCustomSubtitle && (
        <g transform="translate(1080, 215)">
          <rect
            x="0"
            y="0"
            width="600"
            height="80"
            rx="12"
            fill="#7f1d1d"
            stroke="#fbbf24"
            strokeWidth="3"
          />
          <text
            x="300"
            y="58"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Teko', 'Bebas Neue', sans-serif"
            fontWeight="700"
            fontSize="64"
            letterSpacing="8"
            filter="url(#strikzTextGlow)"
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