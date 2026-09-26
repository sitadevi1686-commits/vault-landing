"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addFile,
  createLibrary,
  parseLibrary,
  RECORD_BYTES,
  removeFile,
  toggleMachine,
  uniqueName,
  type BucketId,
  type LibraryResult,
  type LibraryState,
} from "@/lib/vault/library";

const STORAGE_KEY = "hydras-library-v1";

function apply(result: LibraryResult, setState: (state: LibraryState) => void, success: string) {
  if (!result.ok) {
    toast.error(result.error);
    return false;
  }
  setState(result.state);
  toast.success(success);
  return true;
}

export function useLibrary() {
  const [state, setState] = useState<LibraryState>(createLibrary);
  const [ready, setReady] = useState(false);
  const blobs = useRef(new Map<string, Blob>());

  useEffect(() => {
    try {
      const saved = parseLibrary(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
      if (saved) setState(saved);
    } catch {
      /* Keep the sample library when stored data is unreadable. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  return {
    state,
    blobFor: (id: string) => blobs.current.get(id),
    upload(file: File, bucket: BucketId) {
      const id = crypto.randomUUID();
      const name = uniqueName(state, file.name);
      if (!name) {
        toast.error("Use a file name without folders, up to 180 characters.");
        return null;
      }
      const saved = apply(
        addFile(state, { id, name, bucket, bytes: file.size, addedAt: Date.now() }),
        setState,
        `${name} is stored as three copies.`,
      );
      if (!saved) return null;
      blobs.current.set(id, file);
      return id;
    },
    addRecord(input: { name: string; bucket: BucketId; bytes?: number }) {
      const id = crypto.randomUUID();
      const name = uniqueName(state, input.name);
      if (!name) {
        toast.error("Use a file name without folders, up to 180 characters.");
        return null;
      }
      const bytes = input.bytes ?? RECORD_BYTES;
      const saved = apply(
        addFile(state, { id, name, bucket: input.bucket, bytes, addedAt: Date.now() }),
        setState,
        `${name} is stored as three copies.`,
      );
      return saved ? id : null;
    },
    remove(id: string, name: string) {
      const saved = apply(removeFile(state, id), setState, `${name} was removed from every machine.`);
      if (saved) blobs.current.delete(id);
    },
    toggle(id: string) {
      const running = state.machines.find((machine) => machine.id === id)?.running;
      apply(
        toggleMachine(state, id),
        setState,
        running ? `${id} stopped. Other copies keep the files readable.` : `${id} is back online.`,
      );
    },
    reset() {
      blobs.current.clear();
      setState(createLibrary());
      toast.success("Library reset to the sample files.");
    },
  };
}
