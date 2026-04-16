import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tsgqqghdocoeudargsom.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ3FxZ2hkb2NvZXVkYXJnc29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzk0MjQsImV4cCI6MjA5MTg1NTQyNH0.zC4wH9KEcQELL0gPZ-reURY5syNGzrVJQCPRM-TzXXg';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getLogs() {
  const { data, error } = await sb.from('workout_logs').select('*')
    .order('log_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) { console.error('getLogs:', error); return []; }
  return (data || []).map(r => ({
    id: r.id,
    date: r.log_date,
    ts: new Date(r.created_at).getTime(),
    exId: r.ex_id,
    exName: r.ex_name,
    sets: r.sets,
  }));
}

export async function upsertLog(exId, exName, setsData, date) {
  const payload = { log_date: date, ex_id: exId, ex_name: exName, sets: setsData };
  const { error } = await sb.from('workout_logs').upsert(payload, { onConflict: 'ex_id,log_date' });
  if (error) throw error;
}

export async function deleteLog(id) {
  const { error } = await sb.from('workout_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllLogs() {
  const { error } = await sb.from('workout_logs').delete().neq('id', 0);
  if (error) throw error;
}

export async function deleteLogForExDate(exId, date) {
  const { error } = await sb.from('workout_logs').delete().eq('ex_id', exId).eq('log_date', date);
  if (error) throw error;
}

export async function getLastSessionForEx(exId) {
  const { data, error } = await sb.from('workout_logs').select('*')
    .eq('ex_id', exId)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return { date: data[0].log_date, sets: data[0].sets };
}
