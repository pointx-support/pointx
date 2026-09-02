import React, { useState } from 'react';
import { useTeamStore } from '../../store/teamStore';
import { CreateGlobalTeamModal } from './CreateGlobalTeamModal';
import { TeamProfileModal } from './TeamProfileModal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Plus,
  Search,
  Users,
  Eye,
  Trash2,
  Database,
  ArrowLeft
} from 'lucide-react';
import type { GlobalTeam } from '../../types/team';
import { useTournamentStore } from '../../store/tournamentStore';

export const GlobalTeamsView: React.FC = () => {
  const { globalTeams, createGlobalTeam, deleteGlobalTeam } = useTeamStore();
  const { goBackTab } = useTournamentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectingTeam, setInspectingTeam] = useState<GlobalTeam | null>(null);

  const filteredTeams = globalTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="flex items-center gap-2 mb-1 font-mono text-xs text-[var(--accent-primary)] font-bold uppercase tracking-wider">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--status-live)] animate-pulse"></span>
              <span>GLOBAL ROSTER DATABASE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <Database className="h-6 w-6 text-[var(--accent-primary)]" />
              Verified Esports Squads Registry ({globalTeams.length})
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Manage reusable squad templates, verified logos, and player rosters for fast autofilling across all tournaments.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Register New Squad
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Filter database by squad name or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] shadow-[var(--shadow-inset)]"
        />
      </div>

      {/* Squad Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] p-5 shadow-[var(--shadow-flat)] transition-all flex flex-col justify-between space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-black text-sm text-[var(--accent-primary)] font-mono shadow-[var(--shadow-inset)]">
                  {team.tag}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base tracking-tight truncate group-hover:text-[var(--accent-primary)] transition-colors font-display">
                    {team.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                    <span className="text-[var(--text-primary)] font-bold">{team.players.length} Players</span>
                    <span>•</span>
                    <span className="text-[var(--status-live)] font-bold">{team.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              <Badge variant="cyan" size="sm">
                Verified
              </Badge>
            </div>

            {/* Lineup snippet */}
            <div className="rounded-xl bg-[var(--bg-surface-inset)] p-3 border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] text-xs font-mono">
              <div className="flex items-center justify-between text-[var(--text-secondary)] font-bold mb-1.5 font-sans">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Active Lineup
                </span>
                <span className="text-[var(--text-muted)] font-normal font-mono">Free Fire</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {team.players.slice(0, 4).map((p) => (
                  <span
                    key={p.id}
                    className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg text-xs text-[var(--text-primary)] font-mono font-semibold"
                  >
                    {p.name}
                  </span>
                ))}
                {team.players.length > 4 && (
                  <span className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 rounded-lg text-xs text-[var(--text-secondary)]">
                    +{team.players.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setInspectingTeam(team)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                <span>View Full Profile</span>
              </button>

              <button
                onClick={() => deleteGlobalTeam(team.id)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15 transition-colors cursor-pointer"
                title="Delete from global DB"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Global Team Modal */}
      {isCreateModalOpen && (
        <CreateGlobalTeamModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={createGlobalTeam}
        />
      )}

      {/* Inspect Profile Modal */}
      {inspectingTeam && (
        <TeamProfileModal
          isOpen={!!inspectingTeam}
          onClose={() => setInspectingTeam(null)}
          team={inspectingTeam}
        />
      )}
    </div>
  );
};
