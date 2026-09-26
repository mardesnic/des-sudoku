import { useEffect, useRef } from 'react';

// Calls onTick with the ms since the last tick, once a second while
// running. Long gaps (a throttled tab) count as a single second.
export function useTicker(running: boolean, onTick: (ms: number) => void) {
  const callback = useRef(onTick);
  useEffect(() => {
    callback.current = onTick;
  });

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      callback.current(Math.min(now - last, 2000));
      last = now;
    }, 1000);
    return () => clearInterval(id);
  }, [running]);
}
