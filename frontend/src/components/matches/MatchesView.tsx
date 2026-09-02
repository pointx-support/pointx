import React, { useState } from 'react';
import type { Match } from '../../types/tournament';
import { useTournamentStore } from '../../store/tournamentStore';
import { MatchEditor } from './MatchEditor';
import { CreateMatchModal } from './CreateMatchModal';
import { MatchResultTable } from './MatchResultTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import {
  Swords,
  Plus,
  MapPin,
  Trophy,
  Flame,
  Search,
  Lock,
  Edit,
  Trash2,
  Table,
  ArrowLeft
} from 'lucide-react';
import { getMatchpointLabel } from '../../utils/format';

export const MatchesView: React.FC = () => {
  const { currentTournament, deleteMatch, setCreateMatchModalOpen, isCreateMatchModalOpen, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTableMatch, setViewingTableMatch] = useState<Match | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Finalized' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const editingMatch = currentTournament.matches.find((m) => m.id === activeMatchId);

  if (editingMatch) {
    return (
      <MatchEditor
        match={editingMatch}
        tournament={currentTournament}
        onBack={() => setActiveMatchId(null)}
      />
    );
  }

  const filteredMatches = (currentTournament.matches || [])
    .filter((m) => {
      const matchesStatus =
        filterStatus === 'All'
          ? true
          : m.status === filterStatus;
      const matchesSearch =
        (m.customLabel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.mapName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `match ${m.matchNumber}`.includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => b.matchNumber - a.matchNumber);

  const totalFragsProcessed = currentTournament.matches.reduce(
    (sum, m) => sum + m.results.reduce((s, r) => s + (r.kills || 0), 0),
    0
  );

  const finalizedCount = currentTournament.matches.filter((m) => m.status === 'Finalized' || m.status === 'Completed').length;
  const totalScheduledMatches = currentTournament.structure?.matchCount || Math.max(currentTournament.matches.length, 6);
  const nextMatchToCalculate = currentTournament.matches.length + 1;
  const calculateMatchButtonLabel = getMatchpointLabel(nextMatchToCalculate);

  const handleDeleteMatch = (matchId: string) => {
    deleteMatch(matchId);
    showToast({
      type: 'info',
      title: 'Match Removed',
      message: 'Match removed from tournament records.'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
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
              <Swords className="h-6 w-6 text-[var(--accent-primary)]" />
              Calculate Points ({currentTournament.matches.length} Matches)
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Enter team placements and elimination kills. Points and standings update automatically in real-time.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => {
            setIsCreateModalOpen(true);
            setCreateMatchModalOpen(true);
          }}
        >
          {calculateMatchButtonLabel}
        </Button>
      </div>

      {/* Data Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Total Matches</div>
          <div className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-numbers">
            {finalizedCount} / {totalScheduledMatches}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Official Finalized</div>
          <div className="text-2xl font-bold text-[var(--accent-gold)] mt-1 font-numbers">
            {finalizedCount}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Total Eliminations</div>
          <div className="text-2xl font-bold text-[var(--status-danger)] mt-1 font-numbers">
            {totalFragsProcessed}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Active Squads</div>
          <div className="text-2xl font-bold text-[var(--accent-primary)] mt-1 font-numbers">
            {currentTournament.teams.length}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search rounds by title or map name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface-inset)] p-1.5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-inset)]">
          {(['All', 'Finalized', 'Completed', 'Draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-[var(--bg-surface-raised)] text-[var(--accent-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredMatches.map((match) => {
            const winnerResult = match.results.find((r) => r.placement === 1 || r.isBooyah);
            const winnerTeam = winnerResult
              ? currentTournament.teams.find((t) => t.id === winnerResult.teamId)
              : null;

            const matchKills = match.results.reduce((sum, r) => sum + (r.kills || 0), 0);
            const isFinalized = match.status === 'Finalized';

            return (
              <div
                key={match.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-flat)] hover:bg-[var(--bg-surface-hover)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left: Match Info */}
                <div className="flex items-center gap-4 min-w-0 font-mono">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-[var(--accent-primary)] font-black text-base font-numbers shadow-[var(--shadow-inset)]">
                    M{match.matchNumber.toString().padStart(2, '0')}
                  </div>

                  <div className="min-w-0 font-sans space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3
                        onClick={() => setActiveMatchId(match.id)}
                        className="font-bold text-[var(--text-primary)] text-base sm:text-lg tracking-tight hover:text-[var(--accent-primary)] transition-colors cursor-pointer truncate font-display"
                      >
                        {match.customLabel || `Match ${match.matchNumber}`}
                      </h3>

                      <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-surface-inset)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)] font-mono font-bold">
                        <MapPin className="h-3.5 w-3.5 text-[var(--status-live)]" /> {match.mapName}
                      </span>

                      <Badge variant={isFinalized ? 'amber' : match.status === 'Completed' ? 'live' : 'neutral'} size="sm">
                        {isFinalized && <Lock className="h-3.5 w-3.5 mr-1" />}
                        {match.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
                      <span className="text-[var(--status-danger)] font-bold flex items-center gap-1 font-numbers">
                        <Flame className="h-4 w-4" /> {matchKills} Kills
                      </span>
                      <span>•</span>
                      <span>{match.results.length} Squads Recorded</span>
                    </div>
                  </div>
                </div>

                {/* Right: Winner Badge & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-subtle)]">
                  {winnerTeam ? (
                    <div className="flex items-center gap-2 bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 px-3.5 py-2 rounded-xl shadow-sm">
                      <Trophy className="h-4 w-4 text-[var(--accent-gold)] shrink-0" />
                      <div className="min-w-0 font-sans">
                        <div className="text-xs sm:text-sm font-bold text-[var(--accent-gold)] truncate max-w-[140px]">
                          {winnerTeam.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--text-muted)] italic hidden sm:block font-mono">
                      Draft Results
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingTableMatch(match)}
                      title="View Scoreboard Table"
                      className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm active:shadow-inner transition-all cursor-pointer font-bold"
                    >
                      <Table className="h-4 w-4" />
                    </button>

                    <Button
                      variant={isFinalized ? 'secondary' : 'primary'}
                      size="sm"
                      leftIcon={<Edit className="h-4 w-4" />}
                      onClick={() => setActiveMatchId(match.id)}
                    >
                      {isFinalized ? 'View Results' : 'Enter Results'}
                    </Button>

                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      title="Delete Match"
                      className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--status-danger)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--status-danger)]/15 shadow-sm transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Swords}
          title="No Matches Created Yet"
          description={
            searchQuery
              ? `No matches matched "${searchQuery}".`
              : 'Create your first match round to start entering raw team placements, kills, and calculating official points.'
          }
          actionLabel="Create First Match"
          onAction={() => setIsCreateModalOpen(true)}
          stepGuide="Step 03"
        />
      )}

      {/* Create Modal */}
      {(isCreateModalOpen || isCreateMatchModalOpen) && (
        <CreateMatchModal
          isOpen={isCreateModalOpen || isCreateMatchModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateMatchModalOpen(false);
          }}
          tournament={currentTournament}
          onMatchCreated={(newMatchId) => {
            setIsCreateModalOpen(false);
            setCreateMatchModalOpen(false);
            setActiveMatchId(newMatchId);
          }}
        />
      )}

      {/* Table View Modal */}
      {viewingTableMatch && (
        <Modal
          isOpen={!!viewingTableMatch}
          onClose={() => setViewingTableMatch(null)}
          title={viewingTableMatch.customLabel || `Match #${viewingTableMatch.matchNumber} Scoreboard`}
          description={`Official results table for ${viewingTableMatch.mapName} round.`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <MatchResultTable match={viewingTableMatch} tournament={currentTournament} />
            <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
              <Button variant="primary" size="sm" onClick={() => setViewingTableMatch(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};