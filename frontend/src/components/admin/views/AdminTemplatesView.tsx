import React from 'react';
import { useTemplateStore } from '../../../store/templateStore';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import {
  Palette,
  Eye,
  EyeOff,
  Sparkles,
  Sliders,
  Smartphone,
  Monitor
} from 'lucide-react';

export interface AdminTemplatesViewProps {
  onOpenTemplateStudio: () => void;
}

export const AdminTemplatesView: React.FC<AdminTemplatesViewProps> = ({ onOpenTemplateStudio }) => {
  const { templates, publishTemplate, unpublishTemplate, setActiveTemplateId } = useTemplateStore();
  const { showToast } = useToast();

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
            Manage visibility, inspect aspect ratios, and calibrate pixel alignments in Template Studio.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenTemplateStudio}
          leftIcon={<Sparkles className="h-4 w-4" />}
        >
          Launch Precision Studio
        </Button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          const isPortrait = t.aspectRatio === '4:5';

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
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono font-bold text-white uppercase backdrop-blur-xs flex items-center gap-1">
                    {isPortrait ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    {t.aspectRatio}
                  </span>
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
                    {t.description || 'Custom esports standings poster template.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                  <span>Font: <strong className="text-[var(--text-primary)]">{t.alignment.fontFamily}</strong></span>
                  <span>Row Gap: <strong className="text-[var(--text-primary)]">{t.alignment.rowGap}px</strong></span>
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
    </div>
  );
};
