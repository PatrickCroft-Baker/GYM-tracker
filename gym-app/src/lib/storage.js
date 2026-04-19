const DRAFT_KEY = 'wt_drafts_v2';
const PROG_KEY = 'wt_custom_program_v1';
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

export const getCustomProgram = () => parse(PROG_KEY, null);
export const saveCustomProgram = p => localStorage.setItem(PROG_KEY, JSON.stringify(p));
export const clearCustomProgram = () => localStorage.removeItem(PROG_KEY);

const SESSION_START_KEY = 'wt_session_start_v1';
export const getSessionStart = () => parse(SESSION_START_KEY, null);
export const saveSessionStart = t => localStorage.setItem(SESSION_START_KEY, JSON.stringify(t));
export const clearSessionStart = () => localStorage.removeItem(SESSION_START_KEY);

const REST_OVERRIDES_KEY = 'wt_rest_overrides_v1';
export const getRestOverrides = () => parse(REST_OVERRIDES_KEY, {});
export const saveRestOverrides = o => localStorage.setItem(REST_OVERRIDES_KEY, JSON.stringify(o));
