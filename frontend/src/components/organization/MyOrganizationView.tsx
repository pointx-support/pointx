import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTournamentStore } from '../../store/tournamentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUpload } from '../ui/ImageUpload';
import { useToast } from '../ui/Toast';
import {
  Building2,
  Save,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Globe
} from 'lucide-react';

export interface MyOrganizationViewProps {
  onBackToDashboard?: () => void;
}

export const MyOrganizationView: React.FC<MyOrganizationViewProps> = ({ onBackToDashboard }) => {
  const { user, updateProfile } = useAuthStore();
  const { currentTournament, updateTournament, goBackTab, previousTab } = useTournamentStore();
  const { showToast } = useToast();

  const handleBack = () => {
    if (onBackToDashboard && (!previousTab || previousTab === 'organization')) {
      onBackToDashboard();
    } else {
      goBackTab();
    }
  };

  const [organizationName, setOrganizationName] = useState(
    user?.organizationName || currentTournament?.organizer || 'POINTX ESPORTS'
  );
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | undefined>(
    user?.organizationLogoUrl || currentTournament?.organizerLogoUrl
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!organizationName.trim()) {
      showToast({
        type: 'error',
        title: 'Organisation Name Required',
        message: 'Please enter a valid organisation name.'
      });
      return;
    }

    // 1. Update user profile state in auth store (persisted in localStorage)
    updateProfile({
      organizationName: organizationName.trim(),
      organizationLogoUrl
    });

    // 2. Propagate to active tournament if present
    if (currentTournament?.id) {
      updateTournament(currentTournament.id, {
        organizer: organizationName.trim(),
        organizerLogoUrl: organizationLogoUrl
      });
    }

    showToast({
      type: 'success',
      title: 'Organisation Updated',
      message: 'Organisation name and logo saved across all templates and overlays.'
    });
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-start sm:items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            ← Back to Dashboard
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Host Identity
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <Building2 className="h-6 w-6 text-[var(--accent-primary)]" />
              My Organisation
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Manage your esports host branding, official organizer logo, and presenter name.
            </p>
          </div>
        </div>
      </div>

      {/* Main Organisation Settings Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-flat)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2 className="font-bold text-base text-[var(--text-primary)] font-display">
                Organisation Brand Identity
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--accent-primary)] font-bold px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30">
              Auto-Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Organization Name & Details */}
            <div className="space-y-4">
              <Input
                label="Organisation / Host Name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organisation name"
                helperText="Appears as the official presenter on match leaderboards and graphics."
                required
              />

              <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-[var(--accent-primary)] font-bold">
                  <Globe className="h-4 w-4" />
                  <span>Where this is used:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                  <li>Leaderboard header banner</li>
                  <li>Graphics Studio posters & overlays</li>
                  <li>Live stream broadcast scoreboard cards</li>
                  <li>Tournament public match results</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Organization Logo Upload */}
            <div className="space-y-4">
              <ImageUpload
                label="Organisation Official Logo"
                value={organizationLogoUrl}
                onChange={setOrganizationLogoUrl}
                helperText="Upload your team/org badge (PNG, SVG, WEBP, JPG)."
                placeholderText="Click or drop Org Logo here"
              />
            </div>
          </div>

          {/* Live Preview Strip */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {organizationLogoUrl ? (
                <img
                  src={organizationLogoUrl}
                  alt={organizationName}
                  className="h-12 w-12 rounded-xl object-contain bg-black/40 p-1.5 border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-black/40 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] font-bold text-lg font-mono">
                  {organizationName ? organizationName.slice(0, 2).toUpperCase() : 'ORG'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold">Live Host Card</div>
                <div className="font-bold text-sm text-[var(--text-primary)] font-display truncate">
                  {organizationName || 'Organisation Name'}
                </div>
              </div>
            </div>

            <span className="text-[11px] font-mono text-[var(--status-live)] font-bold px-2 py-0.5 rounded bg-[var(--status-live)]/15 border border-[var(--status-live)]/30">
              ● Active
            </span>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Organisation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
