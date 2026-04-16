export default function RestTimer({ timer, exId, onSkip }) {
  const active = timer?.exId === exId;
  if (!active) return null;

  const { remaining, total } = timer;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const m = Math.floor(remaining / 60), s = remaining % 60;
  const display = remaining <= 0 ? 'GO' : m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s);
  const urgent = remaining <= 10;

  return (
    <div className="rest-timer active">
      <span className="timer-label">REST</span>
      <span className={`timer-countdown${urgent ? ' urgent' : ''}`}>{display}</span>
      <div className="timer-bar-outer">
        <div className="timer-bar-inner" style={{ width: `${pct}%` }} />
      </div>
      <button className="timer-skip" onClick={onSkip}>Skip</button>
    </div>
  );
}
