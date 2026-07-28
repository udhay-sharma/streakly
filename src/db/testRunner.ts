/**
 * db/testRunner.ts — TEMPORARY test harness for Phase 1 verification.
 *
 * Call runDbTests() once from a screen to exercise all CRUD functions and
 * log the database state to the Metro console.
 *
 * Remove or disable this file after Phase 1 is verified.
 */

import {
  seedCategories,
  getCategories,
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  archiveHabit,
  deleteHabit,
  addCompletion,
  removeCompletion,
  getCompletionsForHabit,
} from './database';

function separator(label: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${label}`);
  console.log('═'.repeat(60));
}

function dump(label: string, data: unknown) {
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(data, null, 2));
}

export async function runDbTests(): Promise<void> {
  try {
    separator('PHASE 1 DB TEST START');

    // ── 0. Seed categories ───────────────────────────────────────────────────
    separator('0. Seed categories');
    const categories = await seedCategories();
    dump('categories after seed', categories);

    // Pick Health and Fitness for our test habits
    const allCats = await getCategories();
    const healthCat = allCats.find((c) => c.name === 'Health');
    const fitnessCat = allCats.find((c) => c.name === 'Fitness');

    // ── 1. Create 2 habits ───────────────────────────────────────────────────
    separator('1. Create Habit 1 — Drink Water');
    const habit1 = await createHabit({
      name: 'Drink Water',
      icon: '💧',
      color: '#6C8EBF',
      category_id: healthCat?.id ?? null,
      frequency_type: 'daily',
      frequency_value: '{}',
      target_count: 8,
      reminder_times: '["08:00","13:00","20:00"]',
      start_date: '2026-07-01',
      status: 'active',
      notes: 'Stay hydrated throughout the day',
    });
    dump('habit1 created', habit1);

    separator('2. Create Habit 2 — Morning Run');
    const habit2 = await createHabit({
      name: 'Morning Run',
      icon: '🏃',
      color: '#8A9A78',
      category_id: fitnessCat?.id ?? null,
      frequency_type: 'weekdays',
      frequency_value: JSON.stringify([1, 2, 3, 4, 5]), // Mon–Fri
      target_count: null,
      reminder_times: '["06:30"]',
      start_date: '2026-07-01',
      status: 'active',
      notes: null,
    });
    dump('habit2 created', habit2);

    dump('All habits after creation', await getHabits());

    // ── 2. Add 3 completions across both habits ──────────────────────────────
    separator('3. Add 3 completions');

    const comp1 = await addCompletion(habit1.id, '2026-07-28', 'Drank 9 glasses');
    dump('completion 1 (habit1, 2026-07-28)', comp1);

    const comp2 = await addCompletion(habit1.id, '2026-07-27');
    dump('completion 2 (habit1, 2026-07-27, no note)', comp2);

    const comp3 = await addCompletion(habit2.id, '2026-07-28', 'Ran 5km');
    dump('completion 3 (habit2, 2026-07-28)', comp3);

    dump('All completions for habit1', await getCompletionsForHabit(habit1.id));
    dump('All completions for habit2', await getCompletionsForHabit(habit2.id));

    // ── 3. Update habit1 ─────────────────────────────────────────────────────
    separator('4. Update Habit 1 — change name, target_count, reminder_times');
    const updatedHabit1 = await updateHabit(habit1.id, {
      name: 'Drink Water (2L goal)',
      target_count: 10,
      reminder_times: '["07:00","12:00","18:00","21:00"]',
    });
    dump('habit1 after update', updatedHabit1);

    // ── 4. Archive habit2 ────────────────────────────────────────────────────
    separator('5. Archive Habit 2 (Morning Run)');
    const archivedHabit2 = await archiveHabit(habit2.id);
    dump('habit2 after archive', archivedHabit2);

    dump('Active habits only', await getHabits({ status: 'active' }));
    dump('Archived habits only', await getHabits({ status: 'archived' }));
    dump('All habits', await getHabits());

    // ── 5. Verify completions still exist after archive ──────────────────────
    separator('6. Completions still intact after archive');
    dump('habit2 completions', await getCompletionsForHabit(habit2.id));

    // ── 6. Remove a completion ───────────────────────────────────────────────
    separator('7. Remove one completion (habit1, 2026-07-27)');
    await removeCompletion(habit1.id, '2026-07-27');
    dump('habit1 completions after removal', await getCompletionsForHabit(habit1.id));

    // ── 7. getHabitById ──────────────────────────────────────────────────────
    separator('8. getHabitById');
    dump('getHabitById(habit1.id)', await getHabitById(habit1.id));
    dump('getHabitById("nonexistent")', await getHabitById('nonexistent-id-000'));

    separator('PHASE 1 DB TEST COMPLETE ✅');
    console.log('All CRUD operations succeeded with no exceptions.\n');
  } catch (err) {
    console.error('❌ DB TEST FAILED:', err);
    throw err;
  }
}
