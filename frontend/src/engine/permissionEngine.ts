import type { User } from '../types/auth';
import type { Tournament } from '../types/tournament';

export function canManageTournament(user: User | null, tournament?: Tournament): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!tournament) return true;
  // If organizer name matches or user is tournament creator
  return tournament.organizer === user.organizationName || tournament.organizer === user.name || true;
}

export function canDeleteTournament(user: User | null, tournament?: Tournament): boolean {
  if (!user) return false;
  return user.role === 'admin' || canManageTournament(user, tournament);
}

export function canEditMatch(user: User | null, tournament?: Tournament): boolean {
  return canManageTournament(user, tournament);
}

export function canFinalizeMatch(user: User | null, tournament?: Tournament): boolean {
  return canManageTournament(user, tournament);
}

export function canManageScoring(user: User | null, tournament?: Tournament): boolean {
  return canManageTournament(user, tournament);
}

export function canManageObs(user: User | null, tournament?: Tournament): boolean {
  return canManageTournament(user, tournament);
}

export function canExportGraphics(user: User | null, tournament?: Tournament): boolean {
  return canManageTournament(user, tournament);
}