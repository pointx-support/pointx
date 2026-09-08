import React from 'react';
import type { TopFraggersRenderData } from '../../../types/customTemplate';

export interface TopFraggersRendererProps {
  data: TopFraggersRenderData;
  artworkUrl?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16';
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const TopFraggersRenderer: React.FC<TopFraggersRendererProps> = ({
  data,
  artworkUrl,
  aspectRatio = '4:5',
  hueRotate = 0,
  svgRef
}) => {
  const isLandscape = aspectRatio === '16:9';
  const width = isLandscape ? 1920 : 1080;
  const height = isLandscape ? 1080 : 1350;

  const { players, tournamentTitle, organizerName } = data;
  const filterStyle = hueRotate ? { filter: `hue-rotate(${hueRotate}deg)` } : undefined;

  // Colors for Rank 1, 2, 3
  const rankBadges = [
    { color: '#FFD200', title: '1ST MVP', border: 'url(#tfGoldGrad)', bg: '#1E2438' },
    { color: '#E2E8F0', title: '2ND RUNNER', border: '#CBD5E1', bg: '#171C2E' },
    { color: '#CD7F32', title: '3RD PLACE', border: '#D97706', bg: '#141828' }
  ];

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
        <linearGradient id="tfBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0D15" />
          <stop offset="50%" stopColor="#14182B" />
          <stop offset="100%" stopColor="#080911" />
        </linearGradient>

        <linearGradient id="tfGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="50%" stopColor="#FFA751" />
          <stop offset="100%" stopColor="#FFD200" />
        </linearGradient>

        <linearGradient id="tfCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF416C" />
          <stop offset="100%" stopColor="#FF4B2B" />
        </linearGradient>

        <radialGradient id="tfPulse" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFD200" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0B0D15" stopOpacity="0" />
        </radialGradient>

        <filter id="tfGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Fill or Custom Artwork */}
      {artworkUrl ? (
        <image href={artworkUrl} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect width={width} height={height} fill="url(#tfBgGrad)" />
          <rect width={width} height={height} fill="url(#tfPulse)" />
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
            TOP FRAGGERS
          </text>
        </g>
      </g>

      {/* Main Title Badge */}
      <g transform={`translate(${width / 2}, 190)`}>
        <text x="0" y="0" textAnchor="middle" fill="url(#tfGoldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="48" letterSpacing="3" filter="url(#tfGlow)">
          🏆 TOP 3 FRAGGERS LEADERBOARD
        </text>
        <text x="0" y="32" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="14" letterSpacing="4">
          TOURNAMENT MOST VALUABLE PLAYERS (MVP)
        </text>
      </g>

      {/* Exactly Top 3 Players Stack (Gracefully handles < 3) */}
      <g transform={`translate(${(width - 860) / 2}, 260)`}>
        {players.slice(0, 3).map((p, idx) => {
          const cfg = rankBadges[idx] || rankBadges[2];
          const yOffset = idx * 240;

          return (
            <g key={p.id || idx} transform={`translate(0, ${yOffset})`}>
              {/* Outer Card */}
              <rect
                width="860"
                height="215"
                rx="24"
                fill={cfg.bg}
                stroke={cfg.border}
                strokeWidth={idx === 0 ? 3 : 1.5}
                strokeOpacity={idx === 0 ? 1 : 0.8}
              />

              {/* Rank Badge #1, #2, #3 */}
              <rect x="25" y="30" width="85" height="85" rx="20" fill={cfg.color} fillOpacity="0.2" stroke={cfg.color} strokeWidth="2.5" />
              <text x="67" y="85" textAnchor="middle" fill={cfg.color} fontFamily="sans-serif" fontWeight="900" fontSize="38">
                #{p.rank}
              </text>
              <text x="67" y="145" textAnchor="middle" fill={cfg.color} fontFamily="monospace" fontWeight="900" fontSize="12" letterSpacing="1">
                {cfg.title}
              </text>

              {/* Avatar Photo Frame */}
              <g transform="translate(180, 107)">
                <circle r="60" fill="#0C0F1A" stroke={cfg.color} strokeWidth="3" />
                <circle r="52" fill="#182035" />
                {p.avatarUrl ? (
                  <clipPath id={`avatarClip-${idx}`}>
                    <circle r="52" />
                  </clipPath>
                ) : null}
                {p.avatarUrl ? (
                  <image href={p.avatarUrl} x="-52" y="-52" width="104" height="104" clipPath={`url(#avatarClip-${idx})`} preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <text x="0" y="14" textAnchor="middle" fontSize="36">{idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}</text>
                )}
              </g>

              {/* Player Name & Team */}
              <text x="270" y="85" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="36" letterSpacing="1">
                {p.name.toUpperCase()}
              </text>
              <text x="270" y="125" fill={cfg.color} fontFamily="sans-serif" fontWeight="800" fontSize="20" letterSpacing="2">
                {p.teamName.toUpperCase()} {p.teamTag ? `[${p.teamTag}]` : ''}
              </text>

              {/* Stat HUD (Damage & Kills) */}
              <g transform="translate(560, 45)">
                {/* Damage Box */}
                <g transform="translate(0, 0)">
                  <text x="0" y="24" fill="#94A3B8" fontFamily="monospace" fontWeight="700" fontSize="12" letterSpacing="1">
                    TOTAL DAMAGE
                  </text>
                  <text x="0" y="65" fill="#E2E8F0" fontFamily="sans-serif" fontWeight="900" fontSize="32">
                    {p.damage}
                  </text>
                </g>

                {/* Kills Box */}
                <g transform="translate(140, -10)">
                  <rect width="135" height="145" rx="18" fill="#0B0E1B" stroke="url(#tfCrimsonGrad)" strokeWidth="2" />
                  <text x="67" y="42" textAnchor="middle" fill="#FF4B2B" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
                    KILLS
                  </text>
                  <text x="67" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="54">
                    {p.totalKills}
                  </text>
                </g>
              </g>
            </g>
          );
        })}
      </g>

      {/* Footer */}
      <g transform={`translate(${width / 2}, ${height - 50})`}>
        <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
          POINTX ESPORTS • OFFICIAL MVP TOP FRAGGERS ASSET
        </text>
      </g>
    </svg>
  );
};
