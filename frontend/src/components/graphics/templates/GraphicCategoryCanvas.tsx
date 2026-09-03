import React from 'react';
import type { Tournament } from '../../../types/tournament';
import { calculateTopFraggers } from '../../../engine/standingsEngine';

export interface GraphicCategoryCanvasProps {
  category: 'warheads' | 'fraggers' | 'team-poster' | 'slots-list' | 'certificate';
  tournament: Tournament;
  tournamentTitle: string;
  organizerName: string;
  tournamentLogo?: string;
  organizerLogo?: string;
  selectedTeamId?: string;
  hueRotate?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const GraphicCategoryCanvas: React.FC<GraphicCategoryCanvasProps> = ({
  category,
  tournament,
  tournamentTitle,
  organizerName,
  tournamentLogo: _tournamentLogo,
  organizerLogo: _organizerLogo,
  selectedTeamId,
  hueRotate = 0,
  svgRef,
}) => {
  const topFraggers = calculateTopFraggers(tournament);
  const killLeader = topFraggers[0] || {
    rank: 1,
    playerId: 'demo-1',
    playerName: 'ViperX',
    teamId: 't-demo',
    teamName: tournament.teams[0]?.name || 'Alpha Squad',
    teamTag: 'ALP',
    totalKills: 14,
    matchesPlayed: tournament.matches.length || 1,
    avgKills: 14,
    bestMatchKills: 8,
    damage: 2590,
  };

  const selectedTeam =
    tournament.teams.find((t) => t.id === selectedTeamId) ||
    tournament.teams[0] || {
      id: 'team-demo',
      name: 'Alpha Esports',
      tag: 'ALP',
      players: [
        { id: 'p1', name: 'AlphaCaptain' },
        { id: 'p2', name: 'GhostSniper' },
        { id: 'p3', name: 'NeonRusher' },
        { id: 'p4', name: 'ShadowSupport' },
      ],
    };

  // Dimensions: 1080 x 1350 for portrait posters, 1920 x 1080 for certificate
  const isLandscapeCert = category === 'certificate';
  const width = isLandscapeCert ? 1920 : 1080;
  const height = isLandscapeCert ? 1080 : 1350;

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
        {/* Gradients */}
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0D14" />
          <stop offset="50%" stopColor="#121624" />
          <stop offset="100%" stopColor="#080A0F" />
        </linearGradient>

        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE259" />
          <stop offset="50%" stopColor="#FFA751" />
          <stop offset="100%" stopColor="#FFD200" />
        </linearGradient>

        <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF416C" />
          <stop offset="100%" stopColor="#FF4B2B" />
        </linearGradient>

        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#7000FF" />
        </linearGradient>

        <radialGradient id="glowPulse" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#FFD200" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0B0D14" stopOpacity="0" />
        </radialGradient>

        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Background Fill & Texture */}
      <rect width={width} height={height} fill="url(#bgGrad)" />
      <rect width={width} height={height} fill="url(#glowPulse)" />

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
      <g transform="translate(60, 50)">
        <rect width={width - 120} height="90" rx="16" fill="#151928" fillOpacity="0.8" stroke="#ffffff" strokeOpacity="0.1" />
        {/* Tournament Title */}
        <text x="30" y="42" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="24" letterSpacing="1">
          {tournamentTitle.toUpperCase()}
        </text>
        <text x="30" y="68" fill="#FFD200" fontFamily="monospace" fontWeight="700" fontSize="13" letterSpacing="2">
          ORGANIZED BY: {organizerName.toUpperCase()}
        </text>

        {/* Game Tag */}
        <g transform={`translate(${width - 290}, 24)`}>
          <rect width="140" height="42" rx="10" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1.5" />
          <text x="70" y="27" textAnchor="middle" fill="#FFD200" fontFamily="sans-serif" fontWeight="900" fontSize="13" letterSpacing="1.5">
            FREE FIRE PRO
          </text>
        </g>
      </g>

      {/* ========================================================================= */}
      {/* CATEGORY 1: WARHEADS / KILL LEADER                                       */}
      {/* ========================================================================= */}
      {category === 'warheads' && (
        <g transform="translate(0, 170)">
          {/* Main Title Badge */}
          <g transform={`translate(${width / 2}, 40)`}>
            <text x="0" y="0" textAnchor="middle" fill="url(#crimsonGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="48" letterSpacing="3" filter="url(#goldGlow)">
              ⚔️ WARHEAD KILL LEADER
            </text>
            <text x="0" y="32" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="14" letterSpacing="4">
              TOURNAMENT MOST VALUABLE ELIMINATOR
            </text>
          </g>

          {/* Central Kill Leader Spotlight Card */}
          <g transform={`translate(${(width - 760) / 2}, 110)`}>
            {/* Outer Glowing Hex Frame */}
            <rect width="760" height="740" rx="28" fill="#151B2E" fillOpacity="0.9" stroke="url(#crimsonGrad)" strokeWidth="3" />
            <rect x="12" y="12" width="736" height="716" rx="20" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />

            {/* Avatar / Elimination Icon Circle */}
            <g transform="translate(380, 170)">
              <circle r="110" fill="#0B0E17" stroke="url(#goldGrad)" strokeWidth="5" filter="url(#goldGlow)" />
              <circle r="98" fill="#182035" />
              <text x="0" y="24" textAnchor="middle" fill="#FFD200" fontSize="72">👑</text>
            </g>

            {/* Player Name & Team */}
            <text x="380" y="340" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="44" letterSpacing="1">
              {killLeader.playerName.toUpperCase()}
            </text>
            <text x="380" y="380" textAnchor="middle" fill="#FFD200" fontFamily="sans-serif" fontWeight="800" fontSize="22" letterSpacing="3">
              {killLeader.teamName.toUpperCase()}
            </text>

            {/* Stat Counters 3-Box HUD */}
            <g transform="translate(60, 440)">
              {/* Box 1: Total Kills */}
              <g transform="translate(0, 0)">
                <rect width="190" height="150" rx="18" fill="#0E1220" stroke="url(#crimsonGrad)" strokeWidth="2" />
                <text x="95" y="42" textAnchor="middle" fill="#FF4B2B" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
                  TOTAL KILLS
                </text>
                <text x="95" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="56">
                  {killLeader.totalKills}
                </text>
              </g>

              {/* Box 2: Damage Dealt */}
              <g transform="translate(225, 0)">
                <rect width="190" height="150" rx="18" fill="#0E1220" stroke="url(#goldGrad)" strokeWidth="2" />
                <text x="95" y="42" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
                  TOTAL DAMAGE
                </text>
                <text x="95" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="48">
                  {killLeader.damage || killLeader.totalKills * 185}
                </text>
              </g>

              {/* Box 3: Kill / Match */}
              <g transform="translate(450, 0)">
                <rect width="190" height="150" rx="18" fill="#0E1220" stroke="url(#cyanGrad)" strokeWidth="2" />
                <text x="95" y="42" textAnchor="middle" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="2">
                  AVG / MATCH
                </text>
                <text x="95" y="105" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="52">
                  {killLeader.avgKills ? killLeader.avgKills.toFixed(1) : (killLeader.totalKills / Math.max(1, tournament.matches.length)).toFixed(1)}
                </text>
              </g>
            </g>

            {/* Booyah Stamp */}
            <g transform="translate(380, 660)">
              <rect x="-140" y="-20" width="280" height="40" rx="12" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1" />
              <text x="0" y="6" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="14" letterSpacing="3">
                ★ CERTIFIED KILL LEADER ★
              </text>
            </g>
          </g>

          {/* Footer Ribbon */}
          <g transform={`translate(${width / 2}, 980)`}>
            <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
              POINTX ESPORTS PLATFORM • OFFICIAL BROADCAST ASSET
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 2: TOP FRAGGERS / MVP                                           */}
      {/* ========================================================================= */}
      {category === 'fraggers' && (
        <g transform="translate(0, 160)">
          {/* Header */}
          <g transform={`translate(${width / 2}, 30)`}>
            <text x="0" y="0" textAnchor="middle" fill="url(#goldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="44" letterSpacing="2">
              🏆 TOP FRAGGERS LEADERBOARD
            </text>
            <text x="0" y="28" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="13" letterSpacing="3">
              OVERALL ELIMINATION RANKINGS
            </text>
          </g>

          {/* Leaderboard Stack (Top 6) */}
          <g transform={`translate(${(width - 860) / 2}, 80)`}>
            {topFraggers.slice(0, 6).map((frag, idx) => {
              const isFirst = idx === 0;
              const yOffset = idx * 135;
              const rankColor = isFirst ? '#FFD200' : idx === 1 ? '#E2E8F0' : idx === 2 ? '#CD7F32' : '#718096';

              return (
                <g key={idx} transform={`translate(0, ${yOffset})`}>
                  {/* Card Container */}
                  <rect
                    width="860"
                    height="115"
                    rx="20"
                    fill={isFirst ? '#182035' : '#121626'}
                    stroke={isFirst ? 'url(#goldGrad)' : '#ffffff'}
                    strokeOpacity={isFirst ? 1 : 0.12}
                    strokeWidth={isFirst ? 2.5 : 1}
                  />

                  {/* Rank Badge */}
                  <rect x="20" y="20" width="75" height="75" rx="16" fill={rankColor} fillOpacity="0.18" stroke={rankColor} strokeWidth="2" />
                  <text x="57" y="68" textAnchor="middle" fill={rankColor} fontFamily="sans-serif" fontWeight="900" fontSize="32">
                    #{idx + 1}
                  </text>

                  {/* Player & Team Info */}
                  <text x="120" y="52" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="26">
                    {frag.playerName.toUpperCase()}
                  </text>
                  <text x="120" y="82" fill="#FFD200" fontFamily="sans-serif" fontWeight="700" fontSize="15" letterSpacing="1.5">
                    {frag.teamName.toUpperCase()}
                  </text>

                  {/* Damage Pill */}
                  <g transform="translate(560, 38)">
                    <text x="0" y="16" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="11" letterSpacing="1">
                      DMG
                    </text>
                    <text x="0" y="42" fill="#E2E8F0" fontFamily="sans-serif" fontWeight="800" fontSize="22">
                      {frag.damage || frag.totalKills * 190}
                    </text>
                  </g>

                  {/* Kills Pill Box */}
                  <g transform="translate(680, 22)">
                    <rect width="150" height="70" rx="14" fill="#0A0D18" stroke={isFirst ? 'url(#goldGrad)' : '#ffffff'} strokeOpacity={isFirst ? 1 : 0.2} strokeWidth="1.5" />
                    <text x="75" y="26" textAnchor="middle" fill="#FF4B2B" fontFamily="monospace" fontWeight="800" fontSize="11" letterSpacing="2">
                      KILLS
                    </text>
                    <text x="75" y="58" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="28">
                      {frag.totalKills}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Footer */}
          <g transform={`translate(${width / 2}, 980)`}>
            <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
              POINTX ESPORTS • MVP STANDINGS LEADERBOARD
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 3: TEAM ROSTER POSTER                                           */}
      {/* ========================================================================= */}
      {category === 'team-poster' && (
        <g transform="translate(0, 160)">
          {/* Header */}
          <g transform={`translate(${width / 2}, 30)`}>
            <text x="0" y="0" textAnchor="middle" fill="url(#cyanGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="46" letterSpacing="2">
              🛡️ OFFICIAL TEAM ROSTER
            </text>
            <text x="0" y="28" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="13" letterSpacing="3">
              SQUAD REGISTRATION PROFILE
            </text>
          </g>

          {/* Team Profile Banner */}
          <g transform={`translate(${(width - 860) / 2}, 80)`}>
            <rect width="860" height="190" rx="24" fill="#151A2C" stroke="url(#cyanGrad)" strokeWidth="2.5" />

            {/* Team Crest Frame */}
            <rect x="30" y="25" width="140" height="140" rx="20" fill="#0E1220" stroke="#00F0FF" strokeWidth="2" />
            <text x="100" y="110" textAnchor="middle" fill="#00F0FF" fontSize="56">⚔️</text>

            {/* Team Name */}
            <text x="200" y="85" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="42">
              {selectedTeam.name.toUpperCase()}
            </text>
            <text x="200" y="125" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="18" letterSpacing="3">
              TAG: [{selectedTeam.tag || 'TEAM'}] • BATTLE STATUS: VERIFIED
            </text>
          </g>

          {/* 4 Player Roster Cards */}
          <g transform={`translate(${(width - 860) / 2}, 310)`}>
            {[
              { role: 'CAPTAIN / IGL', name: selectedTeam.players?.[0]?.name || 'Player 1', icon: '👑' },
              { role: 'PRIMARY RUSHER', name: selectedTeam.players?.[1]?.name || 'Player 2', icon: '⚡' },
              { role: 'MARKSMAN / SNIPER', name: selectedTeam.players?.[2]?.name || 'Player 3', icon: '🎯' },
              { role: 'SUPPORT / FLANKER', name: selectedTeam.players?.[3]?.name || 'Player 4', icon: '🛡️' },
            ].map((p, idx) => {
              const y = idx * 135;
              return (
                <g key={idx} transform={`translate(0, ${y})`}>
                  <rect width="860" height="115" rx="20" fill="#121626" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />
                  {/* Slot Icon */}
                  <rect x="25" y="20" width="75" height="75" rx="16" fill="#00F0FF" fillOpacity="0.15" stroke="#00F0FF" strokeWidth="1.5" />
                  <text x="62" y="68" textAnchor="middle" fontSize="32">{p.icon}</text>

                  {/* Player Name */}
                  <text x="125" y="52" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="28">
                    {p.name.toUpperCase()}
                  </text>
                  <text x="125" y="82" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="13" letterSpacing="2">
                    {p.role}
                  </text>

                  <rect x="690" y="38" width="135" height="40" rx="10" fill="#00F0FF" fillOpacity="0.1" stroke="#00F0FF" strokeWidth="1" />
                  <text x="757" y="63" textAnchor="middle" fill="#00F0FF" fontFamily="monospace" fontWeight="800" fontSize="12" letterSpacing="1.5">
                    ROSTERED
                  </text>
                </g>
              );
            })}
          </g>

          {/* Footer */}
          <g transform={`translate(${width / 2}, 980)`}>
            <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
              POINTX ESPORTS • TEAM PROFILE BATTLE POSTER
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 4: SLOTS LIST                                                   */}
      {/* ========================================================================= */}
      {category === 'slots-list' && (
        <g transform="translate(0, 160)">
          {/* Header */}
          <g transform={`translate(${width / 2}, 30)`}>
            <text x="0" y="0" textAnchor="middle" fill="url(#goldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="44" letterSpacing="2">
              📋 TOURNAMENT SLOTS MATRIX
            </text>
            <text x="0" y="28" textAnchor="middle" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="13" letterSpacing="3">
              12 SQUAD SLOTS ALLOCATION
            </text>
          </g>

          {/* 12 Slots in 2 Columns */}
          <g transform={`translate(${(width - 920) / 2}, 80)`}>
            {Array.from({ length: 12 }).map((_, idx) => {
              const col = idx < 6 ? 0 : 1;
              const row = idx % 6;
              const xPos = col * 475;
              const yPos = row * 115;
              const team = tournament.teams[idx];
              const slotNumber = (idx + 1).toString().padStart(2, '0');

              return (
                <g key={idx} transform={`translate(${xPos}, ${yPos})`}>
                  <rect
                    width="445"
                    height="95"
                    rx="16"
                    fill="#121626"
                    stroke={team ? '#FFD200' : '#ffffff'}
                    strokeOpacity={team ? 0.6 : 0.1}
                    strokeWidth={team ? 1.5 : 1}
                  />

                  {/* Slot Pill */}
                  <rect x="18" y="18" width="60" height="60" rx="12" fill="#FFD200" fillOpacity="0.15" stroke="#FFD200" strokeWidth="1.5" />
                  <text x="48" y="56" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="22">
                    {slotNumber}
                  </text>

                  {/* Team Name */}
                  <text x="95" y="44" fill={team ? '#FFFFFF' : '#718096'} fontFamily="sans-serif" fontWeight="900" fontSize="18">
                    {team ? team.name.toUpperCase() : 'OPEN SLOT'}
                  </text>
                  <text x="95" y="68" fill="#A0AEC0" fontFamily="monospace" fontWeight="700" fontSize="11" letterSpacing="1">
                    {team ? `SLOT ${slotNumber} • CONFIRMED` : 'WAITING FOR SQUAD'}
                  </text>

                  {/* Status Indicator */}
                  <circle cx="410" cy="48" r="7" fill={team ? '#10B981' : '#4B5563'} />
                </g>
              );
            })}
          </g>

          {/* Footer */}
          <g transform={`translate(${width / 2}, 980)`}>
            <text x="0" y="0" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="2">
              POINTX ESPORTS • TOURNAMENT SLOTS MATRIX
            </text>
          </g>
        </g>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 5: VICTORY CERTIFICATE (LANDSCAPE 1920x1080)                    */}
      {/* ========================================================================= */}
      {category === 'certificate' && (
        <g transform="translate(0, 0)">
          {/* Ornate Gold Border Double Frame */}
          <rect x="40" y="40" width={width - 80} height={height - 80} rx="30" fill="none" stroke="url(#goldGrad)" strokeWidth="6" />
          <rect x="56" y="56" width={width - 112} height={height - 112} rx="22" fill="#0C0F1A" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1.5" />

          {/* Certificate Header Banner */}
          <g transform={`translate(${width / 2}, 160)`}>
            <text x="0" y="0" textAnchor="middle" fill="url(#goldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="24" letterSpacing="6">
              POINTX ESPORTS PLATFORM
            </text>
            <text x="0" y="70" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="68" letterSpacing="4" filter="url(#goldGlow)">
              CERTIFICATE OF VICTORY
            </text>
            <text x="0" y="115" textAnchor="middle" fill="#A0AEC0" fontFamily="sans-serif" fontWeight="700" fontSize="18" letterSpacing="5">
              OFFICIAL GRAND CHAMPIONSHIP ACCREDITATION
            </text>
          </g>

          {/* Presentation Subtitle */}
          <g transform={`translate(${width / 2}, 380)`}>
            <text x="0" y="0" textAnchor="middle" fill="#CBD5E0" fontFamily="sans-serif" fontWeight="600" fontSize="20" letterSpacing="2">
              THIS CERTIFIES THAT THE RESPECTED SQUAD
            </text>

            {/* Champion Team Name */}
            <text x="0" y="90" textAnchor="middle" fill="url(#goldGrad)" fontFamily="sans-serif" fontWeight="900" fontSize="76" letterSpacing="3">
              {(tournament.teams[0]?.name || 'ALPHA CHAMPIONS').toUpperCase()}
            </text>

            <text x="0" y="150" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="700" fontSize="22" letterSpacing="2">
              HAS CONQUERED ALL MATCHES AND CLAIMED 1ST PLACE IN
            </text>

            <text x="0" y="195" textAnchor="middle" fill="#FFD200" fontFamily="sans-serif" fontWeight="900" fontSize="32" letterSpacing="2">
              "{tournamentTitle.toUpperCase()}"
            </text>
          </g>

          {/* Signatures & Seal Row */}
          <g transform="translate(200, 820)">
            {/* Left: Organizer Sign */}
            <g transform="translate(100, 0)">
              <line x1="0" y1="50" x2="320" y2="50" stroke="#FFD200" strokeWidth="2" />
              <text x="160" y="40" textAnchor="middle" fill="#E2E8F0" fontFamily="monospace" fontWeight="700" fontSize="18">
                {organizerName.toUpperCase()}
              </text>
              <text x="160" y="80" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="800" fontSize="13" letterSpacing="2">
                OFFICIAL TOURNAMENT HOST
              </text>
            </g>

            {/* Center: Gold Booyah Seal */}
            <g transform={`translate(${width / 2 - 200}, 20)`}>
              <circle r="65" fill="#14192B" stroke="url(#goldGrad)" strokeWidth="4" filter="url(#goldGlow)" />
              <text x="0" y="15" textAnchor="middle" fontSize="48">🏆</text>
              <text x="0" y="42" textAnchor="middle" fill="#FFD200" fontFamily="monospace" fontWeight="900" fontSize="9" letterSpacing="2">
                VERIFIED
              </text>
            </g>

            {/* Right: Date & Governance */}
            <g transform={`translate(${width - 720}, 0)`}>
              <line x1="0" y1="50" x2="320" y2="50" stroke="#FFD200" strokeWidth="2" />
              <text x="160" y="40" textAnchor="middle" fill="#E2E8F0" fontFamily="monospace" fontWeight="700" fontSize="18">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </text>
              <text x="160" y="80" textAnchor="middle" fill="#718096" fontFamily="sans-serif" fontWeight="800" fontSize="13" letterSpacing="2">
                DATE OF ISSUANCE
              </text>
            </g>
          </g>
        </g>
      )}
    </svg>
  );
};
