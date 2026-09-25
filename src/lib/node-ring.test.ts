import { describe, expect, it } from "vitest";
import {
  CYCLE_MS,
  NODE_COUNT,
  PHASE_MS,
  msUntilNextPhase,
  ringStateAt,
} from "./node-ring";

describe("ringStateAt", () => {
  it("starts healthy with no failed node", () => {
    const state = ringStateAt(0);
    expect(state.phase).toBe("healthy");
    expect(state.failedNode).toBeNull();
    expect(state.sources).toEqual([]);
  });

  it("fails the first node after the healthy window", () => {
    const state = ringStateAt(PHASE_MS.healthy);
    expect(state.phase).toBe("failed");
    expect(state.failedNode).toBe(0);
  });

  it("repairs the failed node from its two ring neighbours", () => {
    const state = ringStateAt(PHASE_MS.healthy + PHASE_MS.failed);
    expect(state.phase).toBe("repairing");
    expect(state.failedNode).toBe(0);
    expect(state.sources).toEqual([NODE_COUNT - 1, 1]);
  });

  it("reports the healed node before moving on", () => {
    const state = ringStateAt(
      PHASE_MS.healthy + PHASE_MS.failed + PHASE_MS.repairing,
    );
    expect(state.phase).toBe("healed");
    expect(state.failedNode).toBe(0);
  });

  it("fails the next node in the following cycle and wraps around", () => {
    expect(ringStateAt(CYCLE_MS + PHASE_MS.healthy).failedNode).toBe(1);
    expect(ringStateAt(CYCLE_MS * NODE_COUNT + PHASE_MS.healthy).failedNode).toBe(0);
    expect(ringStateAt(CYCLE_MS * 2).cycle).toBe(2);
  });

  it("clamps negative time to the start", () => {
    expect(ringStateAt(-500)).toEqual(ringStateAt(0));
  });
});

describe("msUntilNextPhase", () => {
  it("returns the time left in the current phase", () => {
    expect(msUntilNextPhase(0)).toBe(PHASE_MS.healthy);
    expect(msUntilNextPhase(PHASE_MS.healthy + 100)).toBe(PHASE_MS.failed - 100);
  });

  it("never returns zero so timers always advance", () => {
    expect(msUntilNextPhase(PHASE_MS.healthy)).toBe(PHASE_MS.failed);
    expect(msUntilNextPhase(CYCLE_MS)).toBe(PHASE_MS.healthy);
  });
});
