import type { LibraryState } from "./library";

export const SHARED_LIBRARY_URL = "https://levy-poor-minus-import.trycloudflare.com/api/library";

const SHARED_HOSTS = new Set(["hydras.software", "www.hydras.software"]);

export const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

export function librarySyncUrl(hostname: string): string {
  if (SHARED_HOSTS.has(hostname)) return SHARED_LIBRARY_URL;
  return "/api/library";
}

export function libraryFileUrl(hostname: string, id: string): string {
  const root = SHARED_HOSTS.has(hostname) ? SHARED_LIBRARY_URL.replace(/\/api\/library$/, "") : "";
  return `${root}/api/library/files/${encodeURIComponent(id)}`;
}

export function sameLibrary(left: LibraryState, right: LibraryState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
