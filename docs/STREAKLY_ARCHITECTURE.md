# Streakly — Architecture & Product Spec

Personal habit-tracker mobile app. Local-first, no backend, built to publish on the Play Store and showcase on a resume.

---

## 1. What we're making

A minimal, calm habit tracker. Users pick from inbuilt habit templates or create custom ones, check them off daily, and see their consistency build up as streaks and graphs over time. Everything lives on-device — no accounts, no server, no login.

**Design mood:** warm, soothing, minimal. Light mode = "mountain morning" (cream, clay, sage). Dark mode = "night sky" (deep blue-black, moonlight blue).

---

## 2. Tech stack

### Frontend
- **Expo Router** (already set up) — file-based navigation
- **React Native Reanimated + Gesture Handler** (already installed) — animations, swipe-to-complete/delete
- **NativeWind + Tailwind CSS** *(to add)* — styling, pairs with existing `global.css`
- **React Native Reusables** *(to add)* — shadcn-equivalent component primitives, copy-paste-owned code, built on NativeWind
- **Zustand** *(to add)* — global state for habits/completions/UI state
- **date-fns** *(to add)* — streak math, calendar/date handling
- **expo-notifications** *(to add)* — local reminder scheduling
- **expo-haptics** *(to add)* — tactile feedback on check-off
- **A charting library** *(to add, pick one)* — `victory-native` or `react-native-gifted-charts` for stats graphs

### Database
- **expo-sqlite** *(to add)* — primary data store, fully local
- **drizzle-orm** (`drizzle-orm/expo-sqlite`) *(optional, recommended)* — typed schema + migrations instead of raw SQL
- **@react-native-async-storage/async-storage** *(to add)* — small non-relational prefs only (theme choice, onboarding-seen flag) — not habit data

### Backend
**None.** All logic (CRUD, streak calculation, notification scheduling) runs on-device. No server, no API layer, unless a future version adds cross-device sync or social features.

### Auth
**None.** No login/signup screens, no JWT/session handling, no Firebase/Auth0/Clerk. Only revisit this if cloud sync becomes a goal later.

### Explicitly NOT needed
- Cloud database (Postgres/Supabase/Firestore)
- Any backend framework (Fastify/Express/etc.)
- Authentication provider
- Real-time infra (sockets, push server)
- CI/CD, contributor tooling — not until later, if ever

---

## 3. App structure — tabs & screens

**Bottom tabs:**
1. **Today** — home screen, today's habits as a checklist grouped by time of day, big streak indicator
2. **Habits** — full list of all habits (active/paused/archived), search/filter by category
3. **Stats** — graphs, calendar heatmaps, completion rates
4. **Settings** — theme toggle, notification prefs, backup/export, about

**Modal / stacked screens:**
- Add/edit habit — name, icon, color, frequency, reminder time(s), start date, optional target count
- Habit detail — streak, calendar heatmap, history for one habit
- Icon & color picker
- Onboarding (first run) — pick starter habits, set wake/sleep time for default reminders

---

## 4. Features

### Habits
- **Inbuilt templates** (~15–20), grouped by category: Health, Fitness, Mind, Productivity, Learning — pre-filled icon/color/time, fully editable on save
- **Custom habits** — same form, blank start
- Frequency options: daily / specific weekdays / X times per week / X times per month
- Optional target count (e.g. "8 glasses of water")
- Pause/archive without losing history (distinct from delete)
- Optional short note on completion

### Notifications & alerts
- Per-habit scheduled local reminders (one or more times/day)
- Streak-at-risk nudge (e.g. streak ≥3 days, not done by evening)
- Optional daily summary notification
- In-app toasts for completion/undo (not push)

### Stats & graphs
- Per-habit calendar heatmap (GitHub-style)
- Current streak + longest streak
- Weekly/monthly completion rate chart
- Overall 30-day consistency score

### Other
- Home-screen widget (later)
- Backup/restore — export SQLite data to a JSON file (no cloud backup available)
- Milestone badges (7/30/100/365-day streaks) — cosmetic only

---

## 5. Data model (high level)

- **habits** — id, name, icon, color, category, frequency rule, target count, reminder time(s), start date, status (active/paused/archived), notes
- **completions** — id, habit_id, date, note (optional)
- **categories** — id, name (for inbuilt template grouping + custom filtering)

Maps to existing scaffold: `db/schema.ts` (table defs), `db/database.ts` (connection/queries), `store/habitStore.ts` (Zustand state built on top of the db layer), `services/notifications.ts` (scheduling logic).

---

## 6. Design tokens

### Light — "mountain morning"
| Token | Hex | Use |
|---|---|---|
| Background | `#F7F1E7` | Page background (warm ivory, not white) |
| Surface/card | `#FFFDF8` | Cards |
| Text primary | `#3B362F` | Body text (warm brown-gray, not black) |
| Text secondary | `#8A7F6C` | Muted text |
| Border | `#E3D9C6` | Hairlines |
| Accent (clay) | `#A9764A` | Primary accent |
| Accent (sage) | `#8A9A78` | Secondary/complete state |

### Dark — "night sky"
| Token | Hex | Use |
|---|---|---|
| Background | `#10151C` | Page background (deep blue-black, not pure black) |
| Surface/card | `#1B222C` | Cards |
| Text primary | `#E8ECF1` | Body text |
| Text secondary | `#8B94A3` | Muted text |
| Border | `#232C38` | Hairlines |
| Accent (moonlight blue) | `#6C8EBF` | Primary accent |
| Accent (dusk blue) | `#4F6A8C` | Secondary state |

Respect system `useColorScheme` by default, with manual override (light/dark/system) in Settings.

### Known bug to fix
`hooks/use-theme.ts` imports from `@/constants/theme`, which doesn't exist yet — currently split across `colors.ts`, `radius.ts`, `spacing.ts`. Create a `theme.ts` barrel file re-exporting all three, or fix the import path.

---

## 7. Component library

**React Native Reusables** + NativeWind — closest equivalent to shadcn/ui for React Native. Components install as owned source code (not a black-box package), styled with Tailwind-style utility classes matching the tokens above.

---

## 8. Path to Play Store
- Google Play Console account ($25 one-time)
- Privacy policy (simple hosted page — app is fully local, easy "no data collected" answer)
- Data safety form in Play Console
- App signing via EAS (build profiles already configured in `eas.json`)
- Store listing: screenshots, feature graphic, description, icon (already configured in `app.json`)
- Content rating questionnaire
