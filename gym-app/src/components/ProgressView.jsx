import { useState, useEffect } from 'react';
import { getLogs } from '../lib/supabase';

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} ${'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[parseInt(m) - 1]} ${y}`;
}

export default function ProgressView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogs().then(data => { setLogs(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="view-content">
      <div className="empty-state"><div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>Loading…</div>
    </div>
  );

  const days = new Set(logs.map(l => l.date)).size;
  const allIds = [...new Set(logs.map(l => l.exId))];
  let bigName = '—', bigGain = 0;
  allIds.forEach(id => {
    const el = logs.filter(l => l.exId === id);
    if (el.length < 2) return;
    const g = (el[el.length - 1].sets[0]?.weight ?? 0) - (el[0].sets[0]?.weight ?? 0);
    if (g > bigGain) { bigGain = g; bigName = el[0].exName; }
  });

  const maxW = logs.length ? Math.max(...logs.flatMap(l => l.sets.map(s => s.weight))) : 1;

  return (
    <div className="view-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{days}</div>
          <div className="stat-sub">days trained</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exercises</div>
          <div className="stat-value">{allIds.length}</div>
          <div className="stat-sub">unique lifts logged</div>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Biggest Gain</div>
          <div className="stat-value">{bigGain > 0 ? `+${bigGain}kg` : '—'}</div>
          <div className="stat-sub">{bigName}</div>
        </div>
      </div>

      <div className="section-title">Weight Progression</div>

      {!allIds.length ? (
        <div className="empty-state"><div className="empty-icon">📈</div>No data yet.</div>
      ) : allIds.map(id => {
        const el = logs.filter(l => l.exId === id);
        const fMax = Math.max(...el[0].sets.map(s => s.weight));
        const lMax = Math.max(...el[el.length - 1].sets.map(s => s.weight));
        const diff = Math.round((lMax - fMax) * 10) / 10;
        let delta = null;
        if (el.length >= 2) {
          if (diff > 0) delta = <span className="delta-pill delta-up">▲ +{diff}kg</span>;
          else if (diff < 0) delta = <span className="delta-pill delta-down">▼ {diff}kg</span>;
          else delta = <span className="delta-pill delta-same">= same</span>;
        }
        return (
          <div className="progress-ex-card" key={id}>
            <div className="progress-ex-name"><span>{el[0].exName}</span>{delta}</div>
            <div className="bar-row">
              <div className="bar-label">First</div>
              <div className="bar-outer"><div className="bar-inner first" style={{ width: `${Math.round(fMax / maxW * 100)}%` }} /></div>
              <div className="bar-val">{fMax}kg</div>
            </div>
            <div className="bar-row">
              <div className="bar-label">Latest</div>
              <div className="bar-outer"><div className="bar-inner" style={{ width: `${Math.round(lMax / maxW * 100)}%` }} /></div>
              <div className="bar-val">{lMax}kg</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontFamily: 'DM Mono,monospace' }}>
              {el.length} session{el.length !== 1 ? 's' : ''} · since {fmtDate(el[0].date)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
