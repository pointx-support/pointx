import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '../../../store/templateStore';
import { templatesApi } from '../../../services/api';
import { OrganizationSuggestPicker } from '../OrganizationSuggestPicker';
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
  Award,
  Shield,
  Trash2,
  Building,
  Users
} from 'lucide-react';
import type { GraphicTemplateCategory, TemplateType } from '../../../types/customTemplate';
import { normalizeTemplateType } from '../../../types/customTemplate';
import { getVariablesForSection } from '../../../engine/sectionVariables';

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
    createCustomTemplate,
    deleteTemplate
  } = useTemplateStore();
  const { showToast } = useToast();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | GraphicTemplateCategory>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Registered Organizations for Access Control Picker
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; email: string; logoUrl?: string }>>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // New Template Form State
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [targetSection, setTargetSection] = useState<TemplateType>('POINTS_TABLE');
  const [targetCategory, setTargetCategory] = useState<GraphicTemplateCategory>('standings');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:5'>('4:5');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState<'GLOBAL' | 'ORGANIZATION_RESTRICTED'>('GLOBAL');
  const [allowedOrganizationIds, setAllowedOrganizationIds] = useState<string[]>([]);

  const handleSectionChange = (section: TemplateType) => {
    setTargetSection(section);
    if (section === 'POINTS_TABLE') setTargetCategory('standings');
    else if (section === 'KILL_LEADER') setTargetCategory('warheads');
    else if (section === 'TOP_FRAGGERS') setTargetCategory('fraggers');
    else if (section === 'TEAM_POSTER') setTargetCategory('team-poster');
    else if (section === 'SLOTS_LIST') setTargetCategory('slots-list');
    else if (section === 'VICTORY_CERTIFICATE') {
      setTargetCategory('certificate');
      setAspectRatio('16:9');
    }
  };

  // Fetch organizations on mount
  useEffect(() => {
    async function loadOrgs() {
      setIsLoadingOrgs(true);
      try {
        const res = await templatesApi.getOrganizations();
        if (res.success && Array.isArray(res.data)) {
          setOrganizations(res.data);
        }
      } catch (err) {
        console.warn('Failed to load organizations for template picker:', err);
      } finally {
        setIsLoadingOrgs(false);
      }
    }
    loadOrgs();
  }, []);

  const handleTogglePublish = (id: string, currentlyPublished: boolean) => {
    if (currentlyPublished) {
      unpublishTemplate(id);
      showToast({ type: 'info', title: 'Template Unpublished', message: 'Hidden from organizer workspace.' });
    } else {
      publishTemplate(id);
      showToast({ type: 'success', title: 'Template Published', message: 'Now live for permitted organizers.' });
    }
  };

  const handleOpenStudio = (id: string) => {
    setActiveTemplateId(id);
    onOpenTemplateStudio();
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete template "${name}"?`)) {
      try {
        await templatesApi.delete(id);
        deleteTemplate(id);
        showToast({ type: 'success', title: 'Template Deleted', message: `Deleted "${name}".` });
      } catch (err: any) {
        showToast({ type: 'error', title: 'Delete Failed', message: err?.message || 'Could not delete template.' });
      }
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      showToast({ type: 'error', title: 'Name Required', message: 'Please enter a template name.' });
      return;
    }
    if (!imageUrl.trim()) {
      showToast({ type: 'error', title: 'Artwork Required', message: 'Please upload or provide background artwork.' });
      return;
    }
    if (visibility === 'ORGANIZATION_RESTRICTED' && allowedOrganizationIds.length === 0) {
      showToast({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select at least one organization permitted to use this template.'
      });
      return;
    }

    setIsSaving(true);
    const baseAlignment = {
      aspectRatio,
      width: aspectRatio === '4:5' ? 1080 : 1920,
      height: aspectRatio === '4:5' ? 1350 : 1080,
      baseY: aspectRatio === '4:5' ? 680 : 540,
      rowGap: aspectRatio === '4:5' ? 44 : 84,
      layoutMode: 'dual-column' as const,
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
    };

    try {
      const res = await templatesApi.create({
        name: templateName.trim(),
        description: description.trim() || 'Custom esports template calibrated by Admin.',
        imageUrl,
        aspectRatio,
        alignment: baseAlignment,
        templateType: targetSection,
        category: targetCategory,
        visibility,
        allowedOrganizationIds: visibility === 'ORGANIZATION_RESTRICTED' ? allowedOrganizationIds : [],
        isPublished: true,
      });

      const newId = res.success && res.data ? res.data.id : createCustomTemplate(
        templateName.trim(),
        imageUrl,
        baseAlignment,
        targetCategory
      );

      setIsAddModalOpen(false);
      setTemplateName('');
      setDescription('');
      setImageUrl('');
      setVisibility('GLOBAL');
      setAllowedOrganizationIds([]);

      showToast({
        type: 'success',
        title: 'Template Created',
        message: `Created ${visibility === 'ORGANIZATION_RESTRICTED' ? 'Private' : 'Global'} template for ${targetSection}.`
      });

      handleOpenStudio(newId);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err?.message || 'Could not create template.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (activeCategoryFilter === 'all') return true;
    const type = t.templateType || normalizeTemplateType(t.category);
    return type === normalizeTemplateType(activeCategoryFilter);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-display tracking-tight flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#7D4047] dark:text-[#E8C4C8]" />
            Template Ecosystem & Organization Governance
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Deploy global or organization-restricted templates with strict server-side access control.
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
          const isRestricted = t.visibility === 'ORGANIZATION_RESTRICTED';

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
                  {t.isBuiltIn ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#7D4047]/90 text-[10px] font-mono font-bold text-white uppercase backdrop-blur-xs">
                      Official
                    </span>
                  ) : isRestricted ? (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600/90 text-[10px] font-mono font-bold text-white uppercase backdrop-blur-xs flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Restricted ({t.allowedOrganizationIds?.length || 0})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600/90 text-[10px] font-mono font-bold text-white uppercase backdrop-blur-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Global
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
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
                  <span>Font: <strong className="text-[var(--text-primary)]">{t.alignment?.fontFamily || 'Rajdhani'}</strong></span>
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

                  {!t.isBuiltIn && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id, t.name)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
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
          title="Add Custom Template to Studio"
          description="Configure template metadata, artwork, and organization access governance."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateTemplate} className="space-y-4 font-sans text-xs sm:text-sm">
            {/* STEP 1: UPLOAD & METADATA */}
            <div className="space-y-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="text-xs font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                Step 1: Template Artwork & Metadata
              </div>
              <Input
                label="Template Name *"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Apex Predators 4K Poster"
                required
              />

              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Exclusive graphic template calibrated for Official Free Fire League."
              />

              <ImageUpload
                label="Template Background Artwork *"
                value={imageUrl}
                onChange={(val) => setImageUrl(val || '')}
                helperText="Upload official 16:9 or 4:5 poster template background (PNG, JPG, WebP)."
              />
            </div>

            {/* STEP 2: CHOOSE SECTION */}
            <div className="space-y-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="text-xs font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                Step 2: Choose Section ("Which section is this template for?")
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 font-mono">
                    Select Template Section *
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => handleSectionChange(e.target.value as TemplateType)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-bold text-xs text-[var(--text-primary)] cursor-pointer focus:border-[var(--accent-primary)] focus:outline-none"
                  >
                    <option value="POINTS_TABLE">🏆 Points Table (Full tournament standings)</option>
                    <option value="KILL_LEADER">🔥 Warheads / Kill Leader (Highest-kill player)</option>
                    <option value="TOP_FRAGGERS">👑 Top Fraggers / MVP (Top 3 players by kills)</option>
                    <option value="TEAM_POSTER">🖼️ Team Poster (Single team + roster)</option>
                    <option value="SLOTS_LIST">📋 Slots List (All teams and slots)</option>
                    <option value="VICTORY_CERTIFICATE">🎖️ Victory Certificate (Winner/achievement certificate)</option>
                  </select>
                </div>

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
                    <option value="16:9">16:9 Widescreen (1920 × 1080 — Broadcast Stream / Certificate)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 3: DYNAMIC SECTION-SPECIFIC VARIABLES PREVIEW */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
                  Step 3: Available Template Variables for {targetSection}
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {getVariablesForSection(targetSection).length} Available Placeholders
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                This section only accepts the following purpose-specific variables. Irrelevant variables from other sections are strictly excluded.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {getVariablesForSection(targetSection).map((v) => (
                  <div
                    key={v.key}
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono flex items-center gap-1.5"
                    title={v.description}
                  >
                    <span className="text-[var(--accent-primary)] font-bold">{v.variable}</span>
                    <span className="text-[var(--text-secondary)] text-[10px]">({v.label})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ORGANIZATION ACCESS GOVERNANCE (PART 20 & 21) */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider mb-1">
                  Access & Visibility Governance *
                </label>
                <p className="text-[11px] text-[var(--text-muted)] mb-2">
                  Control which organizations can discover and render this graphic template.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('GLOBAL')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      visibility === 'GLOBAL'
                        ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)] font-bold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Users className="h-4 w-4 text-[var(--accent-primary)]" />
                      All Organizations
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Available to all registered organizers
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility('ORGANIZATION_RESTRICTED')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      visibility === 'ORGANIZATION_RESTRICTED'
                        ? 'bg-purple-500/15 border-purple-500 text-[var(--text-primary)] font-bold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-purple-400">
                      <Building className="h-4 w-4 text-purple-400" />
                      Specific Organizations
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Private custom template for selected orgs
                    </div>
                  </button>
                </div>
              </div>

              {/* INTERACTIVE AUTOCOMPLETE ORGANIZATION SUGGESTION PICKER */}
              {visibility === 'ORGANIZATION_RESTRICTED' && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <OrganizationSuggestPicker
                    selectedOrgIds={allowedOrganizationIds}
                    onChange={setAllowedOrganizationIds}
                    organizations={organizations}
                    isLoading={isLoadingOrgs}
                    onSearchServer={async (q) => {
                      const res = await templatesApi.getOrganizations(q);
                      return res.data || [];
                    }}
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSaving}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {isSaving ? 'Creating Template...' : 'Create & Calibrate'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
