import { describe, expect, it } from "vitest";
import {
  DEMO_OBJECTS,
  applyDemoAction,
  advanceDemo,
  createDemoCluster,
  demoOverview,
  resolveDataMode,
  type DemoState,
} from "./demo-cluster";

const T0 = 1_700_000_000_000;

function act(state: DemoState, action: Parameters<typeof applyDemoAction>[1], at: number) {
  const result = applyDemoAction(state, action, at);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

describe("createDemoCluster", () => {
  it("starts with five healthy nodes across three zones and every file fully protected", () => {
    const overview = demoOverview(createDemoCluster(T0));
    expect(overview.nodes).toHaveLength(5);
    expect(new Set(overview.nodes.map((n) => n.zone)).size).toBe(3);
    expect(overview.nodes.every((n) => n.running && n.state === "up" && n.link === "healthy")).toBe(true);
    expect(overview.durability.objects).toBe(DEMO_OBJECTS);
    expect(overview.durability.objectsSafe).toBe(DEMO_OBJECTS);
    expect(overview.durability.atRisk).toBe(0);
    expect(overview.incidentSummary.open).toBe(0);
  });

  it("stores three copies of every file", () => {
    const overview = demoOverview(createDemoCluster(T0));
    const pieces = overview.nodes.reduce((sum, n) => sum + n.blobs, 0);
    expect(pieces).toBe(DEMO_OBJECTS * 3);
    expect(overview.overhead).toBeCloseTo(3, 5);
  });

  it("includes a short resolved history so recovery metrics are not empty", () => {
    const overview = demoOverview(createDemoCluster(T0));
    expect(overview.incidentSummary.resolved).toBeGreaterThan(0);
    expect(overview.incidentSummary.lastRecoveryMs).toBeGreaterThan(0);
    expect(overview.incidents.every((i) => i.status === "resolved")).toBe(true);
  });
});

describe("stopping a disk", () => {
  it("opens a repair and marks that node's files as at risk while reads keep working", () => {
    const state = act(createDemoCluster(T0), { type: "kill", node: "n2" }, T0 + 1000);
    const overview = demoOverview(state);
    const n2 = overview.nodes.find((n) => n.id === "n2");
    expect(n2?.running).toBe(false);
    expect(overview.incidentSummary.open).toBe(1);
    expect(overview.incidents[0]).toMatchObject({ kind: "node-loss", subject: "n2", status: "open" });
    expect(overview.durability.atRisk).toBeGreaterThan(0);
    expect(overview.durability.unavailable).toBe(0);
    expect(overview.durability.objectsSafe).toBeLessThan(DEMO_OBJECTS);
  });

  it("finishes the repair after a few seconds and records the measured recovery time", () => {
    const killed = act(createDemoCluster(T0), { type: "kill", node: "n2" }, T0);
    const overview = demoOverview(advanceDemo(killed, T0 + 20_000));
    const incident = overview.incidents.find((i) => i.subject === "n2" && i.kind === "node-loss");
    expect(incident?.status).toBe("resolved");
    expect(incident?.recoveryMs).toBeGreaterThan(2000);
    expect(incident?.recoveryMs).toBeLessThan(10_000);
    expect(overview.incidentSummary.lastRecoveryMs).toBe(incident?.recoveryMs);
    expect(overview.durability.objectsSafe).toBe(DEMO_OBJECTS);
    expect(overview.durability.atRisk).toBe(0);
  });

  it("moves the lost copies onto the surviving nodes", () => {
    const killed = act(createDemoCluster(T0), { type: "kill", node: "n2" }, T0);
    const overview = demoOverview(advanceDemo(killed, T0 + 20_000));
    const survivors = overview.nodes.filter((n) => n.id !== "n2");
    expect(overview.nodes.find((n) => n.id === "n2")?.blobs).toBe(0);
    expect(survivors.reduce((sum, n) => sum + n.blobs, 0)).toBe(DEMO_OBJECTS * 3);
  });

  it("rebalances when the disk is brought back", () => {
    const healed = advanceDemo(act(createDemoCluster(T0), { type: "kill", node: "n2" }, T0), T0 + 20_000);
    const overview = demoOverview(act(healed, { type: "restart", node: "n2" }, T0 + 21_000));
    const n2 = overview.nodes.find((n) => n.id === "n2");
    expect(n2?.running).toBe(true);
    expect(n2?.blobs).toBeGreaterThan(0);
    expect(overview.nodes.reduce((sum, n) => sum + n.blobs, 0)).toBe(DEMO_OBJECTS * 3);
  });
});

describe("cutting the network", () => {
  it("opens a partition incident and restores cleanly when the link returns", () => {
    const cut = act(createDemoCluster(T0), { type: "link", node: "n4", mode: "partitioned" }, T0);
    const open = demoOverview(cut);
    expect(open.nodes.find((n) => n.id === "n4")?.link).toBe("partitioned");
    expect(open.incidents[0]).toMatchObject({ kind: "partition", subject: "n4", status: "open" });

    const restored = demoOverview(act(cut, { type: "link", node: "n4", mode: "healthy" }, T0 + 1500));
    expect(restored.nodes.find((n) => n.id === "n4")?.link).toBe("healthy");
    expect(restored.incidentSummary.open).toBe(0);
    expect(restored.durability.objectsSafe).toBe(DEMO_OBJECTS);
  });
});

describe("losing too many machines", () => {
  it("makes some files unreadable and pauses repair until a machine returns", () => {
    let state = createDemoCluster(T0);
    for (const node of ["n1", "n2", "n3"]) state = act(state, { type: "kill", node }, T0);
    const stuck = demoOverview(advanceDemo(state, T0 + 60_000));
    expect(stuck.durability.unavailable).toBeGreaterThan(0);
    expect(stuck.incidentSummary.open).toBe(3);

    const recovered = demoOverview(advanceDemo(act(advanceDemo(state, T0 + 60_000), { type: "restart", node: "n1" }, T0 + 60_000), T0 + 90_000));
    expect(recovered.durability.unavailable).toBe(0);
    expect(recovered.incidentSummary.open).toBe(0);
  });
});

describe("activity", () => {
  it("keeps reads and writes moving over time", () => {
    const start = createDemoCluster(T0);
    const later = demoOverview(advanceDemo(start, T0 + 10_000));
    expect(later.engine.gets).toBeGreaterThan(demoOverview(start).engine.gets);
    expect(later.engine.puts).toBeGreaterThan(demoOverview(start).engine.puts);
  });

  it("never moves time backwards", () => {
    const state = advanceDemo(createDemoCluster(T0), T0 + 5000);
    expect(advanceDemo(state, T0 + 1000)).toBe(state);
  });
});

describe("applyDemoAction validation", () => {
  it("rejects unknown nodes and impossible actions without changing state", () => {
    const state = createDemoCluster(T0);
    expect(applyDemoAction(state, { type: "kill", node: "n9" }, T0)).toMatchObject({ ok: false });
    expect(applyDemoAction(state, { type: "restart", node: "n1" }, T0)).toMatchObject({ ok: false });
    const killed = act(state, { type: "kill", node: "n1" }, T0);
    expect(applyDemoAction(killed, { type: "kill", node: "n1" }, T0)).toMatchObject({ ok: false });
    expect(applyDemoAction(killed, { type: "link", node: "n1", mode: "partitioned" }, T0)).toMatchObject({ ok: false });
  });
});

describe("resolveDataMode", () => {
  it("uses the live cluster on localhost and the simulation on public hosts", () => {
    expect(resolveDataMode("localhost", "")).toBe("live");
    expect(resolveDataMode("127.0.0.1", "")).toBe("live");
    expect(resolveDataMode("www.hydras.software", "")).toBe("demo");
  });

  it("lets ?demo= override the default", () => {
    expect(resolveDataMode("localhost", "?demo=1")).toBe("demo");
    expect(resolveDataMode("www.hydras.software", "?demo=0")).toBe("live");
  });
});
