import React from 'react';
import type { TeamPosterRenderData } from '../../../types/customTemplate';

export interface TeamPosterRendererProps {
  data: TeamPosterRenderData;
  artworkUrl?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16';
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const TeamPosterRenderer: React.FC<TeamPosterRendererProps> = ({
  data,
  artworkUrl,
  aspectRatio = '4:5',
  hueRotate = 0,
  svgRef
}) => {
  const isLandscape = aspectRatio === '16:9';
  const width = isLandscape ? 1920 : 1080;
  const height = isLandscape ? 1080 : 1350;

  const { team, tournamentTitle, organizerName } = data;
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
        <linearGradient id="tpBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#080E1B" />
          <stop offset="50%" stopColor="#10182E" />
          <stop offset="100%" stopColor="#060913" />
        </linearGradient>

        <linearGradient id="tpCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#7000FF" />
        </linearGradient>

        <linearGradient id="tpGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="100%" stopColor="#FFA751" />
        </linearGradient>

        <radialGradient id="tpPulse" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#080E1B" stopOpacity="0" />
        </radialGradient>

        <filter id="tpGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Fill or Custom Artwork */}
      {artworkUrl ? (
        <image href={artworkUrl} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect width={width} height={height} fill="url(#tpBgGrad)" />
          <rect width={width} height={height} fill="url(#tpPulse)" />
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
          <rect width="140" height="42" rx="10" fill="#00F0FF" fillOpacity="0.15" stroke="#00F0FF" strokeWidth="1.5" />
          <text x="70" y="27" textAnchor="middle" fill="#00F0FF" fontFamily="sans-serif" fontWeight="900" fontSize="13" letterSpacing="1.5">
            TEAM ROSTER
          </text>
        </g>
      </g>

      {/* Team Profile Banner */}
      <g transform={`translate(${(width - 860) / 2}, 180)`}>
        <rect width="860" height="200" rx="24" fill="#151A2C" stroke="url(#tpCyanGrad)" strokeWidth="2.5" />

        {/* Team Crest Frame */}
        <rect x="30" y="30" width="140" height="140" rx="20" fill="#0E1220" stroke="#00F0FF" strokeWidth="2" />
        {team.logoUrl ? (
          <image href={team.logoUrl} x="40" y="40" width="120" height="120" preserveAspectRatio="xMidYMid meet" />
        ) : (
          <text x="100" y="115" textAnchor="middle" fill="#00F0FF" fontSize="56">⚔️</text>
        )}

        {/* Team Name & Info */}
        <text x="200" y="85" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="42">
          {team.name.toUpperCase()}
        </text>
        <text x="200" y="125" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="18" letterSpacing="3">
          TAG: [{team.tag || 'TEAM'}] • BATTLE STATUS: VERIFIED
        </text>
        {team.slogan && (
          <text x="200" y="155" fill="#94A3B8" fontFamily="sans-serif" fontStyle="italic" fontWeight="600" fontSize="14">
            "{team.slogan}"
          </text>
        )}
      </g>

      {/* 4 Player Roster Cards */}
      <g transform={`translate(${(width - 860) / 2}, 410)`}>
        {team.players.map((p, idx) => {
          const y = idx * 160;
          const roleIcons = ['👑', '⚡', '🎯', '🛡️'];

          return (
            <g key={p.id || idx} transform={`translate(0, ${y})`}>
              <rect width="860" height="135" rx="20" fill="#121626" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />

              {/* Slot Icon Frame */}
              <rect x="25" y="25" width="85" height="85" rx="18" fill="#00F0FF" fillOpacity="0.15" stroke="#00F0FF" strokeWidth="1.5" />
              {p.photoUrl ? (
                <clipPath id={`playerClip-${idx}`}>
                  <rect x="25" y="25" width="85" height="85" rx="18" />
                </clipPath>
              ) : null}
              {p.photoUrl ? (
                <image href={p.photoUrl} x="25" y="25" width="85" height="85" clipPath={`url(#playerClip-${idx})`} preserveAspectRatio="xMidYMid slice" />
              ) : (
                <text x="67" y="78" textAnchor="middle" fontSize="38">{roleIcons[idx] || '⚡'}</text>
              )}

              {/* Player Name */}
              <text x="135" y="62" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="30">
                {p.name.toUpperCase()}
              </text>
              <text x="135" y="94" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="14" letterSpacing="2">
                {p.role || 'ROSTERED PLAYER'}
              </text>

              {/* Verified Pill */}
              <rect x="690" y="48" width="135" height="40" rx="10" fill="#00F0FF" fillOpacity="0.1" stroke="#00F0FF" strokeWidth="1" />
              <text x="757" y="73" textAnchor="middle" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="1.5">
                ACTIVE ROSTER
              </text>
            </g>
          );
        })}
      </g>

      {/* Footer */}
      <g transform={`translate(${width / 2}, ${height - 50})`}>
        <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
          POINTX ESPORTS • TEAM PROFILE BATTLE POSTER
        </text>
      </g>
    </svg>
  );
};
