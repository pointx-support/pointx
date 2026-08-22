import React, { useState } from 'react';
import { useTournamentStore } from '../../store/tournamentStore';
import { calculateTournamentStandings } from '../../engine/standingsEngine';
import { BroadcastFreeFireLiveOverlay } from './BroadcastFreeFireLiveOverlay';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import {
  Tv,
  Copy,
  ExternalLink,
  RotateCcw,
  HelpCircle,
  Sparkles,
  Smartphone,
  ArrowLeft
} from 'lucide-react';

export const BroadcastControlView: React.FC = () => {
  const { currentTournament, goBackTab } = useTournamentStore();
  const { showToast } = useToast();

  const [overlayType, setOverlayType] = useState<'live-squads' | 'standings' | 'match' | 'mvp' | 'lowerthird'>('live-squads');
  const [token, setToken] = useState(() => Math.random().toString(36).substring(2, 10));

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const overlayUrl = `${origin}/?mode=broadcast&tournamentId=${currentTournament.id}&layout=${overlayType}&token=${token}`;
  const remoteUrl = `${origin}/?mode=remote&tournamentId=${currentTournament.id}&token=${token}`;

  const standings = calculateTournamentStandings(currentTournament);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    showToast({
      type: 'success',
      title: 'Overlay URL Copied',
      message: 'Paste this link into OBS Studio Browser Source.'
    });
  };

  const handleCopyRemoteUrl = () => {
    navigator.clipboard.writeText(remoteUrl);
    showToast({
      type: 'success',
      title: 'Remote Controller URL Copied',
      message: 'Open this link on your phone or 2nd screen to control stream scores live!'
    });
  };

  const handleRefreshToken = () => {
    setToken(Math.random().toString(36).substring(2, 10));
    showToast({
      type: 'info',
      title: 'Security Token Refreshed',
      message: 'Updated live streaming access token.'
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
            <div className="flex items-center gap-2 mb-1 font-mono text-xs text-[var(--status-live)] font-bold uppercase tracking-wider">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--status-live)] animate-pulse"></span>
              <span>OBS STUDIO LIVE ENGINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-display">
              <Tv className="h-6 w-6 text-[var(--status-live)]" />
              Live Broadcast Control Room (OBS Studio)
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Embed live Free Fire standings, 4-player squad status bars, and lower-third graphics directly into OBS Studio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={handleCopyUrl}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Copy OBS Link
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(overlayUrl, '_blank')}
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            Test Window
          </Button>
        </div>
      </div>

      {/* Overlay Type Selector */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
        <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Select OBS Broadcast Overlay Scene</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[
            { id: 'live-squads', name: 'Free Fire Live Pro', desc: '1-to-1 Dito official Free Fire vertical leaderboard with 4-player ALIVE bars', badge: 'Official Style' },
            { id: 'standings', name: 'Full Standings Matrix', desc: 'Widescreen leaderboard table overlay' },
            { id: 'match', name: 'Match Results', desc: 'Single match winner & kill stats' },
            { id: 'mvp', name: 'Top Fraggers MVP', desc: 'Top kill leaders and MVP banner' },
            { id: 'lowerthird', name: 'Lower Third Pill', desc: 'Subtle ticker for active live streams' }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setOverlayType(sc.id as any)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                overlayType === sc.id
                  ? 'bg-[var(--bg-surface-raised)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'bg-[var(--bg-surface-inset)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {sc.badge && (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-[9px] font-bold uppercase tracking-wider">
                  {sc.badge}
                </span>
              )}
              <div className="font-bold text-sm font-sans">{sc.name}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{sc.desc}</div>
            </button>
          ))}
        </div>

        {/* Live URL Link Bar */}
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-mono text-xs sm:text-sm">
          <span className="text-[var(--text-muted)] truncate flex-1">{overlayUrl}</span>
          <button
            onClick={handleCopyUrl}
            className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer font-bold shrink-0"
            title="Copy URL"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefreshToken}
            className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            title="Refresh Security Token"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. STREAMER REMOTE OPERATOR CONTROLLER (Mobile / 2nd-Screen Link) */}
      <div className="rounded-2xl border-2 border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#2ea66e] animate-ping" />
                <span className="text-xs font-mono font-bold text-[#2ea66e] uppercase tracking-wider">
                  STREAM OPERATOR REMOTE CONSOLE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display">
                Phone / Tablet Live Match Remote Control Link
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyRemoteUrl}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              Copy Remote Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(remoteUrl, '_blank')}
              leftIcon={<ExternalLink className="h-4 w-4" />}
            >
              Open Remote Deck ↗
            </Button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Open this remote link on your <strong>smartphone, tablet, or 2nd monitor</strong> to instantly change scores, add elimination killpoints (+1, -1), set placement points, and toggle ALIVE / KNOCK / ELIMINATED squad health bars in <strong>0ms real-time sync</strong> on your OBS stream overlay.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-mono text-xs">
          <span className="text-[var(--accent-primary)] font-bold shrink-0">REMOTE LINK:</span>
          <span className="text-[var(--text-secondary)] truncate flex-1">{remoteUrl}</span>
          <button
            onClick={handleCopyRemoteUrl}
            className="px-3 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer font-bold shrink-0 text-[11px]"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Interactive Live Preview of Free Fire Pro Overlay */}
      {overlayType === 'live-squads' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2 font-display">
                <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
                Live Overlay Preview & Interactive Controller
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
                Click any 4-player bar to toggle state (ALIVE → KNOCK → ELIMINATED). Click any row to highlight.
              </p>
            </div>
            <Badge variant="live" size="sm">
              Interactive Test Mode
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-[#0d0a17] border border-[#2b164f] flex justify-center items-center overflow-x-auto">
            <BroadcastFreeFireLiveOverlay
              tournament={currentTournament}
              standings={standings}
              isTransparent={false}
            />
          </div>
        </div>
      )}

      {/* 4-Step Beginner OBS Setup Guide */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-flat)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2 font-display">
            <HelpCircle className="h-5 w-5 text-[var(--accent-primary)]" />
            How to Connect to OBS Studio in 4 Steps
          </h3>
          <Badge variant="live" size="sm">
            4-Step Quickstart
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] space-y-1.5">
            <div className="text-xs font-bold text-[var(--accent-primary)]">STEP 01</div>
            <div className="font-bold text-sm text-[var(--text-primary)] font-sans">Copy Browser Source URL</div>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              Click the button above to copy your stream link.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] space-y-1.5">
            <div className="text-xs font-bold text-[var(--accent-primary)]">STEP 02</div>
            <div className="font-bold text-sm text-[var(--text-primary)] font-sans">Add Browser Source in OBS</div>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              In OBS Sources, add a new <strong>Browser</strong> source.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] space-y-1.5">
            <div className="text-xs font-bold text-[var(--accent-primary)]">STEP 03</div>
            <div className="font-bold text-sm text-[var(--text-primary)] font-sans">Set Canvas Resolution</div>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              Set Width: <strong>1920</strong> and Height: <strong>1080</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] shadow-[var(--shadow-inset)] space-y-1.5">
            <div className="text-xs font-bold text-[var(--accent-primary)]">STEP 04</div>
            <div className="font-bold text-sm text-[var(--text-primary)] font-sans">Go Live Automatically</div>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              Overlays synchronize instantly as matches are recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};