# Workout Tracker — Handover
Last updated: 2026-04-16 21:00

## Project goal
Mobile-first workout logging PWA — logs sets to Supabase, works offline, Week A/B program with editable exercises.

## Current state
**FULLY WORKING.** Live at https://patrick-workout-tracker.netlify.app

- React + Vite app in `gym-app/`
- Supabase backend (workout_logs table, upsert on ex_id+log_date)
- Week A (Days 1–4) + Week B (Days 5–8) — toggle in Log tab
- Program editing — tap Edit on any day card
- Offline queue — saves to localStorage when no signal, auto-syncs on reconnect
- Service worker caches all assets (cache-first) — reload works offline after first visit
- History tab: filters, CSV export, delete
- Progress tab: stats + first vs latest weight bars
- Input cascade autofill fires on blur (not keystroke) — typing "10" no longer cascades "1" mid-type

## Active branch / environment
- Branch: `main`
- Netlify site ID: `e4bea86e-99b1-4b75-9b44-ca9dac16fe8a`
- Supabase: workout-tracker project, West EU (Ireland)

## Next steps (prioritised)
1. Visual testing on real iPhone Safari — open site, add to home screen, test offline (airplane mode after first load)
2. Food plan tab — new component `FoodView.jsx`, tab bar entry in `App.jsx`
3. Playwright visual tests — blocked by WSL2 GPU rendering (blank screenshots)

## Context warnings
- `netlify.toml` is CRITICAL — do not delete. Without it Netlify serves raw source (blank white page).
- Service worker cache name (`lift-log-v3` in `public/sw.js`) must be incremented whenever assets change, otherwise users see stale content.
- Program edits save to localStorage only — historical Supabase logs stay linked to original `ex_id`. Renaming creates a new ID lineage; old logs still accessible in History.
- Do NOT add auth — anon key is intentional for a single-user personal app.
- Screenshots in `gym-app/screenshot-*.png` are blank (WSL2 rendering issue) — safe to delete.

## Environment / how to run
```bash
cd "gym-app"
npm install          # first time only
npm run dev          # local dev server at localhost:5173
npm run build        # builds to dist/ — what Netlify serves
```

Deploy: use Netlify MCP tool from `gym-app/` directory.
