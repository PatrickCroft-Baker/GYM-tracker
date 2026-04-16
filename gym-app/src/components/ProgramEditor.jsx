import { useState } from 'react';

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '75s', value: 75 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
];

function newEx() {
  return { id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: '', sets: 3, reps: '8–12', restSecs: 90 };
}

export default function ProgramEditor({ day, defaultExercises, onSave, onCancel }) {
  const [exercises, setExercises] = useState(() => day.exercises.map(e => ({ ...e })));

  function updateEx(i, field, val) {
    setExercises(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  }

  function delEx(i) {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
  }

  function addEx() {
    setExercises(prev => [...prev, newEx()]);
  }

  function handleReset() {
    if (!confirm('Reset this day to the default program?')) return;
    setExercises(defaultExercises.map(e => ({ ...e })));
  }

  function handleSave() {
    const valid = exercises.filter(e => e.name.trim());
    if (!valid.length) { alert('Add at least one exercise'); return; }
    onSave(valid);
  }

  return (
    <div className="pe-wrap">
      <div className="pe-top-bar">
        <span className="pe-title">Editing {day.subtitle}</span>
        <div className="pe-top-actions">
          <button className="btn-sm" onClick={handleReset}>Reset</button>
          <button className="btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn-sm pe-save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>

      <div className="pe-list">
        {exercises.map((ex, i) => (
          <div className="pe-row" key={ex.id}>
            <div className="pe-row-main">
              <input
                className="pe-name-input"
                placeholder="Exercise name"
                value={ex.name}
                onChange={e => updateEx(i, 'name', e.target.value)}
              />
              <button className="pe-del-btn" onClick={() => delEx(i)}>×</button>
            </div>
            <div className="pe-row-meta">
              <div className="pe-meta-field">
                <div className="pe-meta-label">Sets</div>
                <input
                  type="number" inputMode="numeric" min="1" max="10"
                  className="pe-meta-input"
                  value={ex.sets}
                  onChange={e => updateEx(i, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="pe-meta-field">
                <div className="pe-meta-label">Reps</div>
                <input
                  className="pe-meta-input pe-reps"
                  placeholder="6–10"
                  value={ex.reps}
                  onChange={e => updateEx(i, 'reps', e.target.value)}
                />
              </div>
              <div className="pe-meta-field pe-meta-rest">
                <div className="pe-meta-label">Rest</div>
                <select
                  className="pe-rest-select"
                  value={ex.restSecs}
                  onChange={e => updateEx(i, 'restSecs', parseInt(e.target.value))}
                >
                  {REST_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-add-set pe-add-btn" onClick={addEx}>+ Add Exercise</button>
    </div>
  );
}
