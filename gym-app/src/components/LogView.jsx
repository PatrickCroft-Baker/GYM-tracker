import { useState, useEffect } from 'react';
import ExerciseBlock from './ExerciseBlock';
import ProgramEditor from './ProgramEditor';
import WorkoutSummaryModal from './WorkoutSummaryModal';
import { PROGRAM } from '../lib/program';
import { getSession, saveSession, clearSession, getDrafts, saveDrafts, getQueue, saveQueue, getWeek, saveWeek, getCustomProgram, saveCustomProgram, getSessionStart, saveSessionStart, clearSessionStart } from '../lib/storage';
import { upsertLog, deleteLogForExDate, getLastSessionForEx, getBestWeightForEx, getLogs } from '../lib/supabase';
import { useTimer } from '../hooks/useTimer';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function LogView({ isOnline, showToast }) {
  const [week, setWeek] = useState(getWeek);
  const [program, setProgram] = useState(() => getCustomProgram() || PROGRAM);
  const [session, setSession] = useState(getSession);
  const [lastSessions, setLastSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null); // { week, index }
  const [prExIds, setPrExIds] = useState(new Set());
  const [summary, setSummary] = useState(null);
  const { activeTimer, startTimer, skipTimer } = useTimer();

  const days = program[week];

  useEffect(() => {
    setLoading(true);
    const allEx = days.flatMap(d => d.exercises);
    Promise.all(allEx.map(ex => getLastSessionForEx(ex.id)))
      .then(results => {
        const map = {};
        allEx.forEach((ex, i) => { map[ex.id] = results[i]; });
        setLastSessions(map);
      })
      .finally(() => setLoading(false));
  }, [week, program]);

  function switchWeek(w) {
    setWeek(w);
    saveWeek(w);
    setEditingDay(null);
  }

  async function handleSave(ex, setsData) {
    if (!setsData) { showToast('Fill in all sets first (reps > 0, weight ≥ 0)', true); return; }

    // Record session start on first exercise saved
    if (!Object.keys(session).length && !getSessionStart()) {
      saveSessionStart(Date.now());
    }

    const payload = { log_date: todayISO(), ex_id: ex.id, ex_name: ex.name, sets: setsData };

    // PR check — read historical best BEFORE upserting so the new record isn't included
    let isPRSave = false;
    if (isOnline && setsData.length > 0) {
      try {
        const prevBest = await getBestWeightForEx(ex.id);
        const newBest = Math.max(...setsData.map(s => s.weight));
        if (newBest > prevBest) isPRSave = true;
      } catch (e) { console.error('PR check failed:', e); }
    }

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
    }

    if (isPRSave) setPrExIds(prev => new Set([...prev, ex.id]));

    const next = { ...session, [ex.id]: true };
    setSession(next);
    saveSession(next);
    const drafts = getDrafts();
    delete drafts[ex.id];
    saveDrafts(drafts);
    showToast(isPRSave ? `${ex.name} — new best` : `${ex.name} saved ✓`);
  }

  async function handleRemove(ex) {
    if (!confirm('Remove log and re-edit?')) return;
    const next = { ...session };
    delete next[ex.id];
    setSession(next);
    saveSession(next);
    setPrExIds(prev => { const s = new Set(prev); s.delete(ex.id); return s; });
    await deleteLogForExDate(ex.id, todayISO());
    showToast('Log removed — re-edit and save');
  }

  async function logWorkout() {
    const count = Object.keys(session).length;
    if (!count) { showToast('Save at least one exercise first', true); return; }

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
      console.error('Failed to load summary:', e);
      showToast('Could not load summary — please try again', true);
    }
  }

  function handleSummaryClose() {
    clearSession();
    clearSessionStart();
    setSession({});
    setPrExIds(new Set());
    setSummary(null);
  }

  function handleDaySave(weekKey, dayIndex, newExercises) {
    const newProg = {
      ...program,
      [weekKey]: program[weekKey].map((d, i) =>
        i === dayIndex ? { ...d, exercises: newExercises } : d
      ),
    };
    setProgram(newProg);
    saveCustomProgram(newProg);
    setEditingDay(null);
    showToast('Program updated ✓');
  }

  return (
    <>
      <div className="week-toggle-bar">
        <button className={`week-btn${week === 'A' ? ' active' : ''}`} onClick={() => switchWeek('A')}>Week A</button>
        <button className={`week-btn${week === 'B' ? ' active' : ''}`} onClick={() => switchWeek('B')}>Week B</button>
      </div>

      <div className="view-content">
        {days.map((day, i) => {
          const isEditing = editingDay?.week === week && editingDay?.index === i;
          return (
            <div className="day-card" key={day.day}>
              <div className="day-header" onClick={e => {
                if (isEditing) return;
                const body = e.currentTarget.nextElementSibling;
                const chev = e.currentTarget.querySelector('.day-chevron');
                body.classList.toggle('collapsed');
                chev.classList.toggle('open');
              }}>
                <div>
                  <div className="day-title">{day.title}</div>
                  <div className="day-subtitle">{day.subtitle}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="day-edit-btn"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingDay(isEditing ? null : { week, index: i });
                      const body = e.currentTarget.closest('.day-card').querySelector('.day-body');
                      const chev = e.currentTarget.closest('.day-card').querySelector('.day-chevron');
                      if (body) body.classList.remove('collapsed');
                      if (chev) chev.classList.add('open');
                    }}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  <div className={`day-chevron${i === 0 ? ' open' : ''}`}>▾</div>
                </div>
              </div>

              <div className={`day-body${i !== 0 ? ' collapsed' : ''}`}>
                {isEditing ? (
                  <ProgramEditor
                    day={day}
                    defaultExercises={PROGRAM[week][i].exercises}
                    onSave={exs => handleDaySave(week, i, exs)}
                    onCancel={() => setEditingDay(null)}
                  />
                ) : loading ? (
                  <div className="loading-state">Loading…</div>
                ) : (
                  day.exercises.map((ex, j) => (
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
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="log-workout-bar">
        <button className="btn-log-workout" onClick={logWorkout}>Log Workout</button>
      </div>

      <WorkoutSummaryModal summary={summary} onClose={handleSummaryClose} />
    </>
  );
}
