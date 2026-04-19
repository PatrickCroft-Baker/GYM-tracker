# Workout Tracker — Handover
Last updated: 2026-04-19

## Project goal
Mobile-first workout logging PWA — logs sets to Supabase, works offline, Week A/B program, multi-user auth.

## Current state
**FULLY WORKING.** Live at https://patrick-workout-tracker.netlify.app

- React + Vite app in `gym-app/`
- Supabase Auth — email + password login/signup, no email verification, RLS user-scoped
- Supabase backend — `workout_logs` table with `user_id`, upsert on `(user_id, ex_id, log_date)`
- Week A (Days 1–4) + Week B (Days 5–8) — toggle in Log tab
- Program editing — tap Edit on any day card (stored in localStorage)
- Offline queue — saves to localStorage when no signal, auto-syncs on reconnect
- Service worker caches all assets (lift-log-v7) — works offline after first visit
- PR highlighting — badge on exercise + "new best" toast on new personal records
- Workout summary modal — shown on "Log Workout" (exercises, sets, volume, duration)
- Rest timer — end-time approach survives Safari backgrounding; beep + vibrate on finish
- History tab: filters, CSV export, delete
- Progress tab: stats + first vs latest weight bars
- Patrick's existing data migrated to his account (5 logs linked to his user_id)

## Active branch / environment
- Branch: `main` (5 commits ahead of origin — needs push)
- Netlify site ID: `e4bea86e-99b1-4b75-9b44-ca9dac16fe8a`
- Supabase project: `tsgqqghdocoeudargsom` (eu-west-1)

## Next steps (prioritised)
1. Push the 5 unpushed commits to GitHub (`git push`)
2. Patrick should change his password (currently weak)
3. Visual testing on real iPhone Safari — log in, test offline mode

## Context warnings
- `netlify.toml` is CRITICAL — do not delete. Without it Netlify serves raw source (blank white page).
- SW cache name (`lift-log-v7` in `public/sw.js`) must be incremented whenever assets change.
- `upsertLog` onConflict MUST be `user_id,ex_id,log_date` — changing it back breaks multi-user isolation.
- Program edits save to localStorage only (per-device) — not synced to Supabase.
- Blank screenshots in `gym-app/screenshot-*.png` are from WSL2 headless runs — safe to delete.
- `docker-compose.yml` and `gym-app/Dockerfile.dev` exist but are unused — can be deleted.
- Do NOT deploy automatically — always wait for Patrick to say so.

## Environment / how to run
```bash
cd "gym-app"
npm install          # first time only
npm run dev          # local dev server at localhost:5173
npm run build        # builds to dist/ — what Netlify serves
```

Deploy: use Netlify MCP tool from `gym-app/` directory, only when Patrick explicitly says to.
