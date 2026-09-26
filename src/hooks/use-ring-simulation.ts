"use client";

import { useEffect, useRef, useState } from "react";
import { msUntilNextPhase, ringStateAt, type RingState } from "@/lib/node-ring";

/** One animation frame at 60 fps — added to phase durations so setTimeout fires after the phase boundary, not on it. */
const ONE_FRAME_MS = 16;

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
      }, msUntilNextPhase(from) + ONE_FRAME_MS);
    };

    schedule(elapsedRef.current);
    return () => window.clearTimeout(timer);
  }, [active]);

  return ringStateAt(elapsed);
}

