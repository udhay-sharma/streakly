# Streakly — Build Plan

Rule for every phase: don't move to the next phase until the "Verify" step passes on a real device/simulator with real output — no assuming, no trusting a generated summary.

---

## Phase 0 — Setup & fixes (~0.5 day)
1. Install missing deps: `zustand`, `expo-sqlite`, `expo-notifications`, `expo-haptics`, `date-fns`, `nativewind` + `tailwindcss`
2. Fix `hooks/use-theme.ts` broken import (`@/constants/theme` doesn't exist — create barrel file or fix path)
3. Set up React Native Reusables CLI + confirm NativeWind classes render

**Verify:** app builds and runs on a real device with no red-screen errors; one test component renders with a NativeWind class applied.

---

## Phase 1 — Database layer (~1 day)
1. Write `db/schema.ts` — habits, completions, categories tables
2. Write `db/database.ts` — connection setup, migration runner
3. Write raw CRUD functions: create/read/update/delete habit, add/remove completion

**Verify:** run each CRUD function from a temporary script/console log, confirm rows actually appear in the SQLite file (inspect via a SQLite viewer, not just "no error thrown").

---

## Phase 2 — State layer (~0.5 day)
1. Build `store/habitStore.ts` (Zustand) wrapping the DB functions
2. Wire loading state, error state, and an in-memory cache of habits/completions

**Verify:** log store state changes in console after each action (add habit, complete habit) and confirm it matches DB contents.

---

## Phase 3 — Theme foundation (~0.5 day)
1. Add light/dark token values (from architecture doc) into `constants/colors.ts` etc.
2. Wire `useColorScheme` + manual override into `use-theme.ts`
3. Build 2–3 base UI primitives (Button, Card) using React Native Reusables + tokens

**Verify:** toggle system dark mode on the device and confirm colors switch correctly across both themes.

---

## Phase 4 — Today screen (core loop) (~1.5 days)
1. Build habit checklist UI grouped by time of day
2. Wire tap-to-complete → store → DB
3. Add streak counter display per habit
4. Add haptic feedback + completion toast

**Verify:** complete/uncomplete a habit multiple times across app restarts — streak count and completion state must persist correctly.

---

## Phase 5 — Habit management (~1.5 days)
1. Build Add/Edit habit modal (name, icon, color, frequency, target count, reminder time)
2. Build inbuilt habit template picker (onboarding + "add from template")
3. Build Habits tab list (active/paused/archived, filter by category)
4. Build pause/archive/delete actions

**Verify:** create a custom habit, create one from a template, edit both, archive one — confirm all changes persist and Today screen reflects them correctly.

---

## Phase 6 — Notifications (~1 day)
1. Request notification permissions, handle denial gracefully
2. Schedule per-habit local reminders on create/edit
3. Cancel/reschedule on delete/edit
4. Add streak-at-risk evening nudge logic

**Verify:** background the app, wait for a real scheduled notification to fire on-device; edit a habit's time and confirm the old notification is actually cancelled (check via `expo-notifications` scheduled list, not assumption).

---

## Phase 7 — Stats & graphs (~1.5 days)
1. Build per-habit calendar heatmap
2. Build weekly/monthly completion rate chart
3. Build 30-day overall consistency score card

**Verify:** cross-check chart numbers against manually counted completions in the DB for at least one habit.

---

## Phase 8 — Settings & polish (~1 day)
1. Theme toggle (light/dark/system) in Settings
2. Backup/export to JSON, and restore from file
3. Final visual pass — spacing, empty states, loading states

**Verify:** export data, delete the app, reinstall, restore from the exported file — confirm all habits/completions come back correctly.

---

## Phase 9 — Play Store prep (~1 day)
1. Privacy policy page + Data safety form
2. Store listing assets (screenshots, icon, description)
3. EAS production build + internal test install
4. Submit for review

**Verify:** install the actual production build (not dev client) on a real device and run through the full flow once before submitting.
