import { NextResponse } from "next/server";
import { LINK_SERVERS, summarizeProbes, type ServerId, type ServerProbe } from "@/lib/vault/link-demo";

const HOST = "127.0.0.1";
const CONTROL = `http://${HOST}:4199`;
const PORTS: Record<ServerId, number> = { a: 4101, b: 4102, c: 4103 };

function isServerId(value: unknown): value is ServerId {
  return value === "a" || value === "b" || value === "c";
}

async function probeOne(id: ServerId): Promise<ServerProbe> {
  const port = PORTS[id];
  const started = Date.now();
  try {
    const response = await fetch(`http://${HOST}:${port}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });
    const body: unknown = await response.json();
    const record = body && typeof body === "object" ? body : {};
    const peer = "peer" in record && record.peer && typeof record.peer === "object" ? record.peer : null;
    return {
      id,
      ok: response.ok,
      ms: Date.now() - started,
      host: "host" in record && typeof record.host === "string" ? record.host : null,
      port,
      peerOk: peer && "ok" in peer && typeof peer.ok === "boolean" ? peer.ok : null,
      peerMs: peer && "ms" in peer && typeof peer.ms === "number" ? peer.ms : null,
    };
  } catch {
    return { id, ok: false, ms: null, host: null, port, peerOk: null, peerMs: null };
  }
}

export async function GET() {
  try {
    const status = await fetch(`${CONTROL}/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });
    if (!status.ok) throw new Error("The link servers did not answer");
  } catch {
    return NextResponse.json(
      {
        ready: false,
        copies: 0,
        total: 3,
        readable: false,
        linkOpen: false,
        label: "The two servers are not running on this machine.",
        probes: [],
        error: "The two servers are not running on this machine.",
      },
      { status: 503 },
    );
  }
  const probes = await Promise.all(LINK_SERVERS.map((server) => probeOne(server.id)));
  return NextResponse.json({ ready: true, ...summarizeProbes(probes) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON." }, { status: 400 });
  }
  const record = body && typeof body === "object" ? body : {};
  const id = "id" in record ? record.id : null;
  const up = "up" in record ? record.up : null;
  if (!isServerId(id) || typeof up !== "boolean") {
    return NextResponse.json({ ok: false, error: "Choose server a, b, or c." }, { status: 400 });
  }
  try {
    const response = await fetch(`${CONTROL}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, up }),
      cache: "no-store",
      signal: AbortSignal.timeout(800),
    });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The two servers are not running on this machine." },
      { status: 503 },
    );
  }
}
