import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createLibrary, parseLibrary, type LibraryState } from "./library";

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
