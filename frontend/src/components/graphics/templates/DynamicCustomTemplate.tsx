import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GraphicsRenderData } from '../../../types/graphics';
import type { CalculatedStanding } from '../../../types/tournament';
import { normalizeTemplateType, type CustomGraphicsTemplate, type TextElementStyle, type SlotElementOverride } from '../../../types/customTemplate';
import { useFontStore } from '../../../store/fontStore';

export interface DynamicCustomTemplateProps {
  template: CustomGraphicsTemplate;
  data: GraphicsRenderData;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  selectedElementKey?: string | string[] | null;
  selectedElementKeys?: string[] | null;
  onSelectElement?: (elementKey: string, e?: React.MouseEvent) => void;
  onSelectMultipleElements?: (elementKeys: string[]) => void;
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
  onSelectMultipleElements,
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

  // Marquee / Box Selection State
  const [marquee, setMarquee] = useState<{
    isSelecting: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isShift: boolean;
    initialKeys: string[];
  } | null>(null);

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
  const isCustomSubtitle = Boolean(subtitle);

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
        (e.currentTarget as unknown as Element).setPointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // SVG Canvas Pointer Down (Trigger Marquee Selection if clicking on empty canvas)
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive || e.button !== 0) return;
    const coords = getSvgCoordinates(e);
    const isShift = e.shiftKey || e.ctrlKey || e.metaKey;
    const initialKeys = isShift ? (selectedElementKeys || (selectedElementKey ? (Array.isArray(selectedElementKey) ? selectedElementKey : [selectedElementKey]) : [])) : [];

    setMarquee({
      isSelecting: true,
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
      isShift,
      initialKeys
    });

    try {
      (e.currentTarget as unknown as Element).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  // SVG Container Pointer Move (Handles element dragging & marquee box selection)
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isInteractive) return;

    // 1. Element Dragging Mode (Single element or Multi-selected group)
    if (draggingKey && onDragElement) {
      const current = getSvgCoordinates(e);
      const deltaX = current.x - lastSvgPosRef.current.x;
      const deltaY = current.y - lastSvgPosRef.current.y;

      if (deltaX !== 0 || deltaY !== 0) {
        onDragElement(draggingKey, deltaX, deltaY);
        lastSvgPosRef.current = current;
      }
      return;
    }

    // 2. Marquee Box Selection Mode
    if (marquee?.isSelecting) {
      const current = getSvgCoordinates(e);
      const mMinX = Math.min(marquee.startX, current.x);
      const mMaxX = Math.max(marquee.startX, current.x);
      const mMinY = Math.min(marquee.startY, current.y);
      const mMaxY = Math.max(marquee.startY, current.y);

      const allBounds = getAllElementBounds();
      const intersecting = allBounds
        .filter((b) => !(b.maxX < mMinX || b.minX > mMaxX || b.maxY < mMinY || b.minY > mMaxY))
        .map((b) => b.key);

      const finalKeys = marquee.isShift
        ? Array.from(new Set([...marquee.initialKeys, ...intersecting]))
        : intersecting;

      onSelectMultipleElements?.(finalKeys);
      setMarquee((prev) => (prev ? { ...prev, currentX: current.x, currentY: current.y } : null));
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingKey) {
      setDraggingKey(null);
      try {
        (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
      } catch {}
    }

    if (marquee?.isSelecting) {
      const dist = Math.hypot(marquee.currentX - marquee.startX, marquee.currentY - marquee.startY);
      if (dist < 6 && !marquee.isShift) {
        // Simple click on empty canvas deselects
        onSelectMultipleElements?.([]);
      }
      setMarquee(null);
      try {
        (e.currentTarget as unknown as Element).releasePointerCapture?.(e.pointerId);
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
  const subDefaultWidth = alignment.subtitleWidth || 300;
  const subStyle = getStyle('subtitle', {
    x: alignment.subtitleX ?? Math.round(width / 2 - subDefaultWidth / 2),
    y: alignment.subtitleY ?? 240,
    fontSize: alignment.subtitleFontSize || 28,
    fontFamily: alignment.fontFamily,
    fontWeight: '900',
    fill: alignment.subtitleTextColor || '#ffffff',
    letterSpacing: 6,
    textAnchor: 'middle',
    visible: alignment.showSubtitleBanner !== false
  });

  const shouldRenderSubtitle = isInteractive
    ? (alignment.elements?.subtitle?.visible !== false)
    : alignment.showSubtitleBanner !== false && isCustomSubtitle;

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

  // Effective Template Type
  const effectiveTemplateType = template?.templateType || normalizeTemplateType(template?.category);

  // Prepare Rows (safely handle non-standings data)
  const safeRows = Array.isArray(rows) ? rows : [];
  const leftRows: (CalculatedStanding | null)[] = [];
  const rightRows: (CalculatedStanding | null)[] = [];

  if (isSingleColumn) {
    for (let i = 0; i < 12; i++) {
      leftRows.push(safeRows[i] || null);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      leftRows.push(safeRows[i] || null);
    }
    for (let i = 6; i < 12; i++) {
      rightRows.push(safeRows[i] || null);
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

  // Helper to compute bounding boxes for all interactive elements for marquee box selection
  const getAllElementBounds = useCallback((): { key: string; minX: number; minY: number; maxX: number; maxY: number }[] => {
    const list: { key: string; minX: number; minY: number; maxX: number; maxY: number }[] = [];

    const addTextBounds = (key: string, style: TextElementStyle, approxCharWidth = 0.6) => {
      if (style.visible === false) return;
      const fSize = style.fontSize || 24;
      const text = style.customText || '';
      const textLen = Math.max(text.length, 3);
      const estWidth = Math.max(40, textLen * fSize * approxCharWidth);

      let minX = style.x;
      let maxX = style.x + estWidth;
      if (style.textAnchor === 'middle') {
        minX = style.x - estWidth / 2;
        maxX = style.x + estWidth / 2;
      } else if (style.textAnchor === 'end') {
        minX = style.x - estWidth;
        maxX = style.x;
      }
      const minY = style.y - fSize;
      const maxY = style.y + 10;
      list.push({ key, minX, minY, maxX, maxY });
    };

    const addBoxBounds = (key: string, x: number, y: number, w: number, h: number, visible = true) => {
      if (!visible) return;
      list.push({ key, minX: x, minY: y, maxX: x + w, maxY: y + h });
    };

    // 1. Organizer
    addTextBounds('organizer', orgStyle, 0.7);
    if (effectiveOrgLogo && orgLogoStyle.visible !== false) {
      addBoxBounds('organizerLogo', orgLogoStyle.x, orgLogoStyle.y, orgLogoStyle.fontSize, orgLogoStyle.fontSize);
    }

    // 2. Tournament Title & Logo
    addTextBounds('tournamentTitle', titleStyle, 0.75);
    if (effectiveTournamentLogo && tourneyLogoStyle.visible !== false) {
      addBoxBounds('tournamentLogo', tourneyLogoStyle.x, tourneyLogoStyle.y, 64, 64);
    }

    // 3. Subtitle
    if (shouldRenderSubtitle) {
      addBoxBounds('subtitle', subStyle.x, subStyle.y, alignment.subtitleWidth || 300, alignment.subtitleHeight || 50);
    }

    // 4. PointX Watermark
    if (alignment.showPointXLogo !== false) {
      const pX = alignment.pointXLogoConfig?.x ?? (width - 170);
      const pY = alignment.pointXLogoConfig?.y ?? (height - 65);
      const pW = alignment.pointXLogoConfig?.width ?? 140;
      const pH = alignment.pointXLogoConfig?.height ?? 44;
      addBoxBounds('pointx_logo', pX, pY, pW, pH);
    }

    // 5. Custom Elements (Shapes / Text)
    if (Array.isArray(alignment.customElements)) {
      alignment.customElements.forEach((el) => {
        if (el.visible !== false) {
          addBoxBounds(`custom_el_${el.id}`, el.x, el.y, el.width || 120, el.height || 40);
        }
      });
    }

    // 6. Category-Specific Elements
    if (effectiveTemplateType === 'POINTS_TABLE') {
      for (let rank = 1; rank <= 12; rank++) {
        const isRightCol = !isSingleColumn && rank > 6;
        const rowIndex = isRightCol ? rank - 7 : rank - 1;
        const defaultBaseY = alignment.baseY + rowIndex * alignment.rowGap;

        const baseRank = isRightCol ? baseRightRankStyle : baseRankStyle;
        const baseTeam = isRightCol ? baseRightTeamStyle : baseTeamStyle;
        const baseLogo = isRightCol ? baseRightLogoStyle : baseLogoStyle;
        const baseMatch = isRightCol ? baseRightMatchStyle : baseMatchStyle;
        const baseBooyah = isRightCol ? baseRightBooyahStyle : baseBooyahStyle;
        const baseKills = isRightCol ? baseRightKillsStyle : baseKillsStyle;
        const basePlace = isRightCol ? baseRightPlaceStyle : basePlaceStyle;
        const baseTotal = isRightCol ? baseRightTotalStyle : baseTotalStyle;

        const curRank = resolveSlotItemStyle(rank, 'rank', baseRank, defaultBaseY + 32);
        const curTeam = resolveSlotItemStyle(rank, 'teamName', baseTeam, defaultBaseY + 31);
        const curLogo = resolveSlotItemStyle(rank, 'logo', baseLogo, defaultBaseY + 31 - (baseTeam.fontSize || 24));
        const curMatch = resolveSlotItemStyle(rank, 'match', baseMatch, defaultBaseY + 32);
        const curBooyah = resolveSlotItemStyle(rank, 'booyah', baseBooyah, defaultBaseY + 32);
        const curKills = resolveSlotItemStyle(rank, 'kills', baseKills, defaultBaseY + 32);
        const curPlace = resolveSlotItemStyle(rank, 'place', basePlace, defaultBaseY + 32);
        const curTotal = resolveSlotItemStyle(rank, 'total', baseTotal, defaultBaseY + 32);

        addTextBounds(`slot_${rank}_rank`, curRank, 0.6);
        addBoxBounds(`slot_${rank}_logo`, curLogo.x, curLogo.y, curLogo.fontSize || 28, curLogo.fontSize || 28, curLogo.visible !== false);
        addTextBounds(`slot_${rank}_teamName`, { ...curTeam, customText: curTeam.customText || `Team ${rank}` }, 0.65);
        addTextBounds(`slot_${rank}_match`, curMatch, 0.6);
        addTextBounds(`slot_${rank}_booyah`, curBooyah, 0.6);
        addTextBounds(`slot_${rank}_kills`, curKills, 0.6);
        addTextBounds(`slot_${rank}_place`, curPlace, 0.6);
        addTextBounds(`slot_${rank}_total`, curTotal, 0.6);
      }
    } else if (effectiveTemplateType === 'KILL_LEADER') {
      addTextBounds('kl_badge', getStyle('kl_badge', { x: width / 2, y: 310, fontSize: 36 }), 0.7);
      addBoxBounds('kl_player_photo', getStyle('kl_player_photo', { x: width / 2 - 90, y: 340, fontSize: 180 }).x, getStyle('kl_player_photo', { x: width / 2 - 90, y: 340, fontSize: 180 }).y, 180, 180);
      addTextBounds('kl_player_name', getStyle('kl_player_name', { x: width / 2, y: 570, fontSize: 52 }), 0.7);
      addTextBounds('kl_team_name', getStyle('kl_team_name', { x: width / 2, y: 620, fontSize: 26 }), 0.65);
      addBoxBounds('kl_team_logo', getStyle('kl_team_logo', { x: width / 2 - 20, y: 640, fontSize: 40 }).x, getStyle('kl_team_logo', { x: width / 2 - 20, y: 640, fontSize: 40 }).y, 40, 40);
      addTextBounds('kl_kills', getStyle('kl_kills', { x: width / 2 - 220, y: 760, fontSize: 56 }), 0.6);
      addTextBounds('kl_damage', getStyle('kl_damage', { x: width / 2, y: 760, fontSize: 52 }), 0.6);
      addTextBounds('kl_avg', getStyle('kl_avg', { x: width / 2 + 220, y: 760, fontSize: 52 }), 0.6);
    } else if (effectiveTemplateType === 'TOP_FRAGGERS') {
      addTextBounds('tf_p1_badge', getStyle('tf_p1_badge', { x: width / 2, y: 310, fontSize: 32 }), 0.7);
      addBoxBounds('tf_p1_photo', getStyle('tf_p1_photo', { x: width / 2 - 70, y: 340, fontSize: 140 }).x, getStyle('tf_p1_photo', { x: width / 2 - 70, y: 340, fontSize: 140 }).y, 140, 140);
      addTextBounds('tf_p1_name', getStyle('tf_p1_name', { x: width / 2, y: 520, fontSize: 42 }), 0.7);
      addTextBounds('tf_p1_team', getStyle('tf_p1_team', { x: width / 2, y: 558, fontSize: 24 }), 0.65);
      addTextBounds('tf_p1_kills', getStyle('tf_p1_kills', { x: width / 2, y: 615, fontSize: 38 }), 0.6);
      addTextBounds('tf_p2_badge', getStyle('tf_p2_badge', { x: width / 2 - 320, y: 440, fontSize: 26 }), 0.7);
      addBoxBounds('tf_p2_photo', getStyle('tf_p2_photo', { x: width / 2 - 380, y: 470, fontSize: 120 }).x, getStyle('tf_p2_photo', { x: width / 2 - 380, y: 470, fontSize: 120 }).y, 120, 120);
      addTextBounds('tf_p2_name', getStyle('tf_p2_name', { x: width / 2 - 320, y: 630, fontSize: 32 }), 0.7);
      addTextBounds('tf_p2_team', getStyle('tf_p2_team', { x: width / 2 - 320, y: 665, fontSize: 20 }), 0.65);
      addTextBounds('tf_p2_kills', getStyle('tf_p2_kills', { x: width / 2 - 320, y: 715, fontSize: 32 }), 0.6);
      addTextBounds('tf_p3_badge', getStyle('tf_p3_badge', { x: width / 2 + 320, y: 440, fontSize: 26 }), 0.7);
      addBoxBounds('tf_p3_photo', getStyle('tf_p3_photo', { x: width / 2 + 260, y: 470, fontSize: 120 }).x, getStyle('tf_p3_photo', { x: width / 2 + 260, y: 470, fontSize: 120 }).y, 120, 120);
      addTextBounds('tf_p3_name', getStyle('tf_p3_name', { x: width / 2 + 320, y: 630, fontSize: 32 }), 0.7);
      addTextBounds('tf_p3_team', getStyle('tf_p3_team', { x: width / 2 + 320, y: 665, fontSize: 20 }), 0.65);
      addTextBounds('tf_p3_kills', getStyle('tf_p3_kills', { x: width / 2 + 320, y: 715, fontSize: 32 }), 0.6);
    } else if (effectiveTemplateType === 'TEAM_POSTER') {
      addBoxBounds('tp_team_logo', getStyle('tp_team_logo', { x: width / 2 - 70, y: 240, fontSize: 140 }).x, getStyle('tp_team_logo', { x: width / 2 - 70, y: 240, fontSize: 140 }).y, 140, 140);
      addTextBounds('tp_team_name', getStyle('tp_team_name', { x: width / 2, y: 430, fontSize: 52 }), 0.7);
      addTextBounds('tp_team_tag', getStyle('tp_team_tag', { x: width / 2, y: 472, fontSize: 26 }), 0.65);
      addTextBounds('tp_team_slogan', getStyle('tp_team_slogan', { x: width / 2, y: 510, fontSize: 18 }), 0.65);
      for (let p = 1; p <= 5; p++) {
        addTextBounds(`tp_p${p}_name`, getStyle(`tp_p${p}_name`, { x: 180 * p, y: 750, fontSize: 24 }), 0.65);
        addTextBounds(`tp_p${p}_role`, getStyle(`tp_p${p}_role`, { x: 180 * p, y: 780, fontSize: 15 }), 0.65);
      }
    } else if (effectiveTemplateType === 'SLOTS_LIST') {
      for (let s = 1; s <= 12; s++) {
        addTextBounds(`sl_slot_${s}_num`, getStyle(`sl_slot_${s}_num`, { x: 100, y: 200 + s * 50, fontSize: 24 }), 0.6);
        addTextBounds(`sl_slot_${s}_team`, getStyle(`sl_slot_${s}_team`, { x: 200, y: 200 + s * 50, fontSize: 24 }), 0.65);
        addTextBounds(`sl_slot_${s}_status`, getStyle(`sl_slot_${s}_status`, { x: 400, y: 200 + s * 50, fontSize: 14 }), 0.65);
      }
    } else if (effectiveTemplateType === 'VICTORY_CERTIFICATE') {
      addTextBounds('vc_award_title', getStyle('vc_award_title', { x: width / 2, y: 260, fontSize: 72 }), 0.7);
      addTextBounds('vc_award_subtitle', getStyle('vc_award_subtitle', { x: width / 2, y: 310, fontSize: 22 }), 0.7);
      addTextBounds('vc_winner_name', getStyle('vc_winner_name', { x: width / 2, y: 480, fontSize: 72 }), 0.7);
      addBoxBounds('vc_winner_logo', getStyle('vc_winner_logo', { x: width / 2 - 45, y: 510, fontSize: 90 }).x, getStyle('vc_winner_logo', { x: width / 2 - 45, y: 510, fontSize: 90 }).y, 90, 90);
      addTextBounds('vc_date', getStyle('vc_date', { x: width / 2 - 320, y: 690, fontSize: 22 }), 0.65);
      addTextBounds('vc_signature', getStyle('vc_signature', { x: width / 2 + 320, y: 690, fontSize: 22 }), 0.65);
      addTextBounds('vc_cert_id', getStyle('vc_cert_id', { x: width / 2, y: 780, fontSize: 16 }), 0.65);
    }

    return list;
  }, [
    orgStyle, effectiveOrgLogo, orgLogoStyle,
    titleStyle, effectiveTournamentLogo, tourneyLogoStyle,
    shouldRenderSubtitle, subStyle, alignment, isSingleColumn,
    effectiveTemplateType, width, height,
    baseRightRankStyle, baseRankStyle, baseRightTeamStyle, baseTeamStyle,
    baseRightLogoStyle, baseLogoStyle, baseRightMatchStyle, baseMatchStyle,
    baseRightBooyahStyle, baseBooyahStyle, baseRightKillsStyle, baseKillsStyle,
    baseRightPlaceStyle, basePlaceStyle, baseRightTotalStyle, baseTotalStyle,
    resolveSlotItemStyle, getStyle
  ]);

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

  // Generic Interactive Text Renderer
  const renderInteractiveText = (
    key: string,
    style: TextElementStyle,
    fallbackText: string,
    options?: {
      letterSpacing?: number;
      textAnchor?: 'start' | 'middle' | 'end';
      approxWidth?: number;
    }
  ) => {
    if (style.visible === false) return null;
    const isSelected = isElementSelected(key);
    const textVal = style.customText || fallbackText;
    const fSize = style.fontSize || 24;
    const anchor = options?.textAnchor || style.textAnchor || 'middle';
    const widthEst = options?.approxWidth || Math.max(80, textVal.length * fSize * 0.65);

    let boxX = style.x;
    if (anchor === 'middle') boxX = style.x - widthEst / 2;
    else if (anchor === 'end') boxX = style.x - widthEst;

    return (
      <g
        key={key}
        onPointerDown={(e) => handlePointerDown(key, e)}
        className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-85' : ''}
      >
        <text
          x={style.x}
          y={style.y}
          textAnchor={anchor}
          fill={style.fill}
          fontFamily={`'${style.fontFamily}', sans-serif`}
          fontWeight={style.fontWeight}
          fontSize={fSize}
          letterSpacing={options?.letterSpacing ?? style.letterSpacing}
          filter={style.glowColor ? `drop-shadow(0 0 6px ${style.glowColor})` : undefined}
        >
          {textVal}
        </text>
        {isInteractive && isSelected && (
          <rect
            x={boxX - 4}
            y={style.y - fSize}
            width={widthEst + 8}
            height={fSize + 10}
            fill="rgba(245, 158, 11, 0.15)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
            rx={4}
          />
        )}
      </g>
    );
  };

  // Generic Interactive Image Renderer
  const renderInteractiveImage = (
    key: string,
    href: string | undefined,
    x: number,
    y: number,
    size: number,
    fallbackText?: string,
    borderRadius = 12
  ) => {
    const isSelected = isElementSelected(key);
    const elStyle = getStyle(key, { x, y, fontSize: size, visible: true });
    if (elStyle.visible === false) return null;
    const curX = elStyle.x;
    const curY = elStyle.y;
    const curSize = elStyle.fontSize || size;

    return (
      <g
        key={key}
        onPointerDown={(e) => handlePointerDown(key, e)}
        className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-85' : ''}
      >
        {href ? (
          <image
            href={href}
            x={curX}
            y={curY}
            width={curSize}
            height={curSize}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`inset(0 round ${borderRadius}px)`}
          />
        ) : (
          <g transform={`translate(${curX}, ${curY})`}>
            <rect
              width={curSize}
              height={curSize}
              rx={borderRadius}
              fill="#151b2e"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            <text
              x={curSize / 2}
              y={curSize / 2 + 6}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize={Math.max(12, curSize * 0.28)}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {fallbackText || 'LOGO'}
            </text>
          </g>
        )}
        {isInteractive && isSelected && (
          <rect
            x={curX - 4}
            y={curY - 4}
            width={curSize + 8}
            height={curSize + 8}
            rx={borderRadius + 2}
            fill="rgba(245, 158, 11, 0.2)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}
      </g>
    );
  };

  // 1. KILL LEADER / WARHEADS CATEGORY RENDERER
  const renderKillLeaderCategory = () => {
    const anyData = data as any;
    const player = anyData?.player || {
      name: 'VIPERX',
      teamName: 'ALPHA SQUAD',
      teamLogo: undefined,
      avatarUrl: undefined,
      totalKills: 28,
      damage: 6420,
      avgKills: 7.0,
      matchesPlayed: 4,
    };

    const badgeStyle = getStyle('kl_badge', { x: width / 2, y: 310, fontSize: 36, fontWeight: '900', fill: '#FF416C', textAnchor: 'middle' });
    const photoStyle = getStyle('kl_player_photo', { x: width / 2 - 90, y: 340, fontSize: 180, visible: true });
    const nameStyle = getStyle('kl_player_name', { x: width / 2, y: 570, fontSize: 52, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const teamStyle = getStyle('kl_team_name', { x: width / 2, y: 620, fontSize: 26, fontWeight: '800', fill: '#FFD200', textAnchor: 'middle' });
    const logoStyle = getStyle('kl_team_logo', { x: width / 2 - 20, y: 640, fontSize: 40, visible: true });

    const killsStyle = getStyle('kl_kills', { x: width / 2 - 220, y: 760, fontSize: 56, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const damageStyle = getStyle('kl_damage', { x: width / 2, y: 760, fontSize: 52, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const avgStyle = getStyle('kl_avg', { x: width / 2 + 220, y: 760, fontSize: 52, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });

    return (
      <g key="category_kill_leader">
        {renderInteractiveText('kl_badge', badgeStyle, '⚔️ WARHEAD KILL LEADER')}
        {renderInteractiveImage('kl_player_photo', player.avatarUrl, photoStyle.x, photoStyle.y, photoStyle.fontSize, '👑', 90)}
        {renderInteractiveText('kl_player_name', nameStyle, player.name || 'VIPERX')}
        {renderInteractiveText('kl_team_name', teamStyle, player.teamName || 'ALPHA SQUAD')}
        {renderInteractiveImage('kl_team_logo', player.teamLogo, logoStyle.x, logoStyle.y, logoStyle.fontSize, 'TM', 8)}

        {/* 3-Box Telemetry HUD Cards */}
        <g transform={`translate(${width / 2 - 330}, ${killsStyle.y - 85})`}>
          <rect x="0" y="0" width="200" height="120" rx="16" fill="#0e1220" fillOpacity="0.8" stroke="#ff416c" strokeWidth="2" />
          <text x="100" y="32" textAnchor="middle" fill="#ff4b2b" fontFamily="monospace" fontWeight="800" fontSize="13" letterSpacing={2}>
            TOTAL KILLS
          </text>
        </g>
        {renderInteractiveText('kl_kills', killsStyle, String(player.totalKills ?? 28))}

        <g transform={`translate(${width / 2 - 100}, ${damageStyle.y - 85})`}>
          <rect x="0" y="0" width="200" height="120" rx="16" fill="#0e1220" fillOpacity="0.8" stroke="#ffd200" strokeWidth="2" />
          <text x="100" y="32" textAnchor="middle" fill="#ffd200" fontFamily="monospace" fontWeight="800" fontSize="13" letterSpacing={2}>
            TOTAL DAMAGE
          </text>
        </g>
        {renderInteractiveText('kl_damage', damageStyle, String(player.damage ?? 6420))}

        <g transform={`translate(${width / 2 + 130}, ${avgStyle.y - 85})`}>
          <rect x="0" y="0" width="200" height="120" rx="16" fill="#0e1220" fillOpacity="0.8" stroke="#00f0ff" strokeWidth="2" />
          <text x="100" y="32" textAnchor="middle" fill="#00f0ff" fontFamily="monospace" fontWeight="800" fontSize="13" letterSpacing={2}>
            AVG / MATCH
          </text>
        </g>
        {renderInteractiveText('kl_avg', avgStyle, String(player.avgKills ?? 7.0))}
      </g>
    );
  };

  // 2. TOP FRAGGERS / MVP CATEGORY RENDERER
  const renderTopFraggersCategory = () => {
    const anyData = data as any;
    const playersList = anyData?.players || [
      { rank: 1, name: 'VIPERX', teamName: 'ALPHA SQUAD', totalKills: 32, damage: 7200 },
      { rank: 2, name: 'GHOST_RIDER', teamName: 'NEXUS ESPORTS', totalKills: 26, damage: 5900 },
      { rank: 3, name: 'SHADOW_SNIPER', teamName: 'VALOR WARRIORS', totalKills: 22, damage: 5100 },
    ];

    const p1 = playersList[0] || {};
    const p2 = playersList[1] || {};
    const p3 = playersList[2] || {};

    const p1Badge = getStyle('tf_p1_badge', { x: width / 2, y: 310, fontSize: 32, fontWeight: '900', fill: '#FFD200', textAnchor: 'middle' });
    const p1Photo = getStyle('tf_p1_photo', { x: width / 2 - 70, y: 340, fontSize: 140, visible: true });
    const p1Name = getStyle('tf_p1_name', { x: width / 2, y: 520, fontSize: 42, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const p1Team = getStyle('tf_p1_team', { x: width / 2, y: 558, fontSize: 24, fontWeight: '800', fill: '#FFD200', textAnchor: 'middle' });
    const p1Kills = getStyle('tf_p1_kills', { x: width / 2, y: 615, fontSize: 38, fontWeight: '900', fill: '#FF416C', textAnchor: 'middle' });

    const p2Badge = getStyle('tf_p2_badge', { x: width / 2 - 320, y: 440, fontSize: 26, fontWeight: '900', fill: '#CBD5E1', textAnchor: 'middle' });
    const p2Photo = getStyle('tf_p2_photo', { x: width / 2 - 380, y: 470, fontSize: 120, visible: true });
    const p2Name = getStyle('tf_p2_name', { x: width / 2 - 320, y: 630, fontSize: 32, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const p2Team = getStyle('tf_p2_team', { x: width / 2 - 320, y: 665, fontSize: 20, fontWeight: '800', fill: '#CBD5E1', textAnchor: 'middle' });
    const p2Kills = getStyle('tf_p2_kills', { x: width / 2 - 320, y: 715, fontSize: 32, fontWeight: '900', fill: '#FF416C', textAnchor: 'middle' });

    const p3Badge = getStyle('tf_p3_badge', { x: width / 2 + 320, y: 440, fontSize: 26, fontWeight: '900', fill: '#CD7F32', textAnchor: 'middle' });
    const p3Photo = getStyle('tf_p3_photo', { x: width / 2 + 260, y: 470, fontSize: 120, visible: true });
    const p3Name = getStyle('tf_p3_name', { x: width / 2 + 320, y: 630, fontSize: 32, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const p3Team = getStyle('tf_p3_team', { x: width / 2 + 320, y: 665, fontSize: 20, fontWeight: '800', fill: '#D97706', textAnchor: 'middle' });
    const p3Kills = getStyle('tf_p3_kills', { x: width / 2 + 320, y: 715, fontSize: 32, fontWeight: '900', fill: '#FF416C', textAnchor: 'middle' });

    return (
      <g key="category_top_fraggers">
        {/* MVP 1 (Center) */}
        {renderInteractiveText('tf_p1_badge', p1Badge, '🏆 1ST MVP')}
        {renderInteractiveImage('tf_p1_photo', p1.avatarUrl, p1Photo.x, p1Photo.y, p1Photo.fontSize, '👑', 70)}
        {renderInteractiveText('tf_p1_name', p1Name, p1.name || 'VIPERX')}
        {renderInteractiveText('tf_p1_team', p1Team, p1.teamName || 'ALPHA SQUAD')}
        {renderInteractiveText('tf_p1_kills', p1Kills, `${p1.totalKills ?? 32} KILLS`)}

        {/* MVP 2 (Left) */}
        {renderInteractiveText('tf_p2_badge', p2Badge, '🥈 2ND RUNNER')}
        {renderInteractiveImage('tf_p2_photo', p2.avatarUrl, p2Photo.x, p2Photo.y, p2Photo.fontSize, 'P2', 60)}
        {renderInteractiveText('tf_p2_name', p2Name, p2.name || 'GHOST_RIDER')}
        {renderInteractiveText('tf_p2_team', p2Team, p2.teamName || 'NEXUS')}
        {renderInteractiveText('tf_p2_kills', p2Kills, `${p2.totalKills ?? 26} KILLS`)}

        {/* MVP 3 (Right) */}
        {renderInteractiveText('tf_p3_badge', p3Badge, '🥉 3RD PLACE')}
        {renderInteractiveImage('tf_p3_photo', p3.avatarUrl, p3Photo.x, p3Photo.y, p3Photo.fontSize, 'P3', 60)}
        {renderInteractiveText('tf_p3_name', p3Name, p3.name || 'SHADOW_SNIPER')}
        {renderInteractiveText('tf_p3_team', p3Team, p3.teamName || 'VALOR')}
        {renderInteractiveText('tf_p3_kills', p3Kills, `${p3.totalKills ?? 22} KILLS`)}
      </g>
    );
  };

  // 3. TEAM POSTER CATEGORY RENDERER
  const renderTeamPosterCategory = () => {
    const anyData = data as any;
    const team = anyData?.team || {
      name: 'ALPHA ESPORTS',
      tag: 'ALP',
      slogan: 'VICTORY THROUGH SKILL',
      players: [
        { name: 'AlphaCaptain', role: 'CAPTAIN' },
        { name: 'GhostSniper', role: 'RUSHER' },
        { name: 'NeonRusher', role: 'SNIPER' },
        { name: 'ShadowSupport', role: 'SUPPORT' },
      ]
    };

    const logoStyle = getStyle('tp_team_logo', { x: width / 2 - 70, y: 240, fontSize: 140, visible: true });
    const nameStyle = getStyle('tp_team_name', { x: width / 2, y: 430, fontSize: 52, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const tagStyle = getStyle('tp_team_tag', { x: width / 2, y: 472, fontSize: 26, fontWeight: '800', fill: '#FFD200', textAnchor: 'middle' });
    const sloganStyle = getStyle('tp_team_slogan', { x: width / 2, y: 510, fontSize: 18, fontWeight: '700', fill: '#94A3B8', textAnchor: 'middle' });

    const playersList = team.players || [];
    const cardWidth = 180;
    const gap = 30;
    const totalW = playersList.length * cardWidth + (playersList.length - 1) * gap;
    const startX = (width - totalW) / 2;

    return (
      <g key="category_team_poster">
        {renderInteractiveImage('tp_team_logo', team.logoUrl, logoStyle.x, logoStyle.y, logoStyle.fontSize, 'CREST', 16)}
        {renderInteractiveText('tp_team_name', nameStyle, team.name || 'ALPHA ESPORTS')}
        {renderInteractiveText('tp_team_tag', tagStyle, `[${team.tag || 'ALP'}]`)}
        {renderInteractiveText('tp_team_slogan', sloganStyle, team.slogan || 'VICTORY THROUGH SKILL')}

        {playersList.map((pl: any, idx: number) => {
          const cardX = startX + idx * (cardWidth + gap);
          const photoKey = `tp_p${idx + 1}_photo`;
          const nameKey = `tp_p${idx + 1}_name`;
          const roleKey = `tp_p${idx + 1}_role`;

          const pPhoto = getStyle(photoKey, { x: cardX + 25, y: 580, fontSize: 130, visible: true });
          const pName = getStyle(nameKey, { x: cardX + cardWidth / 2, y: 750, fontSize: 24, fontWeight: '800', fill: '#FFFFFF', textAnchor: 'middle' });
          const pRole = getStyle(roleKey, { x: cardX + cardWidth / 2, y: 780, fontSize: 15, fontWeight: '700', fill: '#00F0FF', textAnchor: 'middle' });

          return (
            <g key={idx}>
              <rect x={cardX} y={560} width={cardWidth} height={240} rx={16} fill="#0d111e" fillOpacity="0.8" stroke="#ffffff" strokeOpacity="0.1" />
              {renderInteractiveImage(photoKey, pl.photoUrl, pPhoto.x, pPhoto.y, pPhoto.fontSize, `P${idx + 1}`, 12)}
              {renderInteractiveText(nameKey, pName, pl.name || `Player ${idx + 1}`)}
              {renderInteractiveText(roleKey, pRole, pl.role || 'ROSTER')}
            </g>
          );
        })}
      </g>
    );
  };

  // 4. SLOTS LIST CATEGORY RENDERER
  const renderSlotsListCategory = () => {
    const anyData = data as any;
    const slots = anyData?.slots || Array.from({ length: 12 }, (_, i) => ({
      slotNumber: i + 1,
      teamName: `TEAM ${i + 1}`,
      isConfirmed: true,
    }));

    return (
      <g key="category_slots_list">
        {slots.slice(0, 12).map((slot: any, idx: number) => {
          const isRightCol = idx >= 6;
          const rowIdx = isRightCol ? idx - 6 : idx;
          const colX = isRightCol ? width / 2 + 30 : width / 2 - 470;
          const colY = 270 + rowIdx * 105;

          const numKey = `sl_slot_${idx + 1}_num`;
          const logoKey = `sl_slot_${idx + 1}_logo`;
          const nameKey = `sl_slot_${idx + 1}_team`;
          const statusKey = `sl_slot_${idx + 1}_status`;

          const numStyle = getStyle(numKey, { x: colX + 45, y: colY + 44, fontSize: 24, fontWeight: '900', fill: '#FFD200', textAnchor: 'middle' });
          const logoStyle = getStyle(logoKey, { x: colX + 85, y: colY + 14, fontSize: 44, visible: true });
          const nameStyle = getStyle(nameKey, { x: colX + 150, y: colY + 44, fontSize: 24, fontWeight: '800', fill: '#FFFFFF', textAnchor: 'start' });
          const statusStyle = getStyle(statusKey, { x: colX + 380, y: colY + 44, fontSize: 14, fontWeight: '800', fill: '#10B981', textAnchor: 'middle' });

          return (
            <g key={idx}>
              <rect x={colX} y={colY} width={440} height={75} rx={14} fill="#0d111e" fillOpacity="0.8" stroke="#ffffff" strokeOpacity="0.1" />
              {renderInteractiveText(numKey, numStyle, `#${String(slot.slotNumber || idx + 1).padStart(2, '0')}`)}
              {renderInteractiveImage(logoKey, slot.logoUrl, logoStyle.x, logoStyle.y, logoStyle.fontSize, 'TM', 8)}
              {renderInteractiveText(nameKey, nameStyle, slot.teamName || `Slot ${idx + 1}`)}
              {renderInteractiveText(statusKey, statusStyle, slot.isConfirmed !== false ? 'CONFIRMED' : 'PENDING')}
            </g>
          );
        })}
      </g>
    );
  };

  // 5. VICTORY CERTIFICATE CATEGORY RENDERER
  const renderVictoryCertificateCategory = () => {
    const anyData = data as any;
    const winner = anyData?.winner || { teamName: 'ALPHA CHAMPIONS', logoUrl: undefined };
    const awardTitle = anyData?.awardTitle || 'CHAMPION';
    const awardSubtitle = anyData?.awardSubtitle || 'For Outstanding Battle Royale Performance';
    const certDate = anyData?.tournamentDate || 'October 14, 2026';
    const signature = anyData?.organizerSignature || 'Official Host';
    const certId = anyData?.certificateId || 'PTX-CERT-2026-A89F2';

    const titleStyle = getStyle('vc_award_title', { x: width / 2, y: 260, fontSize: 72, fontWeight: '900', fill: '#FFD200', textAnchor: 'middle' });
    const subTitleStyle = getStyle('vc_award_subtitle', { x: width / 2, y: 310, fontSize: 22, fontWeight: '700', fill: '#CBD5E0', textAnchor: 'middle' });
    const presentStyle = getStyle('vc_presented_to', { x: width / 2, y: 390, fontSize: 20, fontWeight: '600', fill: '#A0AEC0', textAnchor: 'middle' });
    const winnerStyle = getStyle('vc_winner_name', { x: width / 2, y: 480, fontSize: 72, fontWeight: '900', fill: '#FFFFFF', textAnchor: 'middle' });
    const logoStyle = getStyle('vc_winner_logo', { x: width / 2 - 45, y: 510, fontSize: 90, visible: true });
    const dateStyle = getStyle('vc_date', { x: width / 2 - 320, y: 690, fontSize: 22, fontWeight: '700', fill: '#CBD5E0', textAnchor: 'middle' });
    const sigStyle = getStyle('vc_signature', { x: width / 2 + 320, y: 690, fontSize: 22, fontWeight: '700', fill: '#FFD200', textAnchor: 'middle' });
    const certIdStyle = getStyle('vc_cert_id', { x: width / 2, y: 780, fontSize: 16, fontWeight: '800', fill: '#718096', textAnchor: 'middle' });

    return (
      <g key="category_victory_certificate">
        {renderInteractiveText('vc_award_title', titleStyle, awardTitle.toUpperCase())}
        {renderInteractiveText('vc_award_subtitle', subTitleStyle, awardSubtitle)}
        {renderInteractiveText('vc_presented_to', presentStyle, 'THIS CERTIFICATE IS PROUDLY PRESENTED TO')}
        {renderInteractiveText('vc_winner_name', winnerStyle, (winner.teamName || 'ALPHA CHAMPIONS').toUpperCase())}
        {renderInteractiveImage('vc_winner_logo', winner.logoUrl, logoStyle.x, logoStyle.y, logoStyle.fontSize, '🏆', 16)}
        {renderInteractiveText('vc_date', dateStyle, `DATE: ${certDate}`)}
        {renderInteractiveText('vc_signature', sigStyle, `AUTHORIZED: ${signature.toUpperCase()}`)}
        {renderInteractiveText('vc_cert_id', certIdStyle, `VERIFICATION ID: ${certId}`)}
      </g>
    );
  };

  // 6. CUSTOM USER ELEMENTS (SHAPES & TEXT)
  const renderCustomElements = () => {
    const customList = alignment.customElements || [];
    if (customList.length === 0) return null;

    return (
      <g key="custom_canvas_elements">
        {customList.map((el) => {
          if (el.visible === false) return null;
          const elKey = `custom_el_${el.id}`;
          const isSelected = isElementSelected(elKey);
          const x = el.x;
          const y = el.y;
          const w = el.width || 120;
          const h = el.height || 40;
          const opacity = el.opacity ?? 1;

          if (el.type === 'rect') {
            return (
              <g
                key={el.id}
                onPointerDown={(e) => handlePointerDown(elKey, e)}
                className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={8}
                  fill={el.bgColor || 'rgba(15, 23, 42, 0.8)'}
                  stroke={el.borderColor || '#00f0ff'}
                  strokeWidth={el.borderWidth || 2}
                  opacity={opacity}
                />
                {isInteractive && isSelected && (
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={w + 8}
                    height={h + 8}
                    rx={10}
                    fill="rgba(245, 158, 11, 0.15)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
              </g>
            );
          }

          if (el.type === 'line') {
            return (
              <g
                key={el.id}
                onPointerDown={(e) => handlePointerDown(elKey, e)}
                className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''}
              >
                <line
                  x1={x}
                  y1={y}
                  x2={x + w}
                  y2={y}
                  stroke={el.color || '#f59e0b'}
                  strokeWidth={el.height || 3}
                  opacity={opacity}
                  strokeLinecap="round"
                />
                {isInteractive && isSelected && (
                  <rect
                    x={x - 4}
                    y={y - 8}
                    width={w + 8}
                    height={16}
                    fill="rgba(245, 158, 11, 0.15)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
              </g>
            );
          }

          if (el.type === 'pill') {
            return (
              <g
                key={el.id}
                onPointerDown={(e) => handlePointerDown(elKey, e)}
                className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={h / 2}
                  fill={el.bgColor || 'rgba(239, 68, 68, 0.25)'}
                  stroke={el.borderColor || '#ef4444'}
                  strokeWidth={el.borderWidth || 2}
                  opacity={opacity}
                />
                <text
                  x={x + w / 2}
                  y={y + h * 0.65}
                  textAnchor="middle"
                  fill={el.color || '#ffffff'}
                  fontSize={el.fontSize || 16}
                  fontFamily={`'${el.fontFamily || alignment.fontFamily}', sans-serif`}
                  fontWeight={el.fontWeight || '900'}
                  letterSpacing={1.5}
                >
                  {el.text || 'BADGE'}
                </text>
                {isInteractive && isSelected && (
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={w + 8}
                    height={h + 8}
                    rx={h / 2 + 2}
                    fill="rgba(245, 158, 11, 0.15)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
              </g>
            );
          }

          // Default: Text element
          const fSize = el.fontSize || 28;
          const textVal = el.text || 'CUSTOM TEXT';
          return (
            <g
              key={el.id}
              onPointerDown={(e) => handlePointerDown(elKey, e)}
              className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-90' : ''}
            >
              <text
                x={x}
                y={y}
                textAnchor="middle"
                fill={el.color || '#ffffff'}
                fontFamily={`'${el.fontFamily || alignment.fontFamily}', sans-serif`}
                fontWeight={el.fontWeight || '800'}
                fontSize={fSize}
                opacity={opacity}
              >
                {textVal}
              </text>
              {isInteractive && isSelected && (
                <rect
                  x={x - Math.max(60, textVal.length * fSize * 0.35)}
                  y={y - fSize}
                  width={Math.max(120, textVal.length * fSize * 0.7)}
                  height={fSize + 10}
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  rx={4}
                />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // 7. POINTX WATERMARK LOGO
  const renderPointXLogoWatermark = () => {
    if (alignment.showPointXLogo === false) return null;
    const isSelected = isElementSelected('pointx_logo');
    const pX = alignment.pointXLogoConfig?.x ?? (width - 170);
    const pY = alignment.pointXLogoConfig?.y ?? (height - 65);
    const pW = alignment.pointXLogoConfig?.width ?? 140;
    const pH = alignment.pointXLogoConfig?.height ?? 44;
    const pOp = alignment.pointXLogoConfig?.opacity ?? 0.88;

    return (
      <g
        key="pointx_watermark"
        transform={`translate(${pX}, ${pY})`}
        opacity={pOp}
        onPointerDown={(e) => handlePointerDown('pointx_logo', e)}
        className={isInteractive ? 'cursor-grab active:cursor-grabbing hover:opacity-100' : ''}
      >
        <rect
          width={pW}
          height={pH}
          rx={8}
          fill="#090d16"
          stroke="#f59e0b"
          strokeWidth={1.5}
          fillOpacity={0.88}
        />
        <text
          x={pW / 2}
          y={pH * 0.65}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={Math.round(pH * 0.44)}
          fontFamily="sans-serif"
          fontWeight="900"
          letterSpacing={2}
        >
          POINT<tspan fill="#f59e0b">X</tspan>
        </text>
        {isInteractive && isSelected && (
          <rect
            x={-4}
            y={-4}
            width={pW + 8}
            height={pH + 8}
            rx={10}
            fill="rgba(245, 158, 11, 0.2)"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
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
      onPointerDown={handleSvgPointerDown}
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerLeave={handleSvgPointerUp}
      className={`w-full h-full select-none ${isInteractive ? (draggingKey ? 'cursor-grabbing' : 'cursor-crosshair') : ''}`}
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
      {shouldRenderSubtitle && (
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
            fill={
              alignment.scopeBadgeFont?.bgColor ||
              (alignment.subtitleBgColor && alignment.subtitleBgColor !== 'transparent'
                ? alignment.subtitleBgColor
                : 'rgba(5, 29, 56, 0.9)')
            }
            stroke={
              alignment.scopeBadgeFont?.borderColor ||
              (alignment.subtitleBorderColor && alignment.subtitleBorderColor !== 'transparent'
                ? alignment.subtitleBorderColor
                : '#00f0ff')
            }
            strokeWidth={alignment.scopeBadgeFont?.borderWidth ?? 3}
          />
          <text
            x={(alignment.subtitleWidth || 300) / 2}
            y={(alignment.subtitleHeight || 50) * 0.68}
            textAnchor="middle"
            fill={alignment.scopeBadgeFont?.color || subStyle.fill}
            fontFamily={`'${alignment.scopeBadgeFont?.fontFamily || subStyle.fontFamily}', sans-serif`}
            fontWeight={alignment.scopeBadgeFont?.fontWeight || subStyle.fontWeight}
            fontSize={alignment.scopeBadgeFont?.fontSize || subStyle.fontSize}
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

      {/* 5. DYNAMIC CATEGORY GRAPHICS & STANDINGS OVERLAY */}
      {effectiveTemplateType === 'POINTS_TABLE' && (
        <>
          {leftRows.map((row, idx) => renderRow(row, idx, false))}
          {!isSingleColumn && rightRows.map((row, idx) => renderRow(row, idx, true))}
        </>
      )}
      {effectiveTemplateType === 'KILL_LEADER' && renderKillLeaderCategory()}
      {effectiveTemplateType === 'TOP_FRAGGERS' && renderTopFraggersCategory()}
      {effectiveTemplateType === 'TEAM_POSTER' && renderTeamPosterCategory()}
      {effectiveTemplateType === 'SLOTS_LIST' && renderSlotsListCategory()}
      {effectiveTemplateType === 'VICTORY_CERTIFICATE' && renderVictoryCertificateCategory()}

      {/* 6. USER-DEFINED CUSTOM ELEMENTS (SHAPES, TEXTS, BADGES) */}
      {renderCustomElements()}

      {/* 7. POINTX WATERMARK LOGO */}
      {renderPointXLogoWatermark()}

      {/* 6. MARQUEE MULTI-SELECTION BOX & FLOATING BADGE */}
      {marquee && marquee.isSelecting && Math.hypot(marquee.currentX - marquee.startX, marquee.currentY - marquee.startY) >= 4 && (
        <g pointerEvents="none" className="select-none">
          <rect
            x={Math.min(marquee.startX, marquee.currentX)}
            y={Math.min(marquee.startY, marquee.currentY)}
            width={Math.abs(marquee.currentX - marquee.startX)}
            height={Math.abs(marquee.currentY - marquee.startY)}
            fill="rgba(59, 130, 246, 0.18)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6 3"
            rx="6"
          />
          {/* Live selection counter floating badge */}
          <g transform={`translate(${Math.max(marquee.startX, marquee.currentX) + 10}, ${Math.min(marquee.startY, marquee.currentY) - 8})`}>
            <rect
              x={0}
              y={0}
              width={120}
              height={28}
              rx={14}
              fill="#0f172a"
              stroke="#3b82f6"
              strokeWidth={1.5}
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
            />
            <text
              x={60}
              y={18}
              textAnchor="middle"
              fill="#93c5fd"
              fontSize="12"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ✦ {selectedElementKeys?.length || 0} Selected
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};
