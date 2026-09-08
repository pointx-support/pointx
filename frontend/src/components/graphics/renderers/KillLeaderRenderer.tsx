import React from 'react';
import type { KillLeaderRenderData } from '../../../types/customTemplate';

export interface KillLeaderRendererProps {
  data: KillLeaderRenderData;
  artworkUrl?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16';
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const KillLeaderRenderer: React.FC<KillLeaderRendererProps> = ({
  data,
  artworkUrl,
  aspectRatio = '4:5',
  hueRotate = 0,
  svgRef
}) => {
  const isLandscape = aspectRatio === '16:9';
  const width = isLandscape ? 1920 : 1080;
  const height = isLandscape ? 1080 : 1350;

  const { player, tournamentTitle, organizerName } = data;
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
        <linearGradient id="klBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A0D16" />
          <stop offset="50%" stopColor="#121727" />
          <stop offset="100%" stopColor="#080910" />
        </linearGradient>

        <linearGradient id="klCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF416C" />
          <stop offset="100%" stopColor="#FF4B2B" />
        </linearGradient>

        <linearGradient id="klGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="100%" stopColor="#FFA751" />
        </linearGradient>

        <linearGradient id="klCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#7000FF" />
        </linearGradient>

        <radialGradient id="klPulse" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FF416C" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0A0D16" stopOpacity="0" />
        </radialGradient>

        <filter id="klGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Fill or Artwork */}
      {artworkUrl ? (
        <image href={artworkUrl} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect width={width} height={height} fill="url(#klBgGrad)" />
          <rect width={width} height={height} fill="url(#klPulse)" />
        </>
      )}

      {/* Cyber Grid Lines Overlay */}
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

        {/* Free Fire Badge */}
        <g transform={`translate(${width - (isLandscape ? 470 : 350)}, 24)`}>
          <rect width="140" height="42" rx="10" fill="#FF416C" fillOpacity="0.18" stroke="#FF416C" strokeWidth="1.5" />
          <text x="70" y="27" textAnchor="middle" fill="#FF4B2B" fontFamily="sans-serif" fontWeight="900" fontSize="13" letterSpacing="1.5">
            KILL LEADER
          </text>
        </g>
      </g>

      {/* Main Title Badge */}
      <g transform={`translate(${width / 2}, 190)`}>
        <text x="0" y="0" textAnchor="middle" fill="url(#klCrimsonGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="48" letterSpacing="3" filter="url(#klGlow)">
          ⚔️ WARHEAD KILL LEADER
        </text>
        <text x="0" y="32" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="14" letterSpacing="4">
          TOURNAMENT MOST VALUABLE ELIMINATOR
        </text>
      </g>

      {/* Central Spotlight Card */}
      <g transform={`translate(${(width - 760) / 2}, 260)`}>
        <rect width="760" height="740" rx="28" fill="#151B2E" fillOpacity="0.92" stroke="url(#klCrimsonGrad)" strokeWidth="3" />
        <rect x="12" y="12" width="736" height="716" rx="20" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />

        {/* Avatar / Elimination Icon Circle */}
        <g transform="translate(380, 160)">
          <circle r="110" fill="#0B0E17" stroke="url(#klGoldGrad)" strokeWidth="5" filter="url(#klGlow)" />
          <circle r="98" fill="#182035" />
          {player.avatarUrl ? (
            <clipPath id="avatarClip">
              <circle r="98" />
            </clipPath>
          ) : null}
          {player.avatarUrl ? (
            <image href={player.avatarUrl} x="-98" y="-98" width="196" height="196" clipPath="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />
          ) : (
            <text x="0" y="26" textAnchor="middle" fill="#FFD200" fontSize="72">👑</text>
          )}
        </g>

        {/* Rank #1 Pill */}
        <g transform="translate(380, 275)">
          <rect x="-45" y="-18" width="90" height="36" rx="10" fill="#FFD200" />
          <text x="0" y="7" textAnchor="middle" fill="#000000" fontFamily="sans-serif" fontWeight="900" fontSize="18">
            #1 MVP
          </text>
        </g>

        {/* Player Name & Team */}
        <text x="380" y="350" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="46" letterSpacing="1">
          {player.name.toUpperCase()}
        </text>
        <text x="380" y="390" textAnchor="middle" fill="#FFD200" fontFamily="sans-serif" fontWeight="800" fontSize="22" letterSpacing="3">
          {player.teamName.toUpperCase()} {player.teamTag ? `[${player.teamTag}]` : ''}
        </text>

        {/* Stat Counters 3-Box HUD */}
        <g transform="translate(60, 450)">
          {/* Box 1: Total Kills */}
          <g transform="translate(0, 0)">
            <rect width="190" height="150" rx="18" fill="#0E1220" stroke="url(#klCrimsonGrad)" strokeWidth="2" />
            <text x="95" y="42" textAnchor="middle" fill="#FF4B2B" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
              TOTAL KILLS
            </text>
            <text x="95" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="56">
              {player.totalKills}
            </text>
          </g>

          {/* Box 2: Damage Dealt */}
          <g transform="translate(225, 0)">
            <rect width="190" height="150" rx="18" fill="#0E1220" stroke="url(#klGoldGrad)" strokeWidth="2" />
            <text x="95" y="42" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
              TOTAL DAMAGE
            </text>
            <text x="95" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="46">
              {player.damage}
            </text>
          </g>

          {/* Box 3: Kill / Match */}
          <g transform="translate(450, 0)">
            <rect width="190" height="150" rx="18" fill="#0E1220" stroke="url(#klCyanGrad)" strokeWidth="2" />
            <text x="95" y="42" textAnchor="middle" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
              AVG / MATCH
            </text>
            <text x="95" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="52">
              {player.avgKills}
            </text>
          </g>
        </g>

        {/* Booyah Stamp */}
        <g transform="translate(380, 670)">
          <rect x="-140" y="-20" width="280" height="40" rx="12" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1" />
          <text x="0" y="6" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="14" letterSpacing="3">
            ★ CERTIFIED KILL LEADER ★
          </text>
        </g>
      </g>

      {/* Footer Ribbon */}
      <g transform={`translate(${width / 2}, ${height - 60})`}>
        <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
          POINTX ESPORTS PLATFORM • OFFICIAL BROADCAST ASSET
        </text>
      </g>
    </svg>
  );
};
