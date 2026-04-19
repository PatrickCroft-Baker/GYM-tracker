# Multi-User Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email + password login/signup so multiple users can each have their own workout data, while keeping the existing single-table Supabase setup.

**Architecture:** Supabase Auth handles identity. A `user_id uuid DEFAULT auth.uid()` column is added to `workout_logs` — new inserts auto-tag themselves with the current user's ID via Supabase's session context, so almost no app code changes are needed. Row Level Security restricts all reads/writes to the owner's rows. A `useAuth` hook manages session state and gates the app behind an `AuthScreen` when logged out.

**Tech Stack:** Supabase Auth (built into existing `@supabase/supabase-js`), React useState/useEffect, existing CSS design system (Bebas Neue, DM Sans, accent `#e8400c`)

**Deploy:** Via Netlify MCP tool — only deploy when Patrick explicitly says to.

**Supabase free tier:** 50,000 monthly active users — no upgrade needed.

---

## Pre-flight: What changes and what doesn't

**Changes:**
- `workout_logs` table: new `user_id` column, new unique constraint, updated RLS
- `gym-app/src/lib/supabase.js`: one-line change to `upsertLog` conflict key
- `gym-app/src/hooks/useAuth.js`: new file
- `gym-app/src/components/AuthScreen.jsx`: new file
- `gym-app/src/App.jsx`: gate behind auth, add logout
- `gym-app/src/index.css`: auth screen styles
- `gym-app/public/sw.js`: bump to `lift-log-v7`

**Doesn't change:**
- All other Supabase query functions (RLS filters automatically)
- LogView, HistoryView, ProgressView, ExerciseBlock — untouched
- localStorage schema — custom program stays per-device (intentional)

---

## Task 1: Supabase Dashboard — schema + auth config

**This is a manual task. Run each SQL block in the Supabase SQL Editor.**
Go to: https://tsgqqghdocoeudargsom.supabase.co → SQL Editor

- [ ] **Step 1: Disable email confirmation**

In Supabase Dashboard → Authentication → Email → turn **"Enable email confirmations"** OFF. This lets users sign up and log in immediately without verifying their email.

- [ ] **Step 2: Add user_id column**

Run in SQL Editor:

```sql
ALTER TABLE workout_logs
  ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
```

Existing rows get `user_id = NULL` — that's fine, they'll be migrated in Task 6.

- [ ] **Step 3: Drop old unique constraint, add new one**

The old constraint is on `(ex_id, log_date)`. With multi-user, two people can train the same exercise on the same day, so the constraint must include `user_id`.

Run in SQL Editor:

```sql
-- Find and drop the old constraint (name may vary — check with \d workout_logs if needed)
ALTER TABLE workout_logs
  DROP CONSTRAINT IF EXISTS workout_logs_ex_id_log_date_key;

-- Add new constraint
ALTER TABLE workout_logs
  ADD CONSTRAINT workout_logs_user_id_ex_id_log_date_key
  UNIQUE (user_id, ex_id, log_date);
```

- [ ] **Step 4: Update RLS policies**

```sql
-- Remove the old allow-all policy
DROP POLICY IF EXISTS "Allow all" ON workout_logs;

-- Users can only read/write their own rows
CREATE POLICY "users_own_logs" ON workout_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 5: Verify**

Run this — it should return 0 rows (no policies other than the new one):

```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'workout_logs'
AND policyname != 'users_own_logs';
```

---

## Task 2: Create useAuth hook

**Files:**
- Create: `gym-app/src/hooks/useAuth.js`

- [ ] **Step 1: Create the file**

```js
import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    sb.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    sb.auth.signUp({ email, password });

  const signOut = () => sb.auth.signOut();

  return { user, loading, signIn, signUp, signOut };
}
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/hooks/useAuth.js
git commit -m "feat: add useAuth hook for Supabase session management"
```

---

## Task 3: Create AuthScreen component

**Files:**
- Create: `gym-app/src/components/AuthScreen.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';

export default function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fn = mode === 'login' ? onSignIn : onSignUp;
    const { error: err } = await fn(email, password);
    if (err) setError(err.message);
    setLoading(false);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">LIFT LOG</div>
        <div className="auth-sub">{mode === 'login' ? 'Sign in to continue' : 'Create an account'}</div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button
          className="auth-toggle"
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/components/AuthScreen.jsx
git commit -m "feat: add AuthScreen login/signup component"
```

---

## Task 4: Update supabase.js — fix upsert conflict key

**Files:**
- Modify: `gym-app/src/lib/supabase.js`

The only required code change is the `onConflict` key in `upsertLog` — it must match the new unique constraint `(user_id, ex_id, log_date)`. All other queries are automatically scoped by RLS once the user is authenticated, so no other changes are needed.

- [ ] **Step 1: Update the conflict key in upsertLog**

Change line 25 from:

```js
const { error } = await sb.from('workout_logs').upsert(payload, { onConflict: 'ex_id,log_date' });
```

To:

```js
const { error } = await sb.from('workout_logs').upsert(payload, { onConflict: 'user_id,ex_id,log_date' });
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/lib/supabase.js
git commit -m "fix: update upsert conflict key to include user_id"
```

---

## Task 5: Update App.jsx — gate behind auth, add logout

**Files:**
- Modify: `gym-app/src/App.jsx`

- [ ] **Step 1: Rewrite App.jsx**

Replace the entire file with:

```jsx
import { useState, useEffect, useCallback } from 'react';
import LogView from './components/LogView';
import HistoryView from './components/HistoryView';
import ProgressView from './components/ProgressView';
import AuthScreen from './components/AuthScreen';
import { useOffline } from './hooks/useOffline';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [tab, setTab] = useState('log');
  const [toast, setToast] = useState({ msg: '', err: false, visible: false });
  const isOnline = useOffline();
  const { user, loading, signIn, signUp, signOut } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  if (loading) return (
    <div className="app-shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#888' }}>
        Loading…
      </div>
    </div>
  );

  if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>LIFT LOG</h1>
        <button className="signout-btn" onClick={signOut}>Sign out</button>
      </header>

      {!isOnline && (
        <div className="offline-banner">Offline — changes will sync when reconnected</div>
      )}

      <nav className="tab-bar">
        {[['log', 'Log'], ['history', 'History'], ['progress', 'Progress']].map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'log' && <LogView isOnline={isOnline} showToast={showToast} />}
        {tab === 'history' && <HistoryView showToast={showToast} />}
        {tab === 'progress' && <ProgressView />}
      </main>

      <div className={`toast${toast.visible ? ' show' : ''}${toast.err ? ' err' : ''}`}>
        {toast.msg}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add gym-app/src/App.jsx
git commit -m "feat: gate app behind auth, add sign out button"
```

---

## Task 6: Add auth styles to index.css

**Files:**
- Modify: `gym-app/src/index.css`
- Modify: `gym-app/public/sw.js`

- [ ] **Step 1: Add styles at the bottom of index.css**

```css
/* ── Auth Screen ── */
.auth-screen {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  padding: 24px;
}

.auth-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 28px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.auth-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 40px;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-bottom: 4px;
}

.auth-sub {
  font-size: 14px;
  color: #888;
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
}

.auth-input {
  padding: 14px 16px;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  font-family: 'DM Sans', sans-serif;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}

.auth-input:focus {
  border-color: var(--accent);
}

.auth-error {
  font-size: 13px;
  color: var(--accent);
  background: #e8400c12;
  border-radius: 8px;
  padding: 10px 14px;
}

.auth-submit {
  margin-top: 8px;
  padding: 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.04em;
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.auth-toggle {
  display: block;
  width: 100%;
  margin-top: 20px;
  background: none;
  border: none;
  font-size: 14px;
  color: #888;
  cursor: pointer;
  text-align: center;
  font-family: 'DM Sans', sans-serif;
}

.auth-toggle:hover { color: var(--accent); }

/* Sign out button in header */
.signout-btn {
  font-size: 12px;
  font-family: 'DM Mono', monospace;
  color: #aaa;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.signout-btn:hover { color: var(--accent); border-color: var(--accent); }

.app-header { position: relative; }
```

- [ ] **Step 2: Bump SW cache**

In `gym-app/public/sw.js`:

```js
const CACHE = 'lift-log-v7';
```

- [ ] **Step 3: Build to verify no errors**

```bash
cd gym-app && npm run build
```

Expected: `✓ built in X.XXs` with no errors.

- [ ] **Step 4: Commit**

```bash
git add gym-app/src/index.css gym-app/public/sw.js
git commit -m "feat: add auth screen styles, sign out button, bump SW cache"
```

---

## Task 7: Migrate Patrick's existing data (manual, post-signup)

After signing up with your account, run this in the Supabase SQL Editor to claim your existing logs.

- [ ] **Step 1: Find your user ID**

After signing up in the app, go to Supabase Dashboard → Authentication → Users. Copy your UUID.

- [ ] **Step 2: Assign existing logs**

In SQL Editor, replace `YOUR-UUID-HERE` with your actual UUID:

```sql
UPDATE workout_logs
SET user_id = 'YOUR-UUID-HERE'
WHERE user_id IS NULL;
```

- [ ] **Step 3: Verify**

```sql
SELECT COUNT(*) FROM workout_logs WHERE user_id IS NULL;
```

Expected: `0`

- [ ] **Step 4: Make user_id required (optional but recommended)**

```sql
ALTER TABLE workout_logs ALTER COLUMN user_id SET NOT NULL;
```

---

## Task 8: Update docs

- [ ] **Step 1: Update CLAUDE.md**

Update the "Key rules" section — remove "Do NOT add auth" and replace with:

```
- Auth: Supabase Auth (email + password), no email verification, session managed by useAuth hook
- user_id column on workout_logs is auto-set via DEFAULT auth.uid() — do NOT pass it manually in queries
- upsert conflict key: 'user_id,ex_id,log_date' — must match the DB unique constraint
```

Update "What's done" to include auth.

Update SW cache reference from `lift-log-v6` to `lift-log-v7`.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for multi-user auth"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Logged-out state shows AuthScreen, not the log
- [ ] Sign up creates a new account (no verification email needed)
- [ ] Sign in works with existing credentials
- [ ] Wrong password shows error message
- [ ] Sign out returns to AuthScreen
- [ ] Two different accounts cannot see each other's logs
- [ ] New logs are automatically scoped to the logged-in user
- [ ] Offline queue still works (queue is flushed on reconnect with user's session active)
- [ ] "Sign out" button visible but unobtrusive in header
