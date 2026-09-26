"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "cn";
import { siteConfig } from "@/lib/site-config";
import { springs } from "@/lib/motion-tokens";
import { GithubIcon } from "./brand-icons";
import { DownloadButton, pillSecondary, pillSizes } from "./download-button";
import { HeroScene } from "./hero-scene";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", ...springs.soft } },
};

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section id="top" className="relative overflow-x-clip pt-32 pb-20 sm:pt-40 lg:pb-28">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <motion.div
          variants={container}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="relative z-10 max-w-xl"
        >
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-ember-gradient shadow-[0_0_8px_rgb(255_77_28)]" />
            Desktop app · v{siteConfig.version}
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-6 font-heading text-5xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl"
          >
            Storage that <span className="text-ember-gradient">survives</span> failure.
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted-foreground"
          >
            Vault copies every file to three nodes. When a disk dies or a machine drops off the
            network — protecting photo libraries, ML&nbsp;dataset checkpoints, backup archives, or
            SaaS&nbsp;upload stores — your files keep serving and the missing copy is rebuilt
            automatically.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <DownloadButton />
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Vault on GitHub (opens in new tab)"
              className={cn(pillSecondary, pillSizes.lg)}
            >
              <GithubIcon className="size-4" aria-hidden="true" />
              View on GitHub
            </a>
          </motion.div>
          <motion.p variants={item} className="mt-5 text-xs text-muted-foreground">
            Windows, macOS, and Linux. Runs a local cluster on your own machines.
          </motion.p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", ...springs.gentle, delay: 0.25 }}
          className="relative px-4 sm:px-10"
        >
          <HeroScene />
        </motion.div>
      </div>
    </section>
  );
}
