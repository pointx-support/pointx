import React from 'react';
import type { VictoryCertificateRenderData } from '../../../types/customTemplate';

export interface VictoryCertificateRendererProps {
  data: VictoryCertificateRenderData;
  artworkUrl?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16';
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const VictoryCertificateRenderer: React.FC<VictoryCertificateRendererProps> = ({
  data,
  artworkUrl,
  aspectRatio = '16:9',
  hueRotate = 0,
  svgRef
}) => {
  const isLandscape = aspectRatio === '16:9';
  const width = isLandscape ? 1920 : 1080;
  const height = isLandscape ? 1080 : 1350;

  const { winner, tournamentTitle, tournamentDate, tournamentTime, organizerName, organizerSignature, awardTitle, awardSubtitle, certificateId } = data;
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
        <linearGradient id="vcBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A0D18" />
          <stop offset="50%" stopColor="#121626" />
          <stop offset="100%" stopColor="#080A12" />
        </linearGradient>

        <linearGradient id="vcGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="50%" stopColor="#FFA751" />
          <stop offset="100%" stopColor="#FFD200" />
        </linearGradient>

        <radialGradient id="vcPulse" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFD200" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0A0D18" stopOpacity="0" />
        </radialGradient>

        <filter id="vcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Fill or Custom Artwork */}
      {artworkUrl ? (
        <image href={artworkUrl} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect width={width} height={height} fill="url(#vcBgGrad)" />
          <rect width={width} height={height} fill="url(#vcPulse)" />
        </>
      )}

      {/* Ornate Gold Border Double Frame */}
      <rect x="40" y="40" width={width - 80} height={height - 80} rx="30" fill="none" stroke="url(#vcGoldGrad)" strokeWidth="6" />
      <rect x="56" y="56" width={width - 112} height={height - 112} rx="22" fill="#0C0F1A" fillOpacity="0.85" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" />

      {/* Certificate Header Banner */}
      <g transform={`translate(${width / 2}, 160)`}>
        <text x="0" y="0" textAnchor="middle" fill="url(#vcGoldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="24" letterSpacing="6">
          POINTX ESPORTS PLATFORM
        </text>
        <text x="0" y="70" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="68" letterSpacing="4" filter="url(#vcGlow)">
          CERTIFICATE OF VICTORY
        </text>
        <text x="0" y="115" textAnchor="middle" fill="#A0AEC0" fontFamily="sans-serif" fontWeight="700" fontSize="18" letterSpacing="5">
          OFFICIAL GRAND CHAMPIONSHIP ACCREDITATION
        </text>
      </g>

      {/* Presentation Body */}
      <g transform={`translate(${width / 2}, 370)`}>
        <text x="0" y="0" textAnchor="middle" fill="#CBD5E0" fontFamily="sans-serif" fontWeight="600" fontSize="22" letterSpacing="3">
          THIS CERTIFIES THAT THE RESPECTED SQUAD
        </text>

        {/* Winner Team Name & Tag */}
        <text x="0" y="90" textAnchor="middle" fill="url(#vcGoldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="76" letterSpacing="3" filter="url(#vcGlow)">
          {winner.teamName.toUpperCase()}
        </text>
        {winner.teamTag && (
          <text x="0" y="130" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="800" fontSize="20" letterSpacing="3">
            [{winner.teamTag.toUpperCase()}]
          </text>
        )}

        <text x="0" y="180" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="700" fontSize="22" letterSpacing="2">
          HAS EARNED THE PRESTIGIOUS TITLE OF
        </text>

        {/* Award Title: CHAMPION / 1ST PLACE / MVP */}
        <text x="0" y="235" textAnchor="middle" fill="#FFD200" fontFamily="sans-serif" fontWeight="900" fontSize="42" letterSpacing="3">
          ★ {awardTitle.toUpperCase()} ★
        </text>

        {awardSubtitle && (
          <text x="0" y="275" textAnchor="middle" fill="#CBD5E1" fontFamily="sans-serif" fontStyle="italic" fontWeight="600" fontSize="18">
            "{awardSubtitle}"
          </text>
        )}

        <text x="0" y="325" textAnchor="middle" fill="#E2E8F0" fontFamily="sans-serif" fontWeight="800" fontSize="26" letterSpacing="2">
          IN "{tournamentTitle.toUpperCase()}"
        </text>
      </g>

      {/* Signatures, Seal & Governance Row */}
      <g transform={`translate(150, ${height - 230})`}>
        {/* Left: Authorized Host */}
        <g transform="translate(100, 0)">
          <line x1="0" y1="50" x2="320" y2="50" stroke="#FFD200" strokeWidth="2" />
          <text x="160" y="38" textAnchor="middle" fill="#E2E8F0" fontFamily="monospace" fontWeight="700" fontSize="18">
            {organizerSignature || organizerName.toUpperCase()}
          </text>
          <text x="160" y="80" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="800" fontSize="13" letterSpacing="2">
            OFFICIAL TOURNAMENT HOST
          </text>
        </g>

        {/* Center: Gold Booyah Seal */}
        <g transform={`translate(${width / 2 - 150}, 20)`}>
          <circle r="65" fill="#14192B" stroke="url(#vcGoldGrad)" strokeWidth="4" filter="url(#vcGlow)" />
          <text x="0" y="15" textAnchor="middle" fontSize="48">🏆</text>
          <text x="0" y="42" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="9" letterSpacing="2">
            VERIFIED
          </text>
        </g>

        {/* Right: Date, Time & Verification ID */}
        <g transform={`translate(${width - 670}, 0)`}>
          <line x1="0" y1="50" x2="320" y2="50" stroke="#FFD200" strokeWidth="2" />
          <text x="160" y="28" textAnchor="middle" fill="#E2E8F0" fontFamily="monospace" fontWeight="700" fontSize="17">
            {tournamentDate}
          </text>
          {tournamentTime && (
            <text x="160" y="46" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="600" fontSize="12" letterSpacing="1">
              {tournamentTime}
            </text>
          )}
          <text x="160" y="80" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="800" fontSize="13" letterSpacing="2">
            DATE & TIME OF ACCREDITATION
          </text>
          {certificateId && (
            <text x="160" y="105" textAnchor="middle" fill="#4B5563" fontFamily="monospace" fontWeight="700" fontSize="11" letterSpacing="1">
              ID: {certificateId}
            </text>
          )}
        </g>
      </g>
    </svg>
  );
};
