import { NextResponse } from "next/server";
import { parseLibrary } from "@/lib/vault/library";
import { libraryFilePath, pruneBlobs, readLibrary, recordArrival, writeLibrary } from "@/lib/vault/library-store";

const ALLOWED_ORIGINS = new Set([
  "https://www.hydras.software",
  "https://hydras.software",
  "http://98.81.35.22:3000",
  "https://genesis-there-martin-pressed.trycloudflare.com",
]);

const MAX_BYTES = 1_000_000;

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-Hydras-File-Name");
  return headers;
}

function json(request: Request, body: unknown, status = 200) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new NextResponse(JSON.stringify(body), { status, headers });
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const state = await readLibrary(libraryFilePath());
  return json(request, { state });
}

export async function PUT(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BYTES) {
    return json(request, { error: "That library is too large." }, 413);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Send the library as JSON." }, 400);
  }
  const state = parseLibrary(body);
  if (!state) return json(request, { error: "That library is not valid." }, 400);
  const previous = await readLibrary(libraryFilePath());
  const known = new Set(previous.files.map((file) => file.id));
  await writeLibrary(libraryFilePath(), state);
  await pruneBlobs(libraryFilePath(), state.files.map((file) => file.id));
  for (const file of state.files) {
    if (!known.has(file.id)) await recordArrival(`file arrived: ${file.name} (${file.bytes} bytes)`);
  }
  return json(request, { state });
}
