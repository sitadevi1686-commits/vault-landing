import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Files — Hydras",
  description: "Store photos, backups, and datasets. Each file is copied to three machines, so one disk can fail and the file stays readable.",
};

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster theme="dark" closeButton />
    </>
  );
}
