import { describe, expect, it } from "vitest";
import { createLibrary } from "./library";
import { libraryFileUrl, librarySyncUrl, sameLibrary, SHARED_LIBRARY_URL } from "./library-sync";

describe("librarySyncUrl", () => {
  it("sends the public site to the shared server", () => {
    expect(librarySyncUrl("www.hydras.software")).toBe(SHARED_LIBRARY_URL);
    expect(librarySyncUrl("hydras.software")).toBe(SHARED_LIBRARY_URL);
  });

  it("keeps the EC2 page on its own library API", () => {
    expect(librarySyncUrl("3.237.189.169")).toBe("/api/library");
    expect(librarySyncUrl("levy-poor-minus-import.trycloudflare.com")).toBe("/api/library");
  });

  it("downloads a shared file from the same server the library uses", () => {
    expect(libraryFileUrl("www.hydras.software", "family-trip")).toBe(
      "https://levy-poor-minus-import.trycloudflare.com/api/library/files/family-trip",
    );
    expect(libraryFileUrl("3.237.189.169", "abc-1")).toBe("/api/library/files/abc-1");
  });
});

describe("sameLibrary", () => {
  it("treats two copies of the sample library as the same", () => {
    expect(sameLibrary(createLibrary(), createLibrary())).toBe(true);
  });
});
