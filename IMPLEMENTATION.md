# Workout Tracker — Supabase Backend Implementation

## Summary
Successfully rebuilt the workout tracker HTML file with Supabase cloud backend. All localStorage workout data now lives in PostgreSQL. Drafts and session state remain in localStorage as intended (temporary UI state).

## Supabase Project
- **Name**: workout-tracker
- **Region**: West EU (Ireland)
- **Project ID**: tsgqqghdocoeudargsom
- **URL**: https://tsgqqghdocoeudargsom.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ3FxZ2hkb2NvZXVkYXJnc29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzk0MjQsImV4cCI6MjA5MTg1NTQyNH0.zC4wH9KEcQELL0gPZ-reURY5syNGzrVJQCPRM-TzXXg

## Database Schema
```sql
CREATE TABLE workout_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  log_date DATE NOT NULL,
  ex_id TEXT NOT NULL,
  ex_name TEXT NOT NULL,
  sets JSONB NOT NULL
);

CREATE INDEX ON workout_logs (ex_id, log_date);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
```

## Key Changes from localStorage Version

### Data Layer
- `getLogs()` → async function using Supabase SELECT
- `addLog()` → DELETE existing + INSERT new (prevents duplicates same day)
- `getLastSessionForEx()` → async Supabase query for autofill
- `delLog()` → Supabase DELETE
- `clearAll()` → Supabase DELETE all + clear localStorage temp state

### Kept in localStorage
- `drafts` — per-exercise draft inputs (saves on every keystroke, survives phone lock)
- `session` — which exercises are marked "Done" in current session
- These are temporary UI state, not permanent data

### New Features
- **CSV Export** — Downloads all workout_logs as CSV file
  - Columns: Date, Exercise, Set, Reps, Weight (kg)
  - Filename: `workout_history_YYYY-MM-DD.csv`
  - Triggered by "Export CSV" button in History tab

### Async Handling
- `buildLogView()` now async — fetches autofill for all exercises
- `loadExerciseBlock()` async — loads last session data
- `renderHistory()` and `renderProgress()` async — fetch from Supabase
- Loading states shown while data fetches

## Files Created
1. `/home/claude/workout_tracker.html` — Complete rebuild with Supabase
2. `/home/claude/TEST_PLAN.md` — Test cases and verification checklist

## Next Steps
1. Copy `workout_tracker.html` to your OneDrive folder
2. Upload to Netlify (drag onto app.netlify.com/projects/patrick-workout-tracker)
3. Test on iPhone Safari
4. Run through test cases in TEST_PLAN.md

## Tech Stack
- **Frontend**: Single HTML file (HTML + CSS + vanilla JS)
- **Backend**: Supabase (PostgreSQL)
- **CDN**: Supabase JS v2 (https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
- **Hosting**: Netlify
- **Target**: iPhone Safari

## Design Unchanged
All visual design, CSS variables, tap targets, fonts, colors, and mobile-first layout remain identical to the original. Only the data layer changed.
