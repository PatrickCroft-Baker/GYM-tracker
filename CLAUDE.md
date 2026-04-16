# Workout Tracker — Claude Context
Last updated: 2026-04-16

## What this project is
Mobile-first PWA for logging gym workouts. Logs sets to Supabase cloud DB, works offline with auto-sync, Week A/B alternating program, editable exercises. Single user (Patrick), no auth.

## Tech stack
- **Frontend:** React + Vite (`gym-app/`)
- **Backend:** Supabase PostgreSQL — table `workout_logs` (id, created_at, log_date, ex_id, ex_name, sets JSONB)
- **Hosting:** Netlify — patrick-workout-tracker.netlify.app (Site ID: e4bea86e-99b1-4b75-9b44-ca9dac16fe8a)
- **Build:** `npm run build` → `dist/` (served by Netlify via `netlify.toml`)
- **Target device:** iPhone Safari

## File structure
```
gym-app/
  src/
    App.jsx                  # Shell: tabs, toast, offline banner, SW registration
    index.css                # All styles (ported from original HTML)
    main.jsx                 # React entry point
    components/
      LogView.jsx            # Log tab: week toggle, day cards, exercise blocks
      ExerciseBlock.jsx      # Per-exercise: set inputs, autofill, tick, drafts
      RestTimer.jsx          # Rest countdown (renders inside ExerciseBlock)
      HistoryView.jsx        # History tab: filters, CSV export, delete
      ProgressView.jsx       # Progress tab: stats, first vs latest weight bars
      ProgramEditor.jsx      # Inline day editor (add/remove/rename exercises)
    hooks/
      useOffline.js          # navigator.onLine tracker + queue flush on reconnect
      useTimer.js            # Rest timer with setInterval + Android vibrate
    lib/
      supabase.js            # All Supabase calls (getLogs, upsertLog, deleteLog, etc.)
      program.js             # PROGRAM.A (Days 1-4) + PROGRAM.B (Days 5-8)
      storage.js             # localStorage helpers (drafts, session, queue, week, customProgram)
  public/
    sw.js                    # Service worker — cache-first for assets, network-first for nav
  netlify.toml               # CRITICAL: tells Netlify to build + serve dist/
```

## What's done (do not redo)
- Supabase backend — upsert on (ex_id, log_date) unique constraint, RLS allow-all policy
- Offline queue — saves to localStorage when offline, auto-syncs on reconnect
- Service worker — cache-first for all same-origin assets (lift-log-v3)
- Week A/B toggle with localStorage persistence
- Program editing — per-day, saves to localStorage as custom program
- Autofill from last session (shown in blue), cascade fills empty rows on blur (not keystroke)
- Draft saving on every keystroke (survives phone lock)
- Per-set tick → starts rest timer
- CSV export, history filters (7/30/90 days / all time / exercise)
- Deployed and live — netlify.toml ensures correct build on every deploy

## Key rules
- Do NOT add auth — anon key is intentional
- Do NOT delete `netlify.toml` — without it Netlify serves raw source (blank page)
- Increment SW cache name (`lift-log-v3` in `public/sw.js`) whenever assets change
- localStorage for ephemeral state only (drafts, session, queue, week, customProgram)
- Supabase for permanent data only

## Key commands
```bash
cd gym-app
npm run dev        # local dev at localhost:5173
npm run build      # build to dist/
```
Deploy via Netlify MCP tool from `gym-app/` directory.

## What NOT to do
- Don't change the visual design (accent: #e8400c, fonts: DM Sans/DM Mono/Bebas Neue)
- Don't add a build step that breaks the netlify.toml publish = "dist" assumption
- Don't use DELETE+INSERT for logs — use upsert (race condition risk)
- Don't cascade autofill on onChange — only on onBlur (mid-keystroke cascade was a bug)
- Don't commit blank screenshots from WSL2 headless runs
