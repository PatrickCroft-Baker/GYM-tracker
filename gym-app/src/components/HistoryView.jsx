import { useState, useEffect } from 'react';
import { getLogs, deleteLog, deleteAllLogs } from '../lib/supabase';

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[parseInt(m) - 1]} ${y}`;
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

export default function HistoryView({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEx, setFilterEx] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  async function load() {
    setLoading(true);
    const data = await getLogs();
    setLogs(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    await deleteLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  }

  async function handleClearAll() {
    if (!confirm('Delete ALL data? Cannot be undone.')) return;
    await deleteAllLogs();
    setLogs([]);
  }

  async function exportCSV() {
    showToast('Preparing CSV…');
    if (!logs.length) { showToast('No data to export', true); return; }
    const rows = [['Date', 'Exercise', 'Set', 'Reps', 'Weight (kg)']];
    logs.forEach(log => {
      log.sets.forEach((s, i) => rows.push([log.date, log.exName, i + 1, s.reps, s.weight]));
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: logs.length
        ? `workout_history_${logs[0].date}_to_${logs[logs.length - 1].date}.csv`
        : `workout_history_${todayISO()}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('CSV downloaded!');
  }

  const uniqueEx = [...new Map(logs.map(l => [l.exId, l.exName])).entries()];

  let filtered = [...logs].reverse();
  if (filterEx) filtered = filtered.filter(l => l.exId === filterEx);
  if (filterPeriod) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(filterPeriod));
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    filtered = filtered.filter(l => l.date >= cutoffISO);
  }

  function avg(e) { return e.sets.reduce((a, s) => a + s.weight, 0) / e.sets.length; }

  return (
    <div className="view-content">
      <div className="filter-row">
        <select className="filter-select" value={filterEx} onChange={e => setFilterEx(e.target.value)}>
          <option value="">All exercises</option>
          {uniqueEx.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select className="filter-select" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={{ minWidth: 130 }}>
          <option value="">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button className="btn-sm" onClick={() => { setFilterEx(''); setFilterPeriod(''); }}>Clear</button>
        <button className="btn-sm" onClick={exportCSV}>Export CSV</button>
        <button className="btn-sm-danger" onClick={handleClearAll}>Delete All</button>
      </div>

      <div className="history-list">
        {loading ? (
          <div className="empty-state"><div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>Loading…</div>
        ) : !filtered.length ? (
          <div className="empty-state"><div className="empty-icon">📋</div>No logs yet.</div>
        ) : filtered.map(log => {
          const prev = logs.filter(l => l.exId === log.exId && l.ts < log.ts);
          const prevLog = prev.length ? prev[prev.length - 1] : null;
          let delta = null;
          if (!prevLog) delta = <span className="delta-pill delta-first">First</span>;
          else {
            const diff = Math.round((avg(log) - avg(prevLog)) * 10) / 10;
            if (diff > 0) delta = <span className="delta-pill delta-up">▲ +{diff}kg</span>;
            else if (diff < 0) delta = <span className="delta-pill delta-down">▼ {diff}kg</span>;
            else delta = <span className="delta-pill delta-same">= same</span>;
          }
          return (
            <div className="history-card" key={log.id}>
              <div className="history-card-header">
                <div>
                  <div className="history-ex-name">{log.exName}</div>
                  <div className="history-date">{fmtDate(log.date)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {delta}
                  <button className="history-del-btn" onClick={() => handleDelete(log.id)}>×</button>
                </div>
              </div>
              <div>
                {log.sets.map((s, i) => (
                  <div className="history-set-row" key={i}>
                    <span className="history-set-label">Set {i + 1}</span>
                    <span className="history-set-value">{s.reps} reps × {s.weight}kg</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
