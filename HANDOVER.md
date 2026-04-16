# Workout Tracker — Handover
Last updated: 2026-04-16 18:30

## Project goal
Mobile-first workout logging app with cloud data persistence, autofill from last session, per-set timers, and CSV export.

## Current state
**COMPLETE.** All Supabase integration done. App fully functional:
- Logs persist to cloud (Supabase PostgreSQL)
- Drafts/session state still in localStorage (temp UI state — fine to leave here)
- History tab now has "Download CSV" button
- Last-session autofill working with cloud data
- All async operations properly handled with loading states

## Active branch / environment
- Branch: main
- Hosting: Netlify (patrick-workout-tracker.netlify.app, Site ID: e4bea86e-99b1-4b75-9b44-ca9dac16fe8a)
- Supabase project: `workout-tracker` (West EU, Ireland)
- Frontend: Single HTML file at `gym-app/index.html`

## Next steps (prioritised)
1. Deploy `gym-app/index.html` to Netlify (drag onto app.netlify.com)
2. Test on iPhone Safari — verify autofill, CSV download, rest timers work
3. Monitor Supabase dashboard for any RLS policy issues or data anomalies

## Context warnings
- Do NOT change PROGRAM data array or CSS variables — already locked
- Do NOT add auth/login — anon key is intentional for personal app
- Do NOT modify localStorage usage for drafts/session state — these are intentionally temporary
- Supabase URL and anon key are hardcoded in HTML (safe for single-user app)

## Environment / how to run
**Local development (browser):**
1. Open `gym-app/index.html` in browser
2. No build step needed
3. Logs automatically sync to Supabase on save

**Deploy to Netlify:**
- Drag `gym-app/index.html` onto Netlify deploy UI
- Site: patrick-workout-tracker.netlify.app
- No env vars needed (URL + key hardcoded)
