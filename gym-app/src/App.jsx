import { useState, useEffect, useCallback } from 'react';
import LogView from './components/LogView';
import HistoryView from './components/HistoryView';
import ProgressView from './components/ProgressView';
import { useOffline } from './hooks/useOffline';

export default function App() {
  const [tab, setTab] = useState('log');
  const [toast, setToast] = useState({ msg: '', err: false, visible: false });
  const isOnline = useOffline();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>LIFT LOG</h1>
        <div className="sub">patrick's workout tracker</div>
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
