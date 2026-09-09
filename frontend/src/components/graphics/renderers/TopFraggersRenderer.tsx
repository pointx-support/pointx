import React from 'react';
import type { TopFraggersRenderData } from '../../../types/customTemplate';

export interface TopFraggersRendererProps {
  data: TopFraggersRenderData;
  artworkUrl?: string;
  aspectRatio?: '16:9' | '4:5' | '1:1' | '9:16';
  hueRotate?: number;
  layoutMode?: 'podium' | 'horizontal_cards' | 'vertical_cards' | string;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const TopFraggersRenderer: React.FC<TopFraggersRendererProps> = ({
  data,
  artworkUrl,
  aspectRatio = '4:5',
  hueRotate = 0,
  layoutMode = 'vertical_cards',
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

  const top3 = players.slice(0, 3);

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

      {/* 2. PODIUM LAYOUT (1st Center Stage, 2nd Left, 3rd Right) */}
      {layoutMode === 'podium' ? (
        <g transform={`translate(${width / 2}, 300)`}>
          {/* Reorder players for podium: [2nd (left), 1st (center), 3rd (right)] */}
          {[
            { p: top3[1], rankIdx: 1, xOffset: -320, yOffset: 70, w: 290, h: 420 },
            { p: top3[0], rankIdx: 0, xOffset: -160, yOffset: 0, w: 320, h: 490 },
            { p: top3[2], rankIdx: 2, xOffset: 190, yOffset: 110, w: 290, h: 380 },
          ].map((item, idx) => {
            if (!item.p) return null;
            const p = item.p;
            const cfg = rankBadges[item.rankIdx] || rankBadges[2];
            const isMVP = item.rankIdx === 0;

            return (
              <g key={p.id || idx} transform={`translate(${item.xOffset}, ${item.yOffset})`}>
                <rect
                  width={item.w}
                  height={item.h}
                  rx="24"
                  fill={cfg.bg}
                  stroke={cfg.border}
                  strokeWidth={isMVP ? 3.5 : 1.5}
                  filter={isMVP ? 'url(#tfGlow)' : undefined}
                />

                {/* Pedestal Crown / Medal */}
                <g transform={`translate(${item.w / 2}, 45)`}>
                  <circle r="36" fill="#0C0F1A" stroke={cfg.color} strokeWidth="3" />
                  <text x="0" y="12" textAnchor="middle" fontSize="32">
                    {item.rankIdx === 0 ? '👑' : item.rankIdx === 1 ? '🥈' : '🥉'}
                  </text>
                </g>

                {/* Player Name */}
                <text x={item.w / 2} y="135" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="24">
                  {p.name.toUpperCase()}
                </text>

                {/* Team Tag */}
                <text x={item.w / 2} y="165" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="13">
                  {p.teamName.toUpperCase()} {p.teamTag ? `[${p.teamTag}]` : ''}
                </text>

                {/* Kill Counter Box */}
                <g transform={`translate(${(item.w - 180) / 2}, 205)`}>
                  <rect width="180" height="90" rx="18" fill="#0E121E" stroke={cfg.color} strokeWidth="1.5" />
                  <text x="90" y="55" textAnchor="middle" fill={cfg.color} fontFamily="sans-serif" fontWeight="900" fontSize="54">
                    {p.totalKills}
                  </text>
                  <text x="90" y="78" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="800" fontSize="11" letterSpacing="2">
                    KILLS
                  </text>
                </g>

                {/* Rank Pill */}
                <g transform={`translate(${(item.w - 140) / 2}, ${item.h - 55})`}>
                  <rect width="140" height="34" rx="10" fill={cfg.color} fillOpacity="0.2" stroke={cfg.color} strokeWidth="1.5" />
                  <text x="70" y="22" textAnchor="middle" fill={cfg.color} fontFamily="monospace" fontWeight="900" fontSize="12" letterSpacing="1.5">
                    {cfg.title}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      ) : layoutMode === 'horizontal_cards' ? (
        /* 3. 3 HORIZONTAL SIDE-BY-SIDE CARDS */
        <g transform={`translate(${(width - 960) / 2}, 260)`}>
          {top3.map((p, idx) => {
            const cfg = rankBadges[idx] || rankBadges[2];
            const xOffset = idx * 330;

            return (
              <g key={p.id || idx} transform={`translate(${xOffset}, 0)`}>
                <rect
                  width="300"
                  height="520"
                  rx="24"
                  fill={cfg.bg}
                  stroke={cfg.border}
                  strokeWidth={idx === 0 ? 3 : 1.5}
                />

                {/* Rank Badge Header */}
                <g transform="translate(150, 60)">
                  <circle r="40" fill="#0C0F1A" stroke={cfg.color} strokeWidth="3" />
                  <text x="0" y="14" textAnchor="middle" fontSize="36">
                    {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                  </text>
                </g>

                <text x="150" y="145" textAnchor="middle" fill={cfg.color} fontFamily="monospace" fontWeight="900" fontSize="14" letterSpacing="2">
                  {cfg.title}
                </text>

                {/* Player Name */}
                <text x="150" y="195" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="24">
                  {p.name.toUpperCase()}
                </text>

                {/* Team Info */}
                <text x="150" y="225" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="13">
                  {p.teamName.toUpperCase()}
                </text>

                {/* Kills Box */}
                <g transform="translate(45, 270)">
                  <rect width="210" height="110" rx="18" fill="#0C0F1A" stroke={cfg.color} strokeWidth="1.5" />
                  <text x="105" y="68" textAnchor="middle" fill={cfg.color} fontFamily="sans-serif" fontWeight="900" fontSize="58">
                    {p.totalKills}
                  </text>
                  <text x="105" y="95" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
                    TOTAL ELIMINATIONS
                  </text>
                </g>

                {/* Damage & Avg Kills Sub-stats */}
                <g transform="translate(45, 415)">
                  <text x="105" y="25" textAnchor="middle" fill="#E2E8F0" fontFamily="monospace" fontWeight="700" fontSize="14">
                    DMG: {p.damage ? p.damage.toLocaleString() : '1,850'}
                  </text>
                  <text x="105" y="48" textAnchor="middle" fill="#718096" fontFamily="monospace" fontWeight="700" fontSize="12">
                    AVG KILLS: {p.avgKills ? p.avgKills.toFixed(1) : (p.totalKills / 3).toFixed(1)}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      ) : (
        /* 4. VERTICAL STACKED CARDS (Default) */
        <g transform={`translate(${(width - 860) / 2}, 260)`}>
          {top3.map((p, idx) => {
            const cfg = rankBadges[idx] || rankBadges[2];
            const yOffset = idx * 240;

            return (
              <g key={p.id || idx} transform={`translate(0, ${yOffset})`}>
                <rect
                  width="860"
                  height="215"
                  rx="24"
                  fill={cfg.bg}
                  stroke={cfg.border}
                  strokeWidth={idx === 0 ? 3 : 1.5}
                  strokeOpacity={idx === 0 ? 1 : 0.8}
                />

                {/* Rank Badge */}
                <rect x="25" y="30" width="85" height="85" rx="20" fill={cfg.color} fillOpacity="0.2" stroke={cfg.color} strokeWidth="2.5" />
                <text x="67" y="85" textAnchor="middle" fill={cfg.color} fontFamily="sans-serif" fontWeight="900" fontSize="38">
                  #{p.rank}
                </text>
                <text x="67" y="145" textAnchor="middle" fill={cfg.color} fontFamily="monospace" fontWeight="900" fontSize="12" letterSpacing="1">
                  {cfg.title}
                </text>

                {/* Avatar / Icon */}
                <g transform="translate(180, 107)">
                  <circle r="60" fill="#0C0F1A" stroke={cfg.color} strokeWidth="3" />
                  <circle r="52" fill="#182035" />
                  {p.avatarUrl ? (
                    <image href={p.avatarUrl} x="-52" y="-52" width="104" height="104" preserveAspectRatio="xMidYMid slice" />
                  ) : (
                    <text x="0" y="14" textAnchor="middle" fontSize="36">{idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}</text>
                  )}
                </g>

                {/* Player & Team Identity */}
                <g transform="translate(270, 75)">
                  <text x="0" y="0" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="36" letterSpacing="1">
                    {p.name.toUpperCase()}
                  </text>
                  <g transform="translate(0, 30)">
                    {p.teamLogo && (
                      <image href={p.teamLogo} x="0" y="-18" width="24" height="24" preserveAspectRatio="xMidYMid meet" />
                    )}
                    <text x={p.teamLogo ? 32 : 0} y="0" fill="#CBD5E1" fontFamily="sans-serif" fontWeight="700" fontSize="18">
                      {p.teamName.toUpperCase()}
                    </text>
                    {p.teamTag && (
                      <text x={(p.teamLogo ? 32 : 0) + (p.teamName.length * 11) + 10} y="0" fill={cfg.color} fontFamily="monospace" fontWeight="800" fontSize="16">
                        [{p.teamTag.toUpperCase()}]
                      </text>
                    )}
                  </g>
                </g>

                {/* Elimination Stat Box */}
                <g transform="translate(640, 28)">
                  <rect width="190" height="155" rx="20" fill="#0E1220" stroke={cfg.color} strokeWidth="1.5" />
                  <text x="95" y="75" textAnchor="middle" fill={cfg.color} fontFamily="sans-serif" fontWeight="900" fontSize="64" letterSpacing="-1">
                    {p.totalKills}
                  </text>
                  <text x="95" y="105" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="900" fontSize="13" letterSpacing="2">
                    TOTAL KILLS
                  </text>
                  <line x1="25" y1="118" x2="165" y2="118" stroke="#ffffff" strokeOpacity="0.1" />
                  <text x="95" y="138" textAnchor="middle" fill="#718096" fontFamily="monospace" fontWeight="700" fontSize="11">
                    DMG: {p.damage ? p.damage.toLocaleString() : 'N/A'}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      )}

      {/* Footer System Attribution */}
      <g transform={`translate(${width / 2}, ${height - 40})`}>
        <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
          POINTX ESPORTS • AUTHORITATIVE TOURNAMENT FRAGGERS ENGINE
        </text>
      </g>
    </svg>
  );
};
