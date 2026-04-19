# Workout Tracker — Claude Context
Last updated: 2026-04-19 (Session 2)

## What this project is
Mobile-first PWA for logging gym workouts. Logs sets to Supabase cloud DB, works offline with auto-sync, Week A/B alternating program, editable exercises. Multi-user with Supabase Auth (email + password, no email verification).

## Tech stack
- **Frontend:** React + Vite (`gym-app/`)
- **Backend:** Supabase PostgreSQL — table `workout_logs` (id, created_at, log_date, ex_id, ex_name, sets JSONB, user_id UUID)
- **Auth:** Supabase Auth — email + password, no email verification, RLS user-scoped
- **Hosting:** Netlify — patrick-workout-tracker.netlify.app (Site ID: e4bea86e-99b1-4b75-9b44-ca9dac16fe8a)
- **Build:** `npm run build` → `dist/` (served by Netlify via `netlify.toml`)
- **Target device:** iPhone Safari

## File structure
```
gym-app/
  src/
    App.jsx                       # Shell: auth gate, tabs, toast, offline banner, SW registration
    index.css                     # All styles (single stylesheet)
    main.jsx                      # React entry point
    components/
      AuthScreen.jsx              # Login/signup form (email + password, mode toggle, error display)
      LogView.jsx                 # Log tab: week toggle, day cards, exercise blocks, PR + summary logic
      ExerciseBlock.jsx           # Per-exercise: set inputs, autofill, tick, drafts, PR badge
      RestTimer.jsx               # Rest countdown (renders inside ExerciseBlock)
      WorkoutSummaryModal.jsx     # Bottom-sheet modal shown on session complete
      HistoryView.jsx             # History tab: filters, CSV export, delete
      ProgressView.jsx            # Progress tab: stats, first vs latest weight bars
      ProgramEditor.jsx           # Inline day editor (add/remove/rename exercises)
    hooks/
      useAuth.js                  # Supabase Auth: getSession, onAuthStateChange, signIn, signUp, signOut
      useOffline.js               # navigator.onLine tracker + queue flush on reconnect
      useTimer.js                 # Rest timer: end-time approach (survives backgrounding), beep + vibrate on finish
    lib/
      supabase.js                 # All Supabase calls (getLogs, upsertLog, deleteLog, getBestWeightForEx, etc.)
      program.js                  # PROGRAM.A (Days 1-4) + PROGRAM.B (Days 5-8)
      storage.js                  # localStorage helpers (drafts, session, queue, week, customProgram, sessionStart)
  public/
    sw.js                         # Service worker — cache-first for assets (lift-log-v8)
  netlify.toml                    # CRITICAL: tells Netlify to build + serve dist/
.claude/
  launch.json                     # Claude Code desktop: starts dev server + opens localhost:5173
```

## What's done (do not redo)
- Supabase Auth — email + password, no email verification, login/signup screen gates the app
- Supabase backend — upsert on (user_id, ex_id, log_date) unique constraint, RLS user-scoped policies
- Offline queue — saves to localStorage when offline, auto-syncs on reconnect
- Service worker — cache-first for all same-origin assets (lift-log-v7)
- Week A/B toggle with localStorage persistence
- Program editing — per-day, saves to localStorage as custom program
- Autofill from last session (shown in blue), cascade fills empty rows on blur (not keystroke)
- Draft saving on every keystroke (survives phone lock)
- Per-set tick → starts rest timer
- Rest timer: end-time approach survives Safari backgrounding/phone lock; audio beep (3× 880Hz) + vibrate on finish; persists to localStorage so page reload restores it
- Editable rest breaks — tap "Rest X min" badge in exercise header to open inline stepper; 15s steps (15s–10min); override saved to localStorage per ex_id (`wt_rest_overrides_v1`); used instead of program default when starting timer
- Program restructured to 3 upper + 1 lower per week: Day 2 = Legs A, Day 4 = Upper C (Back+Arms), Day 6 = Legs B, Day 8 = Upper F (Back+Arms)
- PR highlighting — reads historical best BEFORE upsert, shows PR badge + "new best" toast
- Workout complete summary modal — exercises, total sets, volume, duration; shown on "Log Workout"
- Session start time tracked in localStorage (wt_session_start_v1) from first exercise saved
- CSV export, history filters (7/30/90 days / all time / exercise)
- Deployed and live — netlify.toml ensures correct build on every deploy

## Key rules
- Do NOT remove auth — it is required for multi-user data isolation
- Do NOT delete `netlify.toml` — without it Netlify serves raw source (blank page)
- Increment SW cache name (currently `lift-log-v8` in `public/sw.js`) whenever assets change
- localStorage for ephemeral state only (drafts, session, queue, week, customProgram, sessionStart, restOverrides)
- Supabase for permanent data only
- PR check: always read `getBestWeightForEx` BEFORE calling `upsertLog` — reading after includes the new record
- upsertLog onConflict must be `user_id,ex_id,log_date` (not ex_id,log_date)
- Do NOT deploy to Netlify unless Patrick explicitly says to

## Key commands
```bash
cd gym-app
npm run dev        # local dev at localhost:5173
npm run build      # build to dist/
```
Deploy via Netlify MCP tool from `gym-app/` directory — only when Patrick says to.

## What NOT to do
- Don't change the visual design (accent: #e8400c, fonts: DM Sans/DM Mono/Bebas Neue)
- Don't add a build step that breaks the netlify.toml publish = "dist" assumption
- Don't use DELETE+INSERT for logs — use upsert (race condition risk)
- Don't cascade autofill on onChange — only on onBlur (mid-keystroke cascade was a bug)
- Don't commit blank screenshots from WSL2 headless runs
- Don't deploy automatically — wait for explicit instruction
