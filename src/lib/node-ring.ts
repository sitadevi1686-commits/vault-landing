export const NODE_COUNT = 5;

export type RingPhase = "healthy" | "failed" | "repairing" | "healed";

export const PHASE_ORDER: readonly RingPhase[] = ["healthy", "failed", "repairing", "healed"];

export const PHASE_MS: Readonly<Record<RingPhase, number>> = {
  healthy: 2600,
  failed: 1600,
  repairing: 2800,
  healed: 1800,
};

export const CYCLE_MS = PHASE_ORDER.reduce((total, phase) => total + PHASE_MS[phase], 0);

export type RingState = {
  cycle: number;
  phase: RingPhase;
  failedNode: number | null;
  sources: readonly number[];
};

function locate(elapsedMs: number) {
  const elapsed = Math.max(0, elapsedMs);
  const cycle = Math.floor(elapsed / CYCLE_MS);
  let offset = elapsed - cycle * CYCLE_MS;
  for (const phase of PHASE_ORDER) {
    if (offset < PHASE_MS[phase]) return { cycle, phase, remaining: PHASE_MS[phase] - offset };
    offset -= PHASE_MS[phase];
  }
  return { cycle: cycle + 1, phase: "healthy" as const, remaining: PHASE_MS.healthy };
}

export function ringStateAt(elapsedMs: number): RingState {
  const { cycle, phase } = locate(elapsedMs);
  if (phase === "healthy") return { cycle, phase, failedNode: null, sources: [] };

  const failedNode = cycle % NODE_COUNT;
  const sources =
    phase === "repairing"
      ? [(failedNode + NODE_COUNT - 1) % NODE_COUNT, (failedNode + 1) % NODE_COUNT]
      : [];
  return { cycle, phase, failedNode, sources };
}

export function msUntilNextPhase(elapsedMs: number): number {
  return locate(elapsedMs).remaining;
}
