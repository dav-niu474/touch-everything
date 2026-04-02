// ─── Command State Store ─────────────────────────────────────────────────────
// Zustand store for managing slash-command-related persistent state.
// Persists to localStorage so settings survive page reloads.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { availableModels, type ThemeOption, availableThemes } from '@/lib/commands';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EffortLevel = 'low' | 'medium' | 'high';

interface CommandStore {
  // ── State ──────────────────────────────────────────────────────────────
  planMode: boolean;
  fastMode: boolean;
  effort: EffortLevel;
  currentModel: string;
  sessionName: string | null;
  theme: ThemeOption;
  sessionStartTime: number; // Unix ms timestamp

  // ── Actions ────────────────────────────────────────────────────────────
  togglePlanMode: () => void;
  toggleFastMode: () => void;
  setEffort: (level: EffortLevel) => void;
  setModel: (model: string) => void;
  cycleModel: () => void;
  setSessionName: (name: string) => void;
  setTheme: (theme: ThemeOption) => void;
  cycleTheme: () => void;
  resetToDefaults: () => void;

  // ── Persistence ────────────────────────────────────────────────────────
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'claude-code-command-store';

interface PersistedState {
  planMode: boolean;
  fastMode: boolean;
  effort: EffortLevel;
  currentModel: string;
  sessionName: string | null;
  theme: ThemeOption;
  sessionStartTime: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDefaults(): Omit<
  PersistedState,
  'sessionStartTime'
> & { sessionStartTime: number } {
  return {
    planMode: false,
    fastMode: false,
    effort: 'medium' as EffortLevel,
    currentModel: availableModels[0],
    sessionName: null,
    theme: 'dark' as ThemeOption,
    sessionStartTime: Date.now(),
  };
}

function readFromLocalStorage(): Partial<PersistedState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

function writeToLocalStorage(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or unavailable — silently ignore
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCommandStore = create<CommandStore>((set, get) => ({
  ...getDefaults(),

  // ── Actions ────────────────────────────────────────────────────────────

  togglePlanMode: () => {
    set((s) => ({ planMode: !s.planMode }));
    get().saveToStorage();
  },

  toggleFastMode: () => {
    set((s) => ({ fastMode: !s.fastMode }));
    get().saveToStorage();
  },

  setEffort: (level: EffortLevel) => {
    set({ effort: level });
    get().saveToStorage();
  },

  setModel: (model: string) => {
    set({ currentModel: model });
    get().saveToStorage();
  },

  cycleModel: () => {
    const models = [...availableModels];
    const current = get().currentModel;
    const idx = models.indexOf(current);
    const next = models[(idx + 1) % models.length];
    set({ currentModel: next });
    get().saveToStorage();
  },

  setSessionName: (name: string) => {
    set({ sessionName: name });
    get().saveToStorage();
  },

  setTheme: (theme: ThemeOption) => {
    set({ theme });
    get().saveToStorage();
  },

  cycleTheme: () => {
    const themes: ThemeOption[] = [...availableThemes];
    const current = get().theme;
    const idx = themes.indexOf(current);
    const next = themes[(idx + 1) % themes.length];
    set({ theme: next });
    get().saveToStorage();
  },

  resetToDefaults: () => {
    set(getDefaults());
    get().saveToStorage();
  },

  // ── Persistence ────────────────────────────────────────────────────────

  loadFromStorage: () => {
    const saved = readFromLocalStorage();
    if (Object.keys(saved).length > 0) {
      set({
        planMode: saved.planMode ?? false,
        fastMode: saved.fastMode ?? false,
        effort: saved.effort ?? 'medium',
        currentModel: saved.currentModel ?? availableModels[0],
        sessionName: saved.sessionName ?? null,
        theme: saved.theme ?? 'dark',
        sessionStartTime: saved.sessionStartTime ?? Date.now(),
      });
    }
  },

  saveToStorage: () => {
    const s = get();
    writeToLocalStorage({
      planMode: s.planMode,
      fastMode: s.fastMode,
      effort: s.effort,
      currentModel: s.currentModel,
      sessionName: s.sessionName,
      theme: s.theme,
      sessionStartTime: s.sessionStartTime,
    });
  },
}));
