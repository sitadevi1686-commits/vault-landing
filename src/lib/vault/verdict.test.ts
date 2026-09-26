import { describe, expect, it } from "vitest";
import { clusterVerdict } from "./verdict";

const healthy = {
  reachable: true,
  unavailable: 0,
  degraded: 0,
  atRisk: 0,
  openIncidents: 0,
  nodesUp: 5,
  nodesTotal: 5,
  objectsSafe: 4,
  objects: 4,
};

describe("clusterVerdict", () => {
  it("tells the operator to start Hydras when it is offline", () => {
    const verdict = clusterVerdict({
      ...healthy,
      reachable: false,
      nodesUp: 0,
      nodesTotal: 0,
      objectsSafe: 0,
      objects: 0,
    });
    expect(verdict.tone).toBe("offline");
    expect(verdict.detail).toMatch(/Start Hydras/);
  });

  it("treats a missing chunk as a risk, not a quiet repair", () => {
    const verdict = clusterVerdict({
      ...healthy,
      unavailable: 2,
      degraded: 1,
      openIncidents: 1,
      nodesUp: 3,
      objectsSafe: 1,
    });
    expect(verdict.tone).toBe("risk");
    expect(verdict.title).toMatch(/cannot be read/);
  });

  it("describes under-replicated data as repairing", () => {
    const verdict = clusterVerdict({ ...healthy, atRisk: 1, openIncidents: 1, nodesUp: 4, objectsSafe: 3 });
    expect(verdict.tone).toBe("repairing");
    expect(verdict.title).toMatch(/repairing/);
  });

  it("reads as safe when every copy is on a healthy cluster", () => {
    const verdict = clusterVerdict(healthy);
    expect(verdict.tone).toBe("safe");
    expect(verdict.detail).toMatch(/4 of 4 files/);
    expect(verdict.detail).toMatch(/5 of 5 storage machines/);
  });
});
