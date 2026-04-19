import { useState, useEffect, useRef } from 'react';
import RestTimer from './RestTimer';
import { getDrafts, saveDrafts, getSession } from '../lib/storage';

function restLabel(s) {
  if (s >= 60 && s % 60 === 0) return `${s / 60} min`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[parseInt(m) - 1]} ${y}`;
}

export default function ExerciseBlock({ ex, autoOpen, last, isLogged, isPR, timer, onStartTimer, onSkipTimer, onSave, onRemove }) {
  const [open, setOpen] = useState(autoOpen);
  const [rows, setRows] = useState([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const drafts = getDrafts();
    if (drafts[ex.id]) {
      setRows(drafts[ex.id].map(s => ({ reps: s.reps, weight: s.weight, ticked: false })));
    } else if (last) {
      setRows(last.sets.map(s => ({ reps: String(s.reps), weight: String(s.weight), ticked: false, autofilled: true })));
    } else {
      setRows(Array.from({ length: ex.sets }, () => ({ reps: '', weight: '', ticked: false })));
    }
  }, [ex.id, ex.sets, last]);

  function updateRow(idx, field, val) {
    // Update only this cell — no cascade yet (cascade happens on blur)
    setRows(prev => {
      const next = prev.map((r, i) => i === idx ? { ...r, [field]: val, autofilled: false } : r);
      const drafts = getDrafts();
      drafts[ex.id] = next.map(r => ({ reps: r.reps, weight: r.weight }));
      saveDrafts(drafts);
      return next;
    });
  }

  function cascadeRow(idx, field, val) {
    // On blur: fill empty cells below with the finished value
    if (!val) return;
    setRows(prev => {
      const hasEmpty = prev.slice(idx + 1).some(r => !r[field]);
      if (!hasEmpty) return prev;
      const next = prev.map((r, i) => {
        if (i > idx && !prev[i][field]) return { ...r, [field]: val, autofilled: false };
        return r;
      });
      const drafts = getDrafts();
      drafts[ex.id] = next.map(r => ({ reps: r.reps, weight: r.weight }));
      saveDrafts(drafts);
      return next;
    });
  }

  function tickRow(idx) {
    setRows(prev => {
      const next = prev.map((r, i) => i === idx ? { ...r, ticked: !r.ticked, autofilled: false } : r);
      const nowTicked = next[idx].ticked;
      if (nowTicked) onStartTimer(ex.id, ex.restSecs);
      return next;
    });
  }

  function addRow() {
    setRows(prev => [...prev, { reps: '', weight: '', ticked: false }]);
  }

  function delRow(idx) {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== idx);
      const drafts = getDrafts();
      drafts[ex.id] = next.map(r => ({ reps: r.reps, weight: r.weight }));
      saveDrafts(drafts);
      return next;
    });
  }

  function handleSave() {
    const setsData = [];
    for (const r of rows) {
      const reps = parseInt(r.reps), weight = parseFloat(r.weight);
      if (!r.reps || !r.weight || reps <= 0 || isNaN(reps) || weight < 0 || isNaN(weight)) return onSave(null);
      setsData.push({ reps, weight });
    }
    if (!setsData.length) return onSave(null);
    onSave(setsData);
  }

  return (
    <div className="exercise-block" data-exid={ex.id}>
      <div className="ex-header" onClick={() => setOpen(o => !o)}>
        <div className="ex-header-left">
          <div className="ex-name">{ex.name}</div>
          <div className="ex-meta">
            <span className="badge badge-prescription">{ex.sets} sets · {ex.reps} reps</span>
            <span className="badge badge-rest">Rest {restLabel(ex.restSecs)}</span>
          </div>
        </div>
        <div className="ex-header-right">
          {isPR && <div className="pr-pill">PR</div>}
          {isLogged && <div className="done-pill show">✓ Done</div>}
          <div className={`ex-chevron${open ? ' open' : ''}`}>▾</div>
        </div>
      </div>

      {open && (
        <div className="ex-body">
          {last && (
            <div className="last-note">
              Last ({fmtDate(last.date)}): {last.sets.map(s => `${s.reps}×${s.weight}kg`).join(', ')}
            </div>
          )}
          <RestTimer timer={timer} exId={ex.id} onSkip={onSkipTimer} />
          <div className="sets-area">
            {rows.map((row, i) => (
              <div className="set-row" key={i}>
                <div className="set-label">S{i + 1}</div>
                <div className="set-field">
                  <div className="set-field-label">Reps</div>
                  <input
                    type="number" inputMode="numeric" placeholder="—" min="1" max="100"
                    className={`set-input${row.autofilled ? ' autofilled' : ''}${row.ticked ? ' done-set' : ''}`}
                    value={row.reps}
                    onFocus={e => { updateRow(i, 'reps', e.target.value); }}
                    onChange={e => updateRow(i, 'reps', e.target.value)}
                    onBlur={e => cascadeRow(i, 'reps', e.target.value)}
                  />
                </div>
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
                <button className={`set-tick-btn${row.ticked ? ' ticked' : ''}`} onClick={() => tickRow(i)}>✓</button>
                <button className="set-del-btn" onClick={() => delRow(i)}>×</button>
              </div>
            ))}
          </div>
          <div className="sets-footer">
            <button className="btn-add-set" onClick={addRow}>+ Set</button>
            <button
              className={`btn-save-ex${isLogged ? ' saved' : ''}`}
              onClick={isLogged ? onRemove : handleSave}
            >
              {isLogged ? 'Saved ✓' : 'Save Exercise'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
