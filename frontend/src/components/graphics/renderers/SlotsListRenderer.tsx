import React from 'react';
import type { SlotsListRenderData } from '../../../types/customTemplate';

export interface SlotsListRendererProps {
  data: SlotsListRenderData;
  artworkUrl?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16';
  hueRotate?: number;
  layoutMode?: string;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const SlotsListRenderer: React.FC<SlotsListRendererProps> = ({
  data,
  artworkUrl,
  aspectRatio = '4:5',
  hueRotate = 0,
  layoutMode = 'dual_grid',
  svgRef
}) => {
  const isLandscape = aspectRatio === '16:9';
  const width = isLandscape ? 1920 : 1080;
  const height = isLandscape ? 1080 : 1350;

  const { slots, tournamentTitle, organizerName } = data;
  const filterStyle = hueRotate ? { filter: `hue-rotate(${hueRotate}deg)` } : undefined;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={filterStyle}
      className="w-full h-auto block select-none drop-shadow-2xl"
    >
      <defs>
        <linearGradient id="slBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0D16" />
          <stop offset="50%" stopColor="#141829" />
          <stop offset="100%" stopColor="#080912" />
        </linearGradient>

        <linearGradient id="slGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="50%" stopColor="#FFA751" />
          <stop offset="100%" stopColor="#FFD200" />
        </linearGradient>

        <radialGradient id="slPulse" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFD200" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0B0D16" stopOpacity="0" />
        </radialGradient>

        <filter id="slGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Fill or Custom Artwork */}
      {artworkUrl ? (
        <image href={artworkUrl} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect width={width} height={height} fill="url(#slBgGrad)" />
          <rect width={width} height={height} fill="url(#slPulse)" />
        </>
      )}

      {/* Cyber Grid Lines */}
      <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 100} x2={width} y2={i * 100} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2={height} />
        ))}
      </g>

      {/* Top Header Branding Banner */}
      <g transform={`translate(${isLandscape ? 120 : 60}, 50)`}>
        <rect
          width={width - (isLandscape ? 240 : 120)}
          height="90"
          rx="16"
          fill="#151928"
          fillOpacity="0.85"
          stroke="#ffffff"
          strokeOpacity="0.12"
        />
        <text x="30" y="42" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="24" letterSpacing="1">
          {tournamentTitle.toUpperCase()}
        </text>
        <text x="30" y="68" fill="#FFD200" fontFamily="monospace" fontWeight="700" fontSize="13" letterSpacing="2">
          ORGANIZED BY: {organizerName.toUpperCase()}
        </text>

        <g transform={`translate(${width - (isLandscape ? 470 : 350)}, 24)`}>
          <rect width="140" height="42" rx="10" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1.5" />
          <text x="70" y="27" textAnchor="middle" fill="#FFD200" fontFamily="sans-serif" fontWeight="900" fontSize="13" letterSpacing="1.5">
            SLOTS MATRIX
          </text>
        </g>
      </g>

      {/* Main Title Badge */}
      <g transform={`translate(${width / 2}, 180)`}>
        <text x="0" y="0" textAnchor="middle" fill="url(#slGoldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="46" letterSpacing="3" filter="url(#slGlow)">
          📋 TOURNAMENT SLOTS MATRIX
        </text>
        <text x="0" y="32" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="14" letterSpacing="4">
          OFFICIAL SQUAD ALLOCATION (NO POINTS / SCORES)
        </text>
      </g>

      {/* 12 Slots in Dual Grid or Single Column */}
      {layoutMode === 'single_column' ? (
        <g transform={`translate(${(width - 860) / 2}, 240)`}>
          {slots.slice(0, 12).map((slot, idx) => {
            const yPos = idx * 72;
            const slotFormatted = slot.slotNumber.toString().padStart(2, '0');

            return (
              <g key={idx} transform={`translate(0, ${yPos})`}>
                <rect
                  width="860"
                  height="62"
                  rx="14"
                  fill="#121626"
                  stroke={slot.isConfirmed ? '#FFD200' : '#ffffff'}
                  strokeOpacity={slot.isConfirmed ? 0.6 : 0.15}
                  strokeWidth={slot.isConfirmed ? 1.5 : 1}
                />
                {/* Slot Number Pill */}
                <rect x="15" y="11" width="60" height="40" rx="10" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1.5" />
                <text x="45" y="38" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="20">
                  {slotFormatted}
                </text>
                {/* Team Name */}
                <text x={slot.logoUrl ? 135 : 95} y="38" fill={slot.isConfirmed ? '#FFFFFF' : '#718096'} fontFamily="sans-serif" fontWeight="900" fontSize="20">
                  {slot.teamName.toUpperCase()}
                </text>
                {slot.teamTag && (
                  <text x={slot.logoUrl ? 320 : 280} y="37" fill="#FFD200" fontFamily="monospace" fontWeight="800" fontSize="13">
                    [{slot.teamTag.toUpperCase()}]
                  </text>
                )}
                {/* Status Indicator */}
                <text x="780" y="37" textAnchor="end" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="12" letterSpacing="1">
                  {slot.isConfirmed ? 'CONFIRMED' : 'OPEN'}
                </text>
                <circle cx="815" cy="32" r="6" fill={slot.isConfirmed ? '#10B981' : '#4B5563'} />
              </g>
            );
          })}
        </g>
      ) : (
        <g transform={`translate(${(width - 940) / 2}, 240)`}>
          {slots.slice(0, 12).map((slot, idx) => {
            const col = idx < 6 ? 0 : 1;
            const row = idx % 6;
            const xPos = col * 485;
            const yPos = row * 155;
            const slotFormatted = slot.slotNumber.toString().padStart(2, '0');

            return (
              <g key={idx} transform={`translate(${xPos}, ${yPos})`}>
                <rect
                  width="455"
                  height="135"
                  rx="20"
                  fill="#121626"
                  stroke={slot.isConfirmed ? '#FFD200' : '#ffffff'}
                  strokeOpacity={slot.isConfirmed ? 0.6 : 0.15}
                  strokeWidth={slot.isConfirmed ? 1.5 : 1}
                />

                {/* Slot Number Pill */}
                <rect x="20" y="25" width="85" height="85" rx="16" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1.5" />
                <text x="62" y="78" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="32">
                  {slotFormatted}
                </text>

                {/* Team Logo (if present) */}
                {slot.logoUrl ? (
                  <image href={slot.logoUrl} x="120" y="30" width="40" height="40" preserveAspectRatio="xMidYMid meet" />
                ) : null}

                {/* Team Name */}
                <text x={slot.logoUrl ? 170 : 125} y="62" fill={slot.isConfirmed ? '#FFFFFF' : '#718096'} fontFamily="sans-serif" fontWeight="900" fontSize="24">
                  {slot.teamName.toUpperCase()}
                </text>
                <text x={slot.logoUrl ? 170 : 125} y="92" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="13" letterSpacing="1">
                  {slot.isConfirmed ? `SLOT ${slotFormatted} • CONFIRMED` : 'WAITING FOR SQUAD'}
                </text>

                {/* Status Dot */}
                <circle cx="420" cy="67" r="8" fill={slot.isConfirmed ? '#10B981' : '#4B5563'} />
              </g>
            );
          })}
        </g>
      )}

      {/* Footer */}
      <g transform={`translate(${width / 2}, ${height - 40})`}>
        <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
          POINTX ESPORTS • OFFICIAL TOURNAMENT SLOTS MATRIX
        </text>
      </g>
    </svg>
  );
};
