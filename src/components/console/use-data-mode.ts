"use client";

import { useSyncExternalStore } from "react";
import { resolveDataMode, type DataMode } from "@/lib/vault/demo-cluster";

const subscribe = () => () => {};
const getSnapshot = (): DataMode => resolveDataMode(window.location.hostname, window.location.search);
const getServerSnapshot = (): DataMode | null => null;

export function useDataMode(): DataMode | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
