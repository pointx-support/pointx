import { z } from 'zod';

export const globalPlayerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Player name is required').max(100),
  inGameId: z.string().min(1, 'In-game ID is required').max(50),
  uid: z.string().max(50).optional().default(''),
  isCaptain: z.boolean().optional().default(false),
  role: z.string().max(50).optional().default('Player'),
});

export const createGlobalTeamSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Team name is required').max(100),
  tag: z.string().min(1, 'Team tag is required').max(10),
  logoUrl: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  captainName: z.string().max(100).optional().default(''),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().default(''),
  players: z.array(globalPlayerSchema).optional().default([]),
});

export const updateGlobalTeamSchema = createGlobalTeamSchema.partial();
