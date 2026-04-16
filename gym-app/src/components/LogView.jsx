import { useState, useEffect } from 'react';
import ExerciseBlock from './ExerciseBlock';
import ProgramEditor from './ProgramEditor';
import { PROGRAM } from '../lib/program';
import { getSession, saveSession, clearSession, getDrafts, saveDrafts, getQueue, saveQueue, getWeek, saveWeek, getCustomProgram, saveCustomProgram } from '../lib/storage';
import { upsertLog, deleteLogForExDate, getLastSessionForEx } from '../lib/supabase';
import { useTimer } from '../hooks/useTimer';

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function LogView({ isOnline, showToast }) {
  const [week, setWeek] = useState(getWeek);
  const [program, setProgram] = useState(() => getCustomProgram() || PROGRAM);
  const [session, setSession] = useState(getSession);
  const [lastSessions, setLastSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null); // { week, index }
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
    }

    const next = { ...session, [ex.id]: true };
    setSession(next);
    saveSession(next);
    const drafts = getDrafts();
    delete drafts[ex.id];
    saveDrafts(drafts);
    showToast(`${ex.name} saved ✓`);
  }

  async function handleRemove(ex) {
    if (!confirm('Remove log and re-edit?')) return;
    const next = { ...session };
    delete next[ex.id];
    setSession(next);
    saveSession(next);
    await deleteLogForExDate(ex.id, todayISO());
    showToast('Log removed — re-edit and save');
  }

  function logWorkout() {
    const count = Object.keys(session).length;
    if (!count) { showToast('Save at least one exercise first', true); return; }
    clearSession();
    setSession({});
    showToast(`Session complete — ${count} exercise${count !== 1 ? 's' : ''} logged`);
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
                      // ensure body is expanded
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
    </>
  );
}
