import { describe, expect, it } from "vitest";
import {
  addFile,
  createLibrary,
  fileHealth,
  filesInBucket,
  librarySummary,
  removeFile,
  toggleMachine,
  uniqueName,
} from "./library";

const NOW = 1_700_000_000_000;

describe("createLibrary", () => {
  it("starts with sample files fully copied across three zones", () => {
    const library = createLibrary();
    expect(library.files.length).toBeGreaterThan(0);
    expect(library.machines.every((machine) => machine.running)).toBe(true);
    for (const file of library.files) {
      const zones = file.replicas.map((id) => library.machines.find((machine) => machine.id === id)?.zone);
      expect(new Set(zones).size).toBe(3);
      expect(fileHealth(file, library.machines)).toEqual({ copiesOnline: 3, readable: true, status: "protected" });
    }
  });
});

describe("fileHealth", () => {
  it("keeps a file readable after one of its machines stops", () => {
    const stopped = toggleMachine(createLibrary(), "n5");
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) return;
    const file = stopped.state.files[0];
    expect(file?.replicas).toContain("n5");
    expect(fileHealth(file!, stopped.state.machines)).toEqual({ copiesOnline: 2, readable: true, status: "repairing" });
  });

  it("marks a file unavailable only when every copy is offline", () => {
    let state = createLibrary();
    const file = state.files[0]!;
    for (const id of file.replicas) {
      const next = toggleMachine(state, id);
      expect(next.ok).toBe(true);
      if (!next.ok) return;
      state = next.state;
    }
    expect(fileHealth(file, state.machines)).toEqual({ copiesOnline: 0, readable: false, status: "unavailable" });
  });
});

describe("addFile", () => {
  it("stores a new file on three machines in different zones", () => {
    const result = addFile(createLibrary(), { id: "f-new", name: "  notes.txt  ", bucket: "uploads", bytes: 12, addedAt: NOW });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const added = result.state.files.find((file) => file.id === "f-new");
    expect(added?.name).toBe("notes.txt");
    const zones = added!.replicas.map((id) => result.state.machines.find((machine) => machine.id === id)?.zone);
    expect(new Set(zones).size).toBe(3);
  });

  it("gives a second record a new name instead of overwriting the first", () => {
    const library = createLibrary();
    const first = uniqueName(library, "wedding-album.zip");
    expect(first).toBe("wedding-album.zip");
    const withFirst = addFile(library, { id: "photo-1", name: first!, bucket: "photos", bytes: 10, addedAt: NOW });
    expect(withFirst.ok).toBe(true);
    if (!withFirst.ok) return;
    expect(uniqueName(withFirst.state, "wedding-album.zip")).toBe("wedding-album-2.zip");
  });

  it("rejects an empty name and a name with a path", () => {
    const library = createLibrary();
    expect(addFile(library, { id: "a", name: "   ", bucket: "photos", bytes: 1, addedAt: NOW }).ok).toBe(false);
    expect(addFile(library, { id: "b", name: "folder/secret.txt", bucket: "photos", bytes: 1, addedAt: NOW }).ok).toBe(false);
  });
});

describe("removeFile and filters", () => {
  it("removes one file and filters the rest by bucket and search", () => {
    const library = createLibrary();
    const target = library.files.find((file) => file.bucket === "photos");
    expect(target).toBeDefined();
    const removed = removeFile(library, target!.id);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.state.files.some((file) => file.id === target!.id)).toBe(false);
    expect(filesInBucket(library, "photos", "zzz-not-a-file")).toEqual([]);
    expect(filesInBucket(library, "photos", target!.name.slice(0, 4)).some((file) => file.id === target!.id)).toBe(true);
  });

  it("counts how many files are still readable", () => {
    const library = createLibrary();
    const summary = librarySummary(library);
    expect(summary.files).toBe(library.files.length);
    expect(summary.protected).toBe(library.files.length);
    expect(summary.readable).toBe(library.files.length);
    const stopped = toggleMachine(library, "n5");
    if (!stopped.ok) throw new Error("expected to stop n5");
    const after = librarySummary(stopped.state);
    expect(after.readable).toBe(after.files);
    expect(after.protected).toBeLessThan(after.files);
  });
});
