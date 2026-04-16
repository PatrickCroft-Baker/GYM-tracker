# Workout Tracker — Claude Handoff

## Status
The HTML file (`workout_tracker.html`) has been fully rebuilt with all non-Supabase changes applied.
Your job in this session is **Supabase backend only** plus the two items marked below.

---

## What's already done (do NOT redo these)
- Warm orange-red accent colour (#e8400c) — not corporate blue
- Overload banner removed
- All tap targets 52px minimum (Apple HIG compliant)
- Input font size 18px — no iOS Safari auto-zoom
- Autofill from last session shown in light blue, clears on tap
- Per-set tick button (✓) — marks set done, turns green
- Visible rest timer per exercise — fires when set is ticked, counts down, vibrates on Android
- First exercise auto-opens when Day 1 is expanded
- Draft inputs save to localStorage on every keystroke — survive phone lock
- Save Exercise button (per exercise) — saves to localStorage, turns green, shows Done pill
- Tap saved exercise again → confirm to remove and re-edit
- Log Workout button fixed to bottom of screen — commits session, clears drafts/session state
- Duplicate log prevention (same exercise same day = overwrite not duplicate)
- DM Sans + DM Mono + Bebas Neue fonts
- Mobile-first CSS, iPhone Safari tested

---

## What YOU need to do in this session

### 1. Supabase backend (CRITICAL — main task)
Replace ALL localStorage usage with Supabase. The app must work identically but data lives in the cloud.

**Step 1** — Use the Supabase MCP connector to create a new project:
- Name: `workout-tracker`
- Region: West EU (Ireland)
- Get the Project URL and anon public key

**Step 2** — Create this table:
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
```

**Step 3** — Enable RLS with public anon read/write (single-user personal app, no auth needed):
```sql
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
```

**Step 4** — Add Supabase JS client via CDN to the HTML file:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Step 5** — Replace localStorage functions:
- `addLog()` → INSERT into workout_logs
- `getLogs()` → SELECT from workout_logs ORDER BY log_date, created_at
- `saveLogs()` → not needed (replace with DELETE + INSERT pattern)
- `getLastSessionForEx(exId)` → SELECT WHERE ex_id = exId ORDER BY log_date DESC LIMIT 1
- Keep `getDrafts/saveDrafts/getSession/saveSession` in localStorage (these are temp UI state, not permanent data — this is fine)

**Step 6** — Handle async properly:
- `buildLogView()` must await last-session data before rendering autofill
- Show a loading state on exercise blocks while fetching
- On save, await the INSERT before showing the Done pill

**Step 7** — Hardcode the Supabase URL and anon key directly in the JS (this is a personal single-user app, anon key exposure is fine):
```js
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

### 2. CSV export button
Add a "Download CSV" button to the History tab. When tapped, downloads all workout_logs as a CSV file with columns: date, exercise, set_number, reps, weight_kg.

```js
function exportCSV() {
  // fetch all logs from Supabase
  // flatten sets array into rows
  // build CSV string
  // trigger download via <a> blob URL
}
```

---

## Tech stack
- Frontend: Single HTML file (HTML + CSS + vanilla JS)
- Backend: Supabase (PostgreSQL)
- Hosting: Netlify — site already exists: patrick-workout-tracker.netlify.app
  - Site ID: e4bea86e-99b1-4b75-9b44-ca9dac16fe8a
  - Deploy: drag index.html onto app.netlify.com/projects/patrick-workout-tracker
- Supabase JS via CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
- Target device: iPhone Safari. No audio API. navigator.vibrate() works on Android only.

---

## Code rules
- Keep it as a single HTML file — no separate JS/CSS files, no build step
- No frameworks, no npm
- Mobile-first CSS
- Do not add auth — anon key is fine for a personal single-user app
- Do not modify the PROGRAM data array or any CSS variables
- Do not change the visual design — only the data layer changes

---

## Workout program data (reference only — already in the HTML, do not change)

### Day 1 — Upper A
- Barbell Bench Press: 4x6-10, 2 min rest
- Barbell Row: 4x6-10, 2 min rest
- Incline DB Press: 3x10-12, 90s
- Cable Row: 3x10-12, 90s
- Lateral Raise: 3x12-15, 60s

### Day 2 — Lower A
- Barbell Squat: 4x6-10, 2 min
- Romanian Deadlift: 3x8-10, 90s
- Leg Press: 3x10-12, 90s
- Leg Curl: 3x12-15, 60s
- Calf Raise: 3x15-20, 45s

### Day 3 — Upper B
- Overhead Press: 4x6-10, 2 min
- Lat Pulldown: 4x8-10, 90s
- DB Lateral Raise: 3x12-15, 60s
- EZ Bar Curl: 3x10-12, 75s
- Tricep Pushdown: 3x10-12, 75s

### Day 4 — Lower B
- Deadlift: 4x5-8, 2 min
- Bulgarian Split Squat: 3x8-10, 90s
- Leg Press: 3x10-12, 75s
- Leg Curl: 3x12-15, 60s
- Calf Raise: 3x15-20, 45s
