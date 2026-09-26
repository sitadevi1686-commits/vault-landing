import type { LibraryState } from "./library";

export const SHARED_LIBRARY_URL = "https://levy-poor-minus-import.trycloudflare.com/api/library";

const SHARED_HOSTS = new Set(["hydras.software", "www.hydras.software"]);

export function librarySyncUrl(hostname: string): string {
  if (SHARED_HOSTS.has(hostname)) return SHARED_LIBRARY_URL;
  return "/api/library";
}

export function sameLibrary(left: LibraryState, right: LibraryState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
