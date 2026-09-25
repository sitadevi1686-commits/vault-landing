"use client";

import { useSyncExternalStore } from "react";
import { detectOS, type DesktopOS } from "@/lib/detect-os";

type NavigatorWithUAData = Navigator & { userAgentData?: { platform?: string } };

const subscribe = () => () => {};

function getSnapshot(): DesktopOS | null {
  const nav = navigator as NavigatorWithUAData;
  return detectOS(nav.userAgent, nav.userAgentData?.platform);
}

const getServerSnapshot = (): DesktopOS | null => null;

export function useDesktopOS(): DesktopOS | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
