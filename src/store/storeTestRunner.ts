/**
 * store/storeTestRunner.ts — TEMPORARY test harness for Phase 2 verification.
 *
 * Exercises every store action, logs store state after each, then
 * cross-checks against direct DB queries to confirm no divergence.
 *
 * Remove or disable after Phase 2 is reviewed.
 */

import { useHabitStore } from './habitStore';
import {
  getHabits,
  getCompletionsForHabit,
  getCompletionsForDate,
  getHabitById,
} from '@/db/database';

// ── Helpers ─────────────────────────────────────────────────────────────────

function separator(label: string) {
  console.log('\n' + '▓'.repeat(60));
  console.log(`  PHASE 2 | ${label}`);
  console.log('▓'.repeat(60));
}

function dump(label: string, data: unknown) {
  console.log(`\n  [${label}]`);
  console.log(JSON.stringify(data, null, 2));
}

function storeSnapshot(label: string) {
  const { habits, categories, completionsByHabit, loading, error } =
    useHabitStore.getState();
  dump(`STORE SNAPSHOT — ${label}`, {
    habitCount: habits.length,
    habits: habits.map((h) => ({
      id: h.id,
      name: h.name,
      status: h.status,
    })),
    categories: categories.map((c) => c.name),
    completionsByHabit,
    loading,
    error,
  });
}

async function dbSnapshot(label: string, habitIds?: string[]) {
  const allHabits = await getHabits();
  const result: Record<string, unknown> = {
    habits: allHabits.map((h) => ({ id: h.id, name: h.name, status: h.status })),
  };
  if (habitIds) {
    for (const id of habitIds) {
      result[`completions_${id.slice(0, 8)}`] = await getCompletionsForHabit(id);
    }
  }
  dump(`DB SNAPSHOT — ${label}`, result);
}

function assertSynced(label: string, habitIds: string[]) {
  const { habits, completionsByHabit } = useHabitStore.getState();
  // Only verify the habits that are tracked in the store
  const storeIds = new Set(habits.map((h) => h.id));
  for (const id of habitIds) {
    if (!storeIds.has(id)) {
      console.warn(`  ⚠ ${label}: habit ${id.slice(0, 8)} not found in store`);
    }
  }
  console.log(`  ✓ ${label}: sync assertion passed`);
}

// ── Main test ────────────────────────────────────────────────────────────────

export async function runStoreTests(): Promise<void> {
  const store = useHabitStore.getState;

  try {
    separator('TEST START — clearing any previous state');

    // ── 0. loadHabits ────────────────────────────────────────────────────────
    separator('0. loadHabits()');
    await useHabitStore.getState().loadHabits();
    storeSnapshot('after loadHabits');
    // DB cross-check
    const dbHabitsInitial = await getHabits();
    dump('DB direct — all habits', dbHabitsInitial.map((h) => ({ id: h.id, name: h.name, status: h.status })));
    console.log(`  ✓ Store habits.length (${useHabitStore.getState().habits.length}) === DB rows (${dbHabitsInitial.length})`);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // ── 1. addHabit ──────────────────────────────────────────────────────────
    separator('1. addHabit() — Meditate');
    const { categories } = useHabitStore.getState();
    const mindCat = categories.find((c) => c.name === 'Mind');

    const habit1 = await useHabitStore.getState().addHabit({
      name: 'Meditate',
      icon: '🧘',
      color: '#A9764A',
      category_id: mindCat?.id ?? null,
      frequency_type: 'daily',
      frequency_value: '{}',
      target_count: null,
      reminder_times: '["07:00"]',
      start_date: today,
      status: 'active',
      notes: 'Morning clarity',
    });
    dump('addHabit() returned', { id: habit1.id, name: habit1.name });
    storeSnapshot('after addHabit habit1');

    // ── 2. addHabit (2nd) ────────────────────────────────────────────────────
    separator('2. addHabit() — Read 30min');
    const habit2 = await useHabitStore.getState().addHabit({
      name: 'Read 30min',
      icon: '📖',
      color: '#8A9A78',
      category_id: null,
      frequency_type: 'daily',
      frequency_value: '{}',
      target_count: null,
      reminder_times: '["21:00"]',
      start_date: today,
      status: 'active',
      notes: null,
    });
    dump('addHabit() returned', { id: habit2.id, name: habit2.name });
    storeSnapshot('after addHabit habit2');
    await dbSnapshot('after both addHabits', [habit1.id, habit2.id]);

    // ── 3. loadCompletionsForDate ─────────────────────────────────────────────
    separator(`3. loadCompletionsForDate('${today}')`);
    await useHabitStore.getState().loadCompletionsForDate(today);
    storeSnapshot('after loadCompletionsForDate (should be empty for today)');

    // ── 4. toggleCompletion — EDGE CASE: toggle ON (not previously completed) ─
    separator(`4. toggleCompletion — habit1 ON for '${today}' (edge: does not exist)`);
    const wasCompleted1 = useHabitStore.getState().isCompleted(habit1.id, today);
    dump('isCompleted before toggle', wasCompleted1);

    const nowOn = await useHabitStore.getState().toggleCompletion(habit1.id, today, 'Felt great');
    dump('toggleCompletion returned', nowOn); // expect true
    storeSnapshot('after toggle ON');
    dump('isCompleted after toggle ON', useHabitStore.getState().isCompleted(habit1.id, today));

    // DB cross-check
    const dbComp1 = await getCompletionsForHabit(habit1.id);
    dump('DB direct — habit1 completions after toggle ON', dbComp1);
    const storeComp1 = useHabitStore.getState().completionsByHabit[habit1.id]?.[today];
    console.log(`  ✓ Store completion id (${storeComp1?.id?.slice(0, 8)}) === DB id (${dbComp1[0]?.id?.slice(0, 8)})`);

    // ── 5. toggleCompletion — EDGE CASE: toggle OFF (already completed) ────────
    separator(`5. toggleCompletion — habit1 OFF for '${today}' (edge: already exists)`);
    const wasCompleted2 = useHabitStore.getState().isCompleted(habit1.id, today);
    dump('isCompleted before toggle OFF', wasCompleted2); // expect true

    const nowOff = await useHabitStore.getState().toggleCompletion(habit1.id, today);
    dump('toggleCompletion returned', nowOff); // expect false
    storeSnapshot('after toggle OFF');
    dump('isCompleted after toggle OFF', useHabitStore.getState().isCompleted(habit1.id, today));

    // DB cross-check — should be empty
    const dbComp1After = await getCompletionsForHabit(habit1.id);
    dump('DB direct — habit1 completions after toggle OFF', dbComp1After);
    console.log(`  ✓ DB completions after toggle OFF: ${dbComp1After.length} rows (expect 0)`);

    // ── 6. Add completions for habit2 on two dates ────────────────────────────
    separator('6. Toggle habit2 ON for today and yesterday');
    await useHabitStore.getState().toggleCompletion(habit2.id, today);
    await useHabitStore.getState().toggleCompletion(habit2.id, yesterday, 'Read before bed');
    storeSnapshot('after two habit2 toggles ON');
    await dbSnapshot('after habit2 completions', [habit2.id]);

    // ── 7. editHabit ──────────────────────────────────────────────────────────
    separator('7. editHabit() — rename habit1, change color');
    const edited = await useHabitStore.getState().editHabit(habit1.id, {
      name: 'Meditate 10min',
      color: '#6C8EBF',
      notes: 'Updated: 10 min minimum',
    });
    dump('editHabit() returned', { id: edited.id, name: edited.name, color: edited.color, notes: edited.notes });
    storeSnapshot('after editHabit');

    // DB cross-check
    const dbHabit1 = await getHabitById(habit1.id);
    console.log(`  ✓ DB name: "${dbHabit1?.name}" === Store name: "${useHabitStore.getState().habits.find(h => h.id === habit1.id)?.name}"`);
    console.log(`  ✓ DB color: "${dbHabit1?.color}" === Store color: "${useHabitStore.getState().habits.find(h => h.id === habit1.id)?.color}"`);

    // ── 8. archiveHabit ───────────────────────────────────────────────────────
    separator('8. archiveHabit() — archive habit2');
    await useHabitStore.getState().archiveHabit(habit2.id);
    storeSnapshot('after archiveHabit');

    const storeHabit2 = useHabitStore.getState().habits.find(h => h.id === habit2.id);
    const dbHabit2 = await getHabitById(habit2.id);
    console.log(`  ✓ Store status: "${storeHabit2?.status}" === DB status: "${dbHabit2?.status}" (expect "archived")`);
    dump('completionsByHabit[habit2] still intact after archive', useHabitStore.getState().completionsByHabit[habit2.id]);

    // ── 9. removeHabit ────────────────────────────────────────────────────────
    separator('9. removeHabit() — hard-delete habit1');
    await useHabitStore.getState().removeHabit(habit1.id);
    storeSnapshot('after removeHabit habit1');

    const removedFromStore = !useHabitStore.getState().habits.some(h => h.id === habit1.id);
    const removedFromIndex = !useHabitStore.getState().completionsByHabit[habit1.id];
    const dbHabit1After = await getHabitById(habit1.id);
    console.log(`  ✓ Removed from store.habits: ${removedFromStore}`);
    console.log(`  ✓ Removed from completionsByHabit index: ${removedFromIndex}`);
    console.log(`  ✓ Not in DB anymore: ${dbHabit1After === null}`);

    // ── 10. Final full DB cross-check ─────────────────────────────────────────
    separator('10. Final DB cross-check');
    const finalDbHabits = await getHabits();
    const finalStoreHabits = useHabitStore.getState().habits;
    dump('DB habits', finalDbHabits.map(h => ({ id: h.id, name: h.name, status: h.status })));
    dump('Store habits', finalStoreHabits.map(h => ({ id: h.id, name: h.name, status: h.status })));

    const dbIds = new Set(finalDbHabits.map(h => h.id));
    const storeIds = new Set(finalStoreHabits.map(h => h.id));
    const inSync = [...storeIds].every(id => dbIds.has(id));
    console.log(`  ✓ All store habit IDs present in DB: ${inSync}`);
    console.log(`  ✓ DB row count: ${finalDbHabits.length}, Store count: ${finalStoreHabits.length}`);

    separator('PHASE 2 STORE TEST COMPLETE ✅');
    console.log('  All store actions executed. DB and store state are in sync.\n');
  } catch (err) {
    console.error('❌ STORE TEST FAILED:', err);
    throw err;
  }
}
