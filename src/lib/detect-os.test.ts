import { describe, expect, it } from "vitest";
import { detectOS } from "./detect-os";

const UA = {
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  linux:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  android:
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
};

describe("detectOS", () => {
  it("detects desktop operating systems from the user agent", () => {
    expect(detectOS(UA.windows)).toBe("windows");
    expect(detectOS(UA.mac)).toBe("mac");
    expect(detectOS(UA.linux)).toBe("linux");
  });

  it("prefers the platform hint when present", () => {
    expect(detectOS(UA.linux, "Windows")).toBe("windows");
    expect(detectOS("", "macOS")).toBe("mac");
    expect(detectOS("", "Linux")).toBe("linux");
  });

  it("returns null for mobile devices, which cannot run the desktop app", () => {
    expect(detectOS(UA.android)).toBeNull();
    expect(detectOS(UA.iphone)).toBeNull();
  });

  it("returns null for unknown or empty input", () => {
    expect(detectOS("")).toBeNull();
    expect(detectOS("curl/8.0")).toBeNull();
  });
});
