import React, { useState } from 'react';
import type { Tournament } from '../../types/tournament';
import { Badge } from '../ui/Badge';
import {
  Trophy,
  Tv,
  Sparkles,
  ArrowRight,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  Swords,
  Award,
  Download
} from 'lucide-react';

export interface TournamentCardProps {
  tournament: Tournament;
  onOpen: (tournament: Tournament) => void;
  onQuickStandings: (tournament: Tournament) => void;
  onQuickBroadcast: (tournament: Tournament) => void;
  onQuickGraphics: (tournament: Tournament) => void;
  onEdit?: (tournament: Tournament) => void;
  onClone?: (tournament: Tournament) => void;
  onDelete?: (tournament: Tournament) => void;
  onExport?: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onOpen,
  onQuickStandings,
  onQuickBroadcast,
  onQuickGraphics,
  onEdit,
  onClone,
  onDelete,
  onExport
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isOngoing = tournament.status === 'Live' || tournament.status === 'Ongoing';
  const isCompleted = tournament.status === 'Completed';

  // Match progress calculation
  const completedMatches = tournament.matches.filter(
    (m) => m.status === 'Finalized' || m.status === 'Completed'
  ).length;
  const totalScheduledMatches = tournament.structure?.matchCount || Math.max(tournament.matches.length, 6);
  const currentMatchNumber = Math.min(completedMatches + 1, totalScheduledMatches);

  const formatScoringName = (name?: string) => {
    if (!name) return 'FF Standard (12-9-8)';
    if (name.toLowerCase().includes('official') || name.toLowerCase().includes('standard')) {
      return 'FF Standard (12-9-8)';
    }
    if (name.toLowerCase().includes('esports') || name.toLowerCase().includes('competitive')) {
      return 'FF Pro Matrix';
    }
    return name.length > 20 ? `${name.slice(0, 18)}...` : name;
  };

  const primaryActionText = isOngoing
    ? 'CONTINUE'
    : isCompleted
    ? 'VIEW STANDINGS'
    : 'MANAGE EVENT';

  return (
    <div
      className={`group relative rounded-2xl bg-[var(--bg-surface)] p-4 sm:p-5 transition-all duration-200 font-sans border ${
        isOngoing
          ? 'border-[var(--border-subtle)] border-l-4 border-l-[var(--status-live)] shadow-sm hover:shadow-md'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        
        {/* ================= ZONE 1: TOURNAMENT IDENTITY ================= */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Logo / Trophy Crest Container */}
          <div
            onClick={() => onOpen(tournament)}
            className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl cursor-pointer transition-all group-hover:scale-[1.02] ${
              tournament.logoUrl
                ? 'bg-black/30 border border-[var(--border-subtle)] p-1'
                : isOngoing
                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25'
                : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
            title="Open Tournament Overview"
          >
            {tournament.logoUrl ? (
              <img
                src={tournament.logoUrl}
                alt={tournament.title}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--accent-primary)]" />
            )}
          </div>

          {/* Title & Identity Info */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Status & Mode Row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  isOngoing
                    ? 'live'
                    : isCompleted
                    ? 'completed'
                    : tournament.status === 'Upcoming'
                    ? 'cyan'
                    : 'draft'
                }
                size="sm"
                pulse={isOngoing}
              >
                {isOngoing ? '● LIVE NOW' : tournament.status.toUpperCase()}
              </Badge>

              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-surface-inset)] px-2 py-0.5 text-[11px] font-mono font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {tournament.tournamentType || tournament.game || 'Battle Royale'}
              </span>
            </div>

            {/* Tournament Title */}
            <h3
              onClick={() => onOpen(tournament)}
              className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer truncate font-sans"
              title={tournament.title}
            >
              {tournament.title}
            </h3>

            {/* Authoritative Single Organizer / Branding Line */}
            <p className="text-xs text-[var(--text-secondary)] truncate">
              By <strong className="text-[var(--text-primary)] font-medium">{tournament.organizer || 'PointX Esports Network'}</strong>
            </p>
          </div>
        </div>

        {/* ================= ZONE 2: MATCH PROGRESS & SCORING ================= */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0 py-2 sm:py-0 border-y lg:border-none border-[var(--border-subtle)] lg:w-[280px] xl:w-[300px]">
          {/* Single Authoritative Match Progress Block */}
          <div className="bg-[var(--bg-surface-inset)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-center flex flex-col justify-center">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] font-mono flex items-center justify-center gap-1">
              <Swords className="h-3 w-3 text-[var(--accent-primary)]" />
              <span>Match Progress</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5 font-mono">
              {isOngoing
                ? `Match ${currentMatchNumber} of ${totalScheduledMatches}`
                : isCompleted
                ? `${totalScheduledMatches} Matches Done`
                : `${totalScheduledMatches} Matches Scheduled`}
            </div>
          </div>

          {/* Single Authoritative Scoring Preset Block */}
          <div className="bg-[var(--bg-surface-inset)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-center flex flex-col justify-center">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] font-mono flex items-center justify-center gap-1">
              <Award className="h-3 w-3 text-[var(--accent-primary)]" />
              <span>Scoring System</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-[var(--accent-primary)] mt-0.5 truncate font-sans px-0.5" title={tournament.scoringPreset?.name}>
              {formatScoringName(tournament.scoringPreset?.name)}
            </div>
          </div>
        </div>

        {/* ================= ZONE 3: ACTIONS ================= */}
        <div className="flex items-center justify-between lg:justify-end gap-2.5 sm:gap-3 shrink-0">
          {/* Secondary Distinct Quick Action Buttons */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface-inset)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => onQuickStandings(tournament)}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
              title="View Point Table Standings"
            >
              <Trophy className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onQuickGraphics(tournament)}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
              title="Open Graphics Studio"
            >
              <Sparkles className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onQuickBroadcast(tournament)}
              className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer"
              title="Open Live Broadcast OBS Overlays"
            >
              <Tv className="h-4 w-4" />
            </button>
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => onOpen(tournament)}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              isOngoing
                ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.98] shadow-sm'
                : 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] active:scale-[0.98]'
            }`}
          >
            <span>{primaryActionText}</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>

          {/* Overflow Menu (3-dots) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer"
              title="More Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-xl p-1.5 z-50 animate-scaleIn text-xs font-bold font-sans">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(tournament);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Details</span>
                    </button>
                  )}

                  {onClone && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onClone(tournament);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Clone Tournament</span>
                    </button>
                  )}

                  {onExport && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onExport(tournament);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export JSON</span>
                    </button>
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(tournament);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 transition-colors cursor-pointer border-t border-[var(--border-subtle)] mt-1 pt-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete / Archive</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};