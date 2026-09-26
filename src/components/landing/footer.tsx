import { BookOpen } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { GithubIcon, XIcon } from "./brand-icons";
import { VaultLogo } from "./vault-mark";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Download", href: "#download" },
  { label: "Releases", href: siteConfig.releasesUrl },
];

const SOCIALS = [
  { label: "GitHub", href: siteConfig.githubUrl, icon: GithubIcon },
  { label: "Docs", href: siteConfig.docsUrl, icon: BookOpen },
  { label: "X", href: siteConfig.xUrl, icon: XIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <VaultLogo id="footer" />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Fault-tolerant object storage that keeps files readable when disks, machines, or networks fail.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-muted-foreground transition-colors hover:text-bone">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex gap-2">
          {SOCIALS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex size-10 items-center justify-center rounded-full border border-white/[0.08] text-muted-foreground transition-colors hover:border-white/20 hover:text-bone"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 px-5 text-xs text-muted-foreground/70 sm:flex-row sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Hydras</p>
        <p>Storage engine built on SeaweedFS (Apache-2.0).</p>
      </div>
    </footer>
  );
}
