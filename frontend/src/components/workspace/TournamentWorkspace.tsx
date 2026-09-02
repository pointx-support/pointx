import React from 'react';
import type { Tournament } from '../../types/tournament';
import { useTournamentStore } from '../../store/tournamentStore';
import { OverviewView } from '../dashboard/OverviewView';
import { StandingsView } from '../standings/StandingsView';
import { MatchesView } from '../matches/MatchesView';
import { TeamsView } from '../teams/TeamsView';
import { GlobalTeamsView } from '../teams/GlobalTeamsView';
import { StatisticsView } from '../statistics/StatisticsView';
import { GraphicsView } from '../graphics/GraphicsView';
import { BroadcastControlView } from '../broadcast/BroadcastControlView';
import { SettingsView } from '../settings/SettingsView';
import { MyAccountView } from '../account/MyAccountView';
import { MyOrganizationView } from '../organization/MyOrganizationView';
import { AdminTemplateStudio } from '../graphics/AdminTemplateStudio';
import { Button } from '../ui/Button';
import { UserCheck, ArrowLeft } from 'lucide-react';

export interface TournamentWorkspaceProps {
  tournament: Tournament;
  onBackToDashboard?: () => void;
}

export const TournamentWorkspace: React.FC<TournamentWorkspaceProps> = ({
  tournament,
  onBackToDashboard
}) => {
  const { activeTab, goBackTab, previousTab } = useTournamentStore();

  const previousTabLabel = {
    standings: 'Point Table',
    matches: 'Matches',
    teams: 'Teams & Slots',
    overview: 'Overview',
    graphics: 'Graphics Studio',
    'template-studio': 'Template Studio',
    broadcast: 'OBS Broadcast',
    statistics: 'Statistics',
    players: 'Players',
    'global-teams': 'Squads DB',
    scoring: 'Scoring Rules',
    settings: 'Settings',
    organization: 'My Organisation',
    account: 'Account'
  }[previousTab || 'overview'] || 'Previous Section';

  const renderContent = (tab: string) => {
    switch (tab) {
      case 'overview':
        return <OverviewView onBackToDashboard={onBackToDashboard} />;
      case 'standings':
        return <StandingsView />;
      case 'matches':
        return <MatchesView />;
      case 'teams':
        return <TeamsView />;
      case 'global-teams' as any:
        return <GlobalTeamsView />;
      case 'players':
        return (
          <div className="space-y-5 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBackTab}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back to {previousTabLabel}
                </Button>

                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2 font-display">
                    <UserCheck className="h-5 w-5 text-[var(--accent-primary)]" />
                    Player Registry & Squad Assignments
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                    Registered roster lineups and in-game player IDs for all participating teams.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.teams.flatMap((team: any) =>
                team.players.map((player: any) => (
                  <div
                    key={player.id}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-[var(--text-primary)] text-sm">{player.name}</div>
                      <div className="text-xs font-mono text-[var(--text-secondary)]">IGN: {player.inGameId}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-mono font-bold text-[var(--accent-primary)]">
                      {team.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'statistics':
        return <StatisticsView />;
      case 'graphics':
        return <GraphicsView />;
      case 'template-studio':
        return <AdminTemplateStudio onClose={goBackTab} />;
      case 'broadcast':
        return <BroadcastControlView />;
      case 'scoring':
      case 'settings':
        return <SettingsView />;
      case 'organization':
        return <MyOrganizationView onBackToDashboard={onBackToDashboard} />;
      case 'account':
        return <MyAccountView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="w-full font-sans">
      <div key={activeTab} className="animate-page-enter">
        {renderContent(activeTab)}
      </div>
    </div>
  );
};