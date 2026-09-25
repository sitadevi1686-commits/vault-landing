"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "cn";
import { useDesktopOS } from "@/hooks/use-desktop-os";
import { buildFor } from "@/lib/site-config";
import { OSIcon } from "./brand-icons";

type DownloadButtonProps = {
  size?: "sm" | "lg";
  className?: string;
};

export const pillPrimary =
  "group inline-flex items-center justify-center gap-2 rounded-full bg-ember-gradient font-semibold text-[#0b0b0d] shadow-[0_0_0_1px_rgb(255_138_61/0.4),0_10px_40px_-8px_rgb(255_77_28/0.7)] transition-[transform,box-shadow] duration-200 outline-none hover:shadow-[0_0_0_1px_rgb(255_138_61/0.6),0_14px_50px_-6px_rgb(255_77_28/0.9)] focus-visible:ring-2 focus-visible:ring-ember-soft focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";

export const pillSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] font-medium text-bone transition-colors duration-200 outline-none hover:border-white/20 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-ember-soft focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const pillSizes = {
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
} as const;

export function DownloadButton({ size = "lg", className }: DownloadButtonProps) {
  const build = buildFor(useDesktopOS());

  if (size === "sm") {
    return (
      <a href="#download" className={cn(pillPrimary, pillSizes.sm, className)}>
        Download
      </a>
    );
  }

  return (
    <a
      href={build?.href ?? "#download"}
      className={cn(pillPrimary, pillSizes.lg, className)}
    >
      {build ? <OSIcon os={build.os} className="size-4" /> : <ArrowDown className="size-4" />}
      {build ? `Download for ${build.label}` : "Download Vault"}
    </a>
  );
}
