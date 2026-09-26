import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Console — Vault",
  description: "Live health of your local Vault cluster: which files are safe, at risk, or being repaired.",
};

export default function ConsoleLayout({ children }: LayoutProps<"/console">) {
  return (
    <>
      {children}
      <Toaster theme="dark" closeButton />
    </>
  );
}
