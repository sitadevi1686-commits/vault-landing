"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ActivitySample, DataMode } from "@/lib/vault/demo-cluster";
import { createDemoSource } from "@/lib/vault/demo-source";
import type { VaultEnvelope, VaultOverview } from "@/lib/vault/types";
import { useDataMode } from "./use-data-mode";

export type { ActivitySample };

const REFRESH_MS = 2000;
const TIMEOUT_MS = 15000;
const MAX_SAMPLES = 90;

type VaultSource = {
  overview: (signal: AbortSignal) => Promise<VaultOverview>;
  act: (path: string, body: object) => Promise<void>;
  history?: () => ActivitySample[];
  reset?: () => void;
};

async function readVault<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/vault/${path}`, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) });
  const payload = (await response.json()) as VaultEnvelope<T>;
  if (!response.ok || !payload.ok || payload.data === undefined) throw new Error(payload.error || "Vault did not answer.");
  return payload.data;
}

const liveSource: VaultSource = {
  overview: (signal) => readVault<VaultOverview>("overview", { signal }),
  act: async (path, body) => {
    await readVault(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  },
};

function sourceFor(mode: DataMode | null): VaultSource | null {
  if (mode === "live") return liveSource;
  if (mode === "demo") {
    const demo = createDemoSource();
    return { overview: () => demo.overview(), act: demo.act, history: demo.history, reset: demo.reset };
  }
  return null;
}

export function useVault() {
  const mode = useDataMode();
  const source = useMemo(() => sourceFor(mode), [mode]);
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
    if (!source) return;
    if (request.current) {
      if (!afterCurrent) return;
      await completion.current;
    }
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    let finish = () => {};
    completion.current = new Promise<void>((resolve) => { finish = resolve; });
    const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    setRefreshing(true);
    try {
      const data = await source.overview(controller.signal);
      const at = Date.now();
      const current = { at, reads: data.engine.gets, writes: data.engine.puts };
      if (last.current && current.reads >= last.current.reads && current.writes >= last.current.writes) {
        const seconds = (at - last.current.at) / 1000;
        if (seconds > 0) {
          const sample = { at, reads: (current.reads - last.current.reads) / seconds, writes: (current.writes - last.current.writes) / seconds };
          setSamples((previous) => [...previous, sample].slice(-MAX_SAMPLES));
        }
      } else {
        setSamples(source.history?.() ?? []);
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
  }, [source]);

  useEffect(() => {
    if (!source) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => { window.clearInterval(timer); request.current?.abort("unmounted"); };
  }, [refresh, source]);

  async function act(nodeId: string, path: string, body: object, label: string) {
    if (!source || acting.current || !overview || error) return;
    acting.current = true;
    setPending(`${nodeId}:${path}`);
    try {
      await source.act(path, body);
      toast.success(label);
      await refresh(true);
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Action failed.");
    } finally {
      acting.current = false;
      setPending(null);
    }
  }

  async function resetDemo() {
    if (!source?.reset) return;
    source.reset();
    last.current = null;
    toast.success("Demo reset to a healthy cluster.");
    await refresh(true);
  }

  return { mode, overview, error, refreshing, updatedAt, samples, pending, refresh, act, resetDemo };
}
