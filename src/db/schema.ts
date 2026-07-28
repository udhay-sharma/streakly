/**
 * db/schema.ts — Streakly database schema
 *
 * Three tables:
 *   categories   — id, name
 *   habits       — full habit definition
 *   completions  — per-day check-off records
 *
 * All IDs are UUIDs stored as TEXT.
 * Dates are ISO-8601 strings (YYYY-MM-DD or full ISO for timestamps).
 * Arrays / complex objects are stored as JSON TEXT blobs.
 */

// ---------------------------------------------------------------------------
// TypeScript row types
// ---------------------------------------------------------------------------

export type HabitStatus = 'active' | 'paused' | 'archived';

/**
 * frequency_type controls how frequency_value is interpreted:
 *   'daily'        → every day, frequency_value ignored (store null / '{}')
 *   'weekdays'     → frequency_value = JSON array of 0-indexed day numbers [0=Sun … 6=Sat]
 *   'x_per_week'   → frequency_value = JSON { count: number }
 *   'x_per_month'  → frequency_value = JSON { count: number }
 */
export type FrequencyType = 'daily' | 'weekdays' | 'x_per_week' | 'x_per_month';

export interface Habit {
  id: string;
  name: string;
  icon: string;                  // emoji or icon key, e.g. "💧" or "water"
  color: string;                 // hex color string, e.g. "#A9764A"
  category_id: string | null;
  frequency_type: FrequencyType;
  frequency_value: string;       // JSON blob — see FrequencyType docs above
  target_count: number | null;   // optional numeric target (e.g. 8 glasses)
  reminder_times: string;        // JSON array of "HH:MM" strings, e.g. '["07:00","20:00"]'
  start_date: string;            // YYYY-MM-DD
  status: HabitStatus;
  notes: string | null;
  created_at: string;            // ISO-8601 datetime
  updated_at: string;            // ISO-8601 datetime
}

export interface Completion {
  id: string;
  habit_id: string;
  date: string;                  // YYYY-MM-DD
  note: string | null;
  created_at: string;            // ISO-8601 datetime
}

export interface Category {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Helper types for insert / update operations
// ---------------------------------------------------------------------------

export type NewHabit = Omit<Habit, 'id' | 'created_at' | 'updated_at'>;
export type HabitUpdate = Partial<Omit<Habit, 'id' | 'created_at'>>;
export type NewCompletion = Omit<Completion, 'id' | 'created_at'>;

// ---------------------------------------------------------------------------
// SQL DDL strings  (consumed by the migration runner in database.ts)
// ---------------------------------------------------------------------------

export const SQL_CREATE_CATEGORIES = `
CREATE TABLE IF NOT EXISTS categories (
  id   TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE
);
`.trim();

export const SQL_CREATE_HABITS = `
CREATE TABLE IF NOT EXISTS habits (
  id               TEXT PRIMARY KEY NOT NULL,
  name             TEXT NOT NULL,
  icon             TEXT NOT NULL DEFAULT '✅',
  color            TEXT NOT NULL DEFAULT '#A9764A',
  category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
  frequency_type   TEXT NOT NULL DEFAULT 'daily',
  frequency_value  TEXT NOT NULL DEFAULT '{}',
  target_count     INTEGER,
  reminder_times   TEXT NOT NULL DEFAULT '[]',
  start_date       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active','paused','archived')),
  notes            TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
`.trim();

export const SQL_CREATE_COMPLETIONS = `
CREATE TABLE IF NOT EXISTS completions (
  id         TEXT PRIMARY KEY NOT NULL,
  habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(habit_id, date)
);
`.trim();
