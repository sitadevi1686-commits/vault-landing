"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { VaultEnvelope, VaultOverview } from "@/lib/vault/types";

export type ActivitySample = { at: number; reads: number; writes: number };

async function readVault<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/vault/${path}`, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(15000) });
  const payload = (await response.json()) as VaultEnvelope<T>;
  if (!response.ok || !payload.ok || payload.data === undefined) throw new Error(payload.error || "Vault did not answer.");
  return payload.data;
}

export function useVault() {
  const [overview, setOverview] = useState<VaultOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [samples, setSamples] = useState<ActivitySample[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const completion = useRef<Promise<void> | null>(null);
  const acting = useRef(false);
  const last = useRef<{ at: number; reads: number; writes: number } | null>(null);

  const refresh = useCallback(async (afterCurrent = false) => {
    if (request.current) {
      if (!afterCurrent) return;
      await completion.current;
    }
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    let finish = () => {};
    completion.current = new Promise<void>((resolve) => { finish = resolve; });
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setRefreshing(true);
    try {
      const data = await readVault<VaultOverview>("overview", { signal: controller.signal });
      const at = Date.now();
      const current = { at, reads: data.engine.gets, writes: data.engine.puts };
      if (last.current && current.reads >= last.current.reads && current.writes >= last.current.writes) {
        const seconds = (at - last.current.at) / 1000;
        if (seconds > 0) {
          const sample = { at, reads: (current.reads - last.current.reads) / seconds, writes: (current.writes - last.current.writes) / seconds };
          setSamples((previous) => [...previous, sample].slice(-90));
        }
      } else {
        setSamples([]);
      }
      last.current = current;
      setOverview({ ...data, nodes: data.nodes ?? [], zones: data.zones ?? [], incidents: data.incidents ?? [] });
      setUpdatedAt(at);
      setError(null);
    } catch (failure) {
      if (controller.signal.reason === "unmounted") return;
      setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "The control panel took too long to respond.");
      setOverview(null);
      last.current = null;
      setSamples([]);
    } finally {
      window.clearTimeout(timeout);
      request.current = null;
      finish();
      if (controller.signal.reason !== "unmounted") setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => { window.clearInterval(timer); request.current?.abort("unmounted"); };
  }, [refresh]);

  async function act(nodeId: string, path: string, body: object, label: string) {
    if (acting.current || !overview || error) return;
    acting.current = true;
    setPending(`${nodeId}:${path}`);
    try {
      await readVault(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      toast.success(label);
      await refresh(true);
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Action failed.");
    } finally {
      acting.current = false;
      setPending(null);
    }
  }

  return { overview, error, refreshing, updatedAt, samples, pending, refresh, act };
}
