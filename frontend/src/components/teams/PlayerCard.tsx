import React from 'react';
import type { Player } from '../../types/tournament';
import { Crosshair, Shield, Eye, User } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface PlayerCardProps {
  player: Player;
  kills?: number;
  teamTag?: string;
  variant?: 'compact' | 'detailed';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  kills = 0,
  teamTag,
  variant = 'compact'
}) => {
  const getRoleIcon = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'rusher':
        return <Crosshair className="h-3 w-3 text-[var(--status-danger)]" />;
      case 'sniper':
        return <Crosshair className="h-3 w-3 text-[var(--accent-primary)]" />;
      case 'igl':
        return <Shield className="h-3 w-3 text-[var(--accent-gold)]" />;
      case 'support':
        return <Eye className="h-3 w-3 text-[var(--status-live)]" />;
      default:
        return <User className="h-3 w-3 text-[var(--text-secondary)]" />;
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] text-xs font-sans">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] font-black text-[10px] text-[var(--accent-primary)] font-numbers border border-[var(--border-subtle)]">
            {player.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[var(--text-primary)] truncate block">{player.name}</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-mono block">
              IGN: {player.inGameId || 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono shrink-0">
          {player.role && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] flex items-center gap-1 font-sans font-semibold">
              {getRoleIcon(player.role)}
              {player.role}
            </span>
          )}
          {kills > 0 && (
            <Badge variant="coral" size="sm">
              {kills} Kills
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-flat)] hover:shadow-[var(--shadow-raised)] space-y-3 font-sans transition-all">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-surface-inset)] border border-[var(--border-subtle)] font-black text-sm text-[var(--accent-primary)] shadow-inner font-numbers">
          {player.name.slice(0, 2).toUpperCase()}
        </div>
        {teamTag && <Badge variant="cyan" size="sm">[{teamTag}]</Badge>}
      </div>

      <div>
        <h4 className="font-bold text-sm text-[var(--text-primary)] font-display">{player.name}</h4>
        <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 font-semibold">UID: {player.inGameId || '—'}</div>
      </div>

      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
        <span className="text-[var(--text-secondary)] flex items-center gap-1 font-sans font-semibold">
          {getRoleIcon(player.role)} {player.role || 'Player'}
        </span>
        <span className="font-bold text-[var(--status-danger)] font-numbers">{kills} Total Frags</span>
      </div>
    </div>
  );
};
