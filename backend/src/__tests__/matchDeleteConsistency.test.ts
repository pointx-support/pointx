import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import {
  deleteMatchFromTournament,
  createTournament,
} from '../services/tournamentService';
import {
  registerServerDeletedMatch,
  isServerMatchDeleted,
  getOrCreateAuthoritativeState,
  updateAuthoritativeState,
} from '../services/realtimeSync';

let mongoServer: MongoMemoryServer;
let testUser: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  testUser = await User.create({
    name: 'Tournament Admin',
    email: 'admin@pointx.gg',
    passwordHash: 'hashed_password_sample_123',
    role: 'admin',
    isOnboarded: true,
  });
});

describe('Match Deletion Consistency & Anti-Resurrection Test Suite', () => {
  it('should permanently delete match from MongoDB and record tombstone', async () => {
    const tour = await createTournament(testUser._id.toString(), {
      title: 'Championship 2026',
      game: 'Free Fire',
      matches: [
        { id: 'match-1', matchNumber: 1, status: 'Completed', results: [] },
        { id: 'match-2', matchNumber: 2, status: 'Live', results: [] },
      ],
      teams: [{ id: 'team-1', name: 'Team One' }],
    });

    const tourId = tour.customId;
    expect(tour.matches.length).toBe(2);

    // Delete match-2
    const updated = await deleteMatchFromTournament(tourId, 'match-2', testUser._id.toString(), 'admin');
    expect(updated).not.toBeNull();
    expect(updated!.matches.length).toBe(1);
    expect(updated!.matches[0].id).toBe('match-1');

    // Verify tombstone is recorded
    expect(isServerMatchDeleted('match-2')).toBe(true);

    // Verify database document directly
    const dbDoc = await Tournament.findOne({ customId: tourId }).lean();
    expect(dbDoc!.matches.length).toBe(1);
    expect(dbDoc!.matches[0].id).toBe('match-1');
  });

  it('should reject resurrection when a stale client attempts to send an update with the deleted match', async () => {
    const tour = await createTournament(testUser._id.toString(), {
      title: 'Scrims Night',
      game: 'Free Fire',
      matches: [
        { id: 'match-alpha', matchNumber: 1, status: 'Completed', results: [] },
        { id: 'match-beta', matchNumber: 2, status: 'Live', results: [] },
      ],
      teams: [],
    });

    const tourId = tour.customId;

    // Delete match-beta
    await deleteMatchFromTournament(tourId, 'match-beta', testUser._id.toString(), 'admin');
    expect(isServerMatchDeleted('match-beta')).toBe(true);

    // Simulate stale client sending an update containing both match-alpha and match-beta
    const staleTournament = {
      id: tourId,
      title: 'Scrims Night',
      matches: [
        { id: 'match-alpha', matchNumber: 1, status: 'Completed', results: [] },
        { id: 'match-beta', matchNumber: 2, status: 'Live', results: [] }, // Stale!
      ],
    };

    const stateAfterUpdate = await updateAuthoritativeState(tourId, {
      tournament: staleTournament,
    });

    // Authoritative state must strip the tombstoned match-beta
    expect(stateAfterUpdate.tournament.matches.length).toBe(1);
    expect(stateAfterUpdate.tournament.matches[0].id).toBe('match-alpha');

    // Retrieve state again to simulate periodic sync ticks
    const polledState = await getOrCreateAuthoritativeState(tourId);
    expect(polledState.tournament.matches.length).toBe(1);
    expect(polledState.tournament.matches.find((m: any) => m.id === 'match-beta')).toBeUndefined();
  });
});
