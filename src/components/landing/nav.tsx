"use client";

import { Menu } from "lucide-react";
import { cn } from "cn";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site-config";
import { DownloadButton, pillPrimary, pillSizes } from "./download-button";
import { VaultLogo } from "./vault-mark";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#0b0b0d]/60 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ember-soft">
          <VaultLogo id="nav" />
        </a>

        <div className="flex items-center gap-2">
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {siteConfig.nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-bone focus-visible:text-bone focus-visible:outline-none"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <DownloadButton size="sm" className="ml-2 hidden sm:inline-flex" />

          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="inline-flex size-10 items-center justify-center rounded-full text-bone hover:bg-white/[0.06] md:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="border-white/10 bg-[#0f0f11] p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <VaultLogo id="sheet" />
              <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
                {siteConfig.nav.map((item) => (
                  <SheetClose
                    key={item.label}
                    nativeButton={false}
                    render={<a href={item.href} />}
                    className="rounded-lg px-3 py-3 text-base text-bone/80 hover:bg-white/[0.05] hover:text-bone"
                  >
                    {item.label}
                  </SheetClose>
                ))}
              </nav>
              <SheetClose
                nativeButton={false}
                render={<a href="#download" />}
                className={cn(pillPrimary, pillSizes.lg, "mt-auto")}
              >
                Download Vault
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
