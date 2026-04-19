# Workout Tracker — Handover
Last updated: 2026-04-19 (Session 2)

## Project goal
Mobile-first workout logging PWA — logs sets to Supabase, works offline, Week A/B program, multi-user auth.

## Current state
**FULLY WORKING.** Live at https://patrick-workout-tracker.netlify.app

- React + Vite app in `gym-app/`
- Supabase Auth — email + password login/signup, no email verification, RLS user-scoped
- Supabase backend — `workout_logs` table with `user_id`, upsert on `(user_id, ex_id, log_date)`
- Week A (Days 1–4) + Week B (Days 5–8) — toggle in Log tab
- Program editing — tap Edit on any day card (stored in localStorage)
- **Editable rest breaks** — tap "Rest X min" badge in any exercise to open stepper; 15s steps; saves override to localStorage per exercise (`wt_rest_overrides_v1`)
- **New program structure: 3 upper + 1 lower per week** — Day 2 = Legs A, Day 4 = Upper C (Back+Arms), Day 6 = Legs B, Day 8 = Upper F (Back+Arms)
- Offline queue, service worker (lift-log-v8), PR highlighting, workout summary modal, rest timer
- History tab: filters, CSV export, delete
- Progress tab: stats + first vs latest weight bars

## Active branch / environment
- Branch: `main` (changes uncommitted — see next steps)
- Netlify site ID: `e4bea86e-99b1-4b75-9b44-ca9dac16fe8a`
- Supabase project: `tsgqqghdocoeudargsom` (eu-west-1)

## Next steps (prioritised)
1. Commit + push this session's changes (5 files modified)
2. Deploy to Netlify when Patrick says go
3. Test editable rest on iPhone Safari — tap badge, adjust, tick set, confirm timer uses new value
4. If Patrick has a saved custom program in localStorage — tap Reset in program editor to pick up new structure
5. Patrick should change his Supabase account password (still weak)

## Context warnings
- `netlify.toml` is CRITICAL — do not delete. Without it Netlify serves raw source (blank white page).
- SW cache name is now `lift-log-v8` in `public/sw.js` — increment again whenever assets change.
- `upsertLog` onConflict MUST be `user_id,ex_id,log_date` — changing breaks multi-user isolation.
- New `program.js` only applies if user has no `wt_custom_program_v1` in localStorage — must reset via program editor.
- Rest overrides keyed by `ex_id` — new program has new IDs for several exercises (e.g. `lateral_raise` not `lateral_d1`); old overrides won't carry over.
- Blank screenshots in `gym-app/screenshot-*.png` are WSL2 headless artefacts — safe to delete.
- `docker-compose.yml` and `gym-app/Dockerfile.dev` exist but are unused.
- Do NOT deploy automatically — always wait for Patrick to say so.

## Environment / how to run
```bash
cd "gym-app"
npm install          # first time only
npm run dev          # local dev server at localhost:5173
npm run build        # builds to dist/ — what Netlify serves
```

Deploy: use Netlify MCP tool from `gym-app/` directory, only when Patrick explicitly says to.
