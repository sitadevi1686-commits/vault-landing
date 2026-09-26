import { describe, expect, it } from "vitest";
import { buildFor, siteConfig } from "./site-config";

describe("buildFor", () => {
  it("returns the Windows build for the windows OS", () => {
    const build = buildFor("windows");
    expect(build).toBeDefined();
    expect(build?.os).toBe("windows");
    expect(build?.href).toContain(".exe");
  });

  it("returns the macOS build for the mac OS", () => {
    const build = buildFor("mac");
    expect(build).toBeDefined();
    expect(build?.os).toBe("mac");
    expect(build?.href).toContain(".dmg");
  });

  it("returns the Linux build for the linux OS", () => {
    const build = buildFor("linux");
    expect(build).toBeDefined();
    expect(build?.os).toBe("linux");
    expect(build?.href).toContain(".AppImage");
  });

  it("returns undefined for null (mobile / unknown OS)", () => {
    expect(buildFor(null)).toBeUndefined();
  });

  it("every build href points to the releases URL base", () => {
    for (const os of ["windows", "mac", "linux"] as const) {
      expect(buildFor(os)?.href).toContain(siteConfig.releasesUrl);
    }
  });

  it("every build has a non-empty fileName, arch, and size", () => {
    for (const os of ["windows", "mac", "linux"] as const) {
      const build = buildFor(os);
      expect(build?.fileName).toBeTruthy();
      expect(build?.arch).toBeTruthy();
      expect(build?.size).toBeTruthy();
    }
  });
});
