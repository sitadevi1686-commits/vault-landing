import type { DesktopOS } from "@/lib/detect-os";

// TODO: replace the placeholder repo and release details once the first desktop build is published.
const GITHUB_URL = "https://github.com/your-org/vault";
const RELEASES_URL = `${GITHUB_URL}/releases/latest`;

export type DesktopBuild = {
  os: DesktopOS;
  label: string;
  fileName: string;
  arch: string;
  size: string;
  href: string;
};

export const siteConfig = {
  name: "Hydras",
  githubUrl: GITHUB_URL,
  docsUrl: `${GITHUB_URL}#readme`,
  releasesUrl: RELEASES_URL,
  checksumsUrl: `${RELEASES_URL}/download/SHA256SUMS.txt`,
  xUrl: "https://x.com/",
  version: "0.1.0",
  builds: [
    {
      os: "windows",
      label: "Windows",
      fileName: "Hydras-Setup-0.1.0.exe",
      arch: "x64 · Windows 10+",
      size: "~92 MB",
      href: `${RELEASES_URL}/download/Hydras-Setup-0.1.0.exe`,
    },
    {
      os: "mac",
      label: "macOS",
      fileName: "Hydras-0.1.0-universal.dmg",
      arch: "Apple silicon + Intel",
      size: "~110 MB",
      href: `${RELEASES_URL}/download/Hydras-0.1.0-universal.dmg`,
    },
    {
      os: "linux",
      label: "Linux",
      fileName: "Hydras-0.1.0.AppImage",
      arch: "x64 · AppImage",
      size: "~98 MB",
      href: `${RELEASES_URL}/download/Hydras-0.1.0.AppImage`,
    },
  ] satisfies DesktopBuild[],
  nav: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Live demo", href: "/console" },
    { label: "Docs", href: `${GITHUB_URL}#readme` },
    { label: "Download", href: "#download" },
  ],
} as const;

export function buildFor(os: DesktopOS | null): DesktopBuild | undefined {
  return siteConfig.builds.find((build) => build.os === os);
}
