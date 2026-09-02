import React, { useState } from 'react';
import { useTournamentStore, SEED_TEAMS } from '../../store/tournamentStore';
import { TeamCard } from './TeamCard';
import { EditTeamModal } from './EditTeamModal';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import {
  Users2,
  Zap,
  RotateCcw,
  Search,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import type { Team } from '../../types/tournament';

export const TeamsView: React.FC = () => {
  const { currentTournament, updateTournament, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const teams = currentTournament.teams || [];
  const maxSlots = currentTournament.structure?.teamCount || 12;

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `slot ${t.slotNumber}`.includes(searchQuery.toLowerCase())
  );

  const handleBulkAutofill = () => {
    const updated = Array.from({ length: maxSlots }, (_, i) => {
      const seed = SEED_TEAMS[i % SEED_TEAMS.length];
      return {
        ...seed,
        id: `team-${currentTournament.id}-${i + 1}`,
        slotNumber: i + 1,
        players: seed.players.map((p, pIdx) => ({
          ...p,
          id: `p-${currentTournament.id}-${i + 1}-${pIdx + 1}`
        }))
      };
    });

    updateTournament(currentTournament.id, { teams: updated });
    showToast({
      type: 'success',
      title: 'Squads Autofilled',
      message: `Populated ${maxSlots} slots with verified Free Fire pro esports teams.`
    });
  };

  const handleClearAllTeams = () => {
    const cleared = Array.from({ length: maxSlots }, (_, i) => ({
      id: `team-${currentTournament.id}-${i + 1}`,
      name: `Slot #${i + 1} Squad`,
      tag: `S${i + 1}`,
      slotNumber: i + 1,
      players: []
    }));

    updateTournament(currentTournament.id, { teams: cleared });
    showToast({
      type: 'info',
      title: 'Lobby Cleared',
      message: 'All team slots reset to blank placeholders.'
    });
  };

  const handleSaveTeam = (teamId: string, updatedFields: Partial<Team>) => {
    const updated = teams.map((t) => (t.id === teamId ? { ...t, ...updatedFields } : t));
    updateTournament(currentTournament.id, { teams: updated });
    setEditingTeam(null);
    showToast({
      type: 'success',
      title: 'Squad Updated',
      message: 'Team information and player roster saved.'
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    const updated = teams.filter((t) => t.id !== teamId);
    updateTournament(currentTournament.id, { teams: updated });
    showToast({
      type: 'info',
      title: 'Team Removed',
      message: 'Removed squad from tournament lobby.'
    });
  };

  const totalRegisteredPlayers = teams.reduce((sum, t) => sum + t.players.length, 0);

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
              <Users2 className="h-6 w-6 text-[var(--accent-primary)]" />
              Tournament Squads & Lobby Slots ({teams.length} / {maxSlots})
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Manage lobby slot allocations, squad names, team logos, and registered player lineups.
            </p>
          </div>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllTeams}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Clear Slots
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleBulkAutofill}
            leftIcon={<Zap className="h-4 w-4" />}
          >
            ⚡ Bulk Autofill Teams
          </Button>
        </div>
      </div>

      {/* Beginner Tooltip Banner */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4 px-5 flex items-center justify-between gap-3 text-xs sm:text-sm text-[var(--text-secondary)] shadow-[var(--shadow-inset)] font-mono">
        <div className="flex items-center gap-2.5 font-sans">
          <HelpCircle className="h-5 w-5 text-[var(--accent-primary)] shrink-0" />
          <span>
            <strong>Beginner Guide:</strong> Click <strong>[ ⚡ Bulk Autofill Teams ]</strong> to instantly populate all slots with verified pro rosters.
          </span>
        </div>
        <span className="text-xs text-[var(--accent-primary)] font-mono font-bold hidden sm:inline">1-Click Setup</span>
      </div>

      {/* Summary Matrix Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Configured Slots</div>
          <div className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-numbers">{teams.length} / {maxSlots}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Registered Players</div>
          <div className="text-2xl font-bold text-[var(--accent-primary)] mt-1 font-numbers">{totalRegisteredPlayers}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Avg Lineup Size</div>
          <div className="text-2xl font-bold text-[var(--accent-gold)] mt-1 font-numbers">
            {(totalRegisteredPlayers / (teams.length || 1)).toFixed(1)}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-flat)]">
          <div className="text-xs uppercase text-[var(--text-secondary)] font-sans font-bold">Lobby Format</div>
          <div className="text-sm font-bold text-[var(--status-live)] mt-1.5 font-sans">12-Slot Standard</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Filter squads by name, tag, or slot number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-[var(--shadow-inset)] focus:outline-none focus:border-[var(--accent-primary)]"
        />
      </div>

      {/* Teams Slot Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={(t) => setEditingTeam(t)}
              onDelete={handleDeleteTeam}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users2}
          title="No Teams in Lobby"
          description="Populate your tournament lobby slots with verified Free Fire pro teams or add squads manually."
          actionLabel="Bulk Autofill Verified Teams"
          onAction={handleBulkAutofill}
          stepGuide="Step 02"
        />
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <EditTeamModal
          isOpen={!!editingTeam}
          onClose={() => setEditingTeam(null)}
          team={editingTeam}
          onSave={handleSaveTeam}
        />
      )}
    </div>
  );
};