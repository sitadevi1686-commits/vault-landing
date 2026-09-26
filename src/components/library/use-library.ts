"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addFile,
  createLibrary,
  fileHealth,
  parseLibrary,
  RECORD_BYTES,
  removeFile,
  toggleMachine,
  uniqueName,
  type BucketId,
  type LibraryFile,
  type LibraryResult,
  type LibraryState,
} from "@/lib/vault/library";
import { libraryFileUrl, librarySyncUrl, MAX_UPLOAD_BYTES, sameLibrary } from "@/lib/vault/library-sync";

const STORAGE_KEY = "hydras-library-v1";

function apply(result: LibraryResult, success: string): LibraryState | null {
  if (!result.ok) {
    toast.error(result.error);
    return null;
  }
  toast.success(success);
  return result.state;
}

function savedLibrary(): LibraryState | null {
  try {
    return parseLibrary(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return null;
  }
}

export function useLibrary() {
  const [state, setState] = useState<LibraryState>(createLibrary);
  const [ready, setReady] = useState(false);
  const blobs = useRef(new Map<string, Blob>());
  const writing = useRef(false);
  const endpoint = useRef("/api/library");

  useEffect(() => {
    endpoint.current = librarySyncUrl(window.location.hostname);
    let cancelled = false;

    async function pull(first: boolean) {
      if (writing.current) return;
      try {
        const response = await fetch(endpoint.current, { cache: "no-store" });
        if (!response.ok) throw new Error("The shared library did not answer");
        const body: unknown = await response.json();
        const record = body && typeof body === "object" && "state" in body ? body.state : body;
        const parsed = parseLibrary(record);
        if (!parsed || cancelled) return;
        setState((current) => (sameLibrary(current, parsed) ? current : parsed));
      } catch {
        if (first && !cancelled) {
          const local = savedLibrary();
          if (local) setState(local);
        }
      } finally {
        if (first && !cancelled) setReady(true);
      }
    }

    void pull(true);
    const timer = window.setInterval(() => void pull(false), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  function publish(next: LibraryState) {
    setState(next);
    writing.current = true;
    void fetch(endpoint.current, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    })
      .then((response) => {
        if (!response.ok) toast.error("The other Hydras site did not save this file.");
      })
      .catch(() => {
        toast.error("The other Hydras site did not save this file.");
      })
      .finally(() => {
        writing.current = false;
      });
  }

  return {
    state,
    blobFor: (id: string) => blobs.current.get(id),
    async upload(file: File, bucket: BucketId) {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error("Choose a file up to 32 MB so both sites can download it.");
        return null;
      }
      const id = crypto.randomUUID();
      const name = uniqueName(state, file.name);
      if (!name) {
        toast.error("Use a file name without folders, up to 180 characters.");
        return null;
      }
      const saved = await fetch(libraryFileUrl(window.location.hostname, id), {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-Hydras-File-Name": encodeURIComponent(name),
        },
        body: file,
      });
      if (!saved.ok) {
        toast.error("The shared server did not store this file.");
        return null;
      }
      const next = apply(
        addFile(state, { id, name, bucket, bytes: file.size, addedAt: Date.now() }),
        `${name} is stored as three copies.`,
      );
      if (!next) return null;
      blobs.current.set(id, file);
      publish(next);
      return id;
    },
    async download(file: LibraryFile) {
      const health = fileHealth(file, state.machines);
      if (!health.readable) {
        toast.error("Every copy is down, so this file cannot be read.");
        return;
      }
      try {
        const response = await fetch(libraryFileUrl(window.location.hostname, file.id));
        if (response.ok) {
          saveDownload(await response.blob(), file.name);
          return;
        }
        if (response.status === 404) {
          toast.error("That row has no file bytes yet. Upload the file again.");
          return;
        }
      } catch {
        toast.error("The shared server did not send the file.");
        return;
      }
      toast.error("That row has no file bytes yet. Upload the file again.");
    },
    addRecord(input: { name: string; bucket: BucketId; bytes?: number }) {
      const id = crypto.randomUUID();
      const name = uniqueName(state, input.name);
      if (!name) {
        toast.error("Use a file name without folders, up to 180 characters.");
        return null;
      }
      const next = apply(
        addFile(state, { id, name, bucket: input.bucket, bytes: input.bytes ?? RECORD_BYTES, addedAt: Date.now() }),
        `${name} is stored as three copies.`,
      );
      if (!next) return null;
      publish(next);
      return id;
    },
    remove(id: string, name: string) {
      const next = apply(removeFile(state, id), `${name} was removed from every machine.`);
      if (!next) return;
      blobs.current.delete(id);
      publish(next);
    },
    toggle(id: string) {
      const running = state.machines.find((machine) => machine.id === id)?.running;
      const next = apply(
        toggleMachine(state, id),
        running ? `${id} stopped. Other copies keep the files readable.` : `${id} is back online.`,
      );
      if (next) publish(next);
    },
    reset() {
      blobs.current.clear();
      publish(createLibrary());
      toast.success("Library reset to the sample files.");
    },
  };
}

function saveDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
