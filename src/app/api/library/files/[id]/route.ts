import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { fileHealth } from "@/lib/vault/library";
import { MAX_UPLOAD_BYTES } from "@/lib/vault/library-sync";
import { blobPath, libraryFilePath, readLibrary, recordArrival, uploadsDirectory, writeBlob, writeNamedUpload } from "@/lib/vault/library-store";

const ALLOWED_ORIGINS = new Set([
  "https://www.hydras.software",
  "https://hydras.software",
  "http://3.237.189.169:3000",
  "https://levy-poor-minus-import.trycloudflare.com",
]);

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

function json(request: Request, body: unknown, status: number) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new NextResponse(JSON.stringify(body), { status, headers });
}

function downloadName(name: string): string {
  const cleaned = name.replace(/[\r\n"]/g, "").slice(0, 180);
  return cleaned || "download";
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const target = blobPath(libraryFilePath(), id);
  if (!target) return json(request, { error: "That file id is not valid." }, 400);
  const state = await readLibrary(libraryFilePath());
  const file = state.files.find((item) => item.id === id);
  if (!file) return json(request, { error: "That file is not in the shared library." }, 404);
  if (!fileHealth(file, state.machines).readable) {
    return json(request, { error: "Every copy of this file is down." }, 409);
  }
  try {
    const bytes = await readFile(target);
    const headers = corsHeaders(request);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${downloadName(file.name)}"`);
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch {
    return json(request, { error: "This shared file has no saved bytes yet." }, 404);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const target = blobPath(libraryFilePath(), id);
  if (!target) return json(request, { error: "That file id is not valid." }, 400);
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES) {
    return json(request, { error: "That file is larger than 32 MB." }, 413);
  }
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return json(request, { error: "That file is larger than 32 MB." }, 413);
  }
  await writeBlob(target, bytes);
  const encodedName = request.headers.get("x-hydras-file-name");
  let displayName = id;
  if (encodedName) {
    try {
      displayName = decodeURIComponent(encodedName);
    } catch {
      displayName = id;
    }
  }
  const savedPath = await writeNamedUpload(uploadsDirectory(), displayName, bytes);
  await recordArrival(`real file saved: ${savedPath} (${bytes.byteLength} bytes)`);
  return json(request, { ok: true, id, bytes: bytes.byteLength, path: savedPath }, 200);
}
