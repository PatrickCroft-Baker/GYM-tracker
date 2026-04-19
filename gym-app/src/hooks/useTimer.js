import { useState, useRef, useCallback, useEffect } from 'react';

const TIMER_KEY = 'rest_timer';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const lastStop = ctx.currentTime + 0.7 + 0.25;
    [0, 0.35, 0.7].forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
    // Close context after all oscillators finish to avoid exhausting browser limits
    setTimeout(() => ctx.close().catch(() => {}), (lastStop - ctx.currentTime + 0.1) * 1000);
  } catch (e) {}
}

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState(null); // { exId, remaining, total }
  const endTimeRef = useRef(null);
  const exIdRef = useRef(null);
  const totalRef = useRef(null);
  const intervalRef = useRef(null);
  const firedRef = useRef(false);
  const clearTimeoutRef = useRef(null);

  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        playBeep();
        localStorage.removeItem(TIMER_KEY);
        clearInterval(intervalRef.current);
        setActiveTimer({ exId: exIdRef.current, remaining: 0, total: totalRef.current });
        clearTimeoutRef.current = setTimeout(() => {
          setActiveTimer(null);
          endTimeRef.current = null;
        }, 3000);
      }
    } else {
      setActiveTimer({ exId: exIdRef.current, remaining, total: totalRef.current });
    }
  }, []);

  // Restore timer on mount — handles Safari reloading the page after phone lock
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
      if (saved?.endTime > Date.now()) {
        endTimeRef.current = saved.endTime;
        exIdRef.current = saved.exId;
        totalRef.current = saved.total;
        firedRef.current = false;
        tick();
        intervalRef.current = setInterval(tick, 1000);
      } else {
        localStorage.removeItem(TIMER_KEY);
      }
    } catch (e) {}

    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(intervalRef.current);
      clearTimeout(clearTimeoutRef.current);
    };
  }, [tick]);

  const startTimer = useCallback((exId, totalSecs) => {
    clearInterval(intervalRef.current);
    clearTimeout(clearTimeoutRef.current);
    firedRef.current = false;
    const endTime = Date.now() + totalSecs * 1000;
    endTimeRef.current = endTime;
    exIdRef.current = exId;
    totalRef.current = totalSecs;
    localStorage.setItem(TIMER_KEY, JSON.stringify({ exId, endTime, total: totalSecs }));
    setActiveTimer({ exId, remaining: totalSecs, total: totalSecs });
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const skipTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(clearTimeoutRef.current);
    intervalRef.current = null;
    endTimeRef.current = null;
    localStorage.removeItem(TIMER_KEY);
    setActiveTimer(null);
  }, []);

  return { activeTimer, startTimer, skipTimer };
}
