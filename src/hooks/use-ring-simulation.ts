"use client";

import { useEffect, useRef, useState } from "react";
import { msUntilNextPhase, ringStateAt, type RingState } from "@/lib/node-ring";

export function useRingSimulation(active: boolean): RingState {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const startedAt = performance.now() - elapsedRef.current;
    let timer = 0;

    const schedule = (from: number) => {
      timer = window.setTimeout(() => {
        const now = performance.now() - startedAt;
        elapsedRef.current = now;
        setElapsed(now);
        schedule(now);
      }, msUntilNextPhase(from) + 16);
    };

    schedule(elapsedRef.current);
    return () => window.clearTimeout(timer);
  }, [active]);

  return ringStateAt(elapsed);
}
