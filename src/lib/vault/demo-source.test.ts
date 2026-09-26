import { describe, expect, it } from "vitest";
import { createDemoSource, parseDemoAction } from "./demo-source";

describe("parseDemoAction", () => {
  it("maps console chaos requests onto simulation actions", () => {
    expect(parseDemoAction("chaos/kill", { node: "n1" })).toEqual({ type: "kill", node: "n1" });
    expect(parseDemoAction("chaos/restart", { node: "n2" })).toEqual({ type: "restart", node: "n2" });
    expect(parseDemoAction("chaos/link", { node: "n3", mode: "partitioned" })).toEqual({
      type: "link",
      node: "n3",
      mode: "partitioned",
    });
  });

  it("rejects unknown paths, missing nodes, and invalid link modes", () => {
    expect(parseDemoAction("chaos/format", { node: "n1" })).toBeNull();
    expect(parseDemoAction("chaos/kill", {})).toBeNull();
    expect(parseDemoAction("chaos/link", { node: "n1", mode: "melted" })).toBeNull();
    expect(parseDemoAction("chaos/kill", null)).toBeNull();
  });
});

describe("createDemoSource", () => {
  it("applies actions to the simulated cluster it serves", async () => {
    let now = 1_700_000_000_000;
    const source = createDemoSource(() => now);
    await source.act("chaos/kill", { node: "n1" });
    now += 1000;
    const overview = await source.overview();
    expect(overview.nodes.find((n) => n.id === "n1")?.running).toBe(false);
    expect(overview.incidentSummary.open).toBe(1);
  });

  it("reports invalid actions as errors the console can show", async () => {
    const source = createDemoSource(() => 1_700_000_000_000);
    await expect(source.act("chaos/restart", { node: "n1" })).rejects.toThrow(/already running/);
    await expect(source.act("chaos/unknown", { node: "n1" })).rejects.toThrow();
  });

  it("resets back to a healthy cluster", async () => {
    const source = createDemoSource(() => 1_700_000_000_000);
    await source.act("chaos/kill", { node: "n1" });
    source.reset();
    const overview = await source.overview();
    expect(overview.nodes.every((n) => n.running)).toBe(true);
  });

  it("provides recent activity history so the chart starts populated", () => {
    const now = 1_700_000_000_000;
    const history = createDemoSource(() => now).history();
    expect(history.length).toBeGreaterThanOrEqual(20);
    expect(history.at(-1)?.at).toBeLessThanOrEqual(now);
    expect(history.every((s) => s.reads > 0 && s.writes > 0)).toBe(true);
  });
});
