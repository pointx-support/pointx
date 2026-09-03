import React, { useState } from 'react';
import { useTemplateStore } from '../../../store/templateStore';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { ImageUpload } from '../../ui/ImageUpload';
import { useToast } from '../../ui/Toast';
import {
  Palette,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  Smartphone,
  Monitor,
  Plus,
  Trophy,
  Flame,
  UserCheck,
  Image as ImageIcon,
  ListOrdered,
  Award
} from 'lucide-react';
import type { GraphicTemplateCategory } from '../../../types/customTemplate';

export interface AdminTemplatesViewProps {
  onOpenTemplateStudio: () => void;
}

const TEMPLATE_CATEGORIES: { id: 'all' | GraphicTemplateCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Templates', icon: Palette },
  { id: 'standings', label: 'Point Tables', icon: Trophy },
  { id: 'warheads', label: 'Warheads / Kill Leader', icon: Flame },
  { id: 'fraggers', label: 'Top Fraggers / MVP', icon: UserCheck },
  { id: 'team-poster', label: 'Team Poster', icon: ImageIcon },
  { id: 'slots-list', label: 'Slots List', icon: ListOrdered },
  { id: 'certificate', label: 'Victory Certificate', icon: Award },
];

export const AdminTemplatesView: React.FC<AdminTemplatesViewProps> = ({ onOpenTemplateStudio }) => {
  const {
    templates,
    publishTemplate,
    unpublishTemplate,
    setActiveTemplateId,
    createCustomTemplate
  } = useTemplateStore();
  const { showToast } = useToast();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | GraphicTemplateCategory>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Template Form State
  const [templateName, setTemplateName] = useState('');
  const [targetCategory, setTargetCategory] = useState<GraphicTemplateCategory>('standings');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:5'>('4:5');
  const [imageUrl, setImageUrl] = useState('');

  const handleTogglePublish = (id: string, currentlyPublished: boolean) => {
    if (currentlyPublished) {
      unpublishTemplate(id);
      showToast({ type: 'info', title: 'Template Unpublished', message: 'Hidden from organizer workspace.' });
    } else {
      publishTemplate(id);
      showToast({ type: 'success', title: 'Template Published', message: 'Now live for all organizers.' });
    }
  };

  const handleOpenStudio = (id: string) => {
    setActiveTemplateId(id);
    onOpenTemplateStudio();
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter a template name.' });
      return;
    }
    if (!imageUrl.trim()) {
      showToast({ type: 'error', title: 'Artwork Required', message: 'Please upload or provide background artwork.' });
      return;
    }

    const newId = createCustomTemplate(
      templateName.trim(),
      imageUrl,
      {
        aspectRatio,
        width: aspectRatio === '4:5' ? 1080 : 1920,
        height: aspectRatio === '4:5' ? 1350 : 1080,
        baseY: aspectRatio === '4:5' ? 680 : 540,
        rowGap: aspectRatio === '4:5' ? 44 : 84,
        layoutMode: 'dual-column',
        fontFamily: 'Rajdhani',
        rankFontSize: 28,
        teamFontSize: 22,
        statFontSize: 24,
        totalFontSize: 26,
        teamFontWeight: '800',
        rankColor: '#ffffff',
        teamColor: '#ffffff',
        statColor: '#ffffff',
        totalColor: '#f59e0b',
        leftRankX: 132,
        leftTeamX: 206,
        leftMatchX: 530,
        leftBooyahX: 612,
        leftKillsX: 695,
        leftPlaceX: 778,
        leftTotalX: 860,
        rightRankX: 1048,
        rightTeamX: 1122,
        rightMatchX: 1446,
        rightBooyahX: 1528,
        rightKillsX: 1610,
        rightPlaceX: 1692,
        rightTotalX: 1775,
        showSubtitleBanner: false,
        subtitleX: 540,
        subtitleY: 200,
        subtitleWidth: 400,
        subtitleHeight: 50,
        subtitleFontSize: 28,
        subtitleBgColor: '#051d38',
        subtitleBorderColor: '#f59e0b',
        subtitleTextColor: '#ffffff'
      },
      targetCategory
    );

    setIsAddModalOpen(false);
    setTemplateName('');
    setImageUrl('');

    showToast({
      type: 'success',
      title: 'Template Added',
      message: `Created template for ${TEMPLATE_CATEGORIES.find((c) => c.id === targetCategory)?.label || targetCategory}.`
    });

    // Automatically focus the new template
    handleOpenStudio(newId);
  };

  const filteredTemplates = templates.filter((t) => {
    if (activeCategoryFilter === 'all') return true;
    const cat = t.category || 'standings';
    return cat === activeCategoryFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#7D4047] dark:text-[#E8C4C8]" />
            Template Ecosystem & Governance
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage templates across Point Tables, Warheads, MVP, Team Posters, Slots List, and Certificates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Template
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTemplateStudio}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Precision Studio
          </Button>
        </div>
      </div>

      {/* Category Section Filter Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar shadow-xs">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isCurrent = activeCategoryFilter === cat.id;
          const count = cat.id === 'all'
            ? templates.length
            : templates.filter((t) => (t.category || 'standings') === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                isCurrent ? 'bg-black/20 text-[var(--accent-primary-text)]' : 'bg-[var(--bg-surface-inset)] text-[var(--text-muted)]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((t) => {
          const isPortrait = t.aspectRatio === '4:5';
          const categoryMeta = TEMPLATE_CATEGORIES.find((c) => c.id === (t.category || 'standings'));

          return (
            <div
              key={t.id}
              className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-flat)] flex flex-col justify-between"
            >
              {/* Preview Image */}
              <div className="relative aspect-video bg-black/60 overflow-hidden border-b border-[var(--border-subtle)] group">
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono font-bold text-white uppercase backdrop-blur-xs flex items-center gap-1">
                    {isPortrait ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    {t.aspectRatio}
                  </span>
                  {categoryMeta && categoryMeta.id !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-[10px] font-mono font-bold text-black uppercase backdrop-blur-xs">
                      {categoryMeta.label}
                    </span>
                  )}
                  {t.isBuiltIn && (
                    <span className="px-2 py-0.5 rounded-full bg-[#7D4047]/90 text-[10px] font-mono font-bold text-white uppercase backdrop-blur-xs">
                      Official
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    t.isPublished
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-amber-500/90 text-black'
                  }`}>
                    {t.isPublished ? 'Live' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] font-display truncate">
                    {t.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {t.description || 'Custom esports template.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  <span>Font: <strong className="text-[var(--text-primary)]">{t.alignment.fontFamily}</strong></span>
                  <span>Section: <strong className="text-[var(--text-primary)]">{categoryMeta?.label || 'Point Tables'}</strong></span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant={t.isPublished ? 'outline' : 'secondary'}
                    size="xs"
                    onClick={() => handleTogglePublish(t.id, t.isPublished)}
                    leftIcon={t.isPublished ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    className="flex-1"
                  >
                    {t.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleOpenStudio(t.id)}
                    leftIcon={<Sliders className="h-3 w-3" />}
                    className="flex-1"
                  >
                    Calibrate
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / ADD NEW TEMPLATE MODAL */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Template to Studio"
          description="Select the section category, upload artwork, and deploy for organizers."
          maxWidth="md"
        >
          <form onSubmit={handleCreateTemplate} className="space-y-4 font-sans text-xs sm:text-sm">
            {/* Target Section Selection */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Target Section Category *
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value as GraphicTemplateCategory)}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer focus:border-[var(--accent-primary)] focus:outline-none"
              >
                <option value="standings">🏆 Point Tables (Tournament Standings)</option>
                <option value="warheads">🔥 Warheads / Kill Leader</option>
                <option value="fraggers">👑 Top Fraggers / MVP</option>
                <option value="team-poster">🖼️ Team Poster (Squad Lineup)</option>
                <option value="slots-list">📋 Slots List (12-Team Schedule)</option>
                <option value="certificate">🎖️ Victory Certificate (Champion Diploma)</option>
              </select>
            </div>

            <Input
              label="Template Name *"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Apex Predators 4K Poster"
              required
            />

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                Aspect Ratio *
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as '16:9' | '4:5')}
                className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer"
              >
                <option value="4:5">4:5 Portrait Poster (1080 × 1350 — Social Media)</option>
                <option value="16:9">16:9 Widescreen (1920 × 1080 — Broadcast Stream)</option>
              </select>
            </div>

            <ImageUpload
              label="Template Background Artwork *"
              value={imageUrl}
              onChange={(val) => setImageUrl(val || '')}
              helperText="Upload official 16:9 or 4:5 poster template background (PNG, JPG, WebP)."
            />

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Plus className="h-4 w-4" />}>
                Create & Calibrate
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

