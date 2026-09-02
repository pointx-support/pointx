import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTemplateStore } from '../../store/templateStore';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { useFontStore } from '../../store/fontStore';
import { DynamicCustomTemplate } from './templates/DynamicCustomTemplate';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { useToast } from '../ui/Toast';
import {
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowLeft,
  MousePointer,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Eye,
  EyeOff,
  Move,
  Layers,
  ZoomIn,
  ZoomOut,
  Sliders,
  Plus,
  Edit3,
  Copy,
  Image as ImageIcon,
  AlertTriangle,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Maximize2,
  X
} from 'lucide-react';
import type { GraphicsRenderData } from '../../types/graphics';
import type { TemplateAlignmentConfig, TextElementStyle } from '../../types/customTemplate';

export interface AdminTemplateStudioProps {
  onClose: () => void;
}

export const AdminTemplateStudio: React.FC<AdminTemplateStudioProps> = ({ onClose }) => {
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    createCustomTemplate,
    updateTemplateAlignment,
    updateTemplateMetadata,
    publishTemplate,
    unpublishTemplate,
    deleteTemplate,
    cloneTemplate,
    replaceTemplateImage,
    getActiveTemplate
  } = useTemplateStore();

  const {
    customFonts,
    uploadCustomFont,
    deleteCustomFont,
    getAllFontNames,
    registerAllFontsInDocument
  } = useFontStore();

  const { currentTournament, getStandings } = useTournamentStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const replaceArtworkInputRef = useRef<HTMLInputElement | null>(null);
  const customFontInputRef = useRef<HTMLInputElement | null>(null);

  // Multi-element selection state
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['slot_1_teamName']);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>('Slot 1: Team Name');
  const [stepSize, setStepSize] = useState<number>(5);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Hold / long-press interval ref for directional buttons
  const holdTimerRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);

  // Custom Font Upload state
  const [fontUploadName, setFontUploadName] = useState('');
  const [fontUploadFile, setFontUploadFile] = useState<File | null>(null);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  // Create Template form state
  const [createName, setCreateName] = useState('');
  const [createAspectRatio, setCreateAspectRatio] = useState<'16:9' | '4:5'>('16:9');
  const [createLayoutMode, setCreateLayoutMode] = useState<'dual-column' | 'single-column'>('dual-column');
  const [createImageUrl, setCreateImageUrl] = useState('');

  // Edit Template form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAspectRatio, setEditAspectRatio] = useState<'16:9' | '4:5'>('16:9');

  // Full Screen Studio Modal state
  const [isFullScreenStudio, setIsFullScreenStudio] = useState(false);

  useEffect(() => {
    registerAllFontsInDocument();
  }, [registerAllFontsInDocument]);

  // Keyboard shortcut: Escape exits full screen studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenStudio) {
        setIsFullScreenStudio(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenStudio]);

  const activeTemplate = getActiveTemplate();
  const alignment = activeTemplate.alignment;

  const width = alignment.width || (alignment.aspectRatio === '4:5' ? 1080 : 1920);
  const height = alignment.height || (alignment.aspectRatio === '4:5' ? 1350 : 1080);
  const isPortrait = alignment.aspectRatio === '4:5';

  const standings = getStandings();
  const renderData: GraphicsRenderData = {
    tournamentTitle: currentTournament?.title || user?.defaultTournamentTitle || 'TOURNAMENT CHAMPIONSHIP',
    tournamentLogo: currentTournament?.logoUrl || user?.tournamentLogoUrl,
    organizerName: currentTournament?.organizer || user?.organizationName || 'POINTX ARENA',
    organizerLogo: currentTournament?.organizerLogoUrl || user?.organizationLogoUrl,
    rows: standings,
    page: 1,
    totalPages: 1,
    totalMatchesCount: currentTournament?.matches?.length || 6,
    subtitle: 'OVERALL'
  };

  // Primary selected element key (first of the selected keys)
  const primaryKey = selectedKeys[0] || 'slot_1_teamName';

  // Helper to extract style for any given element key
  const getElementStyleByKey = useCallback((key: string): TextElementStyle => {
    const isSlotKey = key.startsWith('slot_');
    const slotParts = isSlotKey ? key.split('_') : [];
    const slotNum = isSlotKey ? Number(slotParts[1]) : null;
    const slotItem = isSlotKey ? slotParts[2] : null;

    if (isSlotKey && slotNum && slotItem) {
      const isSingleColumn = alignment.layoutMode === 'single-column';
      const isRightColumn = !isSingleColumn && slotNum > 6;
      const rowIndex = isRightColumn ? slotNum - 7 : slotNum - 1;

      const slotData = alignment.slots?.[slotNum] || {};
      if (slotItem === 'row') {
        return {
          x: slotData.xOffset || 0,
          y: slotData.yOffset || 0,
          fontSize: 24,
          fontFamily: alignment.fontFamily || 'Rajdhani',
          fontWeight: '800',
          fill: '#ffffff',
          visible: true
        };
      }

      const itemOverride = (slotData as any)?.[slotItem] || {};
      let defaultX = isRightColumn ? (alignment.rightTeamX || alignment.leftTeamX + 800) : alignment.leftTeamX;
      let defaultY = alignment.baseY + rowIndex * alignment.rowGap + 32;
      let defaultSize = alignment.teamFontSize;
      let defaultFill = alignment.teamColor;
      let defaultFont = alignment.fontFamily;

      if (slotItem === 'logo') {
        defaultX = (isRightColumn ? (alignment.rightTeamX || alignment.leftTeamX + 800) : alignment.leftTeamX) - 36;
        defaultY = alignment.baseY + rowIndex * alignment.rowGap + 31 - (alignment.teamFontSize || 24);
        defaultSize = (alignment.teamFontSize || 24) + 4;
        defaultFill = '#ffffff';
      } else if (slotItem === 'rank') {
        defaultX = isRightColumn ? (alignment.rightRankX || alignment.leftRankX + 800) : alignment.leftRankX;
        defaultSize = alignment.rankFontSize;
        defaultFill = alignment.rankColor;
      } else if (slotItem === 'total') {
        defaultX = isRightColumn ? (alignment.rightTotalX || alignment.leftTotalX + 800) : alignment.leftTotalX;
        defaultSize = alignment.totalFontSize;
        defaultFill = alignment.totalColor;
      } else if (slotItem === 'kills') {
        defaultX = isRightColumn ? (alignment.rightKillsX || alignment.leftKillsX + 800) : alignment.leftKillsX;
        defaultSize = alignment.statFontSize;
        defaultFill = alignment.statColor;
      } else if (slotItem === 'place') {
        defaultX = isRightColumn ? (alignment.rightPlaceX || alignment.leftPlaceX + 800) : (alignment.leftPlaceX || alignment.leftKillsX);
        defaultSize = alignment.statFontSize;
        defaultFill = alignment.statColor;
      } else if (slotItem === 'match') {
        defaultX = isRightColumn ? (alignment.rightMatchX || alignment.leftMatchX + 800) : (alignment.leftMatchX || alignment.leftRankX);
        defaultSize = alignment.statFontSize;
        defaultFill = alignment.statColor;
      } else if (slotItem === 'booyah') {
        defaultX = isRightColumn ? (alignment.rightBooyahX || alignment.leftBooyahX + 800) : (alignment.leftBooyahX || alignment.leftTotalX);
        defaultSize = alignment.statFontSize;
        defaultFill = alignment.statColor;
      }

      return {
        x: itemOverride.x !== undefined ? itemOverride.x : defaultX,
        y: itemOverride.y !== undefined ? itemOverride.y : defaultY,
        fontSize: itemOverride.fontSize ?? defaultSize,
        fontFamily: itemOverride.fontFamily ?? defaultFont ?? 'Rajdhani',
        fontWeight: itemOverride.fontWeight ?? '800',
        fill: itemOverride.fill ?? defaultFill,
        glowColor: itemOverride.glowColor,
        letterSpacing: itemOverride.letterSpacing ?? 0,
        textAnchor: itemOverride.textAnchor ?? (slotItem === 'teamName' ? 'start' : 'middle'),
        visible: itemOverride.visible ?? true,
        customText: itemOverride.customText
      };
    }

    const el = (alignment.elements as any)?.[key] || {};
    let defaultX = width / 2;
    let defaultY = height / 2;
    let defaultSize = 24;
    let defaultFill = '#ffffff';

    if (key === 'organizer') {
      defaultX = alignment.organizerX || width / 2;
      defaultY = alignment.organizerY || 60;
      defaultSize = alignment.organizerFontSize || 22;
      defaultFill = alignment.organizerColor || '#ffffff';
    } else if (key === 'organizerLogo') {
      defaultX = (alignment.organizerX || width / 2) - 200;
      defaultY = (alignment.organizerY || 60) - 30;
      defaultSize = 48;
      defaultFill = '#ffffff';
    } else if (key === 'tournamentTitle') {
      defaultX = alignment.tournamentX || width / 2;
      defaultY = alignment.tournamentY || 180;
      defaultSize = alignment.tournamentFontSize || 44;
      defaultFill = alignment.tournamentColor || '#ffffff';
    } else if (key === 'tournamentLogo') {
      defaultX = (alignment.tournamentX || width / 2) - 260;
      defaultY = (alignment.tournamentY || 180) - 42;
      defaultSize = 64;
      defaultFill = '#ffffff';
    } else if (key === 'subtitle') {
      defaultX = alignment.subtitleX || (width / 2 - 150);
      defaultY = alignment.subtitleY || 240;
      defaultSize = alignment.subtitleFontSize || 28;
      defaultFill = alignment.subtitleTextColor || '#ffffff';
    } else if (key === 'rank') {
      defaultX = alignment.leftRankX;
      defaultY = alignment.baseY + 32;
      defaultSize = alignment.rankFontSize;
      defaultFill = alignment.rankColor;
    } else if (key === 'teamName') {
      defaultX = alignment.leftTeamX;
      defaultY = alignment.baseY + 31;
      defaultSize = alignment.teamFontSize;
      defaultFill = alignment.teamColor;
    } else if (key === 'teamLogo') {
      defaultX = alignment.leftTeamX - 36;
      defaultY = alignment.baseY + 31 - (alignment.teamFontSize || 24);
      defaultSize = (alignment.teamFontSize || 24) + 4;
      defaultFill = '#ffffff';
    } else if (key === 'match') {
      defaultX = alignment.leftMatchX;
      defaultY = alignment.baseY + 32;
      defaultSize = alignment.statFontSize;
      defaultFill = alignment.statColor;
    } else if (key === 'booyah') {
      defaultX = alignment.leftBooyahX;
      defaultY = alignment.baseY + 32;
      defaultSize = alignment.statFontSize;
      defaultFill = alignment.statColor;
    } else if (key === 'kills') {
      defaultX = alignment.leftKillsX;
      defaultY = alignment.baseY + 32;
      defaultSize = alignment.statFontSize;
      defaultFill = alignment.statColor;
    } else if (key === 'place') {
      defaultX = alignment.leftPlaceX;
      defaultY = alignment.baseY + 32;
      defaultSize = alignment.statFontSize;
      defaultFill = alignment.statColor;
    } else if (key === 'total') {
      defaultX = alignment.leftTotalX;
      defaultY = alignment.baseY + 32;
      defaultSize = alignment.totalFontSize;
      defaultFill = alignment.totalColor;
    }

    return {
      x: el.x ?? defaultX,
      y: el.y ?? defaultY,
      fontSize: el.fontSize ?? defaultSize,
      fontFamily: el.fontFamily ?? alignment.fontFamily ?? 'Rajdhani',
      fontWeight: el.fontWeight ?? '800',
      fill: el.fill ?? defaultFill,
      glowColor: el.glowColor,
      letterSpacing: el.letterSpacing ?? 0,
      textAnchor: el.textAnchor ?? (key === 'teamName' ? 'start' : 'middle'),
      visible: el.visible ?? true,
      customText: el.customText
    };
  }, [alignment, width, height]);

  // Primary active element style
  const primaryElement = getElementStyleByKey(primaryKey);

  // Element Type Detection
  const isMulti = selectedKeys.length > 1;
  const isTeamName = primaryKey.endsWith('_teamName');
  const isLogo = primaryKey.endsWith('_logo') || primaryKey === 'tournamentLogo' || primaryKey === 'organizerLogo';
  const isTournamentTitle = primaryKey === 'tournamentTitle';
  const isOrganizer = primaryKey === 'organizer';
  const isSubtitle = primaryKey === 'subtitle';

  // Batch / Multi-element updater
  const updateSelectedElements = useCallback((props: Partial<TextElementStyle>, deltaX = 0, deltaY = 0) => {
    const currentElements = { ...(alignment.elements || {}) };
    const currentSlots = { ...(alignment.slots || {}) };
    const syncTopLevel: Partial<TemplateAlignmentConfig> = {};

    selectedKeys.forEach((key) => {
      const isSlotKey = key.startsWith('slot_');
      const slotParts = isSlotKey ? key.split('_') : [];
      const slotNum = isSlotKey ? Number(slotParts[1]) : null;
      const slotItem = isSlotKey ? slotParts[2] : null;

      if (isSlotKey && slotNum && slotItem) {
        const currentSlot = currentSlots[slotNum] || {};
        if (slotItem === 'row') {
          currentSlots[slotNum] = {
            ...currentSlot,
            xOffset: (currentSlot.xOffset || 0) + deltaX,
            yOffset: (currentSlot.yOffset || 0) + deltaY
          };
          return;
        }

        const currentItem = (currentSlot as any)[slotItem] || {};
        const curStyle = getElementStyleByKey(key);

        const updatedX = props.x !== undefined ? props.x : (currentItem.x ?? curStyle.x) + deltaX;
        const updatedY = props.y !== undefined ? props.y : (currentItem.y ?? curStyle.y) + deltaY;

        currentSlots[slotNum] = {
          ...currentSlot,
          [slotItem]: {
            ...currentItem,
            ...props,
            x: updatedX,
            y: updatedY
          }
        };
        return;
      }

      // Top Level global element
      const curEl = (currentElements as any)[key] || {};
      const curStyle = getElementStyleByKey(key);
      const updatedEl = {
        ...curStyle,
        ...curEl,
        ...props,
        x: props.x !== undefined ? props.x : (curEl.x ?? curStyle.x) + deltaX,
        y: props.y !== undefined ? props.y : (curEl.y ?? curStyle.y) + deltaY
      };
      (currentElements as any)[key] = updatedEl;

      if (key === 'organizer') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.organizerX = updatedEl.x;
        if (deltaY !== 0 || props.y !== undefined) syncTopLevel.organizerY = updatedEl.y;
        if (props.fontSize !== undefined) syncTopLevel.organizerFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.organizerColor = props.fill;
      } else if (key === 'tournamentTitle') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.tournamentX = updatedEl.x;
        if (deltaY !== 0 || props.y !== undefined) syncTopLevel.tournamentY = updatedEl.y;
        if (props.fontSize !== undefined) syncTopLevel.tournamentFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.tournamentColor = props.fill;
      } else if (key === 'subtitle') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.subtitleX = updatedEl.x;
        if (deltaY !== 0 || props.y !== undefined) syncTopLevel.subtitleY = updatedEl.y;
        if (props.fontSize !== undefined) syncTopLevel.subtitleFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.subtitleTextColor = props.fill;
      } else if (key === 'rank') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.leftRankX = updatedEl.x;
        if (props.fontSize !== undefined) syncTopLevel.rankFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.rankColor = props.fill;
      } else if (key === 'teamName') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.leftTeamX = updatedEl.x;
        if (props.fontSize !== undefined) syncTopLevel.teamFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.teamColor = props.fill;
      } else if (key === 'total') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.leftTotalX = updatedEl.x;
        if (props.fontSize !== undefined) syncTopLevel.totalFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.totalColor = props.fill;
      } else if (key === 'kills') {
        if (deltaX !== 0 || props.x !== undefined) syncTopLevel.leftKillsX = updatedEl.x;
        if (props.fontSize !== undefined) syncTopLevel.statFontSize = props.fontSize;
        if (props.fill !== undefined) syncTopLevel.statColor = props.fill;
      }
    });

    updateTemplateAlignment(activeTemplate.id, {
      ...syncTopLevel,
      elements: currentElements,
      slots: currentSlots
    });
  }, [alignment, selectedKeys, getElementStyleByKey, activeTemplate.id, updateTemplateAlignment]);

  // Tactile Nudge Action
  const handleNudge = (dx: number, dy: number) => {
    updateSelectedElements({}, dx, dy);
  };

  // Direct Canvas Drag Handler
  const handleDragElement = (_key: string, dx: number, dy: number) => {
    updateSelectedElements({}, dx, dy);
  };

  // Start Long-Press Holding (smooth gliding continuous movement)
  const startHolding = (dx: number, dy: number) => {
    handleNudge(dx, dy);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdTimerRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(() => {
        handleNudge(dx, dy);
      }, 70);
    }, 280);
  };

  const stopHolding = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => stopHolding();
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      stopHolding();
    };
  }, []);

  // Keyboard Arrow Hotkeys (↑ ↓ ← →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      const mult = e.shiftKey ? 5 : 1;
      const step = stepSize * mult;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNudge(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNudge(0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNudge(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNudge(step, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepSize, handleNudge]);

  // Element selection handler
  const handleSelectElement = (key: string, e?: React.MouseEvent) => {
    if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      setSelectedKeys((prev) => {
        const next = prev.includes(key)
          ? prev.length > 1
            ? prev.filter((k) => k !== key)
            : prev
          : [...prev, key];
        setSelectedPresetLabel(`${next.length} Elements Selected`);
        return next;
      });
    } else {
      setSelectedKeys([key]);
      setSelectedPresetLabel(key.replace(/_/g, ' ').toUpperCase());
    }
  };

  // Preset Selection Helpers
  const selectPreset = (label: string, keys: string[]) => {
    setSelectedKeys(keys);
    setSelectedPresetLabel(label);
    showToast({ type: 'info', title: `Selected ${label}`, message: `${keys.length} elements ready to align.` });
  };

  // Replace Poster Artwork Handler
  const handleReplaceArtwork = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      replaceTemplateImage(activeTemplate.id, dataUrl);
      showToast({
        type: 'success',
        title: 'Artwork Replaced',
        message: `Updated poster background artwork for "${activeTemplate.name}".`
      });
    };
    reader.readAsDataURL(file);
  };

  // Custom Font Upload Handler
  const handleCustomFontSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontUploadFile) {
      showToast({ type: 'error', title: 'File Required', message: 'Please select a font file (.ttf, .otf, .woff, .woff2).' });
      return;
    }

    try {
      setIsUploadingFont(true);
      const newFont = await uploadCustomFont(fontUploadName, fontUploadFile);
      setIsUploadingFont(false);
      setIsFontModalOpen(false);
      setFontUploadName('');
      setFontUploadFile(null);

      // Auto-apply newly uploaded font to current element
      updateSelectedElements({ fontFamily: newFont.name });

      showToast({
        type: 'success',
        title: 'Font Added & Applied',
        message: `Custom font "${newFont.name}" stored and ready for all templates!`
      });
    } catch (err) {
      setIsUploadingFont(false);
      showToast({ type: 'error', title: 'Upload Failed', message: 'Could not process font file.' });
    }
  };

  // Create Template Submit Handler
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter a template name.' });
      return;
    }
    if (!createImageUrl) {
      showToast({ type: 'error', title: 'Image Required', message: 'Please upload a background poster image.' });
      return;
    }

    const baseConfig: TemplateAlignmentConfig = {
      ...alignment,
      aspectRatio: createAspectRatio,
      layoutMode: createLayoutMode,
      width: createAspectRatio === '4:5' ? 1080 : 1920,
      height: createAspectRatio === '4:5' ? 1350 : 1080
    };

    createCustomTemplate(createName.trim(), createImageUrl, baseConfig);
    setIsCreateModalOpen(false);
    setCreateName('');
    setCreateImageUrl('');

    showToast({
      type: 'success',
      title: 'Template Created',
      message: `Created "${createName.trim()}". Now ready for alignment!`
    });
  };

  // Edit Template Submit Handler
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateTemplateMetadata(activeTemplate.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      aspectRatio: editAspectRatio
    });

    updateTemplateAlignment(activeTemplate.id, {
      aspectRatio: editAspectRatio,
      width: editAspectRatio === '4:5' ? 1080 : 1920,
      height: editAspectRatio === '4:5' ? 1350 : 1080
    });

    setIsEditModalOpen(false);
    showToast({
      type: 'success',
      title: 'Template Updated',
      message: `Saved details for "${editName.trim()}".`
    });
  };

  const handleOpenEditModal = () => {
    setEditName(activeTemplate.name);
    setEditDescription(activeTemplate.description || '');
    setEditAspectRatio(activeTemplate.aspectRatio === '4:5' ? '4:5' : '16:9');
    setIsEditModalOpen(true);
  };

  const handleClone = () => {
    cloneTemplate(activeTemplate.id);
    showToast({
      type: 'success',
      title: 'Template Cloned',
      message: `Created duplicate copy of "${activeTemplate.name}".`
    });
  };

  const handlePublishToggle = () => {
    if (activeTemplate.isPublished) {
      unpublishTemplate(activeTemplate.id);
      showToast({ type: 'info', title: 'Template Unpublished', message: 'Template hidden from regular users.' });
    } else {
      publishTemplate(activeTemplate.id);
      showToast({ type: 'success', title: 'Template Published', message: 'Template is now live for all users.' });
    }
  };

  const handleDeleteConfirmed = () => {
    deleteTemplate(activeTemplate.id);
    setIsDeleteModalOpen(false);
    showToast({ type: 'info', title: 'Template Deleted', message: `Deleted "${activeTemplate.name}".` });
  };

  const allAvailableFonts = getAllFontNames();

  return (
    <div className="space-y-4 font-sans min-h-[calc(100vh-100px)]">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Graphics
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> High-Precision Template Studio
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                activeTemplate.isPublished
                  ? 'bg-[var(--status-live)]/15 text-[var(--status-live)] border border-[var(--status-live)]/30'
                  : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/30'
              }`}>
                {activeTemplate.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display truncate">
              {activeTemplate.name} • {width} × {height} ({alignment.aspectRatio})
            </h1>
          </div>
        </div>

        {/* Template Switching & Admin Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Template Select Dropdown */}
          <select
            value={activeTemplateId}
            onChange={(e) => setActiveTemplateId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs sm:text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer shadow-inner"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.aspectRatio}) {t.isPublished ? '' : '• [Draft]'}
              </option>
            ))}
          </select>

          {/* ➕ ADD NEW TEMPLATE */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Template
          </Button>

          {/* 🔤 UPLOAD CUSTOM FONT */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFontModalOpen(true)}
            leftIcon={<Type className="h-4 w-4 text-[var(--accent-primary)]" />}
            title="Upload custom OTF/TTF/WOFF font"
          >
            Upload Font
          </Button>

          {/* 🖼️ REPLACE ARTWORK */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => replaceArtworkInputRef.current?.click()}
            leftIcon={<ImageIcon className="h-4 w-4 text-[var(--accent-primary)]" />}
            title="Upload/Replace background image for this template"
          >
            Replace Poster
          </Button>
          <input
            ref={replaceArtworkInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleReplaceArtwork}
            className="hidden"
          />

          {/* ✏️ EDIT METADATA */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditModal}
            leftIcon={<Edit3 className="h-4 w-4" />}
            title="Edit template name and aspect ratio"
          >
            Edit Info
          </Button>

          {/* 📋 DUPLICATE / CLONE */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClone}
            leftIcon={<Copy className="h-4 w-4" />}
            title="Duplicate template"
          >
            Clone
          </Button>

          {/* 👁️ PUBLISH / UNPUBLISH */}
          <Button
            variant={activeTemplate.isPublished ? 'secondary' : 'primary'}
            size="sm"
            onClick={handlePublishToggle}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            {activeTemplate.isPublished ? 'Unpublish' : 'Publish'}
          </Button>

          {/* 🗑️ DELETE TEMPLATE */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
            title="Delete this template"
          >
            Delete
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN STUDIO WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: INTERACTIVE VISUAL CANVAS PREVIEW WITH DIRECT DRAG (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3">
          {/* Canvas Controls Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <MousePointer className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
              <span className="text-[var(--text-secondary)]">
                <strong className="text-[var(--accent-primary)]">✨ Direct Drag-to-Move</strong>: Drag any item on canvas to change position • <strong className="text-[var(--text-primary)]">Shift+Click</strong> multi-select
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.1))}
                className="p-1 rounded bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-[var(--accent-primary)] min-w-[36px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.1))}
                className="p-1 rounded bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setIsFullScreenStudio(true)}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs flex items-center gap-1"
                title="Open Full Screen Interactive Studio"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          {/* SVG Canvas Board */}
          <div className="w-full flex justify-center items-center bg-[#070b13] p-4 sm:p-6 rounded-3xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden min-h-[560px]">
            <div
              style={{
                width: isPortrait ? '440px' : '720px',
                maxWidth: '100%',
                aspectRatio: isPortrait ? '4 / 5' : '16 / 9',
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease'
              }}
              className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10"
            >
              <DynamicCustomTemplate
                template={activeTemplate}
                data={renderData}
                selectedElementKeys={selectedKeys}
                onSelectElement={handleSelectElement}
                onDragElement={handleDragElement}
                isInteractive={true}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTEXT-AWARE INSPECTOR & ALIGNMENT DECK (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* CARD 1: ELEMENT SELECTOR & PRESETS */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="font-bold text-sm text-[var(--text-primary)] font-display">
                  1. Target Element
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--accent-primary)]/20 truncate max-w-[170px]">
                {selectedPresetLabel}
              </span>
            </div>

            {/* Quick 1-Click Multi-Select Pills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold uppercase text-[var(--text-secondary)]">
                Batch Quick-Select:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => selectPreset('🛡️ All Team Names', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_teamName`))}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                >
                  🛡️ Team Names
                </button>

                <button
                  type="button"
                  onClick={() => selectPreset('🎯 Total Points', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_total`))}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                >
                  🎯 Total Points
                </button>

                <button
                  type="button"
                  onClick={() => selectPreset('💥 All Kills', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_kills`))}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                >
                  💥 All Kills
                </button>

                <button
                  type="button"
                  onClick={() => selectPreset('🔢 All Ranks', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_rank`))}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                >
                  🔢 All Ranks
                </button>

                <button
                  type="button"
                  onClick={() => selectPreset('🖼️ Team Logos', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_logo`))}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                >
                  🖼️ Team Logos
                </button>

                <button
                  type="button"
                  onClick={() => selectPreset('👑 All Headers', ['organizer', 'organizerLogo', 'tournamentTitle', 'tournamentLogo', 'subtitle'])}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
                >
                  👑 All Headers
                </button>
              </div>
            </div>

            {/* Granular Individual Selector Dropdown */}
            <div className="pt-1">
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Or select specific element directly:
              </label>
              <select
                value={selectedKeys.length === 1 ? selectedKeys[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedKeys([e.target.value]);
                    setSelectedPresetLabel(e.target.value.replace(/_/g, ' ').toUpperCase());
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                <option value="" disabled>-- Choose Granular Element --</option>
                <optgroup label="Header Elements">
                  <option value="tournamentTitle">Tournament Title Text</option>
                  <option value="tournamentLogo">Tournament Logo</option>
                  <option value="organizer">Organizer Name Text</option>
                  <option value="organizerLogo">Organizer Logo</option>
                  <option value="subtitle">Subtitle / Scope Badge</option>
                </optgroup>
                <optgroup label="Squad Slot 1 (Top Seed)">
                  <option value="slot_1_teamName">Slot 1: Team Name</option>
                  <option value="slot_1_logo">Slot 1: Team Logo</option>
                  <option value="slot_1_rank">Slot 1: Rank #01</option>
                  <option value="slot_1_total">Slot 1: Total Points</option>
                  <option value="slot_1_kills">Slot 1: Kill Points</option>
                  <option value="slot_1_place">Slot 1: Place Points</option>
                  <option value="slot_1_match">Slot 1: Match Played</option>
                  <option value="slot_1_booyah">Slot 1: Booyah Count</option>
                </optgroup>
                <optgroup label="Squad Slot 2">
                  <option value="slot_2_teamName">Slot 2: Team Name</option>
                  <option value="slot_2_total">Slot 2: Total Points</option>
                  <option value="slot_2_kills">Slot 2: Kill Points</option>
                </optgroup>
                <optgroup label="Squad Slot 7 (Right Col Top)">
                  <option value="slot_7_teamName">Slot 7: Team Name</option>
                  <option value="slot_7_total">Slot 7: Total Points</option>
                  <option value="slot_7_kills">Slot 7: Kill Points</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* CARD 2: CONTEXT-AWARE ELEMENT INSPECTOR (Specific function related to chosen element) */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="font-bold text-sm text-[var(--text-primary)] font-display">
                  2. Element Inspector ({isMulti ? `${selectedKeys.length} Selected` : primaryKey.replace(/_/g, ' ').toUpperCase()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSelectedElements({ visible: !primaryElement.visible })}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  primaryElement.visible !== false
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                }`}
              >
                {primaryElement.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>{primaryElement.visible !== false ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>

            {/* A. TEXT OVERRIDE (For Text / Titles) */}
            {(isTeamName || isTournamentTitle || isOrganizer || isSubtitle) && !isMulti && (
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1 font-mono">
                  Custom Text Content:
                </label>
                <input
                  type="text"
                  value={primaryElement.customText || ''}
                  onChange={(e) => updateSelectedElements({ customText: e.target.value })}
                  placeholder={
                    isTeamName
                      ? 'Team Name'
                      : isTournamentTitle
                      ? renderData.tournamentTitle
                      : isOrganizer
                      ? renderData.organizerName
                      : renderData.subtitle || 'OVERALL'
                  }
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            )}

            {/* B. TYPOGRAPHY: FONT FAMILY PICKER (With uploaded custom fonts!) */}
            {!isLogo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] font-mono flex items-center gap-1">
                    <Type className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    Font Family:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsFontModalOpen(true)}
                    className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    + Upload Custom Font
                  </button>
                </div>

                <select
                  value={primaryElement.fontFamily}
                  onChange={(e) => updateSelectedElements({ fontFamily: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <optgroup label="Uploaded Custom Fonts">
                    {customFonts.map((cf) => (
                      <option key={cf.id} value={cf.name}>
                        ⭐ {cf.name} (Custom Font)
                      </option>
                    ))}
                    {customFonts.length === 0 && (
                      <option value="" disabled>
                        No custom fonts uploaded yet
                      </option>
                    )}
                  </optgroup>
                  <optgroup label="Esports Built-in Fonts">
                    {allAvailableFonts
                      .filter((f) => !customFonts.some((cf) => cf.name === f))
                      .map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* C. FONT / LOGO SIZE & WEIGHT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span>{isLogo ? 'Logo Dimension:' : 'Font Size:'}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="6"
                      max={isTournamentTitle ? 400 : isLogo ? 500 : 300}
                      value={primaryElement.fontSize}
                      onChange={(e) => {
                        const val = Math.max(4, Number(e.target.value) || 6);
                        updateSelectedElements({ fontSize: val });
                      }}
                      className="w-16 px-1.5 py-0.5 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--accent-primary)] text-center font-numbers focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">px</span>
                  </div>
                </div>

                {/* High-Limit Range Slider */}
                <input
                  type="range"
                  min="6"
                  max={isTournamentTitle ? 320 : isLogo ? 400 : 250}
                  value={primaryElement.fontSize}
                  onChange={(e) => updateSelectedElements({ fontSize: Number(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />

                {/* Quick Size Stepper Buttons */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ fontSize: Math.max(6, primaryElement.fontSize - 5) })}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer"
                  >
                    -5px
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ fontSize: Math.max(6, primaryElement.fontSize - 1) })}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer"
                  >
                    -1px
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ fontSize: primaryElement.fontSize + 1 })}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--accent-primary)] cursor-pointer"
                  >
                    +1px
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ fontSize: primaryElement.fontSize + 5 })}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--accent-primary)] cursor-pointer"
                  >
                    +5px
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ fontSize: primaryElement.fontSize + 20 })}
                    className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--accent-primary)] cursor-pointer"
                  >
                    +20px
                  </button>
                </div>
              </div>

              {!isLogo && (
                <div>
                  <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                    Font Weight:
                  </label>
                  <select
                    value={primaryElement.fontWeight}
                    onChange={(e) => updateSelectedElements({ fontWeight: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer"
                  >
                    <option value="600">Semi-Bold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extra Bold (800)</option>
                    <option value="900">Black Heavy (900)</option>
                  </select>
                </div>
              )}
            </div>

            {/* D. COLOR & GLOW & ALIGNMENT */}
            {!isLogo && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-secondary)]">Color:</span>
                  <input
                    type="color"
                    value={primaryElement.fill?.startsWith('#') ? primaryElement.fill : '#ffffff'}
                    onChange={(e) => updateSelectedElements({ fill: e.target.value })}
                    className="h-8 w-10 rounded-lg cursor-pointer border border-[var(--border-subtle)] bg-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-secondary)]">Glow:</span>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ glowColor: primaryElement.glowColor ? undefined : '#f59e0b' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      primaryElement.glowColor
                        ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-surface-inset)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {primaryElement.glowColor ? '✨ Glow On' : 'Glow Off'}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-[var(--bg-surface-inset)] p-1 rounded-lg border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ textAnchor: 'start' })}
                    className={`p-1 rounded cursor-pointer ${primaryElement.textAnchor === 'start' ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]' : 'text-[var(--text-muted)]'}`}
                    title="Align Left"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ textAnchor: 'middle' })}
                    className={`p-1 rounded cursor-pointer ${primaryElement.textAnchor === 'middle' ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]' : 'text-[var(--text-muted)]'}`}
                    title="Align Center"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedElements({ textAnchor: 'end' })}
                    className={`p-1 rounded cursor-pointer ${primaryElement.textAnchor === 'end' ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)]' : 'text-[var(--text-muted)]'}`}
                    title="Align Right"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: TACTILE NUDGE & DIRECT COORDINATE SLIDERS */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 text-[var(--accent-primary)]" />
                <span className="font-bold text-sm text-[var(--text-primary)] font-display">
                  3. Precision Nudge & Coordinates
                </span>
              </div>

              {/* Step Size Selector */}
              <div className="flex items-center gap-1 bg-[var(--bg-surface-inset)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
                {[1, 5, 10, 25].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStepSize(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      stepSize === s
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Way Tactile D-Pad Controller */}
            <div className="flex flex-col items-center justify-center gap-2 py-1 select-none">
              {/* UP BUTTON */}
              <button
                type="button"
                onMouseDown={() => startHolding(0, -stepSize)}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={() => startHolding(0, -stepSize)}
                onTouchEnd={stopHolding}
                className="w-16 h-11 rounded-xl bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition-all shadow-sm cursor-pointer"
                title="Move Up (Click or Hold)"
              >
                <ArrowUp className="h-5 w-5" />
              </button>

              {/* MIDDLE ROW (LEFT, COORD, RIGHT) */}
              <div className="flex items-center gap-3">
                {/* LEFT BUTTON */}
                <button
                  type="button"
                  onMouseDown={() => startHolding(-stepSize, 0)}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={() => startHolding(-stepSize, 0)}
                  onTouchEnd={stopHolding}
                  className="w-16 h-11 rounded-xl bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Move Left (Click or Hold)"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>

                {/* COORDINATE READOUT */}
                <div className="w-32 py-1 px-1 text-center rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] font-mono text-xs shadow-inner">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold">Element Coord</div>
                  <div className="text-[var(--accent-primary)] font-bold text-xs font-numbers">
                    X:{primaryElement.x} Y:{primaryElement.y}
                  </div>
                </div>

                {/* RIGHT BUTTON */}
                <button
                  type="button"
                  onMouseDown={() => startHolding(stepSize, 0)}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={() => startHolding(stepSize, 0)}
                  onTouchEnd={stopHolding}
                  className="w-16 h-11 rounded-xl bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Move Right (Click or Hold)"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>

              {/* DOWN BUTTON */}
              <button
                type="button"
                onMouseDown={() => startHolding(0, stepSize)}
                onMouseUp={stopHolding}
                onMouseLeave={stopHolding}
                onTouchStart={() => startHolding(0, stepSize)}
                onTouchEnd={stopHolding}
                className="w-16 h-11 rounded-xl bg-[var(--bg-surface-inset)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition-all shadow-sm cursor-pointer"
                title="Move Down (Click or Hold)"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
            </div>

            {/* Direct Slider Adjustments */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>X Position:</span>
                  <span className="font-bold text-[var(--text-primary)]">{primaryElement.x}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={width}
                  value={primaryElement.x}
                  onChange={(e) => {
                    const newX = Number(e.target.value);
                    const dx = newX - primaryElement.x;
                    handleNudge(dx, 0);
                  }}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Y Position:</span>
                  <span className="font-bold text-[var(--text-primary)]">{primaryElement.y}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={height}
                  value={primaryElement.y}
                  onChange={(e) => {
                    const newY = Number(e.target.value);
                    const dy = newY - primaryElement.y;
                    handleNudge(0, dy);
                  }}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS: UPLOAD FONT, CREATE TEMPLATE, EDIT TEMPLATE, DELETE CONFIRM     */}
      {/* ========================================================================= */}

      {/* UPLOAD CUSTOM FONT MODAL */}
      {isFontModalOpen && (
        <Modal
          isOpen={isFontModalOpen}
          onClose={() => setIsFontModalOpen(false)}
          title="Upload Custom Esports Font"
          description="Upload custom OTF, TTF, WOFF, or WOFF2 font files. Stored permanently for all templates."
          maxWidth="md"
        >
          <form onSubmit={handleCustomFontSubmit} className="space-y-4 font-sans text-xs sm:text-sm">
            <Input
              label="Font Display Name *"
              value={fontUploadName}
              onChange={(e) => setFontUploadName(e.target.value)}
              placeholder="Enter font name"
              required
            />

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Font File (.ttf, .otf, .woff, .woff2) *
              </label>
              <div className="p-4 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-center space-y-2">
                <input
                  ref={customFontInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2,font/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFontUploadFile(file);
                      if (!fontUploadName) {
                        setFontUploadName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                      }
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => customFontInputRef.current?.click()}
                  leftIcon={<Upload className="h-4 w-4" />}
                >
                  {fontUploadFile ? fontUploadFile.name : 'Choose Font File'}
                </Button>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {fontUploadFile ? `${(fontUploadFile.size / 1024).toFixed(1)} KB` : 'Supports TTF, OTF, WOFF, WOFF2'}
                </div>
              </div>
            </div>

            {/* List of Current Custom Fonts */}
            {customFonts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase">
                  Installed Custom Fonts ({customFonts.length}):
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {customFonts.map((cf) => (
                    <div
                      key={cf.id}
                      className="p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-[var(--text-primary)]">{cf.name}</span>
                      <Button
                        variant="danger"
                        size="xs"
                        type="button"
                        onClick={() => deleteCustomFont(cf.id)}
                        leftIcon={<Trash2 className="h-3 w-3" />}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsFontModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isUploadingFont} leftIcon={<Upload className="h-4 w-4" />}>
                Save & Apply Font
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE NEW TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Add New Custom Template"
          description="Upload custom poster artwork and calibrate leaderboard coordinates."
          maxWidth="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-xs sm:text-sm">
            <Input
              label="Template Name *"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Enter template name"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                  Aspect Ratio:
                </label>
                <select
                  value={createAspectRatio}
                  onChange={(e) => setCreateAspectRatio(e.target.value as '16:9' | '4:5')}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="16:9">16:9 Widescreen (1920 × 1080)</option>
                  <option value="4:5">4:5 Portrait Poster (1080 × 1350)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                  Default Layout:
                </label>
                <select
                  value={createLayoutMode}
                  onChange={(e) => setCreateLayoutMode(e.target.value as 'dual-column' | 'single-column')}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="dual-column">Dual Column (6 × 2 Squads)</option>
                  <option value="single-column">Single Column (12 × 1 Rows)</option>
                </select>
              </div>
            </div>

            <ImageUpload
              label="Poster Background Artwork *"
              value={createImageUrl}
              onChange={(val) => setCreateImageUrl(val || '')}
              helperText="Upload official 16:9 or 4:5 poster template background (PNG, JPG, WebP)."
            />

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Plus className="h-4 w-4" />}>
                Create & Calibrate
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT TEMPLATE DETAILS MODAL */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Template Details"
          description={`Update metadata and canvas format for "${activeTemplate.name}".`}
          maxWidth="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 font-sans text-xs sm:text-sm">
            <Input
              label="Template Name *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter template name"
              required
            />

            <Input
              label="Description / Theme Notes"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter description"
            />

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Aspect Ratio Format:
              </label>
              <select
                value={editAspectRatio}
                onChange={(e) => setEditAspectRatio(e.target.value as '16:9' | '4:5')}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer"
              >
                <option value="16:9">16:9 Widescreen (1920 × 1080)</option>
                <option value="4:5">4:5 Portrait Poster (1080 × 1350)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                Save Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE TEMPLATE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Template?"
          description={`Are you sure you want to remove "${activeTemplate.name}"?`}
          maxWidth="sm"
        >
          <div className="space-y-4 font-sans text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>
                This will delete the template artwork and all custom alignment coordinates.
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteConfirmed} leftIcon={<Trash2 className="h-4 w-4" />}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* FULL SCREEN INTERACTIVE STUDIO OVERLAY (ADMIN LIVE CALIBRATION & DRAG)   */}
      {/* ========================================================================= */}
      {isFullScreenStudio && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-3 sm:p-4 animate-fadeIn font-sans select-none overflow-hidden">
          {/* Top Fullscreen Studio Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 text-white">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] font-bold">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm font-display tracking-tight truncate max-w-[200px] sm:max-w-none">
                    {activeTemplate.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                    Live Fullscreen Studio
                  </span>
                </div>
                <div className="text-[11px] text-white/60 font-mono flex items-center gap-2">
                  <span>Selected: <strong className="text-white">{selectedPresetLabel}</strong> ({selectedKeys.length})</span>
                  <span>•</span>
                  <span>Drag any selected item on canvas to move all</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Exit */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/15 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.1))}
                  className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-[var(--accent-primary)] px-1 min-w-[36px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.1))}
                  className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white cursor-pointer"
                >
                  Fit
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFullScreenStudio(false)}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Done Editing
              </Button>

              <button
                type="button"
                onClick={() => setIsFullScreenStudio(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
                title="Exit Full Screen (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Interactive Canvas Centerpiece */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <div
              style={{
                width: isPortrait ? '480px' : '900px',
                maxWidth: '95vw',
                maxHeight: '75vh',
                aspectRatio: isPortrait ? '4 / 5' : '16 / 9',
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease'
              }}
              className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/20"
            >
              <DynamicCustomTemplate
                template={activeTemplate}
                data={renderData}
                selectedElementKeys={selectedKeys}
                onSelectElement={handleSelectElement}
                onDragElement={handleDragElement}
                isInteractive={true}
              />
            </div>
          </div>

          {/* Bottom Floating Interactive HUD Bar */}
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-2.5 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-white text-xs">
            {/* Quick Batch Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold text-white/50">Batch:</span>
              <button
                type="button"
                onClick={() => selectPreset('🛡️ All Team Names', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_teamName`))}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-[var(--accent-primary)] hover:text-black text-[11px] font-bold transition-all cursor-pointer"
              >
                🛡️ Teams
              </button>
              <button
                type="button"
                onClick={() => selectPreset('🎯 Total Points', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_total`))}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-[var(--accent-primary)] hover:text-black text-[11px] font-bold transition-all cursor-pointer"
              >
                🎯 Totals
              </button>
              <button
                type="button"
                onClick={() => selectPreset('💥 All Kills', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_kills`))}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-[var(--accent-primary)] hover:text-black text-[11px] font-bold transition-all cursor-pointer"
              >
                💥 Kills
              </button>
              <button
                type="button"
                onClick={() => selectPreset('🔢 All Ranks', Array.from({ length: 12 }, (_, i) => `slot_${i + 1}_rank`))}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-[var(--accent-primary)] hover:text-black text-[11px] font-bold transition-all cursor-pointer"
              >
                🔢 Ranks
              </button>
              <button
                type="button"
                onClick={() => selectPreset('👑 All Headers', ['organizer', 'organizerLogo', 'tournamentTitle', 'tournamentLogo', 'subtitle'])}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-[var(--accent-primary)] hover:text-black text-[11px] font-bold transition-all cursor-pointer"
              >
                👑 Headers
              </button>
            </div>

            {/* Tactile Mini Nudge Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-white/50">Nudge ({stepSize}px):</span>
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleNudge(-stepSize, 0)}
                  className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                  title="Left"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge(0, -stepSize)}
                  className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                  title="Up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge(0, stepSize)}
                  className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                  title="Down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudge(stepSize, 0)}
                  className="p-1 rounded hover:bg-white/20 text-white cursor-pointer"
                  title="Right"
                >
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Coordinates read out */}
              <div className="text-[11px] font-mono text-[var(--accent-primary)] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                X:{primaryElement.x} Y:{primaryElement.y}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
