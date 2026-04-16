import { useState, useEffect } from 'react';
import { getQueue, saveQueue } from '../lib/storage';
import { upsertLog } from '../lib/supabase';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  async function flushQueue() {
    const q = getQueue();
    if (!q.length) return;
    const failed = [];
    for (const item of q) {
      try {
        await upsertLog(item.ex_id, item.ex_name, item.sets, item.log_date);
      } catch {
        failed.push(item);
      }
    }
    saveQueue(failed);
    return q.length - failed.length;
  }

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); flushQueue(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}
