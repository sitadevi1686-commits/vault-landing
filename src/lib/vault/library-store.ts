import { appendFile, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createLibrary, parseLibrary, type LibraryState } from "./library";

export async function recordArrival(line: string): Promise<void> {
  const text = `${new Date().toISOString()}  ${line}\n`;
  console.log(text.trim());
  try {
    await appendFile(process.env.HYDRAS_ARRIVAL_LOG ?? "/home/ubuntu/hydras-arrivals.log", text);
  } catch {
    /* The EC2 login account is where this log is read. */
  }
}

export function libraryFilePath(): string {
  return process.env.HYDRAS_LIBRARY_FILE ?? path.join(process.cwd(), "data", "library.json");
}

export async function readLibrary(filePath: string): Promise<LibraryState> {
  try {
    const parsed = parseLibrary(JSON.parse(await readFile(filePath, "utf8")));
    return parsed ?? createLibrary();
  } catch {
    return createLibrary();
  }
}

export async function writeLibrary(filePath: string, state: LibraryState): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, JSON.stringify(state));
  await rename(temporary, filePath);
}

export function uploadsDirectory(): string {
  return process.env.HYDRAS_UPLOADS_DIR ?? "/home/ubuntu/uploads";
}

export function safeUploadName(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() ?? "";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/^\.+/, "").slice(0, 120);
  return cleaned || "upload";
}

export async function writeNamedUpload(directory: string, name: string, bytes: Buffer): Promise<string> {
  const fileName = safeUploadName(name);
  await mkdir(directory, { recursive: true });
  const target = path.join(directory, fileName);
  await writeBlob(target, bytes);
  return target;
}

export function safeBlobId(id: string): string | null {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(id)) return null;
  return id;
}

export function blobDirectory(libraryPath: string): string {
  return path.join(path.dirname(libraryPath), "blobs");
}

export function blobPath(libraryPath: string, id: string): string | null {
  const safe = safeBlobId(id);
  if (!safe) return null;
  return path.join(blobDirectory(libraryPath), safe);
}

export async function writeBlob(filePath: string, bytes: Buffer): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, bytes);
  await rename(temporary, filePath);
}

export async function pruneBlobs(libraryPath: string, ids: readonly string[]): Promise<void> {
  const directory = blobDirectory(libraryPath);
  const keep = new Set(ids);
  let names: string[] = [];
  try {
    names = await readdir(directory);
  } catch {
    return;
  }
  await Promise.all(
    names.filter((name) => !keep.has(name) && !name.endsWith(".tmp")).map((name) => unlink(path.join(directory, name))),
  );
}
