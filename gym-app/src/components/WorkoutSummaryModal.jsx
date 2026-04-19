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
        <div className="summary-title">Session Complete</div>
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
          {summary.duration != null && (
            <div className="summary-stat">
              <div className="summary-stat-value">{fmtDuration(summary.duration)}</div>
              <div className="summary-stat-label">Duration</div>
            </div>
          )}
        </div>
        <div className="summary-exercises">
          {summary.exercises?.map(ex => (
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
