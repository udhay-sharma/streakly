/**
 * store/habitStore.ts — Streakly Zustand state layer
 *
 * Wraps Phase 1 DB functions. Never duplicates DB logic — every mutation
 * goes through the DB first, then mirrors the result into store state.
 *
 * Completions index shape:
 *   completionsByHabit: Record<habitId, Record<date, Completion>>
 *
 * This gives O(1) look-ups for "is habit X done on date Y?" which is
 * the hot path for the Today screen checklist.
 */

import { create } from 'zustand';
import {
  getHabits,
  getCategories,
  seedCategories,
  createHabit,
  updateHabit,
  archiveHabit as dbArchiveHabit,
  deleteHabit,
  addCompletion,
  removeCompletion,
  getCompletionsForHabit,
  getCompletionsForDate,
} from '@/db/database';
import type { Habit, Completion, Category, NewHabit, HabitUpdate } from '@/db/schema';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface CompletionIndex {
  /** completionsByHabit[habitId][date] = Completion row */
  [habitId: string]: {
    [date: string]: Completion;
  };
}

export interface HabitStore {
  // ── Data ──────────────────────────────────────────────────────────────────
  habits: Habit[];
  categories: Category[];
  /**
   * Completions indexed for fast lookup.
   * Populated lazily — call loadCompletionsForDate() or
   * loadCompletionsForHabit() to fill a slice of the index.
   */
  completionsByHabit: CompletionIndex;

  // ── Meta ──────────────────────────────────────────────────────────────────
  loading: boolean;
  error: string | null;

  // ── Selectors (derived, no async) ─────────────────────────────────────────
  /** Returns true if the habit was completed on the given date. */
  isCompleted: (habitId: string, date: string) => boolean;
  /** Returns the Completion object if it exists, or undefined. */
  getCompletion: (habitId: string, date: string) => Completion | undefined;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Load all habits + categories from DB into store. Call on app boot. */
  loadHabits: () => Promise<void>;

  /** Load completions for a single date across all habits (Today screen). */
  loadCompletionsForDate: (date: string) => Promise<void>;

  /** Load all completions for a single habit (Habit detail screen). */
  loadCompletionsForHabit: (habitId: string) => Promise<void>;

  /** Insert a new habit, then refresh the habits list. */
  addHabit: (data: NewHabit) => Promise<Habit>;

  /** Partially update a habit, then refresh in-store. */
  editHabit: (id: string, data: HabitUpdate) => Promise<Habit>;

  /**
   * Archive a habit (status → 'archived').
   * Keeps completions intact; habit stays in store.habits but will
   * be filtered by callers who only want active habits.
   */
  archiveHabit: (id: string) => Promise<void>;

  /**
   * Hard-delete a habit and remove it from the store entirely.
   * Also clears its completion index entries.
   */
  removeHabit: (id: string) => Promise<void>;

  /**
   * Toggle completion for habitId on date:
   *   - If no completion exists → call addCompletion() and index it
   *   - If a completion exists  → call removeCompletion() and remove from index
   * Returns true if the habit is now completed, false if uncompleted.
   */
  toggleCompletion: (habitId: string, date: string, note?: string) => Promise<boolean>;

  /** Clear any error string. */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useHabitStore = create<HabitStore>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  habits: [],
  categories: [],
  completionsByHabit: {},
  loading: false,
  error: null,

  // ── Selectors ─────────────────────────────────────────────────────────────
  isCompleted: (habitId, date) => {
    return !!get().completionsByHabit[habitId]?.[date];
  },

  getCompletion: (habitId, date) => {
    return get().completionsByHabit[habitId]?.[date];
  },

  // ── loadHabits ────────────────────────────────────────────────────────────
  loadHabits: async () => {
    set({ loading: true, error: null });
    try {
      // Ensure default categories exist on first run
      await seedCategories();
      const [habits, categories] = await Promise.all([
        getHabits(),
        getCategories(),
      ]);
      set({ habits, categories, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
      throw e;
    }
  },

  // ── loadCompletionsForDate ────────────────────────────────────────────────
  loadCompletionsForDate: async (date) => {
    try {
      const completions = await getCompletionsForDate(date);
      set((state) => {
        const next = { ...state.completionsByHabit };
        for (const c of completions) {
          if (!next[c.habit_id]) next[c.habit_id] = {};
          next[c.habit_id] = { ...next[c.habit_id], [c.date]: c };
        }
        return { completionsByHabit: next };
      });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  // ── loadCompletionsForHabit ───────────────────────────────────────────────
  loadCompletionsForHabit: async (habitId) => {
    try {
      const completions = await getCompletionsForHabit(habitId);
      set((state) => {
        const byDate: Record<string, Completion> = {};
        for (const c of completions) {
          byDate[c.date] = c;
        }
        return {
          completionsByHabit: {
            ...state.completionsByHabit,
            [habitId]: byDate,
          },
        };
      });
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  // ── addHabit ──────────────────────────────────────────────────────────────
  addHabit: async (data) => {
    set({ loading: true, error: null });
    try {
      const habit = await createHabit(data);
      set((state) => ({
        habits: [...state.habits, habit],
        loading: false,
      }));
      return habit;
    } catch (e) {
      set({ loading: false, error: String(e) });
      throw e;
    }
  },

  // ── editHabit ─────────────────────────────────────────────────────────────
  editHabit: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateHabit(id, data);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updated : h)),
        loading: false,
      }));
      return updated;
    } catch (e) {
      set({ loading: false, error: String(e) });
      throw e;
    }
  },

  // ── archiveHabit ──────────────────────────────────────────────────────────
  archiveHabit: async (id) => {
    set({ loading: true, error: null });
    try {
      const archived = await dbArchiveHabit(id);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? archived : h)),
        loading: false,
      }));
    } catch (e) {
      set({ loading: false, error: String(e) });
      throw e;
    }
  },

  // ── removeHabit ───────────────────────────────────────────────────────────
  removeHabit: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteHabit(id);
      set((state) => {
        const next = { ...state.completionsByHabit };
        delete next[id];
        return {
          habits: state.habits.filter((h) => h.id !== id),
          completionsByHabit: next,
          loading: false,
        };
      });
    } catch (e) {
      set({ loading: false, error: String(e) });
      throw e;
    }
  },

  // ── toggleCompletion ──────────────────────────────────────────────────────
  toggleCompletion: async (habitId, date, note) => {
    try {
      const existing = get().completionsByHabit[habitId]?.[date];

      if (existing) {
        // Already completed → remove it
        await removeCompletion(habitId, date);
        set((state) => {
          const byDate = { ...(state.completionsByHabit[habitId] ?? {}) };
          delete byDate[date];
          return {
            completionsByHabit: {
              ...state.completionsByHabit,
              [habitId]: byDate,
            },
          };
        });
        return false; // now un-completed
      } else {
        // Not completed → add it
        const completion = await addCompletion(habitId, date, note);
        set((state) => ({
          completionsByHabit: {
            ...state.completionsByHabit,
            [habitId]: {
              ...(state.completionsByHabit[habitId] ?? {}),
              [date]: completion,
            },
          },
        }));
        return true; // now completed
      }
    } catch (e) {
      set({ error: String(e) });
      throw e;
    }
  },

  // ── clearError ────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));
