import { z } from 'zod';

export const createTournamentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  organizer: z.string().max(150).optional().default(''),
  organizerLogoUrl: z.string().optional(),
  game: z.string().default('Free Fire'),
  description: z.string().max(2000).optional().default(''),
  tournamentType: z.string().default('Battle Royale'),
  status: z.enum(['Draft', 'Upcoming', 'Live', 'Completed', 'Archived']).default('Upcoming'),
  structure: z.object({
    teamCount: z.number().min(2).max(100).default(12),
    matchCount: z.number().min(1).max(50).default(6),
    roundRobin: z.boolean().optional().default(false),
    groupsCount: z.number().optional().default(1),
    slotsPerMatch: z.number().min(2).max(100).default(12),
  }).optional(),
  scoringPreset: z.any().optional(),
  bannerUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  teams: z.array(z.any()).optional(),
  matches: z.array(z.any()).optional(),
});

export const updateTournamentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  organizer: z.string().max(150).optional(),
  organizerLogoUrl: z.string().optional(),
  game: z.string().optional(),
  description: z.string().max(2000).optional(),
  tournamentType: z.string().optional(),
  status: z.enum(['Draft', 'Upcoming', 'Live', 'Completed', 'Archived']).optional(),
  structure: z.any().optional(),
  scoringPreset: z.any().optional(),
  bannerUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  teams: z.array(z.any()).optional(),
  matches: z.array(z.any()).optional(),
});

export const cloneTournamentSchema = z.object({
  sourceId: z.string().min(1, 'Source tournament ID is required'),
  newTitle: z.string().min(2, 'New title is required').max(200),
  copyTeams: z.boolean().default(true),
  copyPlayers: z.boolean().default(true),
  copyMatches: z.boolean().default(false),
  copyScoring: z.boolean().default(true),
  copySettings: z.boolean().default(true),
  copyBranding: z.boolean().default(true),
});
