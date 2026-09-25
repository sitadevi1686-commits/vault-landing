export type DesktopOS = "windows" | "mac" | "linux";

const MOBILE = /android|iphone|ipad|ipod|mobile/i;

export function detectOS(userAgent: string, platformHint?: string): DesktopOS | null {
  const hint = platformHint?.toLowerCase() ?? "";
  if (hint.includes("win")) return "windows";
  if (hint.includes("mac")) return "mac";
  if (hint.includes("linux") && !MOBILE.test(userAgent)) return "linux";

  if (MOBILE.test(userAgent)) return null;
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "mac";
  if (/linux|x11/i.test(userAgent)) return "linux";
  return null;
}
