# Workout Tracker — Supabase Integration Test Plan

## Database Setup ✅
- [x] Supabase project created: `workout-tracker`
- [x] Region: West EU (Ireland)
- [x] Table `workout_logs` created with correct schema
- [x] RLS enabled with public anon read/write policy
- [x] Index created on (ex_id, log_date)

## Code Changes ✅
- [x] Supabase JS client added via CDN
- [x] Supabase URL and anon key hardcoded
- [x] `getLogs()` → SELECT from Supabase (async)
- [x] `addLog()` → DELETE + INSERT pattern (overwrites same exercise same day)
- [x] `getLastSessionForEx()` → SELECT last session for autofill
- [x] `delLog()` → DELETE from Supabase
- [x] `clearAll()` → DELETE all + clear localStorage drafts/session
- [x] Drafts and session state still in localStorage (temp UI state)
- [x] CSV export function added

## Test Cases

### 1. Initial Load
- [ ] Open app → Day 1 auto-expands, first exercise auto-expands
- [ ] Loading state shown while fetching autofill
- [ ] No errors in console

### 2. Log First Exercise
- [ ] Enter reps + weight for Barbell Bench Press
- [ ] Tick set → rest timer starts, vibrates (Android only)
- [ ] Add another set → renders correctly
- [ ] Delete a set → removes it
- [ ] Save Exercise → Done pill shows, button turns green
- [ ] Inputs survive if you navigate away (localStorage drafts)

### 3. Commit Workout
- [ ] Log Workout button → saves to Supabase
- [ ] Success toast shown
- [ ] Drafts and session cleared
- [ ] View reloads with fresh autofill

### 4. History Tab
- [ ] Logged exercise appears in history
- [ ] Delta pill shows "First" for first log
- [ ] Filter by exercise works
- [ ] Delete entry → removes from Supabase, re-renders
- [ ] Export CSV → downloads file with correct format

### 5. Progress Tab
- [ ] Stats show correct session count and exercise count
- [ ] Progress bars render
- [ ] Biggest gain calculates correctly

### 6. Same Exercise Same Day
- [ ] Log Barbell Bench Press again today
- [ ] Check Supabase → only 1 row for that exercise today (overwrite, not duplicate)

### 7. Autofill from Last Session
- [ ] Log an exercise today
- [ ] Open app tomorrow
- [ ] Same exercise → autofill shows last session's values in light blue
- [ ] Tap autofilled input → clears and becomes editable

### 8. Clear All
- [ ] Click Delete All in History tab
- [ ] Confirm → all data deleted from Supabase
- [ ] localStorage drafts/session also cleared
- [ ] History and Progress tabs show empty state

### 9. Network Error Handling
- [ ] Turn off network
- [ ] Try to save → error toast shown
- [ ] Turn network back on
- [ ] Try again → works

### 10. CSV Export
- [ ] Log 2+ exercises across 2+ days
- [ ] Export CSV
- [ ] Open in Excel/Sheets
- [ ] Verify columns: Date, Exercise, Set, Reps, Weight (kg)
- [ ] Verify data matches history

## Known Limitations (Acceptable)
- No auth — single-user personal app, anon key is fine
- No offline mode — requires internet to save/load
- No conflict resolution — last write wins
- Vibrate API only works on Android, not iOS

## Deployment
1. Copy `/home/claude/workout_tracker.html` to local machine
2. Upload to Netlify: https://patrick-workout-tracker.netlify.app
3. Test on iPhone Safari (target device)

## Success Criteria
- All localStorage functions replaced with Supabase
- Data persists across sessions
- Autofill works from cloud data
- CSV export includes all logged data
- No errors on iPhone Safari
