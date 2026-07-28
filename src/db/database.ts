/**
 * db/database.ts — Streakly SQLite connection + migration runner + CRUD
 *
 * Uses the expo-sqlite v2 async API (openDatabaseAsync, runAsync, etc.)
 * which ships with expo-sqlite ~57.0.1 (SDK 57).
 *
 * Migration strategy: PRAGMA user_version tracks schema version.
 * Each migration block is idempotent; add new numbered blocks as needed.
 */

import * as SQLite from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';

import {
  SQL_CREATE_CATEGORIES,
  SQL_CREATE_HABITS,
  SQL_CREATE_COMPLETIONS,
  type Habit,
  type Completion,
  type Category,
  type NewHabit,
  type HabitUpdate,
  type HabitStatus,
} from './schema';

// ---------------------------------------------------------------------------
// Singleton DB connection
// ---------------------------------------------------------------------------

let _db: SQLite.SQLiteDatabase | null = null;

/** Returns the open database, initialising it on first call. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('streakly.db');
  await _runMigrations(_db);
  return _db;
}

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

const CURRENT_DB_VERSION = 1;

async function _runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const { user_version: currentVersion } = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version');

  if (currentVersion >= CURRENT_DB_VERSION) {
    console.log(`[DB] Schema up-to-date (version ${currentVersion})`);
    return;
  }

  console.log(
    `[DB] Migrating from version ${currentVersion} → ${CURRENT_DB_VERSION}`
  );

  if (currentVersion < 1) {
    // ── Migration v1: initial schema ─────────────────────────────────────────
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      ${SQL_CREATE_CATEGORIES}
      ${SQL_CREATE_HABITS}
      ${SQL_CREATE_COMPLETIONS}
    `);
  }

  // Add future migrations here:
  // if (currentVersion < 2) { ... }

  await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
  console.log(`[DB] Migration complete → version ${CURRENT_DB_VERSION}`);
}

/** Call this in your root layout _layout.tsx to initialise on app boot. */
export async function initDatabase(): Promise<void> {
  await getDb();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  return randomUUID();
}

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------

export async function seedCategories(
  names: string[] = ['Health', 'Fitness', 'Mind', 'Productivity', 'Learning']
): Promise<Category[]> {
  const db = await getDb();
  const results: Category[] = [];
  for (const name of names) {
    // Upsert — ignore conflict on unique name
    const existing = await db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE name = ?',
      name
    );
    if (existing) {
      results.push(existing);
    } else {
      const id = uuid();
      await db.runAsync(
        'INSERT INTO categories (id, name) VALUES (?, ?)',
        id,
        name
      );
      results.push({ id, name });
    }
  }
  return results;
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name');
}

// ---------------------------------------------------------------------------
// Habit CRUD
// ---------------------------------------------------------------------------

/** Insert a new habit and return the full row. */
export async function createHabit(data: NewHabit): Promise<Habit> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO habits
       (id, name, icon, color, category_id, frequency_type, frequency_value,
        target_count, reminder_times, start_date, status, notes,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.icon,
    data.color,
    data.category_id ?? null,
    data.frequency_type,
    data.frequency_value,
    data.target_count ?? null,
    data.reminder_times,
    data.start_date,
    data.status,
    data.notes ?? null,
    now,
    now
  );

  const row = await db.getFirstAsync<Habit>('SELECT * FROM habits WHERE id = ?', id);
  if (!row) throw new Error(`createHabit: failed to read back row id=${id}`);
  return row;
}

/** Return all habits, optionally filtered by status. */
export async function getHabits(
  filter?: { status?: HabitStatus | HabitStatus[] }
): Promise<Habit[]> {
  const db = await getDb();

  if (!filter?.status) {
    return db.getAllAsync<Habit>('SELECT * FROM habits ORDER BY created_at ASC');
  }

  const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
  const placeholders = statuses.map(() => '?').join(', ');
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits WHERE status IN (${placeholders}) ORDER BY created_at ASC`,
    ...statuses
  );
}

/** Return a single habit by id (or null). */
export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDb();
  return db.getFirstAsync<Habit>('SELECT * FROM habits WHERE id = ?', id);
}

/** Partial update — only touches the supplied fields. */
export async function updateHabit(
  id: string,
  data: HabitUpdate
): Promise<Habit> {
  const db = await getDb();

  // Build dynamic SET clause from supplied keys
  const allowed: (keyof HabitUpdate)[] = [
    'name', 'icon', 'color', 'category_id', 'frequency_type',
    'frequency_value', 'target_count', 'reminder_times', 'start_date',
    'status', 'notes',
  ];

  const setClauses: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [nowIso()];

  for (const key of allowed) {
    if (key in data) {
      setClauses.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key] as string | number | null);
    }
  }

  values.push(id); // for the WHERE clause

  await db.runAsync(
    `UPDATE habits SET ${setClauses.join(', ')} WHERE id = ?`,
    ...values
  );

  const row = await getHabitById(id);
  if (!row) throw new Error(`updateHabit: no habit found with id=${id}`);
  return row;
}

/** Archive a habit (preserves all history). */
export async function archiveHabit(id: string): Promise<Habit> {
  return updateHabit(id, { status: 'archived' });
}

/** Hard-delete a habit and all its completions (CASCADE handles DB side). */
export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM habits WHERE id = ?', id);
}

// ---------------------------------------------------------------------------
// Completion CRUD
// ---------------------------------------------------------------------------

/**
 * Add a completion for a habit on a given date.
 * Silently upserts (replacing note) if the same day is logged twice.
 */
export async function addCompletion(
  habitId: string,
  date: string,
  note?: string
): Promise<Completion> {
  const db = await getDb();
  const id = uuid();
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO completions (id, habit_id, date, note, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(habit_id, date) DO UPDATE SET note = excluded.note`,
    id,
    habitId,
    date,
    note ?? null,
    now
  );

  const row = await db.getFirstAsync<Completion>(
    'SELECT * FROM completions WHERE habit_id = ? AND date = ?',
    habitId,
    date
  );
  if (!row) throw new Error(`addCompletion: failed to read back row`);
  return row;
}

/** Remove a completion by habit + date. No-op if it doesn't exist. */
export async function removeCompletion(
  habitId: string,
  date: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM completions WHERE habit_id = ? AND date = ?',
    habitId,
    date
  );
}

/**
 * Get all completions for a habit, optionally constrained to a date range.
 * @param from  YYYY-MM-DD inclusive start (optional)
 * @param to    YYYY-MM-DD inclusive end   (optional)
 */
export async function getCompletionsForHabit(
  habitId: string,
  from?: string,
  to?: string
): Promise<Completion[]> {
  const db = await getDb();

  if (from && to) {
    return db.getAllAsync<Completion>(
      `SELECT * FROM completions
       WHERE habit_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      habitId,
      from,
      to
    );
  }
  if (from) {
    return db.getAllAsync<Completion>(
      `SELECT * FROM completions WHERE habit_id = ? AND date >= ? ORDER BY date ASC`,
      habitId,
      from
    );
  }
  if (to) {
    return db.getAllAsync<Completion>(
      `SELECT * FROM completions WHERE habit_id = ? AND date <= ? ORDER BY date ASC`,
      habitId,
      to
    );
  }

  return db.getAllAsync<Completion>(
    'SELECT * FROM completions WHERE habit_id = ? ORDER BY date ASC',
    habitId
  );
}

/** Return completions for a specific date across ALL habits. */
export async function getCompletionsForDate(date: string): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>(
    'SELECT * FROM completions WHERE date = ? ORDER BY created_at ASC',
    date
  );
}
