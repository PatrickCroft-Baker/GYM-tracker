const DRAFT_KEY = 'wt_drafts_v2';
const SESSION_KEY = 'wt_session_v1';
const QUEUE_KEY = 'wt_offline_queue_v1';
const WEEK_KEY = 'wt_week_v1';

function parse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export const getDrafts = () => parse(DRAFT_KEY, {});
export const saveDrafts = d => localStorage.setItem(DRAFT_KEY, JSON.stringify(d));

export const getSession = () => parse(SESSION_KEY, {});
export const saveSession = s => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
export const clearSession = () => { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(DRAFT_KEY); };

export const getQueue = () => parse(QUEUE_KEY, []);
export const saveQueue = q => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));

export const getWeek = () => parse(WEEK_KEY, 'A');
export const saveWeek = w => localStorage.setItem(WEEK_KEY, w);
