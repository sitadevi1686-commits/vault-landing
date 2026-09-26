import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createLibrary, toggleMachine } from "./library";
import { readFile } from "node:fs/promises";
import { blobPath, readLibrary, safeBlobId, safeUploadName, writeBlob, writeLibrary, writeNamedUpload } from "./library-store";

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

describe("blob files", () => {
  it("rejects ids that could escape the blob folder", () => {
    expect(safeBlobId("../secret")).toBeNull();
    expect(safeBlobId("family-trip")).toBe("family-trip");
  });

  it("saves an upload under its real file name", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "hydras-library-"));
    directories.push(directory);
    expect(safeUploadName("../secret.txt")).toBe("secret.txt");
    const saved = await writeNamedUpload(directory, "Unit 1-2 Computing_Environment.pptx", Buffer.from("pptx-bytes"));
    expect(saved.endsWith("Unit 1-2 Computing_Environment.pptx")).toBe(true);
    expect(await readFile(saved, "utf8")).toBe("pptx-bytes");
  });

  it("reads back the bytes saved for a file id", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "hydras-library-"));
    directories.push(directory);
    const target = blobPath(path.join(directory, "library.json"), "photo-1");
    expect(target).not.toBeNull();
    if (!target) return;
    await writeBlob(target, Buffer.from("hello photo"));
    expect(await readFile(target, "utf8")).toBe("hello photo");
  });
});
