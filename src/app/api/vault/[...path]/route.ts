import { NextResponse } from "next/server";

const ALLOWED = new Set([
  "GET /overview",
  "POST /chaos/kill",
  "POST /chaos/restart",
  "POST /chaos/link",
]);

const LINK_MODES = new Set(["healthy", "partitioned", "flaky", "slow"]);

let cachedToken: { value: string; at: number } | null = null;

function panelOrigin(): string {
  const raw = process.env.VAULT_PANEL_URL ?? "http://127.0.0.1:9001";
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("VAULT_PANEL_URL must be http or https");
  }
  return url.origin;
}

async function panelToken(origin: string): Promise<string> {
  if (cachedToken && Date.now() - cachedToken.at < 30_000) {
    return cachedToken.value;
  }
  const page = await fetch(`${origin}/`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!page.ok) {
    throw new Error("Vault control panel did not respond");
  }
  const html = await page.text();
  const match = html.match(/name="vault-token" content="([A-Za-z0-9]+)"/);
  if (!match) {
    throw new Error("Vault control panel did not return a session token");
  }
  cachedToken = { value: match[1], at: Date.now() };
  return match[1];
}

function routeKey(method: string, path: string[]): string | null {
  if (path.some((part) => part.includes("..") || part.includes("/"))) return null;
  return `${method} /${path.join("/")}`;
}

async function forward(
  method: string,
  path: string[],
  body?: string,
): Promise<NextResponse> {
  const key = routeKey(method, path);
  if (!key || !ALLOWED.has(key)) {
    return NextResponse.json(
      { ok: false, error: "That control action is not available from the console." },
      { status: 404 },
    );
  }
  let origin: string;
  try {
    origin = panelOrigin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid panel URL";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
  try {
    const token = await panelToken(origin);
    const upstream = await fetch(`${origin}/api/${path.join("/")}`, {
      method,
      cache: "no-store",
      headers: {
        "X-Vault-Token": token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    cachedToken = null;
    return NextResponse.json(
      {
        ok: false,
        error: "Vault is not running on this machine. Start it, then refresh.",
      },
      { status: 503 },
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward("GET", path);
}

function chaosBody(path: string[], raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const node = body.node;
  if (typeof node !== "string" || !/^n\d{1,2}$/.test(node)) return null;
  const action = path[1];
  if (action === "kill" || action === "restart") {
    return JSON.stringify({ node });
  }
  if (action === "link" && typeof body.mode === "string" && LINK_MODES.has(body.mode)) {
    return JSON.stringify({ node, mode: body.mode });
  }
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const raw = await request.text();
  if (raw.length > 4096) {
    return NextResponse.json(
      { ok: false, error: "Request is too large." },
      { status: 413 },
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON." },
      { status: 400 },
    );
  }
  const body = chaosBody(path, parsed);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Choose a storage node and a valid action." },
      { status: 400 },
    );
  }
  return forward("POST", path, body);
}
