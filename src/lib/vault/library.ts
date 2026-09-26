export const MACHINES = [
  { id: "n1", zone: "zone-a" },
  { id: "n2", zone: "zone-a" },
  { id: "n3", zone: "zone-b" },
  { id: "n4", zone: "zone-b" },
  { id: "n5", zone: "zone-c" },
] as const;

export const BUCKETS = [
  { id: "photos", label: "Photos", detail: "Family photos and video" },
  { id: "backups", label: "Backups", detail: "Laptop and disk images" },
  { id: "datasets", label: "Datasets", detail: "Training checkpoints" },
  { id: "uploads", label: "Uploads", detail: "Files a service received" },
] as const;

export type BucketId = (typeof BUCKETS)[number]["id"];

export type LibraryFile = {
  id: string;
  name: string;
  bucket: BucketId;
  bytes: number;
  addedAt: number;
  replicas: readonly [string, string, string];
};

export type MachineState = { id: string; zone: string; running: boolean };

export type LibraryState = {
  files: readonly LibraryFile[];
  machines: readonly MachineState[];
};

export type FileHealth = {
  copiesOnline: number;
  readable: boolean;
  status: "protected" | "repairing" | "unavailable";
};

export type LibraryResult = { ok: true; state: LibraryState } | { ok: false; error: string };

const MACHINE_IDS = new Set<string>(MACHINES.map((machine) => machine.id));
const BUCKET_IDS = new Set<string>(BUCKETS.map((bucket) => bucket.id));
const NAME_LIMIT = 180;
export const RECORD_BYTES = 24_000_000;

export const DEMO_RECORDS = [
  { label: "Add a photo", name: "wedding-album.zip", bucket: "photos", bytes: 3_200_000_000 },
  { label: "Add a backup", name: "nas-backup-tonight.tar", bucket: "backups", bytes: 12_000_000_000 },
  { label: "Add a checkpoint", name: "run-42-checkpoint.safetensors", bucket: "datasets", bytes: 8_100_000_000 },
  { label: "Add an upload", name: "signup-export.csv", bucket: "uploads", bytes: 840_000 },
] as const satisfies readonly { label: string; name: string; bucket: BucketId; bytes: number }[];

const SEED: readonly Omit<LibraryFile, "replicas">[] = [
  { id: "family-trip", name: "family-trip-2024.zip", bucket: "photos", bytes: 1_840_000_000, addedAt: 1_725_000_000_000 },
  { id: "laptop-backup", name: "laptop-backup-sep.tar", bucket: "backups", bytes: 48_200_000_000, addedAt: 1_726_200_000_000 },
  { id: "checkpoint", name: "checkpoint-epoch-40.safetensors", bucket: "datasets", bytes: 6_400_000_000, addedAt: 1_726_800_000_000 },
  { id: "invoices", name: "invoice-batch-september.csv", bucket: "uploads", bytes: 2_400_000, addedAt: 1_727_100_000_000 },
];

function zoneOf(id: string): string | undefined {
  return MACHINES.find((machine) => machine.id === id)?.zone;
}

function seedReplicas(index: number): LibraryFile["replicas"] {
  const plans: LibraryFile["replicas"][] = [
    ["n1", "n3", "n5"],
    ["n2", "n4", "n5"],
    ["n1", "n4", "n5"],
    ["n2", "n3", "n5"],
  ];
  return plans[index] ?? plans[0]!;
}

export function createLibrary(): LibraryState {
  return {
    machines: MACHINES.map((machine) => ({ ...machine, running: true })),
    files: SEED.map((file, index) => ({ ...file, replicas: seedReplicas(index) })),
  };
}

export function fileHealth(file: LibraryFile, machines: readonly MachineState[]): FileHealth {
  const online = new Set(machines.filter((machine) => machine.running).map((machine) => machine.id));
  const copiesOnline = file.replicas.filter((id) => online.has(id)).length;
  const status = copiesOnline >= 3 ? "protected" : copiesOnline > 0 ? "repairing" : "unavailable";
  return { copiesOnline, readable: copiesOnline > 0, status };
}

export function librarySummary(state: LibraryState) {
  const health = state.files.map((file) => fileHealth(file, state.machines));
  return {
    files: state.files.length,
    protected: health.filter((item) => item.status === "protected").length,
    readable: health.filter((item) => item.readable).length,
    unavailable: health.filter((item) => item.status === "unavailable").length,
  };
}

export function filesInBucket(state: LibraryState, bucket: BucketId | "all", query: string): LibraryFile[] {
  const needle = query.trim().toLowerCase();
  return state.files.filter((file) => {
    const inBucket = bucket === "all" || file.bucket === bucket;
    return inBucket && file.name.toLowerCase().includes(needle);
  });
}

function cleanName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > NAME_LIMIT) return null;
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..")) return null;
  return trimmed;
}

export function uniqueName(state: LibraryState, name: string): string | null {
  const cleaned = cleanName(name);
  if (!cleaned) return null;
  if (!state.files.some((file) => file.name === cleaned)) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  const stem = dot > 0 ? cleaned.slice(0, dot) : cleaned;
  const ext = dot > 0 ? cleaned.slice(dot) : "";
  let count = 2;
  while (state.files.some((file) => file.name === `${stem}-${count}${ext}`)) count += 1;
  return `${stem}-${count}${ext}`;
}

function chooseReplicas(state: LibraryState): LibraryFile["replicas"] | null {
  const load = new Map(state.machines.map((machine) => [machine.id, 0]));
  for (const file of state.files) {
    for (const id of file.replicas) load.set(id, (load.get(id) ?? 0) + 1);
  }
  const picked: string[] = [];
  const zones = [...new Set(state.machines.map((machine) => machine.zone))];
  for (const zone of zones) {
    if (picked.length === 3) break;
    const inZone = state.machines.filter((machine) => machine.zone === zone);
    const running = inZone.filter((machine) => machine.running);
    const pool = [...(running.length > 0 ? running : inZone)].sort(
      (a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0) || a.id.localeCompare(b.id),
    );
    const choice = pool[0];
    if (choice) picked.push(choice.id);
  }
  if (picked.length < 3) return null;
  return [picked[0]!, picked[1]!, picked[2]!];
}

export function addFile(
  state: LibraryState,
  input: { id: string; name: string; bucket: BucketId; bytes: number; addedAt: number },
): LibraryResult {
  const name = cleanName(input.name);
  if (!name) return { ok: false, error: "Use a file name without folders, up to 180 characters." };
  if (!BUCKET_IDS.has(input.bucket)) return { ok: false, error: "Choose a folder for this file." };
  if (!Number.isFinite(input.bytes) || input.bytes < 0) return { ok: false, error: "That file size is not valid." };
  if (state.files.some((file) => file.id === input.id)) return { ok: false, error: "That file is already stored." };
  const replicas = chooseReplicas(state);
  if (!replicas) return { ok: false, error: "There are not enough machines to keep three copies." };
  const file: LibraryFile = { id: input.id, name, bucket: input.bucket, bytes: input.bytes, addedAt: input.addedAt, replicas };
  return { ok: true, state: { ...state, files: [file, ...state.files] } };
}

export function removeFile(state: LibraryState, id: string): LibraryResult {
  if (!state.files.some((file) => file.id === id)) return { ok: false, error: "That file is not in the library." };
  return { ok: true, state: { ...state, files: state.files.filter((file) => file.id !== id) } };
}

export function toggleMachine(state: LibraryState, id: string): LibraryResult {
  if (!MACHINE_IDS.has(id)) return { ok: false, error: `There is no storage machine called ${id}.` };
  return {
    ok: true,
    state: {
      ...state,
      machines: state.machines.map((machine) => (machine.id === id ? { ...machine, running: !machine.running } : machine)),
    },
  };
}

function isBucket(value: unknown): value is BucketId {
  return typeof value === "string" && BUCKET_IDS.has(value);
}

function isFile(value: unknown): value is LibraryFile {
  if (!value || typeof value !== "object") return false;
  const file = value as LibraryFile;
  return (
    typeof file.id === "string" &&
    typeof file.name === "string" &&
    isBucket(file.bucket) &&
    typeof file.bytes === "number" &&
    Number.isFinite(file.bytes) &&
    file.bytes >= 0 &&
    typeof file.addedAt === "number" &&
    Array.isArray(file.replicas) &&
    file.replicas.length === 3 &&
    file.replicas.every((id) => typeof id === "string" && MACHINE_IDS.has(id)) &&
    new Set(file.replicas.map(zoneOf)).size === 3
  );
}

export function parseLibrary(raw: unknown): LibraryState | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as { files?: unknown; machines?: unknown };
  const savedFiles = body.files;
  const savedMachines = body.machines;
  if (!Array.isArray(savedFiles) || !Array.isArray(savedMachines)) return null;
  if (savedMachines.length !== MACHINES.length) return null;
  const machines = MACHINES.map((machine) => {
    const saved = savedMachines.find((item) => item && typeof item === "object" && (item as MachineState).id === machine.id) as
      | MachineState
      | undefined;
    if (!saved || typeof saved.running !== "boolean") return null;
    return { id: machine.id, zone: machine.zone, running: saved.running };
  });
  if (machines.some((machine) => machine === null)) return null;
  if (!savedFiles.every(isFile)) return null;
  return { files: savedFiles, machines: machines as MachineState[] };
}

export function healthLabel(health: FileHealth): string {
  if (health.status === "protected") return "3 copies";
  if (health.status === "repairing") return "Still readable";
  return "Unavailable";
}

export function healthDetail(health: FileHealth): string {
  if (health.status === "protected") return "Every copy is on a machine that is up.";
  if (health.status === "repairing") {
    return `A machine is down. ${health.copiesOnline} of 3 copies can still serve this file.`;
  }
  return "Every machine holding this file is stopped, so it cannot be read right now.";
}
