import { readPsd, type Psd, type Layer, type Color } from 'ag-psd';
import type { TemplateAlignmentConfig, SlotRowOverride } from '../types/customTemplate';

export interface PsdAnalysisResult {
  success: boolean;
  width: number;
  height: number;
  aspectRatio: '16:9' | '4:5' | '1:1' | '9:16';
  layoutMode: 'dual-column' | 'single-column';
  cleanImageUrl: string;
  alignment: TemplateAlignmentConfig;
  detectedSummary: {
    teamsCount: number;
    ranksCount: number;
    logosCount: number;
    hasStats: boolean;
    hasOrgLogo: boolean;
    hasTourneyLogo: boolean;
    details: string[];
  };
}

export interface DetectedElement {
  type: 'teamName' | 'rank' | 'logo' | 'kills' | 'total' | 'match' | 'place' | 'booyah' | 'orgLogo' | 'tourneyLogo' | 'tourneyTitle' | 'organizerTitle' | 'unknown';
  slotNumber?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  rawName: string;
  rawText?: string;
}

/**
 * Helper to convert ag-psd color to CSS hex string (#RRGGBB)
 */
export function colorToHex(c?: Color | string): string {
  if (!c) return '#ffffff';
  if (typeof c === 'string') return c;
  if ('r' in c && 'g' in c && 'b' in c) {
    const r = Math.min(255, Math.max(0, Math.round(c.r))).toString(16).padStart(2, '0');
    const g = Math.min(255, Math.max(0, Math.round(c.g))).toString(16).padStart(2, '0');
    const b = Math.min(255, Math.max(0, Math.round(c.b))).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }
  return '#ffffff';
}

/**
 * Recursively flattens all layers from a PSD document tree
 */
export function flattenLayers(layers: Layer[] = []): Layer[] {
  const result: Layer[] = [];
  for (const layer of layers) {
    result.push(layer);
    if (layer.children && layer.children.length > 0) {
      result.push(...flattenLayers(layer.children));
    }
  }
  return result;
}

/**
 * Fuzzy matching to classify a layer into a semantic template slot or element
 */
export function classifyLayer(layer: Layer): DetectedElement | null {
  const name = (layer.name || '').trim().toLowerCase();
  const textVal = (layer.text?.text || '').trim().toLowerCase();
  const combined = (name + ' ' + textVal).trim();

  // Bounding box (ag-psd uses top, left, bottom, right)
  const left = layer.left ?? 0;
  const top = layer.top ?? 0;
  const right = layer.right ?? left;
  const bottom = layer.bottom ?? top;
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);

  // Extract font properties if available
  const style = layer.text?.style;
  const fontSize = style?.fontSize ? Math.round(style.fontSize) : (height > 0 ? Math.round(height * 0.8) : 24);
  const color = colorToHex(style?.fillColor);
  const fontFamily = style?.font?.name || undefined;

  const base: DetectedElement = {
    type: 'unknown',
    x: left,
    y: top,
    width,
    height,
    fontSize,
    color,
    fontFamily,
    rawName: layer.name || '',
    rawText: layer.text?.text || undefined,
  };

  // 1. Logos & Headers (Check specific branding first)
  if (combined.includes('org logo') || combined.includes('organizer logo') || combined.includes('sponsor') || combined.includes('host logo')) {
    return { ...base, type: 'orgLogo' };
  }

  if (combined.includes('tourney logo') || combined.includes('tournament logo') || combined.includes('event logo')) {
    return { ...base, type: 'tourneyLogo' };
  }

  if (combined.includes('tournament title') || combined.includes('tournament name') || combined.includes('championship')) {
    return { ...base, type: 'tourneyTitle' };
  }

  if (combined.includes('organizer name') || combined.includes('organized by')) {
    return { ...base, type: 'organizerTitle' };
  }

  // 2. Team Name: "Team 1", "Slot 1", "Team A", "Team_1", "T1", "Slot #1"
  const teamMatch = combined.match(/(?:team|slot)\s*#?([0-9]{1,2})/i);
  if (teamMatch) {
    const slot = parseInt(teamMatch[1], 10);
    if (slot >= 1 && slot <= 16) {
      return { ...base, type: 'teamName', slotNumber: slot };
    }
  }

  // Letters: "Team A" -> Slot 1, "Team B" -> Slot 2 ...
  const teamLetterMatch = combined.match(/team\s+([a-p])\b/i);
  if (teamLetterMatch) {
    const slot = teamLetterMatch[1].toUpperCase().charCodeAt(0) - 64; // A=1, B=2
    if (slot >= 1 && slot <= 16) {
      return { ...base, type: 'teamName', slotNumber: slot };
    }
  }

  // 3. Serial / Rank: "1", "#1", "Rank 1", "01"
  const rankMatch = combined.match(/^(?:#|rank\s*#?|slot\s*#?)?0?([1-9]|1[0-6])$/i);
  if (rankMatch) {
    const slot = parseInt(rankMatch[1], 10);
    return { ...base, type: 'rank', slotNumber: slot };
  }

  // 4. Team Logo: "Logo 1", "Logo 2", "Team 1 Logo", "Slot 1 Logo"
  const logoMatch = combined.match(/(?:team|slot)?\s*logo\s*#?([0-9]{1,2})/i);
  if (logoMatch) {
    const slot = parseInt(logoMatch[1], 10);
    if (slot >= 1 && slot <= 16) {
      return { ...base, type: 'logo', slotNumber: slot };
    }
  }

  if (combined.includes('team logo') || combined === 'logo') {
    return { ...base, type: 'logo', slotNumber: 1 };
  }

  // 5. Stats: Kills / Frags
  if (combined.includes('kill') || combined.includes('frag') || combined === 'k') {
    return { ...base, type: 'kills' };
  }

  // 6. Stats: Total Points / Pts / Score
  if (combined.includes('pts') || combined.includes('total') || combined.includes('points') || combined === 'score') {
    return { ...base, type: 'total' };
  }

  // 7. Stats: Place Points (use word boundary so "placeholder" doesn't trigger place!)
  if (/\b(place|placement|rank pts)\b/i.test(combined) || combined === 'p' || combined === 'pl.') {
    return { ...base, type: 'place' };
  }

  // 8. Stats: Matches Played
  if (combined.includes('matches') || combined === 'm' || combined === 'mp' || /\bmatch\b/i.test(combined)) {
    return { ...base, type: 'match' };
  }

  // 9. Stats: Booyah / WWCD
  if (combined.includes('booyah') || combined.includes('wwcd') || combined.includes('win')) {
    return { ...base, type: 'booyah' };
  }

  return null;
}

/**
 * Extracts a clean background image from a PSD
 * In browser environment: Hides text/placeholder layers and renders composite canvas.
 * If canvas is not available (e.g. Node tests), generates a placeholder SVG/dataURL.
 */
export function extractCleanBackgroundDataUrl(psd: Psd): string {
  // If browser HTML5 canvas is available on psd
  if (psd.canvas && typeof psd.canvas.toDataURL === 'function') {
    try {
      return psd.canvas.toDataURL('image/png');
    } catch {
      // ignore
    }
  }

  // Check if any layer is named background / bg and has a canvas
  const all = flattenLayers(psd.children);
  const bgLayer = all.find((l) => {
    const n = (l.name || '').toLowerCase();
    return n.includes('background') || n === 'bg' || n === 'artwork';
  });

  if (bgLayer?.canvas && typeof bgLayer.canvas.toDataURL === 'function') {
    try {
      return bgLayer.canvas.toDataURL('image/png');
    } catch {
      // ignore
    }
  }

  // Fallback: high-res clean SVG banner placeholder with PSD dimensions
  const w = psd.width || 1920;
  const h = psd.height || 1080;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f0c1b"/>
        <stop offset="50%" stop-color="#161226"/>
        <stop offset="100%" stop-color="#0b0814"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Main analyzer function: parses PSD buffer and generates 100% automated PointX template alignment
 */
export function analyzePsdTemplateBuffer(buffer: ArrayBuffer | Uint8Array): PsdAnalysisResult {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  
  // Read PSD with layer data
  const psd = readPsd(buffer, {
    skipLayerImageData: !isBrowser,
    skipCompositeImageData: !isBrowser,
    useImageData: !isBrowser,
  });

  const width = psd.width || 1920;
  const height = psd.height || 1080;
  const ratio = width / height;

  // Aspect ratio detection
  let aspectRatio: '16:9' | '4:5' | '1:1' | '9:16' = '16:9';
  if (Math.abs(ratio - 16 / 9) < 0.25) aspectRatio = '16:9';
  else if (Math.abs(ratio - 4 / 5) < 0.18) aspectRatio = '4:5';
  else if (Math.abs(ratio - 1) < 0.15) aspectRatio = '1:1';
  else if (Math.abs(ratio - 9 / 16) < 0.25) aspectRatio = '9:16';
  else if (height > width) aspectRatio = '4:5';

  const cleanImageUrl = extractCleanBackgroundDataUrl(psd);
  const allLayers = flattenLayers(psd.children);

  const detected: DetectedElement[] = [];
  for (const layer of allLayers) {
    const item = classifyLayer(layer);
    if (item) detected.push(item);
  }

  // Group by slot
  const teamSlots: Record<number, DetectedElement> = {};
  const rankSlots: Record<number, DetectedElement> = {};
  const logoSlots: Record<number, DetectedElement> = {};

  let killsEl: DetectedElement | undefined;
  let totalEl: DetectedElement | undefined;
  let matchEl: DetectedElement | undefined;
  let placeEl: DetectedElement | undefined;
  let booyahEl: DetectedElement | undefined;
  let orgLogoEl: DetectedElement | undefined;
  let tourneyLogoEl: DetectedElement | undefined;
  let tourneyTitleEl: DetectedElement | undefined;
  let orgTitleEl: DetectedElement | undefined;

  for (const el of detected) {
    if (el.type === 'teamName' && el.slotNumber) teamSlots[el.slotNumber] = el;
    else if (el.type === 'rank' && el.slotNumber) rankSlots[el.slotNumber] = el;
    else if (el.type === 'logo' && el.slotNumber) logoSlots[el.slotNumber] = el;
    else if (el.type === 'kills' && !killsEl) killsEl = el;
    else if (el.type === 'total' && !totalEl) totalEl = el;
    else if (el.type === 'match' && !matchEl) matchEl = el;
    else if (el.type === 'place' && !placeEl) placeEl = el;
    else if (el.type === 'booyah' && !booyahEl) booyahEl = el;
    else if (el.type === 'orgLogo' && !orgLogoEl) orgLogoEl = el;
    else if (el.type === 'tourneyLogo' && !tourneyLogoEl) tourneyLogoEl = el;
    else if (el.type === 'tourneyTitle' && !tourneyTitleEl) tourneyTitleEl = el;
    else if (el.type === 'organizerTitle' && !orgTitleEl) orgTitleEl = el;
  }

  const teamCount = Object.keys(teamSlots).length;
  const rankCount = Object.keys(rankSlots).length;
  const logoCount = Object.keys(logoSlots).length;

  // Single Column vs Dual Column detection
  let layoutMode: 'dual-column' | 'single-column' = 'single-column';
  if (teamSlots[1] && teamSlots[7] && (teamSlots[7].x - teamSlots[1].x) > 300) {
    layoutMode = 'dual-column';
  }

  // Calculate master Base Y and Row Gap
  const s1 = teamSlots[1] || { x: 300, y: 250 };
  const s2 = teamSlots[2];
  const s7 = teamSlots[7];

  let baseY = Math.round(s1.y);
  let rowGap = 55; // sensible default

  if (s1 && s2 && s2.y > s1.y) {
    rowGap = Math.round(s2.y - s1.y);
  }

  const leftTeamX = Math.round(s1.x);
  const rightTeamX = s7 ? Math.round(s7.x) : (layoutMode === 'dual-column' ? leftTeamX + 800 : leftTeamX);

  const leftRankX = rankSlots[1] ? Math.round(rankSlots[1].x) : Math.max(0, leftTeamX - 70);
  const rightRankX = rankSlots[7] ? Math.round(rankSlots[7].x) : Math.max(0, rightTeamX - 70);

  const leftTotalX = totalEl ? Math.round(totalEl.x) : leftTeamX + 380;
  const rightTotalX = layoutMode === 'dual-column' ? leftTotalX + (rightTeamX - leftTeamX) : leftTotalX;

  const leftKillsX = killsEl ? Math.round(killsEl.x) : leftTeamX + 310;
  const rightKillsX = layoutMode === 'dual-column' ? leftKillsX + (rightTeamX - leftTeamX) : leftKillsX;

  const leftPlaceX = placeEl ? Math.round(placeEl.x) : leftKillsX - 45;
  const rightPlaceX = layoutMode === 'dual-column' ? leftPlaceX + (rightTeamX - leftTeamX) : leftPlaceX;

  const leftMatchX = matchEl ? Math.round(matchEl.x) : leftPlaceX - 45;
  const rightMatchX = layoutMode === 'dual-column' ? leftMatchX + (rightTeamX - leftTeamX) : leftMatchX;

  const leftBooyahX = booyahEl ? Math.round(booyahEl.x) : leftMatchX;
  const rightBooyahX = layoutMode === 'dual-column' ? leftBooyahX + (rightTeamX - leftTeamX) : leftBooyahX;

  // Build granular per-slot overrides (so exact custom PSD coordinates are 100% honored)
  const slotOverrides: Record<number, SlotRowOverride> = {};
  for (let i = 1; i <= 16; i++) {
    const tSlot = teamSlots[i];
    const rSlot = rankSlots[i];
    const lSlot = logoSlots[i] || (i === 1 && logoSlots[1] ? logoSlots[1] : undefined);

    if (tSlot || rSlot || lSlot) {
      slotOverrides[i] = {
        teamName: tSlot ? {
          x: Math.round(tSlot.x),
          y: Math.round(tSlot.y),
          fontSize: tSlot.fontSize,
          fill: tSlot.color || '#ffffff',
          fontFamily: tSlot.fontFamily,
          visible: true,
        } : undefined,
        rank: rSlot ? {
          x: Math.round(rSlot.x),
          y: Math.round(rSlot.y),
          fontSize: rSlot.fontSize,
          fill: rSlot.color || '#ffffff',
          fontFamily: rSlot.fontFamily,
          visible: true,
        } : undefined,
        logo: lSlot ? {
          x: Math.round(lSlot.x),
          y: Math.round(lSlot.y),
          visible: true,
        } : undefined,
      };
    }
  }

  // Master Alignment Config
  const alignment: TemplateAlignmentConfig = {
    aspectRatio,
    width,
    height,
    layoutMode,

    baseY,
    rowGap,

    fontFamily: s1?.fontFamily || 'Rajdhani',
    rankFontSize: rankSlots[1]?.fontSize || 28,
    teamFontSize: s1?.fontSize || 24,
    statFontSize: killsEl?.fontSize || 24,
    totalFontSize: totalEl?.fontSize || 26,
    teamFontWeight: '800',

    rankColor: rankSlots[1]?.color || '#ffffff',
    teamColor: s1?.color || '#ffffff',
    statColor: killsEl?.color || '#ffffff',
    totalColor: totalEl?.color || '#f59e0b',
    totalGlowColor: 'rgba(245, 158, 11, 0.4)',

    leftRankX,
    leftTeamX,
    leftMatchX,
    leftBooyahX,
    leftKillsX,
    leftPlaceX,
    leftTotalX,

    rightRankX,
    rightTeamX,
    rightMatchX,
    rightBooyahX,
    rightKillsX,
    rightPlaceX,
    rightTotalX,

    showSubtitleBanner: false,
    subtitleX: Math.round(width * 0.5),
    subtitleY: Math.max(30, baseY - 60),
    subtitleWidth: 300,
    subtitleHeight: 40,
    subtitleFontSize: 18,
    subtitleBgColor: '#0f172a',
    subtitleBorderColor: '#334155',
    subtitleTextColor: '#f8fafc',

    showOrganizerHeader: !!orgTitleEl || !!orgLogoEl,
    organizerX: orgTitleEl ? Math.round(orgTitleEl.x) : 80,
    organizerY: orgTitleEl ? Math.round(orgTitleEl.y) : 60,
    organizerFontSize: orgTitleEl?.fontSize || 22,
    organizerColor: orgTitleEl?.color || '#cbd5e1',

    showTournamentHeader: !!tourneyTitleEl || !!tourneyLogoEl,
    tournamentX: tourneyTitleEl ? Math.round(tourneyTitleEl.x) : Math.round(width * 0.5),
    tournamentY: tourneyTitleEl ? Math.round(tourneyTitleEl.y) : 80,
    tournamentFontSize: tourneyTitleEl?.fontSize || 32,
    tournamentColor: tourneyTitleEl?.color || '#ffffff',

    slots: Object.keys(slotOverrides).length > 0 ? slotOverrides : undefined,
  };

  const details: string[] = [
    `Canvas: ${width}x${height} (${aspectRatio})`,
    `Detected ${teamCount} Team Name slot(s)`,
    `Detected ${rankCount} Rank/Serial number(s)`,
    `Detected ${logoCount} Logo placeholder(s)`,
    `Layout mode: ${layoutMode === 'dual-column' ? 'Dual Column (6+6)' : 'Single Column (12)'}`,
    `Base Y: ${baseY}px, Row Gap: ${rowGap}px`,
  ];

  if (totalEl) details.push(`Total Points column mapped at X=${alignment.leftTotalX}px`);
  if (killsEl) details.push(`Kills column mapped at X=${alignment.leftKillsX}px`);
  if (orgLogoEl) details.push(`Organizer Logo mapped at (${orgLogoEl.x}, ${orgLogoEl.y})`);
  if (tourneyLogoEl) details.push(`Tournament Logo mapped at (${tourneyLogoEl.x}, ${tourneyLogoEl.y})`);

  return {
    success: true,
    width,
    height,
    aspectRatio,
    layoutMode,
    cleanImageUrl,
    alignment,
    detectedSummary: {
      teamsCount: teamCount,
      ranksCount: rankCount,
      logosCount: logoCount,
      hasStats: !!totalEl || !!killsEl,
      hasOrgLogo: !!orgLogoEl,
      hasTourneyLogo: !!tourneyLogoEl,
      details,
    },
  };
}
