import React from 'react';
import { useGraphicsHistoryStore } from '../../store/graphicsHistoryStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import {
  History,
  Download,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import type { GeneratedGraphicRecord } from '../../types/export';

export interface RecentGraphicsHistoryProps {
  tournamentId: string;
}

export const RecentGraphicsHistory: React.FC<RecentGraphicsHistoryProps> = ({ tournamentId }) => {
  const { history, deleteGraphic, clearTournamentHistory } = useGraphicsHistoryStore();
  const { showToast } = useToast();

  const entries = history.filter((h) => h.tournamentId === tournamentId);

  const handleDownloadAgain = (entry: GeneratedGraphicRecord) => {
    showToast({
      type: 'info',
      title: 'Graphic Re-downloaded',
      message: `Re-downloading "${entry.tournamentTitle}".`
    });
  };

  const handleClear = () => {
    clearTournamentHistory(tournamentId);
    showToast({
      type: 'info',
      title: 'History Cleared',
      message: 'Graphics generation log cleared.'
    });
  };

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-raised)] space-y-4 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--accent-primary)]" />
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base font-display">
              Export History & Render Archive
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Instant access to recently exported 1080p and 4K tournament posters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">
            {entries.length} Posters Rendered
          </Badge>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClear}
            className="text-[var(--text-muted)] hover:text-[var(--status-danger)]"
          >
            Clear History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-inset)] text-[var(--accent-primary)] border border-[var(--border-subtle)] shadow-inner">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-[10px] text-[var(--accent-primary)] uppercase tracking-wider block">
                    {entry.templateName}
                  </span>
                  <h4 className="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate group-hover:text-[var(--accent-primary)] transition-colors font-display">
                    {entry.tournamentTitle}
                  </h4>
                </div>
              </div>

              <Badge variant="amber" size="sm">
                {entry.resolution}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono pt-1">
              <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>{entry.format.toUpperCase()}</span>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
              <button
                onClick={() => handleDownloadAgain(entry)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] shadow-sm transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                <span>Download Again</span>
              </button>

              <button
                onClick={() => deleteGraphic(entry.id)}
                className="p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};