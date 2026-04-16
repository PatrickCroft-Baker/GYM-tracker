import { useState, useRef, useCallback } from 'react';

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState(null); // { exId, remaining, total }
  const intervalRef = useRef(null);

  const startTimer = useCallback((exId, totalSecs) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveTimer({ exId, remaining: totalSecs, total: totalSecs });

    intervalRef.current = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || prev.exId !== exId) { clearInterval(intervalRef.current); return prev; }
        if (prev.remaining <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          setTimeout(() => setActiveTimer(null), 3000);
          return { ...prev, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
  }, []);

  const skipTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setActiveTimer(null);
  }, []);

  return { activeTimer, startTimer, skipTimer };
}
