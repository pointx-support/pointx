import React, { useState, useEffect } from 'react';
import { useTemplateStore } from '../../../store/templateStore';
import { templatesApi } from '../../../services/api';
import { CustomTemplateWizard } from '../CustomTemplateWizard';
import { Button } from '../../ui/Button';
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
  Building
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
    syncTemplates
  } = useTemplateStore();
  const { showToast } = useToast();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | GraphicTemplateCategory>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomGraphicsTemplate | null>(null);

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
    </div>
  );
};
