import type { DesktopOS } from "@/lib/detect-os";

const GITHUB_URL = "https://github.com/itsawesomeabhishek/vault";
const RELEASES_URL = `${GITHUB_URL}/releases`;

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
  checksumsUrl: `${GITHUB_URL}#readme`,
  xUrl: "https://x.com/",
  version: "0.1.0",
  builds: [
    {
      os: "windows",
      label: "Windows",
      fileName: "Vault-Setup.exe",
      arch: "x64 · Windows 10+",
      size: "GitHub",
      href: GITHUB_URL,
    },
    {
      os: "mac",
      label: "macOS",
      fileName: "Hydras-0.1.0-universal.dmg",
      arch: "Apple silicon + Intel",
      size: "~110 MB",
      href: GITHUB_URL,
    },
    {
      os: "linux",
      label: "Linux",
      fileName: "Hydras-0.1.0.AppImage",
      arch: "x64 · AppImage",
      size: "~98 MB",
      href: GITHUB_URL,
    },
  ] satisfies DesktopBuild[],
  nav: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "App", href: "/app" },
    { label: "Live demo", href: "/console" },
    { label: "Servers", href: "/live" },
    { label: "Docs", href: `${GITHUB_URL}#readme` },
    { label: "Download", href: "#download" },
  ],
} as const;

export function buildFor(os: DesktopOS | null): DesktopBuild | undefined {
  return siteConfig.builds.find((build) => build.os === os);
}
