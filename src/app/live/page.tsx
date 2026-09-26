import type { Metadata } from "next";
import { ServerLink } from "@/components/link/server-link";

export const metadata: Metadata = {
  title: "Live link — Hydras",
  description: "Watch two storage servers check a file, then stop one and see the remaining copies keep it readable.",
};

export default function LiveLinkPage() {
  return <ServerLink />;
}
