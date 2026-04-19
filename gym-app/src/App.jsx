import { useState, useEffect, useCallback } from 'react';
import LogView from './components/LogView';
import HistoryView from './components/HistoryView';
import ProgressView from './components/ProgressView';
import AuthScreen from './components/AuthScreen';
import { useOffline } from './hooks/useOffline';
import useAuth from './hooks/useAuth';

export default function App() {
  const [tab, setTab] = useState('log');
  const [toast, setToast] = useState({ msg: '', err: false, visible: false });
  const isOnline = useOffline();
  const { user, signIn, signUp, signOut } = useAuth();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  // Still loading auth state
  if (user === undefined) return <div className="auth-loading" />;

  // Not logged in
  if (user === null) return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>LIFT LOG</h1>
        <div className="header-row">
          <div className="sub">{user.email}</div>
          <button className="sign-out-btn" onClick={signOut}>Sign out</button>
        </div>
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
