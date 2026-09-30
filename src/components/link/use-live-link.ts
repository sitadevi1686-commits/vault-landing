"use client";

import { useCallback, useEffect, useState } from "react";
import type { ServerId, ServerProbe } from "@/lib/vault/link-demo";

export type LiveLink = {
  ready: boolean;
  copies: number;
  total: number;
  readable: boolean;
  linkOpen: boolean;
  label: string;
  probes: ServerProbe[];
  error: string | null;
};

const EMPTY: LiveLink = {
  ready: false,
  copies: 0,
  total: 3,
  readable: false,
  linkOpen: false,
  label: "Checking the two servers.",
  probes: [],
  error: null,
};

function isLiveLink(value: unknown): value is LiveLink {
  return Boolean(value && typeof value === "object" && "ready" in value && "probes" in value && Array.isArray(value.probes));
}

export function useLiveLink() {
  const [snapshot, setSnapshot] = useState<LiveLink>(EMPTY);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/link", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!isLiveLink(body)) return;
      setSnapshot(body);
    } catch {
      setSnapshot({ ...EMPTY, error: "The live check did not answer." });
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 1000);
    void refresh();
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function setServerUp(id: ServerId, up: boolean) {
    setPending(true);
    try {
      await fetch("/api/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, up }),
      });
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function restoreAll() {
    setPending(true);
    try {
      for (const id of ["a", "b", "c"] as const) {
        await fetch("/api/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, up: true }),
        });
      }
      await refresh();
    } finally {
      setPending(false);
    }
  }

  return { snapshot, pending, setServerUp, restoreAll };
}
