import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createLibrary, toggleMachine } from "./library";
import { readLibrary, writeLibrary } from "./library-store";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("library store", () => {
  it("starts from the sample library when nothing is saved", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "hydras-library-"));
    directories.push(directory);
    const saved = await readLibrary(path.join(directory, "library.json"));
    expect(saved.files).toHaveLength(createLibrary().files.length);
  });

  it("reads back a library after it is saved", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "hydras-library-"));
    directories.push(directory);
    const filePath = path.join(directory, "nested", "library.json");
    const stopped = toggleMachine(createLibrary(), "n5");
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) return;
    await writeLibrary(filePath, stopped.state);
    const saved = await readLibrary(filePath);
    expect(saved.machines.find((machine) => machine.id === "n5")?.running).toBe(false);
  });
});
