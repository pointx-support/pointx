import { create } from 'zustand';
import type { GeneratedGraphicRecord } from '../types/export';

interface GraphicsHistoryState {
  history: GeneratedGraphicRecord[];
  saveGraphic: (record: GeneratedGraphicRecord) => void;
  deleteGraphic: (id: string) => void;
  clearTournamentHistory: (tournamentId: string) => void;
  getTournamentGraphics: (tournamentId: string) => GeneratedGraphicRecord[];
}

const STORAGE_KEY = 'strikz_graphics_history_v1';

function loadInitialHistory(): GeneratedGraphicRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load graphics history', e);
    return [];
  }
}

function persistHistory(history: GeneratedGraphicRecord[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30))); // Keep latest 30 records
    } catch (e) {
      console.warn('Failed to save graphics history', e);
    }
  }
}

export const useGraphicsHistoryStore = create<GraphicsHistoryState>((set, get) => ({
  history: loadInitialHistory(),

  saveGraphic: (record) => {
    set((state) => {
      // Avoid duplicate consecutive entries for same template & page
      const filtered = state.history.filter((h) => h.id !== record.id);
      const updated = [record, ...filtered].slice(0, 30);
      persistHistory(updated);
      return { history: updated };
    });
  },

  deleteGraphic: (id) => {
    set((state) => {
      const updated = state.history.filter((h) => h.id !== id);
      persistHistory(updated);
      return { history: updated };
    });
  },

  clearTournamentHistory: (tournamentId) => {
    set((state) => {
      const updated = state.history.filter((h) => h.tournamentId !== tournamentId);
      persistHistory(updated);
      return { history: updated };
    });
  },

  getTournamentGraphics: (tournamentId) => {
    return get().history.filter((h) => h.tournamentId === tournamentId);
  }
}));