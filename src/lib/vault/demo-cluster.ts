import type { LinkMode, VaultIncident, VaultOverview } from "./types";

export const DEMO_OBJECTS = 1248;
const REPLICAS = 3;
const PIECE_BYTES = 2_400_000;
const DETECT_MS = 1200;
const REPAIR_BASE_MS = 2600;
const REPAIR_MS_PER_PIECE = 2;
const MAX_OFFLINE_BEFORE_LOSS = 2;
const NODE_LAYOUT = [
  { id: "n1", zone: "zone-a", weight: 0.21 },
  { id: "n2", zone: "zone-a", weight: 0.19 },
  { id: "n3", zone: "zone-b", weight: 0.2 },
  { id: "n4", zone: "zone-b", weight: 0.22 },
  { id: "n5", zone: "zone-c", weight: 0.18 },
] as const;

type IncidentKind = "node-loss" | "partition" | "corruption";

type DemoNode = { id: string; zone: string; running: boolean; link: LinkMode; blobs: number };

type DemoIncident = {
  id: string;
  kind: IncidentKind;
  subject: string;
  detail: string;
  status: "open" | "resolved";
  startedAt: number;
  repairAt: number;
  recoveryMs: number;
  affected: number;
};

export type DemoState = {
  now: number;
  nodes: readonly DemoNode[];
  incidents: readonly DemoIncident[];
  gets: number;
  puts: number;
  repairedPieces: number;
  healed: number;
  nextId: number;
};

export type DemoAction =
  | { type: "kill"; node: string }
  | { type: "restart"; node: string }
  | { type: "link"; node: string; mode: LinkMode };

export type DemoResult = { ok: true; state: DemoState } | { ok: false; error: string };

export type DataMode = "live" | "demo";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function resolveDataMode(hostname: string, search: string): DataMode {
  const flag = new URLSearchParams(search).get("demo");
  if (flag === "1" || flag === "true") return "demo";
  if (flag === "0" || flag === "false") return "live";
  return LOCAL_HOSTS.has(hostname) ? "live" : "demo";
}

function spread(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, i) => base + (i < total - base * count ? 1 : 0));
}

function initialBlobs(): number[] {
  const total = DEMO_OBJECTS * REPLICAS;
  const blobs = NODE_LAYOUT.map((n) => Math.floor(total * n.weight));
  blobs[0] += total - blobs.reduce((sum, b) => sum + b, 0);
  return blobs;
}

function historyIncident(
  id: string,
  kind: IncidentKind,
  subject: string,
  detail: string,
  startedAt: number,
  recoveryMs: number,
): DemoIncident {
  return { id, kind, subject, detail, status: "resolved", startedAt, repairAt: startedAt + recoveryMs, recoveryMs, affected: 0 };
}

export function createDemoCluster(now: number): DemoState {
  const blobs = initialBlobs();
  return {
    now,
    nodes: NODE_LAYOUT.map((n, i) => ({ id: n.id, zone: n.zone, running: true, link: "healthy", blobs: blobs[i] })),
    incidents: [
      historyIncident("h1", "corruption", "n5", "A copy failed its checksum on read and was replaced from a healthy replica.", now - 3 * 3_600_000, 1100),
      historyIncident("h2", "partition", "n2", "A switch port flapped. Reads continued from the other zones until the link returned.", now - 2 * 3_600_000, 3200),
      historyIncident("h3", "node-loss", "n4", "The disk stopped responding. Its copies were rebuilt on the remaining machines.", now - 40 * 60_000, 4600),
    ],
    gets: 48_210,
    puts: 9_874,
    repairedPieces: 2_180,
    healed: 1,
    nextId: 1,
  };
}

const isOffline = (node: DemoNode) => !node.running || node.link === "partitioned";

function readRate(ms: number): number {
  const t = ms / 1000;
  return 55 + 20 * Math.sin((2 * Math.PI * t) / 40) + 8 * Math.sin((2 * Math.PI * t) / 9);
}

function writeRate(ms: number): number {
  const t = ms / 1000;
  return 12 + 5 * Math.sin((2 * Math.PI * t) / 25 + 1);
}

export type ActivitySample = { at: number; reads: number; writes: number };

export function demoActivityHistory(now: number, count = 30, stepMs = 2000): ActivitySample[] {
  return Array.from({ length: count }, (_, i) => {
    const at = now - (count - 1 - i) * stepMs;
    return { at, reads: readRate(at), writes: writeRate(at) };
  });
}

function withNode(state: DemoState, id: string, change: Partial<DemoNode>): DemoState {
  return { ...state, nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...change } : n)) };
}

function redistribute(state: DemoState, fromId: string): DemoState {
  const source = state.nodes.find((n) => n.id === fromId);
  const online = state.nodes.filter((n) => !isOffline(n));
  if (!source || online.length === 0) return state;
  const shares = spread(source.blobs, online.length);
  const shareFor = new Map(online.map((n, i) => [n.id, shares[i]]));
  return {
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === fromId ? { ...n, blobs: 0 } : { ...n, blobs: n.blobs + (shareFor.get(n.id) ?? 0) },
    ),
  };
}

function rebalance(state: DemoState): DemoState {
  const online = state.nodes.filter((n) => !isOffline(n));
  const pool = online.reduce((sum, n) => sum + n.blobs, 0);
  const shares = spread(pool, online.length);
  const shareFor = new Map(online.map((n, i) => [n.id, shares[i]]));
  return { ...state, nodes: state.nodes.map((n) => (shareFor.has(n.id) ? { ...n, blobs: shareFor.get(n.id) ?? 0 } : n)) };
}

function resolveIncident(state: DemoState, id: string, at: number, detail: string): DemoState {
  const incident = state.incidents.find((i) => i.id === id);
  if (!incident || incident.status !== "open") return state;
  const resolved: DemoIncident = { ...incident, status: "resolved", repairAt: at, recoveryMs: at - incident.startedAt, detail };
  return {
    ...state,
    incidents: state.incidents.map((i) => (i.id === id ? resolved : i)),
    repairedPieces: state.repairedPieces + incident.affected,
  };
}

function rebuiltDetail(incident: DemoIncident): string {
  const what = incident.kind === "partition" ? "was cut off" : "stopped";
  return `${incident.subject} ${what}. ${incident.affected.toLocaleString()} pieces were copied back to three replicas on the remaining machines.`;
}

function returnedDetail(incident: DemoIncident): string {
  const what = incident.kind === "partition" ? "network returned" : "disk came back";
  return `The ${what} before the rebuild finished, so ${incident.subject}'s copies were verified in place.`;
}

function progressRepairs(state: DemoState, now: number, dt: number): DemoState {
  const paused = state.nodes.filter(isOffline).length > MAX_OFFLINE_BEFORE_LOSS;
  if (paused) {
    return { ...state, incidents: state.incidents.map((i) => (i.status === "open" ? { ...i, repairAt: i.repairAt + dt } : i)) };
  }
  return state.incidents
    .filter((i) => i.status === "open" && i.repairAt <= now)
    .reduce((next, incident) => redistribute(resolveIncident(next, incident.id, incident.repairAt, rebuiltDetail(incident)), incident.subject), state);
}

export function advanceDemo(state: DemoState, now: number): DemoState {
  if (now <= state.now) return state;
  const dt = now - state.now;
  const midpoint = state.now + dt / 2;
  const onlineShare = state.nodes.filter((n) => !isOffline(n)).length / state.nodes.length;
  const repaired = progressRepairs(state, now, dt);
  return {
    ...repaired,
    now,
    gets: repaired.gets + Math.round((readRate(midpoint) * onlineShare * dt) / 1000),
    puts: repaired.puts + Math.round((writeRate(midpoint) * onlineShare * dt) / 1000),
  };
}

function openIncident(state: DemoState, node: DemoNode, kind: IncidentKind, now: number): DemoState {
  if (state.incidents.some((i) => i.status === "open" && i.subject === node.id)) return state;
  const affected = node.blobs;
  const what = kind === "partition" ? "was cut off from the network" : "stopped";
  const incident: DemoIncident = {
    id: `d${state.nextId}`,
    kind,
    subject: node.id,
    detail: `${node.id} ${what}. ${affected.toLocaleString()} pieces are down to two copies and are being rebuilt from the surviving replicas.`,
    status: "open",
    startedAt: now,
    repairAt: now + DETECT_MS + REPAIR_BASE_MS + affected * REPAIR_MS_PER_PIECE,
    recoveryMs: 0,
    affected,
  };
  return { ...state, incidents: [...state.incidents, incident], nextId: state.nextId + 1 };
}

function bringBack(state: DemoState, id: string, now: number): DemoState {
  const open = state.incidents.filter((i) => i.status === "open" && i.subject === id);
  const resolved = open.reduce((next, incident) => resolveIncident(next, incident.id, now, returnedDetail(incident)), state);
  return rebalance(resolved);
}

export function applyDemoAction(state: DemoState, action: DemoAction, now: number): DemoResult {
  const current = advanceDemo(state, now);
  const node = current.nodes.find((n) => n.id === action.node);
  if (!node) return { ok: false, error: `There is no storage node called ${action.node}.` };

  if (action.type === "kill") {
    if (!node.running) return { ok: false, error: `${node.id} is already stopped.` };
    return { ok: true, state: openIncident(withNode(current, node.id, { running: false }), node, "node-loss", now) };
  }
  if (action.type === "restart") {
    if (node.running) return { ok: false, error: `${node.id} is already running.` };
    return { ok: true, state: bringBack(withNode(current, node.id, { running: true, link: "healthy" }), node.id, now) };
  }
  if (!node.running) return { ok: false, error: `${node.id} is stopped, so there is no network link to change.` };
  if (action.mode === node.link) return { ok: false, error: `${node.id} is already ${action.mode}.` };
  const changed = withNode(current, node.id, { link: action.mode });
  if (action.mode === "partitioned") return { ok: true, state: openIncident(changed, node, "partition", now) };
  return { ok: true, state: node.link === "partitioned" ? bringBack(changed, node.id, now) : changed };
}

function choose(n: number, k: number): number {
  if (k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return result;
}

function durability(state: DemoState) {
  const open = state.incidents.filter((i) => i.status === "open");
  const atRisk = open.reduce((sum, i) => sum + i.affected, 0);
  const stranded = state.nodes.filter((n) => isOffline(n) && n.blobs > 0).length;
  const unavailable = Math.round((DEMO_OBJECTS * choose(stranded, REPLICAS)) / choose(state.nodes.length, REPLICAS));
  const objectsSafe = Math.round(open.reduce((safe, i) => safe * (1 - i.affected / DEMO_OBJECTS), DEMO_OBJECTS));
  const chunks = DEMO_OBJECTS * REPLICAS;
  return {
    chunks,
    protected: Math.max(0, chunks - atRisk),
    degraded: 0,
    atRisk,
    unavailable,
    objects: DEMO_OBJECTS,
    objectsSafe: Math.max(0, objectsSafe - unavailable),
  };
}

function incidentSummary(incidents: readonly DemoIncident[]) {
  const resolved = incidents.filter((i) => i.status === "resolved").sort((a, b) => a.repairAt - b.repairAt);
  const times = resolved.map((i) => i.recoveryMs);
  return {
    open: incidents.length - resolved.length,
    resolved: resolved.length,
    lastRecoveryMs: times.at(-1) ?? 0,
    meanRecoveryMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    maxRecoveryMs: times.length ? Math.max(...times) : 0,
  };
}

function toIncident(incident: DemoIncident): VaultIncident {
  return {
    id: incident.id,
    kind: incident.kind,
    subject: incident.subject,
    detail: incident.detail,
    status: incident.status,
    recoveryMs: incident.recoveryMs,
    timeToDetectMs: DETECT_MS,
  };
}

export function demoOverview(state: DemoState): VaultOverview {
  const dur = durability(state);
  const summary = incidentSummary(state.incidents);
  const logicalBytes = DEMO_OBJECTS * PIECE_BYTES;
  return {
    nodes: state.nodes.map((n) => ({
      id: n.id,
      zone: n.zone,
      state: n.running ? "up" : "down",
      draining: false,
      blobs: n.blobs,
      bytes: n.blobs * PIECE_BYTES,
      link: n.link,
      running: n.running,
    })),
    zones: [...new Set(NODE_LAYOUT.map((n) => n.zone))],
    durability: dur,
    incidentSummary: summary,
    incidents: [...state.incidents].sort((a, b) => b.startedAt - a.startedAt).map(toIncident),
    repair: { queue: dur.atRisk, repaired: state.repairedPieces, healed: state.healed },
    engine: {
      availability: dur.unavailable > 0 ? 0.962 : 0.9997,
      puts: state.puts,
      gets: state.gets,
      p99Ms: summary.open > 0 ? 38 : 14,
      corruptDetected: 1,
    },
    storage: { logicalBytes, physicalBytes: logicalBytes * REPLICAS },
    overhead: REPLICAS,
  };
}
