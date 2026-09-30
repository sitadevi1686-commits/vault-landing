import { describe, expect, it } from "vitest";
import { createLinkDemo, linkHealth, setServer, summarizeProbes, type ServerProbe } from "./link-demo";

describe("linkHealth", () => {
  it("starts with three reachable copies and an open link", () => {
    const health = linkHealth(createLinkDemo());
    expect(health.copies).toBe(3);
    expect(health.linkOpen).toBe(true);
    expect(health.readable).toBe(true);
  });

  it("keeps the file readable after server-a stops", () => {
    const health = linkHealth(setServer(createLinkDemo(), "a", false));
    expect(health.copies).toBe(2);
    expect(health.readable).toBe(true);
    expect(health.linkOpen).toBe(false);
  });

  it("marks the file unreadable only when every server is down", () => {
    const down = ["a", "b", "c"].reduce((state, id) => setServer(state, id as "a", false), createLinkDemo());
    expect(linkHealth(down).readable).toBe(false);
    expect(linkHealth(setServer(down, "b", true)).copies).toBe(1);
  });
});

function probe(id: ServerProbe["id"], ok: boolean, ms: number | null): ServerProbe {
  return { id, ok, ms, host: "hydras-1", port: 4100, peerOk: ok, peerMs: ms };
}

describe("summarizeProbes", () => {
  it("keeps the file readable when server-a stops answering", () => {
    const health = summarizeProbes([probe("a", false, null), probe("b", true, 4), probe("c", true, 5)]);
    expect(health.copies).toBe(2);
    expect(health.readable).toBe(true);
    expect(health.linkOpen).toBe(false);
  });

  it("treats a missing probe as a down server", () => {
    const health = summarizeProbes([probe("b", true, 3)]);
    expect(health.copies).toBe(1);
    expect(health.linkOpen).toBe(false);
  });
});
