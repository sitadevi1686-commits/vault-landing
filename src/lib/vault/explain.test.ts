import { describe, expect, it } from "vitest";
import { checkMark, incidentKindLabel, nodeSituation, proofChecks } from "./explain";

const quiet = {
  known: true,
  reachable: true,
  nodesUp: 5,
  nodesTotal: 5,
  objects: 4,
  objectsSafe: 4,
  unavailable: 0,
  degraded: 0,
  atRisk: 0,
  openIncidents: 0,
  resolvedIncidents: 0,
  lastRecoveryMs: 0,
};

describe("proofChecks", () => {
  it("passes the first two checks on a healthy cluster and waits for a failure", () => {
    const checks = proofChecks(quiet);
    expect(checks[0]?.state).toBe("pass");
    expect(checks[1]?.state).toBe("pass");
    expect(checks[2]?.state).toBe("idle");
    expect(checks[2]?.evidence ?? "").toMatch(/Kill one disk/);
  });

  it("fails the durability check when copies are missing", () => {
    const copies = proofChecks({ ...quiet, unavailable: 1, objectsSafe: 3 }).find((c) => c.id === "copies");
    expect(copies?.state).toBe("fail");
    expect(copies?.evidence ?? "").toMatch(/would fail/);
  });

  it("shows an open repair in progress and cites the time of a finished one", () => {
    const working = proofChecks({ ...quiet, openIncidents: 1, atRisk: 1, objectsSafe: 3 });
    expect(working.find((c) => c.id === "copies")?.state).toBe("working");
    expect(working.find((c) => c.id === "repair")?.state).toBe("working");

    const done = proofChecks({ ...quiet, resolvedIncidents: 1, lastRecoveryMs: 4200 });
    expect(done.find((c) => c.id === "repair")?.evidence ?? "").toMatch(/4\.2 seconds/);
  });
});

describe("plain-language labels", () => {
  it("describes incidents, node states, and check results without jargon", () => {
    expect(incidentKindLabel("node-loss")).toBe("A storage machine stopped");
    expect(nodeSituation("up", "partitioned").label).toBe("Network cut");
    expect(nodeSituation("down", "healthy").label).toBe("Stopped");
    expect(checkMark("pass")).toBe("Passed");
  });
});
