"use client";

import { ArrowDown, ExternalLink, FileCheck } from "lucide-react";
import { cn } from "cn";
import { useDesktopOS } from "@/hooks/use-desktop-os";
import { siteConfig } from "@/lib/site-config";
import { OSIcon } from "./brand-icons";
import { pillPrimary, pillSecondary } from "./download-button";
import { Reveal } from "./reveal";

export function DownloadSection() {
  const detected = useDesktopOS();

  return (
    <section id="download" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="surface-card relative overflow-hidden rounded-3xl p-6 sm:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-ember/25 blur-[100px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(245_241_234/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(245_241_234/0.04)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
            />

            <div className="relative text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-muted-foreground">
                v{siteConfig.version} · latest release
              </p>
              <h2 className="mx-auto mt-6 max-w-2xl font-heading text-4xl leading-tight font-bold tracking-[-0.03em] text-balance sm:text-6xl">
                Run your own <span className="text-ember-gradient">unbreakable</span> storage.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                One installer sets up the desktop console and a local cluster. Pull a node&apos;s plug and
                watch your files stay readable.
              </p>
            </div>

            <ul className="relative mt-12 grid gap-3 md:grid-cols-3">
              {siteConfig.builds.map((build) => {
                const recommended = build.os === detected;
                return (
                  <li key={build.os}>
                    <a
                      href={build.href}
                      className={cn(
                        "group flex h-full flex-col rounded-xl border p-5 transition-[border-color,background-color,transform] duration-300 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ember-soft",
                        recommended
                          ? "border-ember/50 bg-ember/[0.07] shadow-[0_0_40px_-12px_rgb(255_77_28/0.6)]"
                          : "border-white/[0.08] bg-black/20 hover:border-white/20",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                          <OSIcon os={build.os} className="size-5 text-bone" />
                        </span>
                        {recommended ? (
                          <span className="rounded-full bg-ember-gradient px-2.5 py-1 text-[10px] font-semibold text-[#0b0b0d]">
                            Your system
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-5 font-heading text-lg font-semibold tracking-tight">{build.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{build.arch}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[11px] text-bone/70">{build.fileName}</span>
                          <span className="block font-mono text-[11px] text-muted-foreground">{build.size}</span>
                        </span>
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-y-0.5",
                            recommended ? pillPrimary : pillSecondary,
                          )}
                        >
                          <ArrowDown className="size-4" />
                          <span className="sr-only">Download for {build.label}</span>
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
              <a
                href={siteConfig.checksumsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-bone"
              >
                <FileCheck className="size-4 text-ember-soft" />
                SHA-256 checksums
              </a>
              <a
                href={siteConfig.releasesUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-bone"
              >
                <ExternalLink className="size-4 text-ember-soft" />
                Release notes &amp; older versions
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
