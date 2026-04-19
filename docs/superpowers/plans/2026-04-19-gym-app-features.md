# Gym App Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three features across three phases: decimal weight UI, PR highlighting, and workout complete summary.

**Architecture:** All features are self-contained UI enhancements to the existing React/Vite app. Phases are independent and can be approved one at a time. No new dependencies needed. No changes to Supabase schema except one new query function.

**Tech Stack:** React, Vite, Supabase (already set up), Web Audio API (already used), localStorage (already used), index.css (single stylesheet)

**Deploy:** Via Netlify MCP tool — only deploy when Patrick explicitly says to.

**Key rules:**
- Do NOT cascade autofill on onChange, only onBlur
- Do NOT add auth
- Do NOT delete netlify.toml
- Increment SW cache name in `public/sw.js` after each phase that changes assets (currently `lift-log-v3` → increment to v4, v5, etc.)
- Accent colour: `#e8400c` — do not change visual design

---

## Phase 1: Decimal Weight Increments

**Goal:** Make 2.5kg weight increments obvious and easy to tap.

**What exists:** Weight input already uses `type="number" inputMode="decimal" step="2.5"` and `handleSave` uses `parseFloat`, so decimals already work internally. The problem is the stepper arrows are tiny browser-native UI that's easy to miss on mobile. No visual hint that 2.5kg increments exist.

**Solution:** Add `-2.5` / `+2.5` quick-tap buttons below each weight field. Tapping them adjusts the value, clears autofill styling, and triggers cascade on blur.

**Files:**
- Modify: `gym-app/src/components/ExerciseBlock.jsx`
- Modify: `gym-app/src/index.css`
- Modify: `gym-app/public/sw.js` (bump cache name to `lift-log-v4`)

---

### Task 1.1: Add ±2.5 increment buttons to weight field

**Files:**
- Modify: `gym-app/src/components/ExerciseBlock.jsx`

- [ ] **Step 1: Add `adjustWeight` helper inside `ExerciseBlock`**

Add this function inside the `ExerciseBlock` component, after `cascadeRow`:

```jsx
function adjustWeight(idx, delta) {
  setRows(prev => {
    const current = parseFloat(prev[idx].weight) || 0;
    const next = Math.max(0, Math.round((current + delta) * 4) / 4); // round to nearest 0.25
    const val = String(next);
    const updated = prev.map((r, i) => i === idx ? { ...r, weight: val, autofilled: false } : r);
    const drafts = getDrafts();
    drafts[ex.id] = updated.map(r => ({ reps: r.reps, weight: r.weight }));
    saveDrafts(drafts);
    return updated;
  });
}
```

- [ ] **Step 2: Add increment buttons to the weight set-field in the JSX**

Replace the existing weight `set-field` div:

```jsx
<div className="set-field">
  <div className="set-field-label">kg</div>
  <input
    type="number" inputMode="decimal" placeholder="—" min="0" max="500" step="2.5"
    className={`set-input${row.autofilled ? ' autofilled' : ''}${row.ticked ? ' done-set' : ''}`}
    value={row.weight}
    onFocus={e => { updateRow(i, 'weight', e.target.value); }}
    onChange={e => updateRow(i, 'weight', e.target.value)}
    onBlur={e => cascadeRow(i, 'weight', e.target.value)}
  />
</div>
```

With:

```jsx
<div className="set-field set-field-weight">
  <div className="set-field-label">kg</div>
  <input
    type="number" inputMode="decimal" placeholder="—" min="0" max="500" step="2.5"
    className={`set-input${row.autofilled ? ' autofilled' : ''}${row.ticked ? ' done-set' : ''}`}
    value={row.weight}
    onFocus={e => { updateRow(i, 'weight', e.target.value); }}
    onChange={e => updateRow(i, 'weight', e.target.value)}
    onBlur={e => cascadeRow(i, 'weight', e.target.value)}
  />
  <div className="weight-btns">
    <button className="weight-adj-btn" onClick={() => adjustWeight(i, -2.5)}>−2.5</button>
    <button className="weight-adj-btn" onClick={() => adjustWeight(i, +2.5)}>+2.5</button>
  </div>
</div>
```

- [ ] **Step 3: Verify the app compiles without errors**

Run: `cd gym-app && npm run dev`
Expected: No console errors. Open http://localhost:5173 and expand an exercise — the weight field should now show two small buttons below it.

- [ ] **Step 4: Commit**

```bash
git add gym-app/src/components/ExerciseBlock.jsx
git commit -m "feat: add ±2.5kg quick-tap buttons to weight field"
```

---

### Task 1.2: Style the increment buttons

**Files:**
- Modify: `gym-app/src/index.css`

- [ ] **Step 1: Add styles for weight increment buttons**

Find the `.set-field` block in `index.css` and add after it:

```css
.set-field-weight {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weight-btns {
  display: flex;
  gap: 4px;
}

.weight-adj-btn {
  flex: 1;
  padding: 4px 0;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  color: #e8400c;
  background: transparent;
  border: 1px solid #e8400c44;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
}

.weight-adj-btn:active {
  background: #e8400c18;
}
```

- [ ] **Step 2: Visual check**

Screenshot or manually verify: the two buttons appear below the kg input, are clearly tappable, and tapping +2.5 increments the value by 2.5 (e.g. 50 → 52.5).

- [ ] **Step 3: Bump SW cache name**

In `gym-app/public/sw.js`, change:
```js
const CACHE = 'lift-log-v3';
```
To:
```js
const CACHE = 'lift-log-v4';
```

- [ ] **Step 4: Commit**

```bash
git add gym-app/src/index.css gym-app/public/sw.js
git commit -m "feat: style weight increment buttons, bump SW cache"
```

---

## Phase 2: PR Highlighting

**Goal:** When a new personal best weight is set on save, show a PR badge on the exercise and a celebratory toast.

**What "PR" means:** New highest single-set weight for that exercise across all time. Checked server-side by querying `workout_logs` for the historical max weight for that `ex_id`, then comparing against the new save.

**Files:**
- Modify: `gym-app/src/lib/supabase.js` (add `getBestWeightForEx`)
- Modify: `gym-app/src/components/LogView.jsx` (check PR on save, track `prExIds` state)
- Modify: `gym-app/src/components/ExerciseBlock.jsx` (accept `isPR` prop, show badge)
- Modify: `gym-app/src/index.css` (PR badge styles)
- Modify: `gym-app/public/sw.js` (bump cache name to `lift-log-v5`)

---

### Task 2.1: Add `getBestWeightForEx` to supabase.js

**Files:**
- Modify: `gym-app/src/lib/supabase.js`

- [ ] **Step 1: Add the query function**

Add to the bottom of `gym-app/src/lib/supabase.js`:

```js
export async function getBestWeightForEx(exId) {
  const { data, error } = await sb.from('workout_logs')
    .select('sets')
    .eq('ex_id', exId);
  if (error || !data?.length) return 0;
  let best = 0;
  for (const row of data) {
    for (const set of row.sets) {
      if (set.weight > best) best = set.weight;
    }
  }
  return best;
}
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/lib/supabase.js
git commit -m "feat: add getBestWeightForEx query"
```

---

### Task 2.2: Check for PR on save in LogView

**Files:**
- Modify: `gym-app/src/components/LogView.jsx`

- [ ] **Step 1: Import `getBestWeightForEx`**

Update the supabase import line at the top of `LogView.jsx`:

```js
import { upsertLog, deleteLogForExDate, getLastSessionForEx, getBestWeightForEx } from '../lib/supabase';
```

- [ ] **Step 2: Add `prExIds` state**

Add after the existing `useState` declarations inside `LogView`:

```js
const [prExIds, setPrExIds] = useState(new Set());
```

- [ ] **Step 3: Add PR check inside `handleSave`**

In `handleSave`, after the successful `upsertLog` call (inside the `else` block, after `await upsertLog(...)`), add:

```js
// Check for new PR (best single-set weight)
try {
  const prevBest = await getBestWeightForEx(ex.id);
  const newBest = Math.max(...setsData.map(s => s.weight));
  if (newBest > prevBest) {
    setPrExIds(prev => new Set([...prev, ex.id]));
    showToast(`${ex.name} — New PR! 🏆 ${newBest}kg`);
    return; // skip normal toast
  }
} catch (e) {}
```

Note: this must run BEFORE `showToast(\`${ex.name} saved ✓\`)` at the end of `handleSave`. Move the PR check before the final `showToast` call.

The full updated `handleSave` function should look like:

```js
async function handleSave(ex, setsData) {
  if (!setsData) { showToast('Fill in all sets first (reps > 0, weight ≥ 0)', true); return; }

  const payload = { log_date: todayISO(), ex_id: ex.id, ex_name: ex.name, sets: setsData };

  if (!isOnline) {
    const q = getQueue().filter(i => !(i.ex_id === ex.id && i.log_date === todayISO()));
    q.push(payload);
    saveQueue(q);
  } else {
    try {
      await upsertLog(ex.id, ex.name, setsData, todayISO());
    } catch (err) {
      console.error(err);
      showToast('Save failed — check connection', true);
      return;
    }
    try {
      const prevBest = await getBestWeightForEx(ex.id);
      const newBest = Math.max(...setsData.map(s => s.weight));
      if (newBest > prevBest) {
        setPrExIds(prev => new Set([...prev, ex.id]));
        showToast(`New PR on ${ex.name}! ${newBest}kg 🏆`);
        const next = { ...session, [ex.id]: true };
        setSession(next);
        saveSession(next);
        const drafts = getDrafts();
        delete drafts[ex.id];
        saveDrafts(drafts);
        return;
      }
    } catch (e) {}
  }

  const next = { ...session, [ex.id]: true };
  setSession(next);
  saveSession(next);
  const drafts = getDrafts();
  delete drafts[ex.id];
  saveDrafts(drafts);
  showToast(`${ex.name} saved ✓`);
}
```

- [ ] **Step 4: Pass `isPR` prop to ExerciseBlock**

In the `ExerciseBlock` render inside the `days.map`:

```jsx
<ExerciseBlock
  key={ex.id}
  ex={ex}
  autoOpen={i === 0 && j === 0}
  last={lastSessions[ex.id]}
  isLogged={!!session[ex.id]}
  isPR={prExIds.has(ex.id)}
  timer={activeTimer}
  onStartTimer={startTimer}
  onSkipTimer={skipTimer}
  onSave={setsData => handleSave(ex, setsData)}
  onRemove={() => handleRemove(ex)}
/>
```

- [ ] **Step 5: Commit**

```bash
git add gym-app/src/components/LogView.jsx
git commit -m "feat: detect and flag PR exercises on save"
```

---

### Task 2.3: Show PR badge in ExerciseBlock

**Files:**
- Modify: `gym-app/src/components/ExerciseBlock.jsx`
- Modify: `gym-app/src/index.css`

- [ ] **Step 1: Accept `isPR` prop**

Update the `ExerciseBlock` function signature from:

```jsx
export default function ExerciseBlock({ ex, autoOpen, last, isLogged, timer, onStartTimer, onSkipTimer, onSave, onRemove }) {
```

To:

```jsx
export default function ExerciseBlock({ ex, autoOpen, last, isLogged, isPR, timer, onStartTimer, onSkipTimer, onSave, onRemove }) {
```

- [ ] **Step 2: Add PR badge in the header**

In the `ex-header-right` div, add a PR badge alongside the existing done pill:

```jsx
<div className="ex-header-right">
  {isPR && <div className="pr-pill">PR 🏆</div>}
  {isLogged && <div className="done-pill show">✓ Done</div>}
  <div className={`ex-chevron${open ? ' open' : ''}`}>▾</div>
</div>
```

- [ ] **Step 3: Add PR badge styles to index.css**

Find the `.done-pill` styles and add after them:

```css
.pr-pill {
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  font-weight: 700;
  color: #fff;
  background: #e8400c;
  border-radius: 20px;
  padding: 3px 10px;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 4: Bump SW cache name**

In `gym-app/public/sw.js`:
```js
const CACHE = 'lift-log-v5';
```

- [ ] **Step 5: Commit**

```bash
git add gym-app/src/components/ExerciseBlock.jsx gym-app/src/index.css gym-app/public/sw.js
git commit -m "feat: show PR badge on exercise header, bump SW cache"
```

---

## Phase 3: Workout Complete Summary

**Goal:** When "Log Workout" is tapped, show a modal with session stats (exercises done, total sets, total volume, duration) before clearing the session.

**Volume formula:** sum of (reps × weight) across all sets of all exercises logged this session. Requires fetching today's logs on "Log Workout" tap.

**Duration:** Track session start time in localStorage when the first exercise is saved. Show elapsed time on summary.

**Files:**
- Modify: `gym-app/src/lib/storage.js` (add session start time helpers)
- New: `gym-app/src/components/WorkoutSummaryModal.jsx`
- Modify: `gym-app/src/components/LogView.jsx` (collect stats, show modal)
- Modify: `gym-app/src/index.css` (modal styles)
- Modify: `gym-app/public/sw.js` (bump to `lift-log-v6`)

---

### Task 3.1: Add session start time to storage.js

**Files:**
- Modify: `gym-app/src/lib/storage.js`

- [ ] **Step 1: Add start time helpers**

Add to the bottom of `gym-app/src/lib/storage.js`:

```js
const SESSION_START_KEY = 'wt_session_start_v1';
export const getSessionStart = () => parse(SESSION_START_KEY, null);
export const saveSessionStart = t => localStorage.setItem(SESSION_START_KEY, JSON.stringify(t));
export const clearSessionStart = () => localStorage.removeItem(SESSION_START_KEY);
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/lib/storage.js
git commit -m "feat: add session start time to storage helpers"
```

---

### Task 3.2: Create WorkoutSummaryModal component

**Files:**
- New: `gym-app/src/components/WorkoutSummaryModal.jsx`

- [ ] **Step 1: Create the component**

Create `gym-app/src/components/WorkoutSummaryModal.jsx`:

```jsx
function fmtDuration(ms) {
  const totalMins = Math.round(ms / 60000);
  if (totalMins < 60) return `${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtVolume(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

export default function WorkoutSummaryModal({ summary, onClose }) {
  if (!summary) return null;

  return (
    <div className="summary-overlay" onClick={onClose}>
      <div className="summary-modal" onClick={e => e.stopPropagation()}>
        <div className="summary-title">Session Complete 💪</div>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="summary-stat-value">{summary.exerciseCount}</div>
            <div className="summary-stat-label">Exercises</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat-value">{summary.totalSets}</div>
            <div className="summary-stat-label">Sets</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat-value">{fmtVolume(summary.totalVolume)}</div>
            <div className="summary-stat-label">Volume</div>
          </div>
          {summary.duration && (
            <div className="summary-stat">
              <div className="summary-stat-value">{fmtDuration(summary.duration)}</div>
              <div className="summary-stat-label">Duration</div>
            </div>
          )}
        </div>
        <div className="summary-exercises">
          {summary.exercises.map(ex => (
            <div className="summary-ex-row" key={ex.name}>
              <span className="summary-ex-name">{ex.name}</span>
              <span className="summary-ex-detail">{ex.sets} sets · {fmtVolume(ex.volume)}</span>
            </div>
          ))}
        </div>
        <button className="summary-close-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/components/WorkoutSummaryModal.jsx
git commit -m "feat: add WorkoutSummaryModal component"
```

---

### Task 3.3: Wire up summary in LogView

**Files:**
- Modify: `gym-app/src/components/LogView.jsx`

- [ ] **Step 1: Update imports**

Add to the top of `LogView.jsx`:

```js
import WorkoutSummaryModal from './WorkoutSummaryModal';
import { getSessionStart, saveSessionStart, clearSessionStart } from '../lib/storage';
import { getLogs } from '../lib/supabase';
```

Note: `clearSession` is already imported — keep it.

- [ ] **Step 2: Add `summary` state**

Add after existing state declarations:

```js
const [summary, setSummary] = useState(null);
```

- [ ] **Step 3: Record session start on first save**

At the start of `handleSave`, before the payload line, add:

```js
// Record session start time on first exercise saved
if (!Object.keys(session).length && !getSessionStart()) {
  saveSessionStart(Date.now());
}
```

- [ ] **Step 4: Replace `logWorkout` function**

Replace the existing `logWorkout` function with:

```js
async function logWorkout() {
  const count = Object.keys(session).length;
  if (!count) { showToast('Save at least one exercise first', true); return; }

  // Build summary from today's logged exercises
  try {
    const today = todayISO();
    const allLogs = await getLogs();
    const todayLogs = allLogs.filter(l => l.date === today && session[l.exId]);
    const startTime = getSessionStart();

    const exercises = todayLogs.map(l => ({
      name: l.exName,
      sets: l.sets.length,
      volume: l.sets.reduce((acc, s) => acc + s.reps * s.weight, 0),
    }));

    setSummary({
      exerciseCount: exercises.length,
      totalSets: exercises.reduce((acc, e) => acc + e.sets, 0),
      totalVolume: exercises.reduce((acc, e) => acc + e.volume, 0),
      duration: startTime ? Date.now() - startTime : null,
      exercises,
    });
  } catch (e) {
    // Fallback: just clear without summary
    clearSession();
    clearSessionStart();
    setSession({});
    showToast(`Session complete — ${count} exercise${count !== 1 ? 's' : ''} logged`);
  }
}
```

- [ ] **Step 5: Add `handleSummaryClose` function**

Add after `logWorkout`:

```js
function handleSummaryClose() {
  clearSession();
  clearSessionStart();
  setSession({});
  setSummary(null);
  showToast('Session cleared ✓');
}
```

- [ ] **Step 6: Render the modal**

In the return JSX, add `WorkoutSummaryModal` just before the closing `</>`:

```jsx
<WorkoutSummaryModal summary={summary} onClose={handleSummaryClose} />
```

- [ ] **Step 7: Commit**

```bash
git add gym-app/src/components/LogView.jsx
git commit -m "feat: show workout summary modal on session complete"
```

---

### Task 3.4: Style the summary modal

**Files:**
- Modify: `gym-app/src/index.css`
- Modify: `gym-app/public/sw.js`

- [ ] **Step 1: Add modal styles**

Add to `gym-app/src/index.css`:

```css
/* Workout Summary Modal */
.summary-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.summary-modal {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 32px 24px 40px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
}

.summary-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 28px;
  letter-spacing: 0.05em;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-stat {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.summary-stat-value {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 32px;
  color: #e8400c;
  line-height: 1;
}

.summary-stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-exercises {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.summary-ex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.summary-ex-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.summary-ex-detail {
  font-size: 13px;
  font-family: 'DM Mono', monospace;
  color: #888;
}

.summary-close-btn {
  width: 100%;
  padding: 16px;
  background: #e8400c;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 2: Bump SW cache name**

In `gym-app/public/sw.js`:
```js
const CACHE = 'lift-log-v6';
```

- [ ] **Step 3: Commit**

```bash
git add gym-app/src/index.css gym-app/public/sw.js
git commit -m "feat: style workout summary modal, bump SW cache"
```

---

## Approval Gates

Patrick approves each phase before the next begins. After each phase:
1. Run `npm run build` to confirm no build errors
2. Report what was built with a screenshot
3. Wait for explicit "deploy" instruction before using Netlify MCP tool

## SW Cache Version Reference

| Phase | Cache Name |
|-------|-----------|
| Timer fix (done) | lift-log-v3 |
| Phase 1 complete | lift-log-v4 |
| Phase 2 complete | lift-log-v5 |
| Phase 3 complete | lift-log-v6 |

**Image source:** Free exercise GIFs from `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/` — public domain, no API key needed.

**Files:**
- New: `gym-app/src/lib/exerciseInfo.js` (data for all 39 exercises)
- New: `gym-app/src/components/ExerciseInfoModal.jsx`
- Modify: `gym-app/src/components/ExerciseBlock.jsx` (tap name → open modal)
- Modify: `gym-app/src/index.css` (modal styles)
- Modify: `gym-app/public/sw.js` (bump to `lift-log-v7`)

---

### Task 4.1: Create exercise info data

**Files:**
- New: `gym-app/src/lib/exerciseInfo.js`

- [ ] **Step 1: Create the file**

Create `gym-app/src/lib/exerciseInfo.js` with the following. Each entry has `muscles` (primary[], secondary[]), `cues` (string[]), `mistakes` (string[]), and `image` (URL string or null):

```js
export const EXERCISE_INFO = {
  bench_press: {
    muscles: { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
    image: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    cues: [
      'Lie flat, feet planted, slight arch in lower back',
      'Grip just outside shoulder width, thumbs wrapped around bar',
      'Pull shoulder blades together and down into the bench',
      'Lower bar to lower chest with controlled tempo',
      'Press up and slightly back — bar path is not vertical',
    ],
    mistakes: ['Flared elbows (keep at ~45–60°)', 'Bouncing off chest', 'Lifting hips off bench'],
  },
  barbell_row: {
    muscles: { primary: ['Upper Back', 'Lats'], secondary: ['Biceps', 'Rear Delts'] },
    image: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Row/0.jpg',
    cues: [
      'Hinge at hips, torso 45–70° from floor',
      'Pull bar to lower ribcage, elbows drive back',
      'Squeeze shoulder blades at the top',
      'Lower with control — don\'t let the weight crash down',
    ],
    mistakes: ['Jerking with lower back', 'Pulling to stomach instead of ribcage', 'Not squeezing at top'],
  },
  incline_db: {
    muscles: { primary: ['Upper Chest'], secondary: ['Front Delts', 'Triceps'] },
    image: null,
    cues: [
      'Set bench to 30–45°',
      'Grip dumbbells with palms facing forward, slight inward angle',
      'Lower to chest level, elbows at ~60° from body',
      'Press up, bringing dumbbells slightly together at top',
    ],
    mistakes: ['Too steep an angle (works delts, not chest)', 'Flaring elbows fully out', 'Short range of motion'],
  },
  cable_row: {
    muscles: { primary: ['Mid Back', 'Lats'], secondary: ['Biceps', 'Rear Delts'] },
    image: null,
    cues: [
      'Sit tall, slight lean forward at start',
      'Drive elbows back, squeezing shoulder blades at end',
      'Keep chest up throughout — don\'t round forward to get extra range',
      'Control the return — don\'t let cable yank you forward',
    ],
    mistakes: ['Using momentum / body swing', 'Rounding upper back', 'Incomplete squeeze at top'],
  },
  lateral_d1: {
    muscles: { primary: ['Lateral Delts'], secondary: ['Traps'] },
    image: null,
    cues: [
      'Slight bend in elbows throughout',
      'Lead with elbows, not wrists — think of pouring a jug',
      'Raise to shoulder height only — no higher',
      'Lower slowly (2–3 seconds) for maximum tension',
    ],
    mistakes: ['Shrugging shoulders up', 'Using momentum / swinging', 'Raising past shoulder height'],
  },
  squat: {
    muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Core'] },
    image: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg',
    cues: [
      'Bar on upper traps (high bar) or rear delts (low bar)',
      'Feet shoulder-width, toes slightly out',
      'Brace core hard before descent — 360° of pressure',
      'Sit between heels, knees track over toes',
      'Drive through full foot, chest up on the way up',
    ],
    mistakes: ['Knees caving in', 'Butt wink at the bottom', 'Heels rising'],
  },
  rdl: {
    muscles: { primary: ['Hamstrings', 'Glutes'], secondary: ['Lower Back', 'Core'] },
    image: null,
    cues: [
      'Soft bend in knees throughout — this is not a stiff-leg deadlift',
      'Push hips back as bar slides down thighs',
      'Maintain a neutral spine — no rounding',
      'Feel a strong hamstring stretch, then drive hips forward to return',
    ],
    mistakes: ['Rounding the lower back', 'Bending knees too much (becomes a squat)', 'Bar drifting away from body'],
  },
  leg_press_d2: {
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Hamstrings'] },
    image: null,
    cues: [
      'Feet hip-width in the middle of the plate',
      'Lower until knees are at ~90° or just past',
      'Press through full foot — don\'t let heels rise',
      'Keep lower back pressed to pad throughout',
    ],
    mistakes: ['Allowing lower back to peel off pad', 'Partial range of motion', 'Locking out knees explosively'],
  },
  leg_curl_d2: {
    muscles: { primary: ['Hamstrings'], secondary: [] },
    image: null,
    cues: [
      'Lie face down, pad just above heels',
      'Curl heels toward glutes — full range of motion',
      'Squeeze hard at the top for 1 second',
      'Lower slowly (2–3 seconds)',
    ],
    mistakes: ['Hips lifting off the pad', 'Short range of motion', 'Using momentum on the way up'],
  },
  calf_d2: {
    muscles: { primary: ['Calves (Gastrocnemius)'], secondary: [] },
    image: null,
    cues: [
      'Full stretch at the bottom — don\'t cut the range short',
      'Drive up onto the ball of the foot',
      'Pause for 1 second at the top',
      'Lower slowly — calves respond to time under tension',
    ],
    mistakes: ['Bouncing at the bottom', 'Partial range of motion', 'Too fast a tempo'],
  },
  ohp: {
    muscles: { primary: ['Front Delts', 'Lateral Delts'], secondary: ['Triceps', 'Upper Chest'] },
    image: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/0.jpg',
    cues: [
      'Grip just outside shoulder width, bar resting on front delts',
      'Brace core, squeeze glutes — keep body rigid',
      'Press straight up, head moves back slightly to clear bar path',
      'Lock out at top without hyperextending the lower back',
    ],
    mistakes: ['Leaning back excessively', 'Flaring elbows wide', 'Not locking out at top'],
  },
  lat_pulldown: {
    muscles: { primary: ['Lats'], secondary: ['Biceps', 'Rear Delts'] },
    image: null,
    cues: [
      'Wide overhand grip, lean back slightly (~15°)',
      'Drive elbows down and back — think of putting them in your back pockets',
      'Squeeze lats at bottom, bar comes to upper chest',
      'Control the return — arms fully extend at top',
    ],
    mistakes: ['Pulling with biceps instead of lats', 'Leaning back too far', 'Not reaching full extension at top'],
  },
  db_lateral: {
    muscles: { primary: ['Lateral Delts'], secondary: ['Traps'] },
    image: null,
    cues: [
      'Slight forward lean at the waist',
      'Lead with elbows, slight bend maintained throughout',
      'Raise to shoulder height, no higher',
      'Lower under control — 2 full seconds down',
    ],
    mistakes: ['Shrugging at the top', 'Swinging the weight up', 'Wrists leading instead of elbows'],
  },
  ez_curl: {
    muscles: { primary: ['Biceps'], secondary: ['Brachialis', 'Brachioradialis'] },
    image: null,
    cues: [
      'Grip inner angled portion of EZ bar',
      'Upper arms stay pinned to sides throughout',
      'Curl to full contraction — squeeze at top',
      'Lower slowly to full extension',
    ],
    mistakes: ['Swinging elbows forward', 'Not reaching full extension', 'Using body momentum'],
  },
  tricep_push: {
    muscles: { primary: ['Triceps'], secondary: [] },
    image: null,
    cues: [
      'Rope or bar at upper chest height',
      'Elbows tucked at sides — they don\'t move',
      'Push down to full extension, flaring rope handles outward at bottom',
      'Control the return to starting position',
    ],
    mistakes: ['Elbows drifting forward', 'Leaning over the bar for extra range', 'Not fully extending at bottom'],
  },
  deadlift: {
    muscles: { primary: ['Hamstrings', 'Glutes', 'Lower Back'], secondary: ['Traps', 'Lats', 'Core'] },
    image: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg',
    cues: [
      'Bar over mid-foot, grip just outside legs',
      'Pull slack out of bar before initiating — "bend the bar"',
      'Push the floor away (like a leg press) for the first portion',
      'Bar stays dragging against shins and thighs throughout',
      'Lock hips through at the top — don\'t hyperextend',
    ],
    mistakes: ['Bar drifting away from body', 'Jerking the bar off the floor', 'Rounding the lower back'],
  },
  bss: {
    muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Core'] },
    image: null,
    cues: [
      'Rear foot elevated on bench, front foot ~2 feet forward',
      'Lower until front thigh is parallel to floor',
      'Keep torso upright — slight forward lean is fine',
      'Drive through front heel to return',
    ],
    mistakes: ['Front knee caving in', 'Leaning too far forward', 'Rear knee hitting the floor hard'],
  },
  leg_press_d4: {
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Hamstrings'] },
    image: null,
    cues: [
      'Feet hip-width in the middle of the plate',
      'Lower until knees are at ~90° or just past',
      'Press through full foot — don\'t let heels rise',
      'Keep lower back pressed to pad throughout',
    ],
    mistakes: ['Allowing lower back to peel off pad', 'Partial range of motion', 'Locking out knees explosively'],
  },
  leg_curl_d4: {
    muscles: { primary: ['Hamstrings'], secondary: [] },
    image: null,
    cues: [
      'Lie face down, pad just above heels',
      'Curl heels toward glutes — full range of motion',
      'Squeeze hard at the top for 1 second',
      'Lower slowly (2–3 seconds)',
    ],
    mistakes: ['Hips lifting off the pad', 'Short range of motion', 'Using momentum on the way up'],
  },
  calf_d4: {
    muscles: { primary: ['Calves (Gastrocnemius)'], secondary: [] },
    image: null,
    cues: [
      'Full stretch at the bottom — don\'t cut the range short',
      'Drive up onto the ball of the foot',
      'Pause for 1 second at the top',
      'Lower slowly — calves respond to time under tension',
    ],
    mistakes: ['Bouncing at the bottom', 'Partial range of motion', 'Too fast a tempo'],
  },
  incline_bar: {
    muscles: { primary: ['Upper Chest'], secondary: ['Front Delts', 'Triceps'] },
    image: null,
    cues: [
      'Set bench to 30–45°',
      'Grip slightly narrower than flat bench — shoulder width',
      'Lower bar to upper chest, elbows ~60° from torso',
      'Press up and slightly back',
    ],
    mistakes: ['Bench angle too steep (>45° shifts load to shoulders)', 'Elbows fully flared', 'Bar bouncing off chest'],
  },
  cs_db_row: {
    muscles: { primary: ['Lats', 'Mid Back'], secondary: ['Biceps', 'Rear Delts'] },
    image: null,
    cues: [
      'Chest supported on incline bench — no lower back involvement',
      'Let arms hang fully, then drive elbow up and back',
      'Squeeze shoulder blade at top for 1 second',
      'Lower fully — don\'t short the stretch',
    ],
    mistakes: ['Shrugging instead of rowing', 'Not achieving full retraction at top', 'Using momentum'],
  },
  cable_cross: {
    muscles: { primary: ['Chest (inner)'], secondary: ['Front Delts'] },
    image: null,
    cues: [
      'Cables set to upper position, slight forward lean',
      'Slight bend in elbows — maintained throughout',
      'Bring hands together in an arc, hands meet at navel height',
      'Squeeze chest hard at the centre',
    ],
    mistakes: ['Bending elbows too much (becomes a press)', 'Not squeezing at the centre', 'Inconsistent elbow angle'],
  },
  wide_cable_row: {
    muscles: { primary: ['Upper Back', 'Rear Delts'], secondary: ['Biceps'] },
    image: null,
    cues: [
      'Use a wide bar or rope, elbows flare out to sides',
      'Pull to lower chest, elbows go wide and back',
      'Focus on squeezing the upper back / rear delts',
      'Control the return',
    ],
    mistakes: ['Elbows dropping to a narrow row pattern', 'Using body swing', 'Incomplete range of motion'],
  },
  rear_delt_fly: {
    muscles: { primary: ['Rear Delts'], secondary: ['Upper Back', 'Traps'] },
    image: null,
    cues: [
      'Seated, chest on knees or standing with hinge',
      'Slight bend in elbows, arms open wide',
      'Lead with elbows, squeeze rear delts at top',
      'Don\'t use heavy weight — this is a detail muscle',
    ],
    mistakes: ['Too heavy (traps take over)', 'Not hinging enough (becomes lateral raise)', 'Jerking with momentum'],
  },
  hack_squat: {
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Hamstrings'] },
    image: null,
    cues: [
      'Feet shoulder-width, toes slightly out on plate',
      'Keep back pressed to pad throughout descent',
      'Lower until hips are below knees',
      'Drive through full foot on the way up',
    ],
    mistakes: ['Heels rising', 'Lower back peeling from pad', 'Partial range of motion'],
  },
  walking_lunge: {
    muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Core'] },
    image: null,
    cues: [
      'Step far enough forward so front shin stays vertical',
      'Lower until rear knee nearly touches floor',
      'Drive through front heel to step forward',
      'Keep torso upright throughout',
    ],
    mistakes: ['Front knee shooting past toes', 'Torso leaning forward', 'Short steps'],
  },
  leg_ext: {
    muscles: { primary: ['Quads'], secondary: [] },
    image: null,
    cues: [
      'Sit back fully in the seat, pad just above ankles',
      'Extend to full lockout — squeeze quads hard at top',
      'Hold for 1 second at full extension',
      'Lower slowly (2–3 seconds)',
    ],
    mistakes: ['Not reaching full extension', 'Hips lifting off seat', 'Too fast a tempo'],
  },
  seated_curl: {
    muscles: { primary: ['Hamstrings'], secondary: [] },
    image: null,
    cues: [
      'Seated position — knees at 90°, pad on lower calves',
      'Curl to full range — heels toward seat',
      'Squeeze at full contraction',
      'Lower with control — 2–3 seconds',
    ],
    mistakes: ['Short range of motion', 'Hips shifting', 'Too fast on the return'],
  },
  seated_calf_d6: {
    muscles: { primary: ['Calves (Soleus)'], secondary: [] },
    image: null,
    cues: [
      'Seated position targets soleus (deeper calf muscle)',
      'Full stretch at the bottom — heels as low as possible',
      'Drive up to full plantar flexion, pause 1 second',
      'Lower slowly',
    ],
    mistakes: ['Partial range of motion', 'Bouncing', 'Not pausing at the top'],
  },
  db_shoulder: {
    muscles: { primary: ['Front Delts', 'Lateral Delts'], secondary: ['Triceps'] },
    image: null,
    cues: [
      'Seated upright, dumbbells at shoulder height, palms forward',
      'Press straight up, dumbbells close but not touching at top',
      'Lower to 90° at the elbow — full range',
      'Keep lower back against pad — don\'t arch',
    ],
    mistakes: ['Arching lower back', 'Short range of motion', 'Letting dumbbells drift forward or backward'],
  },
  straight_pull: {
    muscles: { primary: ['Lats'], secondary: ['Chest', 'Triceps'] },
    image: null,
    cues: [
      'Stand facing cable, arm straight, slight hinge',
      'Pull bar or rope down in an arc to hips, keeping arms straight',
      'Squeeze lats hard at the bottom',
      'Return slowly to shoulder height',
    ],
    mistakes: ['Bending elbows', 'Not maintaining a hinge', 'Short range of motion'],
  },
  cable_lateral: {
    muscles: { primary: ['Lateral Delts'], secondary: [] },
    image: null,
    cues: [
      'Cable at ankle height, cross-body grip',
      'Raise arm to shoulder height in a lateral arc',
      'Slight elbow bend, lead with elbow',
      'Lower slowly against cable resistance',
    ],
    mistakes: ['Shrugging', 'Pulling with wrist instead of leading with elbow', 'Too fast on the return'],
  },
  incline_curl: {
    muscles: { primary: ['Biceps (long head)'], secondary: ['Brachialis'] },
    image: null,
    cues: [
      'Incline bench at ~60°, arms hang behind body — this is key for the stretch',
      'Curl with supinated grip, squeeze at the top',
      'Lower fully — let the arm extend behind the torso',
      'Do NOT swing — use a controlled tempo',
    ],
    mistakes: ['Swinging arms forward', 'Short range of motion at the bottom', 'Too heavy'],
  },
  oh_tri_ext: {
    muscles: { primary: ['Triceps (long head)'], secondary: [] },
    image: null,
    cues: [
      'Arms overhead, elbows pointing forward — not flared',
      'Lower weight behind head until elbows at ~90°',
      'Extend to full lockout at top',
      'Keep upper arms stationary throughout',
    ],
    mistakes: ['Elbows flaring out', 'Upper arms moving', 'Hyperextending at the top'],
  },
  sumo_dl: {
    muscles: { primary: ['Glutes', 'Hamstrings', 'Adductors'], secondary: ['Quads', 'Lower Back'] },
    image: null,
    cues: [
      'Wide stance, toes pointed out 45°+',
      'Grip inside legs, arms vertical',
      'Push knees out over toes as you drive through the floor',
      'Hips and shoulders rise at the same rate',
    ],
    mistakes: ['Knees caving in', 'Hips shooting up first', 'Rounding lower back'],
  },
  good_morning: {
    muscles: { primary: ['Hamstrings', 'Glutes'], secondary: ['Lower Back', 'Core'] },
    image: null,
    cues: [
      'Bar on upper traps, soft bend in knees',
      'Hinge at hips — push them back as torso descends',
      'Keep a neutral spine throughout — this is not a forward round',
      'Hamstring stretch initiates the return — drive hips forward',
    ],
    mistakes: ['Rounding the back', 'Squatting instead of hinging', 'Going too heavy'],
  },
  leg_press_d8: {
    muscles: { primary: ['Quads (inner emphasis)'], secondary: ['Glutes'] },
    image: null,
    cues: [
      'Feet close together in the centre of the plate',
      'Close stance shifts emphasis to inner quad (VMO)',
      'Lower until knees at 90°, press back through full foot',
      'Keep lower back pressed to pad',
    ],
    mistakes: ['Knees caving in (especially with close stance)', 'Heels rising', 'Lower back peeling off pad'],
  },
  nordic_curl: {
    muscles: { primary: ['Hamstrings'], secondary: ['Glutes', 'Core'] },
    image: null,
    cues: [
      'Kneel with ankles secured under a pad or bar',
      'Body rigid from knees to head — like a plank',
      'Lower slowly using hamstrings to control the descent',
      'Use hands to catch yourself and push back up if needed',
    ],
    mistakes: ['Hips breaking (bending at the waist)', 'Dropping too fast', 'Not fighting the descent'],
  },
  seated_calf_d8: {
    muscles: { primary: ['Calves (Soleus)'], secondary: [] },
    image: null,
    cues: [
      'Seated position targets soleus (deeper calf muscle)',
      'Full stretch at the bottom — heels as low as possible',
      'Drive up to full plantar flexion, pause 1 second',
      'Lower slowly',
    ],
    mistakes: ['Partial range of motion', 'Bouncing', 'Not pausing at the top'],
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/lib/exerciseInfo.js
git commit -m "feat: add exercise info data for all 39 exercises"
```

---

### Task 4.2: Create ExerciseInfoModal component

**Files:**
- New: `gym-app/src/components/ExerciseInfoModal.jsx`

- [ ] **Step 1: Create the component**

Create `gym-app/src/components/ExerciseInfoModal.jsx`:

```jsx
import { EXERCISE_INFO } from '../lib/exerciseInfo';

export default function ExerciseInfoModal({ ex, onClose }) {
  if (!ex) return null;
  const info = EXERCISE_INFO[ex.id];
  if (!info) return null;

  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-modal" onClick={e => e.stopPropagation()}>
        <div className="info-handle" />

        {info.image && (
          <div className="info-image-wrap">
            <img
              src={info.image}
              alt={ex.name}
              className="info-image"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}

        <div className="info-ex-name">{ex.name}</div>

        <div className="info-muscles">
          <div className="info-muscle-group">
            <span className="info-muscle-label">Primary</span>
            <span className="info-muscle-tags">
              {info.muscles.primary.map(m => (
                <span key={m} className="muscle-tag primary">{m}</span>
              ))}
            </span>
          </div>
          {info.muscles.secondary.length > 0 && (
            <div className="info-muscle-group">
              <span className="info-muscle-label">Secondary</span>
              <span className="info-muscle-tags">
                {info.muscles.secondary.map(m => (
                  <span key={m} className="muscle-tag secondary">{m}</span>
                ))}
              </span>
            </div>
          )}
        </div>

        <div className="info-section-title">Form Cues</div>
        <ol className="info-cues">
          {info.cues.map((c, i) => <li key={i}>{c}</li>)}
        </ol>

        <div className="info-section-title">Common Mistakes</div>
        <ul className="info-mistakes">
          {info.mistakes.map((m, i) => <li key={i}>{m}</li>)}
        </ul>

        <button className="info-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/components/ExerciseInfoModal.jsx
git commit -m "feat: add ExerciseInfoModal component"
```

---

### Task 4.3: Wire info modal into ExerciseBlock

**Files:**
- Modify: `gym-app/src/components/ExerciseBlock.jsx`

- [ ] **Step 1: Import the modal**

Add at the top of `ExerciseBlock.jsx`:

```jsx
import ExerciseInfoModal from './ExerciseInfoModal';
```

- [ ] **Step 2: Add `infoOpen` state**

Add inside the component, after the `open` state:

```jsx
const [infoOpen, setInfoOpen] = useState(false);
```

- [ ] **Step 3: Make the exercise name tappable**

Replace:

```jsx
<div className="ex-name">{ex.name}</div>
```

With:

```jsx
<div className="ex-name ex-name-tappable" onClick={e => { e.stopPropagation(); setInfoOpen(true); }}>
  {ex.name} <span className="info-icon">ⓘ</span>
</div>
```

- [ ] **Step 4: Render the modal**

At the very end of the component return, just before the closing `</div>` of `.exercise-block`:

```jsx
<ExerciseInfoModal ex={infoOpen ? ex : null} onClose={() => setInfoOpen(false)} />
```

- [ ] **Step 5: Commit**

```bash
git add gym-app/src/components/ExerciseBlock.jsx
git commit -m "feat: wire exercise name tap to info modal"
```

---

### Task 4.4: Style the info modal

**Files:**
- Modify: `gym-app/src/index.css`
- Modify: `gym-app/public/sw.js`

- [ ] **Step 1: Add info modal styles**

Add to `gym-app/src/index.css`:

```css
/* Exercise Info Modal */
.ex-name-tappable {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  font-size: 14px;
  color: #aaa;
  font-style: normal;
}

.info-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.info-modal {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 12px 24px 40px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.info-handle {
  width: 36px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0 auto 20px;
}

.info-image-wrap {
  width: 100%;
  aspect-ratio: 16/9;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.info-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-ex-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 24px;
  letter-spacing: 0.05em;
  color: #1a1a1a;
  margin-bottom: 16px;
}

.info-muscles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.info-muscle-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.info-muscle-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  min-width: 60px;
}

.info-muscle-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.muscle-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.muscle-tag.primary {
  background: #e8400c18;
  color: #e8400c;
}

.muscle-tag.secondary {
  background: #f0f0f0;
  color: #555;
}

.info-section-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  margin: 20px 0 10px;
}

.info-cues {
  padding-left: 18px;
  margin: 0 0 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-cues li {
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a1a;
}

.info-mistakes {
  padding-left: 18px;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-mistakes li {
  font-size: 13px;
  line-height: 1.4;
  color: #666;
}

.info-close-btn {
  width: 100%;
  padding: 14px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
}
```

- [ ] **Step 2: Bump SW cache name**

In `gym-app/public/sw.js`:
```js
const CACHE = 'lift-log-v7';
```

- [ ] **Step 3: Commit**

```bash
git add gym-app/src/index.css gym-app/public/sw.js
git commit -m "feat: style exercise info modal, bump SW cache"
```

---

## Approval Gates

Patrick approves each phase before the next begins. After each phase:
1. Run `npm run build` to confirm no build errors
2. Report what was built with a screenshot
3. Wait for explicit "deploy" instruction before using Netlify MCP tool

## SW Cache Version Reference

| Phase | Cache Name |
|-------|-----------|
| Timer fix (done) | lift-log-v3 |
| Phase 1 complete | lift-log-v4 |
| Phase 2 complete | lift-log-v5 |
| Phase 3 complete | lift-log-v6 |
| Phase 4 complete | lift-log-v7 |
