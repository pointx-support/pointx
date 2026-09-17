import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '../../../store/templateStore';
import { templatesApi } from '../../../services/api';
import { CustomTemplateWizard } from '../CustomTemplateWizard';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
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
  Edit3,
  Building,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { GraphicTemplateCategory, CustomGraphicsTemplate } from '../../../types/customTemplate';
import { normalizeTemplateType } from '../../../types/customTemplate';

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
    deleteTemplate,
    deleteAllTemplates,
    restoreBuiltInTemplates,
    syncTemplates
  } = useTemplateStore();
  const { showToast } = useToast();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | GraphicTemplateCategory>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomGraphicsTemplate | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Sync server templates on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const tmplRes = await templatesApi.getAll();
        if (isMounted && tmplRes.success && Array.isArray(tmplRes.data)) {
          syncTemplates(tmplRes.data as any);
        }
      } catch (err) {
        console.warn('Failed to load initial data for AdminTemplatesView:', err);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [syncTemplates]);

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

  const handleEditTemplate = (t: CustomGraphicsTemplate) => {
    setEditingTemplate(t);
    setIsWizardOpen(true);
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

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const idsToDelete = filteredTemplates.map((t) => t.id);
      for (const id of idsToDelete) {
        try {
          await templatesApi.delete(id);
        } catch {}
      }
      deleteAllTemplates(idsToDelete);
      showToast({
        type: 'success',
        title: 'Templates Deleted',
        message: `Permanently removed ${idsToDelete.length} template(s).`,
      });
      setIsDeleteAllModalOpen(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err?.message || 'Could not delete templates.',
      });
    } finally {
      setIsDeletingAll(false);
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

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTemplate(null);
              setIsWizardOpen(true);
            }}
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

          {filteredTemplates.length > 0 ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteAllModalOpen(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
              title="Delete all visible templates"
            >
              Delete All ({filteredTemplates.length})
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                restoreBuiltInTemplates();
                showToast({ type: 'success', title: 'Presets Restored', message: 'Restored all original template presets.' });
              }}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Restore Presets
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategoryFilter === cat.id;
          const count = cat.id === 'all'
            ? templates.length
            : templates.filter((t) => (t.templateType || normalizeTemplateType(t.category)) === normalizeTemplateType(cat.id)).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] border-[var(--accent-primary)] shadow-md'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border-[var(--border-subtle)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isActive ? 'bg-black/20 text-current' : 'bg-[var(--bg-surface-inset)] text-[var(--text-muted)]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((t) => {
          const isPortrait = t.aspectRatio === '4:5';
          const type = t.templateType || normalizeTemplateType(t.category);
          const categoryMeta = TEMPLATE_CATEGORIES.find((c) => c.id !== 'all' && normalizeTemplateType(c.id) === type);
          const isRestricted = t.visibility === 'ORGANIZATION_RESTRICTED';
          const allowedCount = Array.isArray(t.allowedOrganizationIds) ? t.allowedOrganizationIds.length : 0;

          return (
            <div
              key={t.id}
              className={`rounded-2xl border bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-flat)] transition-all flex flex-col justify-between ${
                t.isPublished ? 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40' : 'border-dashed border-amber-500/40 opacity-80'
              }`}
            >
              {/* Template Image Preview */}
              <div className="relative aspect-video bg-black/40 overflow-hidden border-b border-[var(--border-subtle)] group">
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Aspect Ratio Badge */}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10 flex items-center gap-1">
                  {isPortrait ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                  {t.aspectRatio}
                </span>

                {/* Visibility Badge */}
                <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border backdrop-blur-md flex items-center gap-1 ${
                  isRestricted
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isRestricted ? (
                    <>
                      <Building className="h-2.5 w-2.5" />
                      <span>{allowedCount} Org{allowedCount !== 1 ? 's' : ''}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-2.5 w-2.5" />
                      <span>Global</span>
                    </>
                  )}
                </span>

                {/* Built-in Indicator */}
                {t.isBuiltIn && (
                  <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono font-bold">
                    Official System
                  </span>
                )}

                {/* Scope Badge */}
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-purple-950/90 text-purple-200 border border-purple-500/50 text-[9px] font-mono font-bold flex items-center gap-1 shadow-md backdrop-blur-md">
                  <Sliders className="h-2.5 w-2.5 text-purple-400" />
                  <span>
                    {type === 'POINTS_TABLE'
                      ? 'Scope: Overall & Match'
                      : type === 'KILL_LEADER' || type === 'TOP_FRAGGERS'
                      ? 'Scope: Match / Stage'
                      : type === 'TEAM_POSTER'
                      ? 'Scope: Squad Roster'
                      : 'Scope: Tournament'}
                  </span>
                </span>
              </div>

              {/* Template Info & Action Bar */}
              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-display truncate">
                      {t.name}
                    </h3>
                    {t.defaultLayout && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--accent-primary)] font-bold shrink-0">
                        {t.defaultLayout}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {t.description || 'Custom esports template calibrated by Admin.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  <span>Font: <strong className="text-[var(--text-primary)]">{t.alignment?.fontFamily || 'Rajdhani'}</strong></span>
                  <span>Section: <strong className="text-[var(--text-primary)]">{categoryMeta?.label || 'Point Tables'}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
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
                    variant="outline"
                    size="xs"
                    onClick={() => handleEditTemplate(t)}
                    leftIcon={<Edit3 className="h-3 w-3" />}
                    title="Edit in Canonical Wizard"
                  >
                    Edit
                  </Button>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleOpenStudio(t.id)}
                    leftIcon={<Sliders className="h-3 w-3" />}
                    title="Calibrate on Visual Canvas"
                  >
                    Calibrate
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t.id, t.name)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CANONICAL 7-STEP CUSTOM TEMPLATE WIZARD / EDITOR */}
      {isWizardOpen && (
        <CustomTemplateWizard
          isOpen={isWizardOpen}
          onClose={() => {
            setIsWizardOpen(false);
            setEditingTemplate(null);
          }}
          initialTemplate={editingTemplate}
          onSuccess={(savedId) => {
            setActiveTemplateId(savedId);
          }}
        />
      )}

      {/* DELETE ALL CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteAllModalOpen}
        onClose={() => !isDeletingAll && setIsDeleteAllModalOpen(false)}
        maxWidth="md"
      >
        <div className="p-6 bg-[#160d29] text-white rounded-2xl border border-rose-800/40 font-sans">
          <div className="flex items-center gap-3 text-rose-400 mb-4">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold font-display">Delete All Templates?</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Are you sure you want to permanently delete all <strong className="text-rose-400">{filteredTemplates.length}</strong> template(s) in this view?
            This will wipe them from both the database and workspace. You can restore built-in presets later if needed.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={isDeletingAll}
              onClick={() => setIsDeleteAllModalOpen(false)}
              className="bg-neutral-800 hover:bg-neutral-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeletingAll}
              onClick={handleDeleteAll}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isDeletingAll ? 'Deleting All...' : `Yes, Delete All (${filteredTemplates.length})`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
