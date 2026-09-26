export type NodeState = "starting" | "up" | "suspect" | "down" | string;

export type LinkMode = "healthy" | "partitioned" | "flaky" | "slow";

export type VaultNode = {
  id: string;
  zone: string;
  state: NodeState;
  draining: boolean;
  blobs: number;
  bytes: number;
  link: LinkMode;
  running: boolean;
};

export type VaultIncident = {
  id: string;
  kind: string;
  subject: string;
  detail: string;
  status: "open" | "resolved" | string;
  recoveryMs: number;
  timeToDetectMs: number;
};

export type VaultOverview = {
  nodes: VaultNode[];
  zones: string[];
  durability: {
    chunks: number;
    protected: number;
    degraded: number;
    atRisk: number;
    unavailable: number;
    objects: number;
    objectsSafe: number;
  };
  incidentSummary: {
    open: number;
    resolved: number;
    lastRecoveryMs: number;
    meanRecoveryMs: number;
    maxRecoveryMs: number;
  };
  incidents: VaultIncident[];
  repair: {
    queue: number;
    repaired: number;
    healed: number;
  };
  engine: {
    availability: number;
    puts: number;
    gets: number;
    p99Ms: number;
    corruptDetected: number;
  };
  storage: {
    logicalBytes: number;
    physicalBytes: number;
  };
  overhead: number;
};

export type VaultEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
