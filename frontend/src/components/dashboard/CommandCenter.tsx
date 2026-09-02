import React, { useState } from 'react';
import type { Tournament } from '../../types/tournament';
import { useTournamentStore } from '../../store/tournamentStore';
import { useAuthStore } from '../../store/authStore';
import { TournamentCard } from '../tournaments/TournamentCard';
import { TournamentWizard } from '../tournaments/TournamentWizard';
import { CloneTournamentModal } from '../tournaments/CloneTournamentModal';
import { EditTournamentModal } from '../tournaments/EditTournamentModal';
import { DeleteTournamentModal } from '../tournaments/DeleteTournamentModal';
import { Button } from '../ui/Button';
import { PointXLogo } from '../ui/PointXLogo';
import { useToast } from '../ui/Toast';
import {
  Trophy,
  Plus,
  Search,
  FolderInput,
  Zap,
  Users2,
  Swords,
  Sparkles,
  Tv,
  HelpCircle,
  History,
  Radio,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import { downloadBlobFile } from '../../engine/exportEngine';

const HERO_TAGLINES = [
  'Tournament Operations, Real-Time Point Matrix Engine, OBS Broadcast Overlays & 4K Graphics Studio.',
  'Instant Free Fire Official Scoring (12-9-8-7) with Automated Multi-Tiebreaker Hierarchy.',
  'Live OBS Studio Browser Source Overlays with Dynamic 4-Player ALIVE Status Bars.',
  'Ultra HD 4K Instagram Standings Posters, Match Summaries & Story Flyers.',
  'Global Esports Squad Registry, 12-Slot Lineups & Verified Player Database.',
  'Single-Click JSON Tournament Backups, Portable Restores & Cloud Data Exports.',
  'Comprehensive Tournament Analytics, Single-Match Records & Frag Consistency Insights.',
  'Customizable Scoring Matrix Sandbox with Dynamic Elimination Points & Placement Rules.',
  'Mobile Remote Score Controller for Broadcasters, Casters & Tournament Admins.',
  'Live Matchpoint Calculations, Booyah Tracking & Instant Leaderboard Updates.',
  'Automated Multi-Group Round Robin Management & Stage Progression Engine.'
];

export interface CommandCenterProps {
  onSelectTournament: (tournament: Tournament, targetTab?: any) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onSelectTournament }) => {
  const {
    tournaments,
    isLoadingTournaments,
    hasLoadedFromDatabase,
    fetchTournaments,
    createTournament,
    updateTournament,
    cloneTournament,
    importTournaments,
    archiveTournament,
    deleteTournament,
    loadDemoTournaments,
    clearAllTournaments,
    highlightDashboardAction
  } = useTournamentStore();
  const { user } = useAuthStore();

  const { showToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'teams' | 'matches'>('updated');
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);

  // Dynamic Fading Taglines
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isTaglineFading, setIsTaglineFading] = useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsTaglineFading(true);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % HERO_TAGLINES.length);
        setIsTaglineFading(false);
      }, 300);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!hasLoadedFromDatabase) {
      fetchTournaments();
    }
  }, [hasLoadedFromDatabase, fetchTournaments]);

  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      useTournamentStore.getState().sanitizeTournamentsForRole(user.role);
    }
  }, [user?.role]);

  // Modal / Wizard Triggers
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [cloningTournament, setCloningTournament] = useState<Tournament | null>(null);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);

  const filteredTournaments = tournaments
    .filter((t) => {
      const matchesStatus =
        filterStatus === 'All'
          ? t.status !== 'Archived'
          : filterStatus === 'Archived'
          ? t.status === 'Archived'
          : t.status === filterStatus;

      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.game && t.game.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'teams') return b.teams.length - a.teams.length;
      if (sortBy === 'matches') return b.matches.length - a.matches.length;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const liveCount = tournaments.filter((t) => t.status === 'Live' || t.status === 'Ongoing').length;
  const upcomingCount = tournaments.filter((t) => t.status === 'Upcoming').length;
  const completedCount = tournaments.filter((t) => t.status === 'Completed').length;
  const totalTournamentsCount = tournaments.length;

  const handleWizardComplete = (newTour: Tournament) => {
    createTournament(newTour);
    setIsWizardOpen(false);
    showToast({
      type: 'success',
      title: 'Tournament Initialized 🎉',
      message: `Next Step: Configure your 12 squad lineups in Teams & Slots before calculating points.`
    });
    onSelectTournament(newTour, 'teams');
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const toImport: any[] = Array.isArray(parsed) ? parsed : [parsed];

        const validTournaments: Tournament[] = toImport.filter(
          (item) => item && item.id && item.title && Array.isArray(item.teams)
        );

        if (validTournaments.length === 0) {
          throw new Error('No valid tournament structures found in JSON.');
        }

        const count = await importTournaments(validTournaments);
        showToast({
          type: 'success',
          title: 'Tournaments Imported',
          message: `Successfully imported ${count} tournament${count > 1 ? 's' : ''} into PointX.`
        });
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Import Failed',
          message: err?.message || 'Could not parse the imported JSON file.'
        });
      } finally {
        if (e.target) {
          e.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExportSingleTournament = (tour: Tournament) => {
    try {
      const dataStr = JSON.stringify(tour, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      downloadBlobFile(blob, `${tour.title.replace(/\s+/g, '_')}_Backup.json`);
      showToast({
        type: 'success',
        title: 'Export Complete',
        message: `Saved backup file for "${tour.title}".`
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export tournament data.'
      });
    }
  };

  const handleEditSave = (tournamentId: string, updatedData: Partial<Tournament>) => {
    updateTournament(tournamentId, updatedData);
    setEditingTournament(null);
    showToast({
      type: 'success',
      title: 'Changes Saved',
      message: `Updated tournament details.`
    });
  };

  const handleArchive = (id: string) => {
    archiveTournament(id);
    setDeletingTournament(null);
    showToast({
      type: 'info',
      title: 'Tournament Archived',
      message: 'Tournament moved to archive.'
    });
  };

  const handlePermanentDelete = (id: string) => {
    deleteTournament(id);
    setDeletingTournament(null);
    showToast({
      type: 'success',
      title: 'Tournament Deleted',
      message: 'Permanently deleted tournament.'
    });
  };

  const WORKFLOW_STEPS = [
    { step: '1', title: 'Create Tournament', desc: 'Title, logo, structure & scoring', icon: Zap },
    { step: '2', title: 'Teams & Slots', desc: 'Assign 12 squad rosters & slots', icon: Users2 },
    { step: '3', title: 'Calculate Points', desc: 'Enter match placements & kills', icon: Swords },
    { step: '4', title: 'Point Table', desc: 'Standings with tie-breakers', icon: Trophy },
    { step: '5', title: 'Graphics Studio', desc: 'Export 4K posters & flyers', icon: Sparkles },
    { step: '6', title: 'Live OBS', desc: 'Stream overlay browser source', icon: Tv }
  ];

  if (isWizardOpen) {
    return (
      <TournamentWizard
        onComplete={handleWizardComplete}
        onCancel={() => setIsWizardOpen(false)}
      />
    );
  }

  return (
    <div className="space-y-8 font-sans w-full max-w-[1680px] mx-auto animate-page-enter">
      {/* ================= 1. CLEAN POINTX ESPORTS COMMAND-CENTER HERO SECTION ================= */}
      <section className="relative rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-surface-raised)] via-[var(--bg-hero)] to-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-raised)] p-6 sm:p-10 lg:p-12 text-center transition-all duration-300">
        
        {/* Subtle, soft ambient highlight behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[540px] h-[200px] sm:h-[260px] bg-[var(--accent-primary)]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* --- HERO CONTENT COMPOSITION --- */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
          
          {/* 1. PointX Esports Authority Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/25 backdrop-blur-md text-[var(--accent-primary-text)] dark:text-[var(--accent-primary)] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.22em] uppercase">
              PointX Esports • Tournament OS
            </span>
          </div>

          {/* 2. Flagship PointX Brand Logo */}
          <div className="relative flex h-20 sm:h-26 md:h-32 w-auto max-w-[280px] sm:max-w-[400px] md:max-w-[480px] items-center justify-center p-1 group">
            <div className="absolute inset-0 bg-[var(--accent-primary)]/15 rounded-3xl blur-2xl group-hover:bg-[var(--accent-primary)]/25 transition-all duration-500" />
            <div className="relative z-10">
              <PointXLogo
                className="w-full h-full object-contain select-none drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_6px_24px_rgba(0,0,0,0.65)]"
                withShine={true}
              />
            </div>
          </div>

          {/* 3. Dynamic Fading Capabilities Tagline System */}
          <div className="min-h-[44px] sm:min-h-[48px] flex items-center justify-center max-w-xl mx-auto px-2">
            <p
              className={`text-xs sm:text-sm md:text-base text-[var(--text-secondary)] font-medium leading-relaxed transition-all duration-300 transform ${
                isTaglineFading ? 'opacity-0 -translate-y-1 scale-[0.99]' : 'opacity-100 translate-y-0 scale-100'
              }`}
              aria-live="polite"
            >
              {HERO_TAGLINES[taglineIndex]}
            </p>
          </div>

          {/* 4. PRIMARY ACTIONS: Create & Import */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full pt-2">
            {/* CREATE TOURNAMENT BUTTON */}
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className={`group relative w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base font-display cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 overflow-hidden ${
                highlightDashboardAction
                  ? 'bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_0_30px_rgba(255,208,0,0.6)] ring-2 ring-[#ffd000] ring-offset-2 ring-offset-[var(--bg-base)] animate-pulse'
                  : 'bg-gradient-to-r from-[#ffd000] via-[#ffc000] to-[#ff9900] text-black shadow-[0_6px_20px_rgba(255,208,0,0.35)] hover:shadow-[0_10px_26px_rgba(255,208,0,0.5)]'
              }`}
            >
              <div className="flex items-center justify-center h-5 w-5 rounded-md bg-black/10 group-hover:scale-110 transition-transform">
                <Plus className="h-4 w-4 stroke-[2.5] text-black" />
              </div>
              <span className="tracking-wide">Create Tournament</span>
            </button>

            {/* IMPORT TOURNAMENT BUTTON */}
            <button
              type="button"
              onClick={handleTriggerImport}
              className="group relative w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base font-display text-[var(--text-primary)] bg-[var(--bg-surface-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] hover:border-[var(--accent-primary)]/60 backdrop-blur-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              title="Import tournament data from JSON backup"
            >
              <div className="flex items-center justify-center h-5 w-5 rounded-md bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                <FolderInput className="h-4 w-4 text-[var(--accent-primary)]" />
              </div>
              <span className="tracking-wide">Import Tournament</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* ================= 2. ESPORTS METRICS & TELEMETRY ROW ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 font-mono">
        {/* TOTAL TOURNAMENTS */}
        <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)] hover:border-[var(--accent-primary)]/50 hover:shadow-[var(--shadow-raised)] transition-all duration-200 group overflow-hidden">
          {/* Subtle Accent Strip */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-[var(--accent-primary)]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-secondary)] font-mono">
              Total Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 group-hover:scale-110 transition-transform">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-numbers">
              {totalTournamentsCount}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-sans">
              Managed Tournaments
            </div>
          </div>
        </div>

        {/* LIVE NOW */}
        <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)] hover:border-[#10b981]/50 hover:shadow-[var(--shadow-raised)] transition-all duration-200 group overflow-hidden">
          {/* Subtle Accent Strip */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-[#10b981]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-[#10b981] animate-pulse" />
              Live Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 group-hover:scale-110 transition-transform">
              <Swords className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#10b981] font-numbers flex items-center gap-2">
              <span>{liveCount}</span>
              {liveCount > 0 && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#10b981] animate-ping" />
              )}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-sans">
              Real-time Scoring Active
            </div>
          </div>
        </div>

        {/* UPCOMING */}
        <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)] hover:border-[#38bdf8]/50 hover:shadow-[var(--shadow-raised)] transition-all duration-200 group overflow-hidden">
          {/* Subtle Accent Strip */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-[#38bdf8]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-secondary)] font-mono">
              Upcoming
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 group-hover:scale-110 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-numbers">
              {upcomingCount}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-sans">
              Scheduled for Launch
            </div>
          </div>
        </div>

        {/* COMPLETED */}
        <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-[var(--shadow-flat)] hover:border-[var(--accent-primary)]/50 hover:shadow-[var(--shadow-raised)] transition-all duration-200 group overflow-hidden">
          {/* Subtle Accent Strip */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-[#f59e0b]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-secondary)] font-mono">
              Completed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-numbers">
              {completedCount}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-sans">
              Archived & Finalized
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. TOURNAMENT WORKFLOW GUIDE (COLLAPSIBLE) ================= */}
      <div className="rounded-2xl bg-[var(--bg-surface)] p-4 sm:p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-flat)] transition-colors duration-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-display">
              PointX Esports Tournament Workflow (6 Simple Steps)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
            className="text-xs font-mono font-bold text-[var(--accent-primary)] hover:underline cursor-pointer flex items-center gap-1"
          >
            {showWorkflowGuide ? 'Hide Guide ▲' : 'Show Roadmap ▼'}
          </button>
        </div>

        {showWorkflowGuide && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3.5 mt-3.5 border-t border-[var(--border-subtle)] animate-fadeIn">
            {WORKFLOW_STEPS.map((s) => {
              const IconComp = s.icon;
              return (
                <div
                  key={s.step}
                  className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1.5 hover:border-[var(--accent-primary)]/50 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                      STEP {s.step}
                    </span>
                    <IconComp className="h-3.5 w-3.5 text-[var(--accent-primary)] group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] truncate font-display">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-snug">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= 4. PREVIOUS TOURNAMENTS WORKSPACE SECTION ================= */}
      <section className="space-y-5 p-5 sm:p-6 lg:p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-raised)]">
        {/* Section Header with Tabs & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] font-display">
                Previous Tournaments
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Manage, edit, export and review all active & historic brackets
              </p>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[var(--bg-surface-inset)] p-1.5 rounded-2xl border border-[var(--border-subtle)]">
            {[
              { id: 'All', label: 'All Events', count: tournaments.length },
              { id: 'Live', label: 'Live Now', count: liveCount, dot: true },
              { id: 'Upcoming', label: 'Upcoming', count: upcomingCount },
              { id: 'Completed', label: 'Completed', count: completedCount },
              { id: 'Archived', label: 'Archived', count: tournaments.filter((t) => t.status === 'Archived').length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {tab.dot && <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />}
                <span>{tab.label}</span>
                <span className="font-mono opacity-80 text-[10px]">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sorting Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search tournaments by name, game, or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'admin' && tournaments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearAllTournaments();
                  showToast({
                    type: 'info',
                    title: 'Demo Tournaments Hidden',
                    message: 'Removed all demo tournaments from workspace.'
                  });
                }}
                className="px-3 py-2 rounded-xl bg-[var(--bg-surface-subtle)] hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-500 border border-[var(--border-medium)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Hide all demo tournaments"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hide Demo Info</span>
              </button>
            )}
            <span className="text-xs font-mono text-[var(--text-secondary)] hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] text-xs font-bold text-[var(--text-primary)] shadow-sm cursor-pointer focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            >
              <option value="updated">Recently Updated</option>
              <option value="teams">Most Squads</option>
              <option value="matches">Most Matches</option>
            </select>
          </div>
        </div>

        {/* Tournament Cards List */}
        {isLoadingTournaments ? (
          <div className="grid grid-cols-1 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-700/20" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 rounded-md bg-zinc-700/20" />
                      <div className="h-3 w-32 rounded-md bg-zinc-700/10" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded-full bg-zinc-700/20" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div className="h-8 rounded-lg bg-zinc-700/10" />
                  <div className="h-8 rounded-lg bg-zinc-700/10" />
                  <div className="h-8 rounded-lg bg-zinc-700/10" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTournaments.map((tour) => (
              <TournamentCard
                key={tour.id}
                tournament={tour}
                onOpen={(t) => onSelectTournament(t, 'overview')}
                onQuickStandings={(t) => onSelectTournament(t, 'standings')}
                onQuickBroadcast={(t) => onSelectTournament(t, 'broadcast')}
                onQuickGraphics={(t) => onSelectTournament(t, 'graphics')}
                onEdit={(t) => setEditingTournament(t)}
                onClone={(t) => setCloningTournament(t)}
                onDelete={(t) => setDeletingTournament(t)}
                onExport={handleExportSingleTournament}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-[var(--text-secondary)] opacity-50" />
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display">No Tournaments Yet</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {searchQuery
                ? 'No events match your search query. Try clearing the filter.'
                : 'Your tournament workspace is empty. Create your first tournament to get started.'}
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsWizardOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create Tournament
              </Button>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadDemoTournaments();
                    showToast({
                      type: 'info',
                      title: 'Demo Tournaments Loaded',
                      message: 'Loaded 3 official sample tournaments for testing.'
                    });
                  }}
                  leftIcon={<Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />}
                >
                  Load Demo Tournaments
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Clone Modal */}
      {cloningTournament && (
        <CloneTournamentModal
          tournament={cloningTournament}
          isOpen={true}
          onClose={() => setCloningTournament(null)}
          onClone={(sourceTournamentId, options) => {
            cloneTournament(sourceTournamentId, options);
            setCloningTournament(null);
            showToast({
              type: 'success',
              title: 'Tournament Cloned',
              message: `Created clone: "${options.newTitle}".`
            });
          }}
        />
      )}

      {/* Edit Modal */}
      {editingTournament && (
        <EditTournamentModal
          tournament={editingTournament}
          isOpen={true}
          onClose={() => setEditingTournament(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete / Archive Modal */}
      {deletingTournament && (
        <DeleteTournamentModal
          tournament={deletingTournament}
          isOpen={true}
          onClose={() => setDeletingTournament(null)}
          onArchive={handleArchive}
          onPermanentDelete={handlePermanentDelete}
        />
      )}
    </div>
  );
};