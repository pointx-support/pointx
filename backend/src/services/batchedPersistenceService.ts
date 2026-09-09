import { Tournament } from '../models/Tournament';
import { BroadcastSession } from '../models/BroadcastSession';
import type { CanonicalLiveMatchState } from './liveStateStore';

interface PendingPersistence {
  state: CanonicalLiveMatchState;
  scoringPreset?: any;
  timer: NodeJS.Timeout;
}

const pendingBatches = new Map<string, PendingPersistence>();
const BATCH_DEBOUNCE_MS = 3000; // 3-second rapid kill activity window

function getBatchKey(orgId: string, tourId: string, matchId: string): string {
  return `${orgId}:${tourId}:${matchId}`;
}

/**
 * Persist match state to MongoDB
 */
async function executeMongoPersistence(state: CanonicalLiveMatchState, _scoringPreset?: any): Promise<void> {
  const targetDbId = state.tournamentId;
  if (!targetDbId || targetDbId === 'default' || targetDbId === 'tour-default-live') {
    return;
  }

  try {
    const idQueries: any[] = [{ customId: targetDbId }];
    if (targetDbId.match(/^[0-9a-fA-F]{24}$/)) {
      idQueries.push({ _id: targetDbId });
    }

    const tour = await Tournament.findOne({ $or: idQueries });
    if (!tour) return;

    if (!Array.isArray(tour.matches)) tour.matches = [];
    let match = tour.matches.find((m: any) => (m.id || m.customId) === state.matchId);

    if (!match) {
      match = {
        id: state.matchId,
        customId: state.matchId,
        tournamentId: state.tournamentId,
        matchNumber: state.matchNumber || 1,
        mapName: 'Bermuda',
        status: state.isMatchFinished ? 'Completed' : 'Live',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        results: [],
      };
      tour.matches.push(match);
    }

    if (!Array.isArray(match.results)) match.results = [];

    // Map live state teams into match.results
    for (const [teamId, liveTeam] of Object.entries(state.teams)) {
      const existingIdx = match.results.findIndex((r: any) => r.teamId === teamId);
      const resData = {
        teamId,
        kills: liveTeam.kills,
        placement: liveTeam.placement,
        placementPoints: liveTeam.placementPoints,
        killPoints: liveTeam.killPoints,
        totalPoints: liveTeam.points,
        isBooyah: liveTeam.isBooyah,
        bonusPoints: liveTeam.bonusPoints || 0,
        penaltyPoints: liveTeam.penaltyPoints || 0,
      };

      if (existingIdx >= 0) {
        match.results[existingIdx] = { ...match.results[existingIdx], ...resData };
      } else {
        match.results.push(resData);
      }
    }

    if (state.isMatchFinished) {
      match.status = 'Completed';
    }

    await Tournament.updateOne(
      { $or: idQueries },
      {
        $set: {
          matches: tour.matches,
          status: 'Live',
        },
      }
    );

    // Also update BroadcastSession
    await BroadcastSession.findOneAndUpdate(
      { tournamentId: state.tournamentId, matchId: state.matchId },
      {
        $set: {
          organizationId: state.organizationId,
          tableVisible: state.tableVisible,
          pointRushEnabled: Object.values(state.teams).some((t) => t.pointRushEnabled),
          fireTeamIds: state.fireTeamId ? [state.fireTeamId] : [],
          revision: state.revision,
          isMatchFinished: state.isMatchFinished,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`[BatchedPersistence] Failed to persist match ${state.matchId}:`, err);
  }
}

/**
 * Enqueue batched persistence with 3-second debounce window.
 * Rapid clicks reset the timer, saving database operations.
 */
export function enqueueBatchedPersistence(state: CanonicalLiveMatchState, scoringPreset?: any): void {
  const key = getBatchKey(state.organizationId, state.tournamentId, state.matchId);
  const existing = pendingBatches.get(key);

  if (existing) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(async () => {
    pendingBatches.delete(key);
    await executeMongoPersistence(state, scoringPreset);
  }, BATCH_DEBOUNCE_MS);

  pendingBatches.set(key, { state, scoringPreset, timer });
}

/**
 * Immediate persistence for critical lifecycle events (finalize match, push report, next match).
 * Cancels any pending debounce timer and writes to MongoDB immediately.
 */
export async function flushPersistenceImmediately(orgId: string, tourId: string, matchId: string): Promise<void> {
  const key = getBatchKey(orgId, tourId, matchId);
  const pending = pendingBatches.get(key);

  if (pending) {
    clearTimeout(pending.timer);
    pendingBatches.delete(key);
    await executeMongoPersistence(pending.state, pending.scoringPreset);
  }
}
