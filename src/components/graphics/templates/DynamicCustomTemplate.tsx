import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GraphicsRenderData } from '../../../types/graphics';
import type { CalculatedStanding } from '../../../types/tournament';
import type { CustomGraphicsTemplate, TextElementStyle, SlotElementOverride } from '../../../types/customTemplate';
import { useFontStore } from '../../../store/fontStore';

export interface DynamicCustomTemplateProps {
  template: CustomGraphicsTemplate;
  data: GraphicsRenderData;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  selectedElementKey?: string | string[] | null;
  selectedElementKeys?: string[] | null;
  onSelectElement?: (elementKey: string, e?: React.MouseEvent) => void;
  onDragElement?: (key: string, deltaX: number, deltaY: number) => void;
  isInteractive?: boolean;
  hueRotate?: number;
}

const DEMO_TOURNAMENT_LOGO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%230f172a" stroke="%23f59e0b" stroke-width="4"/><path d="M32 30h36v18c0 10-8 18-18 18s-18-8-18-18V30z" fill="%23f59e0b" fill-opacity="0.25" stroke="%23f59e0b" stroke-width="3"/><path d="M26 36c-4 0-6 4-6 8s2 8 6 8M74 36c4 0 6 4 6 8s-2 8-6 8M50 66v12M38 78h24" stroke="%23f59e0b" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="46" r="6" fill="%23fbbf24"/></svg>';

const DEMO_ORG_LOGO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M50 8l34 14v28c0 24-16 40-34 46C32 90 16 74 16 50V22L50 8z" fill="%23091e3a" stroke="%2306b6d4" stroke-width="4"/><path d="M50 20l22 9v18c0 16-10 26-22 30-12-4-22-14-22-30V29l22-9z" fill="%2306b6d4" fill-opacity="0.25"/><text x="50" y="56" text-anchor="middle" fill="%2338bdf8" font-family="sans-serif" font-weight="900" font-size="16">ORG</text></svg>';

const getDemoTeamLogo = (slotNum: number) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="50,6 92,28 92,72 50,94 8,72 8,28" fill="%23111827" stroke="%23f59e0b" stroke-width="4"/><polygon points="50,14 84,32 84,68 50,86 16,68 16,32" fill="%23f59e0b" fill-opacity="0.2"/><text x="50" y="58" text-anchor="middle" fill="%23ffffff" font-family="monospace" font-weight="900" font-size="24">${slotNum.toString().padStart(2, '0')}</text></svg>`;

export const DynamicCustomTemplate: React.FC<DynamicCustomTemplateProps> = ({
  template,
  data,
  svgRef,
  selectedElementKey,
  selectedElementKeys,
  onSelectElement,
  onDragElement,
  isInteractive = false,
  hueRotate = 0
}) => {
  const { rows, subtitle, organizerName, organizerLogo, tournamentTitle, tournamentLogo } = data;
  const { alignment, imageUrl } = template;
  const { getSvgDefsFontStyle, registerAllFontsInDocument } = useFontStore();

  const internalSvgRef = useRef<SVGSVGElement | null>(null);

  // Dragging State
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const lastSvgPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    registerAllFontsInDocument();
  }, [registerAllFontsInDocument]);

  const isElementSelected = (key: string) => {
    if (selectedElementKeys && selectedElementKeys.includes(key)) return true;
    if (Array.isArray(selectedElementKey)) return selectedElementKey.includes(key);
    return selectedElementKey === key;
  };

  const width = alignment.width || (alignment.aspectRatio === '4:5' ? 1080 : 1920);
  const height = alignment.height || (alignment.aspectRatio === '4:5' ? 1350 : 1080);

  const isSingleColumn = alignment.layoutMode === 'single-column';
  const isCustomSubtitle = subtitle && subtitle !== 'OVERALL';

  // SVG coordinate transformation helper
  const getSvgCoordinates = useCallback(
    (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent | MouseEvent | PointerEvent) => {
      const svg = svgRef?.current || internalSvgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return { x: Math.round(transformed.x), y: Math.round(transformed.y) };
      }
      return { x: 0, y: 0 };
    },
    [svgRef]
  );

  // Pointer drag start on element
  const handlePointerDown = (key: string, e: React.PointerEvent) => {
    if (!isInteractive) return;
    e.stopPropagation();

    const isAlreadySelected =
      (selectedElementKeys && selectedElementKeys.includes(key)) ||
      (Array.isArray(selectedElementKey) && selectedElementKey.includes(key)) ||
      selectedElementKey === key;

    // Only change selection if not already selected, or if user is modifying selection with Shift/Ctrl/Meta
    if (!isAlreadySelected || e.shiftKey || e.ctrlKey || e.metaKey) {
      onSelectElement?.(key, e as any);
    }

    if (onDragElement) {
      const coords = getSvgCoordinates(e);
      lastSvgPosRef.current = coords;
      setDraggingKey(key);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // SVG Container Pointer Move (Active Dragging)
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive || !draggingKey || !onDragElement) return;
    const current = getSvgCoordinates(e);
    const deltaX = current.x - lastSvgPosRef.current.x;
    const deltaY = current.y - lastSvgPosRef.current.y;

    if (deltaX !== 0 || deltaY !== 0) {
      onDragElement(draggingKey, deltaX, deltaY);
      lastSvgPosRef.current = current;
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingKey) {
      setDraggingKey(null);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  const getStyle = (key: string, fallback: Partial<TextElementStyle>): TextElementStyle => {
    const el = (alignment.elements as any)?.[key] || {};
    return {
      x: el.x ?? fallback.x ?? 0,
      y: el.y ?? fallback.y ?? 0,
      fontSize: el.fontSize ?? fallback.fontSize ?? 24,
      fontFamily: el.fontFamily ?? fallback.fontFamily ?? alignment.fontFamily ?? 'Rajdhani',
      fontWeight: el.fontWeight ?? fallback.fontWeight ?? '800',
      fill: el.fill ?? fallback.fill ?? '#ffffff',
      glowColor: el.glowColor ?? fallback.glowColor,
      letterSpacing: el.letterSpacing ?? fallback.letterSpacing ?? 0,
      textAnchor: el.textAnchor ?? fallback.textAnchor ?? 'middle',
      visible: el.visible ?? fallback.visible ?? true,
      customText: el.customText
    };
  };

  // 1. Organiser Style
  const orgStyle = getStyle('organizer', {
    x: alignment.organizerX || width / 2,
    y: alignment.organizerY || 60,
    fontSize: alignment.organizerFontSize || 22,
    fontFamily: alignment.fontFamily,
    fontWeight: '700',
    fill: alignment.organizerColor || '#ffffff',
    letterSpacing: 2,
    textAnchor: 'middle',
    visible: alignment.showOrganizerHeader ?? true
  });

  // Organiser Logo Style
  const effectiveOrgLogo = organizerLogo || (isInteractive ? DEMO_ORG_LOGO : undefined);
  const orgLogoStyle = getStyle('organizerLogo', {
    x: orgStyle.x - 200,
    y: orgStyle.y - 30,
    fontSize: 48,
    visible: true
  });

  // 2. Tournament Title Style
  const titleStyle = getStyle('tournamentTitle', {
    x: alignment.tournamentX || width / 2,
    y: alignment.tournamentY || 180,
    fontSize: alignment.tournamentFontSize || 44,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.tournamentColor || '#ffffff',
    letterSpacing: 4,
    textAnchor: 'middle',
    visible: alignment.showTournamentHeader ?? true
  });

  // Tournament Logo Style
  const effectiveTournamentLogo = tournamentLogo || (isInteractive ? DEMO_TOURNAMENT_LOGO : undefined);
  const tourneyLogoStyle = getStyle('tournamentLogo', {
    x: titleStyle.x - 260,
    y: titleStyle.y - 42,
    fontSize: 64,
    visible: true
  });

  // 3. Subtitle / Scope Style
  const subStyle = getStyle('subtitle', {
    x: alignment.subtitleX,
    y: alignment.subtitleY,
    fontSize: alignment.subtitleFontSize || 28,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.subtitleTextColor || '#ffffff',
    letterSpacing: 6,
    textAnchor: 'middle',
    visible: alignment.showSubtitleBanner ?? false
  });

  // Column Styles Fallback (Left / Primary)
  const baseRankStyle = getStyle('rank', {
    x: alignment.leftRankX,
    fontSize: alignment.rankFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.rankColor,
    textAnchor: 'middle'
  });

  const baseTeamStyle = getStyle('teamName', {
    x: alignment.leftTeamX,
    fontSize: alignment.teamFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: alignment.teamFontWeight || '800',
    fill: alignment.teamColor,
    textAnchor: 'start',
    letterSpacing: 0.5
  });

  const baseLogoStyle = getStyle('teamLogo', {
    x: alignment.leftTeamX - 36,
    fontSize: alignment.teamFontSize + 4,
    visible: true
  });

  const baseMatchStyle = getStyle('match', {
    x: alignment.leftMatchX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseBooyahStyle = getStyle('booyah', {
    x: alignment.leftBooyahX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseKillsStyle = getStyle('kills', {
    x: alignment.leftKillsX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const basePlaceStyle = getStyle('place', {
    x: alignment.leftPlaceX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseTotalStyle = getStyle('total', {
    x: alignment.leftTotalX,
    fontSize: alignment.totalFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.totalColor,
    glowColor: alignment.totalGlowColor,
    textAnchor: 'middle'
  });

  // Column Styles Fallback (Right / Secondary Column)
  const baseRightRankStyle = getStyle('rightRank', {
    x: alignment.rightRankX,
    fontSize: alignment.rankFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.rankColor,
    textAnchor: 'middle'
  });

  const baseRightTeamStyle = getStyle('rightTeamName', {
    x: alignment.rightTeamX,
    fontSize: alignment.teamFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: alignment.teamFontWeight || '800',
    fill: alignment.teamColor,
    textAnchor: 'start',
    letterSpacing: 0.5
  });

  const baseRightLogoStyle = getStyle('rightTeamLogo', {
    x: alignment.rightTeamX - 36,
    fontSize: alignment.teamFontSize + 4,
    visible: true
  });

  const baseRightMatchStyle = getStyle('rightMatch', {
    x: alignment.rightMatchX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseRightBooyahStyle = getStyle('rightBooyah', {
    x: alignment.rightBooyahX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseRightKillsStyle = getStyle('rightKills', {
    x: alignment.rightKillsX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseRightPlaceStyle = getStyle('rightPlace', {
    x: alignment.rightPlaceX,
    fontSize: alignment.statFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '800',
    fill: alignment.statColor,
    textAnchor: 'middle'
  });

  const baseRightTotalStyle = getStyle('rightTotal', {
    x: alignment.rightTotalX,
    fontSize: alignment.totalFontSize,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.totalColor,
    glowColor: alignment.totalGlowColor,
    textAnchor: 'middle'
  });

  // Prepare Rows
  const leftRows: (CalculatedStanding | null)[] = [];
  const rightRows: (CalculatedStanding | null)[] = [];

  if (isSingleColumn) {
    for (let i = 0; i < 12; i++) {
      leftRows.push(rows[i] || null);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      leftRows.push(rows[i] || null);
    }
    for (let i = 6; i < 12; i++) {
      rightRows.push(rows[i] || null);
    }
  }

  // Merge slot-level individual overrides
  const resolveSlotItemStyle = (
    slotNumber: number,
    itemKey: 'rank' | 'logo' | 'teamName' | 'match' | 'booyah' | 'kills' | 'place' | 'total',
    baseStyle: TextElementStyle,
    defaultY: number
  ): TextElementStyle => {
    const slotData = alignment.slots?.[slotNumber] || {};
    const itemOverride: SlotElementOverride = (slotData as any)?.[itemKey] || {};
    const xOff = slotData.xOffset || 0;
    const yOff = slotData.yOffset || 0;

    return {
      x: itemOverride.x !== undefined ? itemOverride.x : (baseStyle.x + xOff),
      y: itemOverride.y !== undefined ? itemOverride.y : (defaultY + yOff),
      fontSize: itemOverride.fontSize ?? baseStyle.fontSize,
      fontFamily: itemOverride.fontFamily ?? baseStyle.fontFamily,
      fontWeight: itemOverride.fontWeight ?? baseStyle.fontWeight,
      fill: itemOverride.fill ?? baseStyle.fill,
      glowColor: itemOverride.glowColor ?? baseStyle.glowColor,
      letterSpacing: itemOverride.letterSpacing ?? baseStyle.letterSpacing,
      textAnchor: itemOverride.textAnchor ?? baseStyle.textAnchor,
      visible: itemOverride.visible ?? baseStyle.visible ?? true,
      customText: itemOverride.customText ?? baseStyle.customText
    };
  };

  const renderRow = (
    row: CalculatedStanding | null,
    rowIndex: number,
    isRightColumn: boolean
  ) => {
    const defaultBaseY = alignment.baseY + rowIndex * alignment.rowGap;
    const rank = isRightColumn ? rowIndex + 7 : rowIndex + 1;
    const rankStr = rank.toString().padStart(2, '0');

    const baseRank = isRightColumn ? baseRightRankStyle : baseRankStyle;
    const baseTeam = isRightColumn ? baseRightTeamStyle : baseTeamStyle;
    const baseLogo = isRightColumn ? baseRightLogoStyle : baseLogoStyle;
    const baseMatch = isRightColumn ? baseRightMatchStyle : baseMatchStyle;
    const baseBooyah = isRightColumn ? baseRightBooyahStyle : baseBooyahStyle;
    const baseKills = isRightColumn ? baseRightKillsStyle : baseKillsStyle;
    const basePlace = isRightColumn ? baseRightPlaceStyle : basePlaceStyle;
    const baseTotal = isRightColumn ? baseRightTotalStyle : baseTotalStyle;

    const curRank = resolveSlotItemStyle(rank, 'rank', baseRank, defaultBaseY + 32);
    const curTeam = resolveSlotItemStyle(rank, 'teamName', baseTeam, defaultBaseY + 31);
    const curLogo = resolveSlotItemStyle(rank, 'logo', baseLogo, defaultBaseY + 31 - (baseTeam.fontSize || 24));
    const curMatch = resolveSlotItemStyle(rank, 'match', baseMatch, defaultBaseY + 32);
    const curBooyah = resolveSlotItemStyle(rank, 'booyah', baseBooyah, defaultBaseY + 32);
    const curKills = resolveSlotItemStyle(rank, 'kills', baseKills, defaultBaseY + 32);
    const curPlace = resolveSlotItemStyle(rank, 'place', basePlace, defaultBaseY + 32);
    const curTotal = resolveSlotItemStyle(rank, 'total', baseTotal, defaultBaseY + 32);

    const teamText = curTeam.customText || (row ? row.teamName.slice(0, 18) : `Slot ${rank}`);
    const effectiveTeamLogo = row?.teamLogo || (isInteractive ? getDemoTeamLogo(rank) : undefined);

    const logoSize = curLogo.fontSize || 28;

    return (
      <g key={rank}>
        {/* RANK NUMBER */}
        {curRank.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_rank`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <text
              x={curRank.x}
              y={curRank.y}
              textAnchor={curRank.textAnchor}
              fill={curRank.fill}
              fontFamily={`'${curRank.fontFamily}', sans-serif`}
              fontWeight={curRank.fontWeight}
              fontSize={curRank.fontSize}
              letterSpacing={curRank.letterSpacing}
            >
              {rankStr}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_rank`) && (
              <rect
                x={curRank.x - 30}
                y={curRank.y - curRank.fontSize}
                width={60}
                height={curRank.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* TEAM LOGO */}
        {effectiveTeamLogo && curLogo.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_logo`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <image
              href={effectiveTeamLogo}
              x={curLogo.x}
              y={curLogo.y}
              width={logoSize}
              height={logoSize}
              preserveAspectRatio="xMidYMid slice"
            />
            {isInteractive && isElementSelected(`slot_${rank}_logo`) && (
              <rect
                x={curLogo.x - 2}
                y={curLogo.y - 2}
                width={logoSize + 4}
                height={logoSize + 4}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* TEAM NAME */}
        {curTeam.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_teamName`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <text
              x={curTeam.x}
              y={curTeam.y}
              textAnchor={curTeam.textAnchor}
              fill={curTeam.fill}
              fontFamily={`'${curTeam.fontFamily}', sans-serif`}
              fontWeight={curTeam.fontWeight}
              fontSize={curTeam.fontSize}
              letterSpacing={curTeam.letterSpacing}
            >
              {teamText}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_teamName`) && (
              <rect
                x={curTeam.x - 4}
                y={curTeam.y - curTeam.fontSize}
                width={Math.max(260, curTeam.fontSize * 10)}
                height={curTeam.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* MATCHES PLAYED */}
        {curMatch.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_match`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <text
              x={curMatch.x}
              y={curMatch.y}
              textAnchor={curMatch.textAnchor}
              fill={curMatch.fill}
              fontFamily={`'${curMatch.fontFamily}', sans-serif`}
              fontWeight={curMatch.fontWeight}
              fontSize={curMatch.fontSize}
              letterSpacing={curMatch.letterSpacing}
            >
              {row ? row.matchesPlayed : 6}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_match`) && (
              <rect
                x={curMatch.x - 22}
                y={curMatch.y - curMatch.fontSize}
                width={44}
                height={curMatch.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* BOOYAH COUNT */}
        {curBooyah.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_booyah`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <text
              x={curBooyah.x}
              y={curBooyah.y}
              textAnchor={curBooyah.textAnchor}
              fill={curBooyah.fill}
              fontFamily={`'${curBooyah.fontFamily}', sans-serif`}
              fontWeight={curBooyah.fontWeight}
              fontSize={curBooyah.fontSize}
              letterSpacing={curBooyah.letterSpacing}
            >
              {row ? row.booyahs : 1}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_booyah`) && (
              <rect
                x={curBooyah.x - 22}
                y={curBooyah.y - curBooyah.fontSize}
                width={44}
                height={curBooyah.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* KILL POINTS */}
        {curKills.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_kills`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <text
              x={curKills.x}
              y={curKills.y}
              textAnchor={curKills.textAnchor}
              fill={curKills.fill}
              fontFamily={`'${curKills.fontFamily}', sans-serif`}
              fontWeight={curKills.fontWeight}
              fontSize={curKills.fontSize}
              letterSpacing={curKills.letterSpacing}
            >
              {row ? row.killPoints : 12}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_kills`) && (
              <rect
                x={curKills.x - 24}
                y={curKills.y - curKills.fontSize}
                width={48}
                height={curKills.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* PLACE POINTS */}
        {curPlace.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_place`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            <text
              x={curPlace.x}
              y={curPlace.y}
              textAnchor={curPlace.textAnchor}
              fill={curPlace.fill}
              fontFamily={`'${curPlace.fontFamily}', sans-serif`}
              fontWeight={curPlace.fontWeight}
              fontSize={curPlace.fontSize}
              letterSpacing={curPlace.letterSpacing}
            >
              {row ? row.placementPoints : 14}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_place`) && (
              <rect
                x={curPlace.x - 24}
                y={curPlace.y - curPlace.fontSize}
                width={48}
                height={curPlace.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}

        {/* TOTAL POINTS */}
        {curTotal.visible !== false && (
          <g
            onPointerDown={(e) => handlePointerDown(`slot_${rank}_total`, e)}
            className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
          >
            {curTotal.glowColor && (
              <text
                x={curTotal.x}
                y={curTotal.y}
                textAnchor={curTotal.textAnchor}
                fill={curTotal.glowColor}
                fontFamily={`'${curTotal.fontFamily}', sans-serif`}
                fontWeight={curTotal.fontWeight}
                fontSize={curTotal.fontSize}
                letterSpacing={curTotal.letterSpacing}
                filter="url(#text-glow)"
                opacity="0.85"
              >
                {row ? row.totalPoints : 26}
              </text>
            )}
            <text
              x={curTotal.x}
              y={curTotal.y}
              textAnchor={curTotal.textAnchor}
              fill={curTotal.fill}
              fontFamily={`'${curTotal.fontFamily}', sans-serif`}
              fontWeight={curTotal.fontWeight}
              fontSize={curTotal.fontSize}
              letterSpacing={curTotal.letterSpacing}
            >
              {row ? row.totalPoints : 26}
            </text>
            {isInteractive && isElementSelected(`slot_${rank}_total`) && (
              <rect
                x={curTotal.x - 28}
                y={curTotal.y - curTotal.fontSize}
                width={56}
                height={curTotal.fontSize + 8}
                fill="rgba(245, 158, 11, 0.2)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      ref={svgRef || internalSvgRef}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerLeave={handleSvgPointerUp}
      className={`w-full h-full select-none ${isInteractive ? 'cursor-crosshair' : ''}`}
    >
      <defs>
        {/* Self-contained Embedded Fonts (Google + Uploaded Custom Base64) */}
        <style dangerouslySetInnerHTML={{ __html: getSvgDefsFontStyle() }} />

        {/* Glow Filter Effect */}
        <filter id="text-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Dynamic Hue Shift / Color Tint Filter */}
        {hueRotate !== 0 && (
          <filter id="poster-hue-filter" colorInterpolationFilters="sRGB">
            <feColorMatrix type="hueRotate" values={`${hueRotate}`} />
          </filter>
        )}
      </defs>

      {/* 1. BACKGROUND POSTER ARTWORK IMAGE */}
      {imageUrl && (
        <image
          href={imageUrl}
          x={0}
          y={0}
          width={width}
          height={height}
          filter={hueRotate !== 0 ? 'url(#poster-hue-filter)' : undefined}
          preserveAspectRatio="xMidYMid slice"
        />
      )}

      {/* 2. ORGANISER HEADER OVERLAY */}
      {effectiveOrgLogo && orgLogoStyle.visible !== false && (
        <g
          onPointerDown={(e) => handlePointerDown('organizerLogo', e)}
          className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
        >
          <image
            href={effectiveOrgLogo}
            x={orgLogoStyle.x}
            y={orgLogoStyle.y}
            width={orgLogoStyle.fontSize}
            height={orgLogoStyle.fontSize}
            preserveAspectRatio="xMidYMid slice"
          />
          {isInteractive && isElementSelected('organizerLogo') && (
            <rect
              x={orgLogoStyle.x - 2}
              y={orgLogoStyle.y - 2}
              width={orgLogoStyle.fontSize + 4}
              height={orgLogoStyle.fontSize + 4}
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </g>
      )}

      {orgStyle.visible !== false && (
        <g
          onPointerDown={(e) => handlePointerDown('organizer', e)}
          className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
        >
          <text
            x={orgStyle.x}
            y={orgStyle.y}
            textAnchor={orgStyle.textAnchor}
            fill={orgStyle.fill}
            fontFamily={`'${orgStyle.fontFamily}', sans-serif`}
            fontWeight={orgStyle.fontWeight}
            fontSize={orgStyle.fontSize}
            letterSpacing={orgStyle.letterSpacing}
          >
            {orgStyle.customText || organizerName.toUpperCase()}
          </text>
          {isInteractive && isElementSelected('organizer') && (
            <rect
              x={orgStyle.x - Math.max(140, orgStyle.fontSize * 6)}
              y={orgStyle.y - orgStyle.fontSize}
              width={Math.max(280, orgStyle.fontSize * 12)}
              height={orgStyle.fontSize + 12}
              fill="rgba(245, 158, 11, 0.15)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </g>
      )}

      {/* 3. TOURNAMENT TITLE HEADER OVERLAY */}
      {effectiveTournamentLogo && tourneyLogoStyle.visible !== false && (
        <g
          onPointerDown={(e) => handlePointerDown('tournamentLogo', e)}
          className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
        >
          <image
            href={effectiveTournamentLogo}
            x={tourneyLogoStyle.x}
            y={tourneyLogoStyle.y}
            width={tourneyLogoStyle.fontSize}
            height={tourneyLogoStyle.fontSize}
            preserveAspectRatio="xMidYMid slice"
          />
          {isInteractive && isElementSelected('tournamentLogo') && (
            <rect
              x={tourneyLogoStyle.x - 2}
              y={tourneyLogoStyle.y - 2}
              width={tourneyLogoStyle.fontSize + 4}
              height={tourneyLogoStyle.fontSize + 4}
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </g>
      )}

      {titleStyle.visible !== false && (
        <g
          onPointerDown={(e) => handlePointerDown('tournamentTitle', e)}
          className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
        >
          <text
            x={titleStyle.x}
            y={titleStyle.y}
            textAnchor={titleStyle.textAnchor}
            fill={titleStyle.fill}
            fontFamily={`'${titleStyle.fontFamily}', sans-serif`}
            fontWeight={titleStyle.fontWeight}
            fontSize={titleStyle.fontSize}
            letterSpacing={titleStyle.letterSpacing}
          >
            {titleStyle.customText || tournamentTitle.toUpperCase()}
          </text>
          {isInteractive && isElementSelected('tournamentTitle') && (
            <rect
              x={titleStyle.x - Math.max(240, titleStyle.fontSize * 7)}
              y={titleStyle.y - titleStyle.fontSize}
              width={Math.max(480, titleStyle.fontSize * 14)}
              height={titleStyle.fontSize + 16}
              fill="rgba(245, 158, 11, 0.15)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </g>
      )}

      {/* 4. DYNAMIC SUBTITLE / SCOPE BANNER */}
      {isCustomSubtitle && subStyle.visible !== false && (
        <g
          transform={`translate(${subStyle.x}, ${subStyle.y})`}
          onPointerDown={(e) => handlePointerDown('subtitle', e)}
          className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-80' : ''}
        >
          <rect
            x={0}
            y={0}
            width={alignment.subtitleWidth || 300}
            height={alignment.subtitleHeight || 50}
            rx={12}
            fill={alignment.subtitleBgColor || '#051d38'}
            stroke={alignment.subtitleBorderColor || '#00f0ff'}
            strokeWidth={3}
          />
          <text
            x={(alignment.subtitleWidth || 300) / 2}
            y={(alignment.subtitleHeight || 50) * 0.68}
            textAnchor="middle"
            fill={subStyle.fill}
            fontFamily={`'${subStyle.fontFamily}', sans-serif`}
            fontWeight={subStyle.fontWeight}
            fontSize={subStyle.fontSize}
            letterSpacing={subStyle.letterSpacing}
          >
            {subStyle.customText || subtitle}
          </text>
          {isInteractive && isElementSelected('subtitle') && (
            <rect
              x={-4}
              y={-4}
              width={(alignment.subtitleWidth || 300) + 8}
              height={(alignment.subtitleHeight || 50) + 8}
              rx={14}
              fill="rgba(245, 158, 11, 0.15)"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </g>
      )}

      {/* 5. ROWS DATA OVERLAY */}
      {leftRows.map((row, idx) => renderRow(row, idx, false))}
      {!isSingleColumn && rightRows.map((row, idx) => renderRow(row, idx, true))}
    </svg>
  );
};
