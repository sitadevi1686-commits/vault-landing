import {
  advanceDemo,
  applyDemoAction,
  createDemoCluster,
  demoActivityHistory,
  demoOverview,
  type ActivitySample,
  type DemoAction,
} from "./demo-cluster";
import type { LinkMode, VaultOverview } from "./types";

const LINK_MODES: ReadonlySet<string> = new Set<LinkMode>(["healthy", "partitioned", "flaky", "slow"]);

export function parseDemoAction(path: string, body: unknown): DemoAction | null {
  if (!body || typeof body !== "object") return null;
  const { node, mode } = body as { node?: unknown; mode?: unknown };
  if (typeof node !== "string" || node === "") return null;
  if (path === "chaos/kill") return { type: "kill", node };
  if (path === "chaos/restart") return { type: "restart", node };
  if (path === "chaos/link" && typeof mode === "string" && LINK_MODES.has(mode)) {
    return { type: "link", node, mode: mode as LinkMode };
  }
  return null;
}

export type DemoSource = {
  overview: () => Promise<VaultOverview>;
  act: (path: string, body: unknown) => Promise<void>;
  history: () => ActivitySample[];
  reset: () => void;
};

export function createDemoSource(clock: () => number = Date.now): DemoSource {
  let state = createDemoCluster(clock());
  return {
    async overview() {
      state = advanceDemo(state, clock());
      return demoOverview(state);
    },
    async act(path, body) {
      const action = parseDemoAction(path, body);
      if (!action) throw new Error("That control action is not available in the demo.");
      const result = applyDemoAction(state, action, clock());
      if (!result.ok) throw new Error(result.error);
      state = result.state;
    },
    history: () => demoActivityHistory(clock()),
    reset() {
      state = createDemoCluster(clock());
    },
  };
}
