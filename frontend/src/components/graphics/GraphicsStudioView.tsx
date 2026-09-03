import React, { useState, useRef, useEffect } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { useTemplateStore } from '../../store/templateStore';
import { useAuthStore } from '../../store/authStore';
import { DynamicCustomTemplate } from './templates/DynamicCustomTemplate';
import { GraphicCategoryCanvas } from './templates/GraphicCategoryCanvas';
import { useAdminStore } from '../../store/adminStore';
import { exportSvgToPng, downloadBlobFile } from '../../engine/exportEngine';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { getOrdinalSuffix } from '../../utils/format';
import {
  Sparkles,
  Download,
  CheckCircle2,
  Package,
  ChevronDown,
  Trophy,
  Flame,
  UserCheck,
  Image as ImageIcon,
  ListOrdered,
  Award,
  Sliders,
  Smartphone,
  Monitor,
  ArrowLeft,
  LayoutGrid,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Palette,
  RotateCcw,
  Edit3,
  X,
  Tv
} from 'lucide-react';
import JSZip from 'jszip';
import type { GraphicsRenderData } from '../../types/graphics';

type GraphicCategoryTab = 'standings' | 'warheads' | 'fraggers' | 'team-poster' | 'slots-list' | 'certificate';

const HUE_PRESETS = [
  { label: 'Default (Original)', value: 0, color: '#f59e0b' },
  { label: 'Crimson Red', value: 0, color: '#ef4444' },
  { label: 'Golden Amber', value: 45, color: '#f59e0b' },
  { label: 'Emerald Glow', value: 120, color: '#10b981' },
  { label: 'Neon Cyan', value: 180, color: '#06b6d4' },
  { label: 'Cyber Violet', value: 270, color: '#8b5cf6' },
  { label: 'Hot Magenta', value: 315, color: '#ec4899' }
];

export const GraphicsStudioView: React.FC = () => {
  const {
    currentTournament,
    getStandings,
    goBackTab,
    setActiveTab,
    activeGraphicsCategory,
    setActiveGraphicsCategory
  } = useTournamentStore();
  const { templates, activeTemplateId, setActiveTemplateId, getActiveTemplate } = useTemplateStore();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const activeCategory = activeGraphicsCategory || 'standings';
  const setActiveCategory = setActiveGraphicsCategory;
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTournament.teams[0]?.id || '');
  const [selectedScope, setSelectedScope] = useState<'overall' | number>('overall');
  const [formatFilter, setFormatFilter] = useState<'all' | 'portrait' | 'landscape'>('all');
  const [customOrgName, setCustomOrgName] = useState(currentTournament.organizer || 'PointX Arena');
  const [customEventTitle, setCustomEventTitle] = useState(currentTournament.title || 'Free Fire Masters');
  const [isExporting, setIsExporting] = useState(false);

  // Hue & Color Adjuster state
  const [hueRotate, setHueRotate] = useState<number>(0);

  // Full Screen Modal state
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenZoom, setFullScreenZoom] = useState(1);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const fullScreenSvgRef = useRef<SVGSVGElement | null>(null);

  // Keyboard shortcut: Escape closes full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenOpen) {
        setIsFullScreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenOpen]);

  const publishedTemplates = templates.filter((t) => {
    if (!t.isPublished) return false;
    if (formatFilter === 'portrait') return t.aspectRatio === '4:5';
    if (formatFilter === 'landscape') return t.aspectRatio === '16:9';
    return true;
  });

  const currentTemplate = getActiveTemplate();

  // Compute standings and subtitle dynamically based on selected scope
  const isOverall = selectedScope === 'overall';
  const standings = isOverall
    ? getStandings()
    : getStandings({ matchRange: { start: selectedScope, end: selectedScope } });

  const scopeLabel = isOverall
    ? 'Overall Point Table'
    : `${getOrdinalSuffix(selectedScope)} Match Point Table`;

  const graphicSubtitle = isOverall
    ? 'OVERALL'
    : `${getOrdinalSuffix(selectedScope).toUpperCase()} MATCH`;

  const renderData: GraphicsRenderData = {
    tournamentTitle: customEventTitle,
    tournamentLogo: currentTournament.logoUrl || user?.tournamentLogoUrl,
    organizerName: customOrgName,
    organizerLogo: currentTournament.organizerLogoUrl || user?.organizationLogoUrl,
    rows: standings,
    page: 1,
    totalPages: 1,
    totalMatchesCount: isOverall ? currentTournament.matches.length : 1,
    subtitle: graphicSubtitle
  };

  const isPortrait = activeCategory === 'standings' ? currentTemplate.aspectRatio === '4:5' : activeCategory !== 'certificate';
  const baseExportWidth = isPortrait ? 1080 : 1920;
  const baseExportHeight = isPortrait ? 1350 : 1080;

  const handleExport = async (format: '1080p' | '4k') => {
    const targetSvg = isFullScreenOpen ? fullScreenSvgRef.current || svgRef.current : svgRef.current;
    if (!targetSvg) return;
    setIsExporting(true);

    try {
      const scale = format === '4k' ? 2 : 1;
      const width = baseExportWidth * scale;
      const height = baseExportHeight * scale;

      const blob = await exportSvgToPng(targetSvg, width, height);

      const categoryName = GRAPHIC_CATEGORIES.find((c) => c.id === activeCategory)?.label.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'GRAPHIC';
      const filename = activeCategory === 'standings'
        ? `${customEventTitle.replace(/\s+/g, '_').toUpperCase()}_${scopeLabel.replace(/\s+/g, '_').toUpperCase()}_${currentTemplate.name.replace(/\s+/g, '_')}_${format.toUpperCase()}${hueRotate ? `_HUE${hueRotate}` : ''}.png`
        : `${customEventTitle.replace(/\s+/g, '_').toUpperCase()}_${categoryName}_${format.toUpperCase()}${hueRotate ? `_HUE${hueRotate}` : ''}.png`;

      downloadBlobFile(blob, filename);

      showToast({
        type: 'success',
        title: 'Export Complete',
        message: `Generated ${format.toUpperCase()} ${isPortrait ? 'Poster' : 'Graphic'} (${width}x${height}) successfully!`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to rasterize poster: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllZip = async () => {
    const targetSvg = isFullScreenOpen ? fullScreenSvgRef.current || svgRef.current : svgRef.current;
    if (!targetSvg) return;
    setIsExporting(true);

    try {
      const categoryName = GRAPHIC_CATEGORIES.find((c) => c.id === activeCategory)?.label.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() || 'GRAPHIC';
      const zip = new JSZip();
      const folder = zip.folder(`${customEventTitle.replace(/\s+/g, '_')}_${categoryName}`);

      // 1. 1080p Export
      const hdBlob = await exportSvgToPng(targetSvg, baseExportWidth, baseExportHeight);
      folder?.file(`01_${categoryName}_1080p.png`, hdBlob);

      // 2. 4K Export
      const fourKBlob = await exportSvgToPng(targetSvg, baseExportWidth * 2, baseExportHeight * 2);
      folder?.file(`02_${categoryName}_4K.png`, fourKBlob);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlobFile(zipBlob, `${customEventTitle.replace(/\s+/g, '_')}_${categoryName}_Bundle.zip`);

      showToast({
        type: 'success',
        title: 'ZIP Generated',
        message: `${categoryName} graphics bundle downloaded successfully!`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'ZIP Export Failed',
        message: String(err)
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyObsLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const categoryName = GRAPHIC_CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Graphics';
    const obsUrl = `${origin}/?mode=broadcast&tournamentId=${currentTournament.id}&layout=${activeCategory === 'standings' ? 'graphic' : activeCategory}&templateId=${currentTemplate.id}&hue=${hueRotate}&scope=${selectedScope}&title=${encodeURIComponent(customEventTitle)}&org=${encodeURIComponent(customOrgName)}`;
    navigator.clipboard.writeText(obsUrl);
    showToast({
      type: 'success',
      title: 'OBS Link Copied!',
      message: `Direct 4K Vector link copied for ${categoryName}! Paste into OBS Browser Source (${isPortrait ? '1080x1350' : '1920x1080'}).`
    });
  };

  const sortedMatches = [...currentTournament.matches].sort((a, b) => a.matchNumber - b.matchNumber);

  const GRAPHIC_CATEGORIES = [
    { id: 'standings', label: 'Point Tables', icon: Trophy, isAvailable: true, isPro: false },
    { id: 'warheads', label: 'Warheads / Kill Leader', icon: Flame, isAvailable: true, isPro: true },
    { id: 'fraggers', label: 'Top Fraggers / MVP', icon: UserCheck, isAvailable: true, isPro: true },
    { id: 'team-poster', label: 'Team Poster', icon: ImageIcon, isAvailable: true, isPro: true },
    { id: 'slots-list', label: 'Slots List', icon: ListOrdered, isAvailable: true, isPro: true },
    { id: 'certificate', label: 'Victory Certificate', icon: Award, isAvailable: true, isPro: true }
  ] as const;

  return (
    <div className="space-y-6 font-sans">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goBackTab}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <Sparkles className="h-6 w-6 text-[var(--accent-primary)]" />
              High-Resolution Esports Graphics Studio
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Render professional 4K Ultra HD Instagram posters and 16:9 broadcast overlays with dynamic branding.
            </p>
          </div>
        </div>

        {/* Primary Export Actions Toolbar (Active Across All Categories) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && activeCategory === 'standings' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                useAdminStore.getState().setActiveAdminTab('templates');
                setActiveTab('admin-dashboard' as any);
              }}
              leftIcon={<Sliders className="h-4 w-4 text-[var(--accent-primary)]" />}
            >
              Admin Template Studio
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={handleCopyObsLink}
            leftIcon={<Tv className="h-4 w-4 text-[#E5A93C] dark:text-[#F3B344]" />}
            className="border-[#E5A93C]/40 hover:border-[#E5A93C] font-bold text-[#E5A93C] dark:text-[#F3B344]"
            title="Copy live browser source URL for OBS Studio"
          >
            Copy OBS Link
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsFullScreenOpen(true)}
            leftIcon={<Maximize2 className="h-4 w-4 text-[#E5A93C] dark:text-[#F3B344]" />}
            className="border-white/15 hover:border-white/30 font-bold"
            title="View in full screen with zoom and direct export"
          >
            Full Screen
          </Button>

          <Button
            variant="secondary"
            size="md"
            isLoading={isExporting}
            onClick={() => handleExport('1080p')}
            leftIcon={<Download className="h-4 w-4 text-[var(--text-secondary)]" />}
          >
            {isPortrait ? 'Export Poster HD' : 'Export 1080p FHD'}
          </Button>

          <Button
            variant="primary"
            size="md"
            isLoading={isExporting}
            onClick={() => handleExport('4k')}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {isPortrait ? 'Export Poster 4K' : 'Export 4K UHD'}
          </Button>

          <Button
            variant="booyah"
            size="md"
            isLoading={isExporting}
            onClick={handleExportAllZip}
            leftIcon={<Package className="h-4 w-4" />}
          >
            Download ZIP Pack
          </Button>
        </div>
      </div>

      {/* GRAPHIC CATEGORY TABS BAR */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {GRAPHIC_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as GraphicCategoryTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-md'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{cat.label}</span>
              {!cat.isAvailable && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono uppercase font-black ${
                  isActive ? 'bg-black/20 text-[var(--accent-primary-text)]' : 'bg-[var(--bg-surface-inset)] text-[var(--accent-primary)] border border-[var(--border-subtle)]'
                }`}>
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeCategory === 'standings' ? (
        <>
          {/* 2-COLUMN MAIN WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: LIVE POSTER PREVIEW + HUE ADJUSTER (7 cols) */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4">
              {/* Quick Brand Customization Bar */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Live Brand Headers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Tournament / League Title"
                    value={customEventTitle}
                    onChange={(e) => setCustomEventTitle(e.target.value)}
                    placeholder="Enter league title"
                  />
                  <Input
                    label="Organizer / Host Name"
                    value={customOrgName}
                    onChange={(e) => setCustomOrgName(e.target.value)}
                    placeholder="Enter host organization"
                  />
                </div>
              </div>

              {/* 🎨 HUE SHIFT & COLOR THEME CONTROLLER */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-[var(--accent-primary)]" />
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] font-display">
                      Poster Hue & Color Tint
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-md border border-[var(--accent-primary)]/20">
                      {hueRotate}° Shift
                    </span>
                    {hueRotate !== 0 && (
                      <button
                        type="button"
                        onClick={() => setHueRotate(0)}
                        className="text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer font-bold"
                        title="Reset Hue"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Hue Slider with Full Spectrum Gradient Track */}
                <div className="space-y-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hueRotate}
                      onChange={(e) => setHueRotate(Number(e.target.value))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer shadow-inner"
                      style={{
                        background: 'linear-gradient(to right, #ef4444 0%, #f97316 17%, #eab308 33%, #22c55e 50%, #06b6d4 67%, #6366f1 83%, #ec4899 92%, #ef4444 100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Quick Hue Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {HUE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setHueRotate(preset.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        hueRotate === preset.value
                          ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-xs'
                          : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vector Poster Display Box */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Standings Scope Switcher */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--text-secondary)]">Scope:</span>
                    <div className="relative">
                      <select
                        id="point-table-scope-select"
                        value={selectedScope}
                        onChange={(e) => setSelectedScope(e.target.value === 'overall' ? 'overall' : Number(e.target.value))}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer shadow-sm font-sans"
                      >
                        <option value="overall">🏆 Overall Point Table</option>
                        {sortedMatches.map((m) => {
                          const ordinal = getOrdinalSuffix(m.matchNumber);
                          return (
                            <option key={m.id} value={m.matchNumber}>
                              ⚔️ {ordinal} Match ({m.status})
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                    <button
                      type="button"
                      onClick={handleCopyObsLink}
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      title="Copy live browser source URL for OBS Studio"
                    >
                      <Tv className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      <span>Copy OBS Link</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setIsFullScreenOpen(true)}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      title="Open full screen preview"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      <span>Full Screen</span>
                    </button>
                    <span>•</span>
                    <span className="text-[var(--accent-primary)] font-bold uppercase">
                      {isPortrait ? '1080 × 1350' : '1920 × 1080'}
                    </span>
                  </div>
                </div>

                {/* Vector Canvas Preview */}
                <div className="flex justify-center">
                  <div className={`relative w-full ${isPortrait ? 'max-w-md aspect-[4/5]' : 'max-w-2xl aspect-video'} rounded-2xl overflow-hidden shadow-2xl bg-black border border-[var(--border-subtle)] transition-all`}>
                    <DynamicCustomTemplate
                      template={currentTemplate}
                      data={renderData}
                      svgRef={svgRef}
                      hueRotate={hueRotate}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: TEMPLATES SELECTION PANEL */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] space-y-3.5">
                {/* Header & Format Filter Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--border-subtle)]">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-1.5">
                      <LayoutGrid className="h-4 w-4 text-[var(--accent-primary)]" />
                      Templates
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Click any style to apply
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFormatFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        formatFilter === 'all'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                          : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      All ({templates.filter((t) => t.isPublished).length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatFilter('portrait')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        formatFilter === 'portrait'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                          : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>4:5</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormatFilter('landscape')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        formatFilter === 'landscape'
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-xs'
                          : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      <Monitor className="h-3 w-3" />
                      <span>16:9</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('template-studio')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-primary-text)] transition-all cursor-pointer shadow-xs"
                        title="Add or Edit Templates in Admin Studio"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* COMPACT TEMPLATE THEME CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
                  {publishedTemplates.map((t) => {
                    const isSelected = activeTemplateId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTemplateId(t.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group ${
                          isSelected
                            ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 text-[var(--text-primary)] shadow-sm'
                            : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50'
                        }`}
                      >
                        <div className="space-y-1.5 w-full">
                          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/40 border border-[var(--border-subtle)]">
                            <img
                              src={t.imageUrl}
                              alt={t.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={{
                                filter: hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined
                              }}
                            />
                            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-white uppercase backdrop-blur-xs">
                              {t.aspectRatio}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <div className="font-bold text-xs text-[var(--text-primary)] font-display truncate">
                              {t.name}
                            </div>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[8px] font-mono text-[var(--accent-primary)] font-bold w-full">
                          <span>{t.aspectRatio === '4:5' ? 'POSTER' : '16:9'}</span>
                          <span className="truncate max-w-[65px]">{t.alignment.fontFamily}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* PRO GRAPHICS WORKSPACE FOR WARHEADS, FRAGGERS, TEAM POSTER, SLOTS, CERTIFICATE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* LEFT COLUMN: LIVE POSTER PREVIEW + HUE ADJUSTER (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            {/* Quick Brand Customization Bar */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Live Brand Headers
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Tournament Title"
                  value={customEventTitle}
                  onChange={(e) => setCustomEventTitle(e.target.value)}
                  placeholder="e.g. Free Fire Masters"
                />
                <Input
                  label="Organizer Name"
                  value={customOrgName}
                  onChange={(e) => setCustomOrgName(e.target.value)}
                  placeholder="e.g. PointX Arena"
                />
              </div>

              {activeCategory === 'team-poster' && (
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Select Squad / Team
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
                  >
                    {currentTournament.teams.map((team, idx) => (
                      <option key={team.id} value={team.id}>
                        Slot {(idx + 1).toString().padStart(2, '0')}: {team.name} ({team.tag || 'TEAM'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Hue Presets */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-[11px] font-mono font-bold text-[var(--text-secondary)]">
                  Color Accent & Hue
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HUE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setHueRotate(preset.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        hueRotate === preset.value
                          ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-xs'
                          : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vector Poster Display Box */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {GRAPHIC_CATEGORIES.find((c) => c.id === activeCategory)?.label} Canvas
                </span>
                <span className="text-xs font-mono text-[var(--accent-primary)] font-bold">
                  {baseExportWidth} × {baseExportHeight} Vector
                </span>
              </div>

              <div
                className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[#0B0D14] flex items-center justify-center p-2"
                style={{
                  aspectRatio: isPortrait ? '4 / 5' : '16 / 9',
                  maxHeight: '650px'
                }}
              >
                <GraphicCategoryCanvas
                  category={activeCategory}
                  tournament={currentTournament}
                  tournamentTitle={customEventTitle}
                  organizerName={customOrgName}
                  tournamentLogo={currentTournament.logoUrl}
                  organizerLogo={currentTournament.organizerLogoUrl}
                  selectedTeamId={selectedTeamId}
                  hueRotate={hueRotate}
                  svgRef={svgRef}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CATEGORY CONTROLS & STATS (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-flat)] space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
                <h3 className="font-bold text-base text-[var(--text-primary)] font-display">
                  {GRAPHIC_CATEGORIES.find((c) => c.id === activeCategory)?.label} Pro Suite
                </h3>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Generate broadcast-ready, high-resolution vector assets with dynamic tournament data. Directly streamable to OBS Studio or exportable in 4K UHD.
              </p>

              {/* Action Buttons Grid in Sidebar Card */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center font-bold"
                  isLoading={isExporting}
                  onClick={() => handleExport('4k')}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  {isPortrait ? 'Export Poster 4K' : 'Export 4K UHD'}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={isExporting}
                  onClick={() => handleExport('1080p')}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  {isPortrait ? 'Export Poster HD (1080p)' : 'Export 1080p FHD'}
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                  onClick={handleCopyObsLink}
                  leftIcon={<Tv className="h-4 w-4 text-[var(--accent-primary)]" />}
                >
                  Copy OBS Browser Source URL
                </Button>

                <Button
                  variant="booyah"
                  size="md"
                  className="w-full justify-center font-bold"
                  isLoading={isExporting}
                  onClick={handleExportAllZip}
                  leftIcon={<Package className="h-4 w-4" />}
                >
                  Download ZIP Pack (HD + 4K)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL SCREEN TEMPLATE PREVIEW MODAL (WITH ADMIN-ONLY EDITING CONTROLS)     */}
      {/* ========================================================================= */}
      {isFullScreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col p-4 sm:p-6 animate-fadeIn font-sans select-none">
          {/* Top Fullscreen Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 text-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-display tracking-tight">
                    {currentTemplate.name}
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 uppercase">
                    {isPortrait ? '4:5 Portrait Poster' : '16:9 Broadcast'}
                  </span>
                  {hueRotate !== 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                      Hue: +{hueRotate}°
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 font-mono">
                  {baseExportWidth} × {baseExportHeight} • High-Fidelity Vector Canvas
                </p>
              </div>
            </div>

            {/* Fullscreen Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/15 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setFullScreenZoom((z) => Math.max(0.5, z - 0.1))}
                  className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="font-bold text-[var(--accent-primary)] px-1 min-w-[40px] text-center">
                  {Math.round(fullScreenZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setFullScreenZoom((z) => Math.min(2.5, z + 0.1))}
                  className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFullScreenZoom(1)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white cursor-pointer"
                >
                  Fit
                </button>
              </div>

              {/* 🔒 ADMIN ONLY: EDIT TEMPLATE IN PRECISION STUDIO */}
              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsFullScreenOpen(false);
                    setActiveTab('template-studio');
                  }}
                  leftIcon={<Edit3 className="h-4 w-4" />}
                >
                  Edit in Template Studio
                </Button>
              )}

              {/* Direct Export from Fullscreen */}
              <Button
                variant="secondary"
                size="sm"
                isLoading={isExporting}
                onClick={() => handleExport('1080p')}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export HD
              </Button>

              <Button
                variant="booyah"
                size="sm"
                isLoading={isExporting}
                onClick={() => handleExport('4k')}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export 4K
              </Button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullScreenOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer shadow-xs"
                title="Close Full Screen (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas Centerpiece */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <div
              style={{
                width: isPortrait ? '520px' : '960px',
                maxWidth: '95vw',
                maxHeight: '82vh',
                aspectRatio: isPortrait ? '4 / 5' : '16 / 9',
                transform: `scale(${fullScreenZoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease'
              }}
              className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/20"
            >
              {activeCategory === 'standings' ? (
                <DynamicCustomTemplate
                  template={currentTemplate}
                  data={renderData}
                  svgRef={fullScreenSvgRef}
                  hueRotate={hueRotate}
                />
              ) : (
                <GraphicCategoryCanvas
                  category={activeCategory}
                  tournament={currentTournament}
                  tournamentTitle={customEventTitle}
                  organizerName={customOrgName}
                  tournamentLogo={currentTournament.logoUrl}
                  organizerLogo={currentTournament.organizerLogoUrl}
                  selectedTeamId={selectedTeamId}
                  hueRotate={hueRotate}
                  svgRef={fullScreenSvgRef}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};