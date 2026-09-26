"use client";

import { useRef, useState } from "react";
import { useInView } from "motion/react";
import { Pause, Play } from "lucide-react";
import { cn } from "cn";
import { useRingSimulation } from "@/hooks/use-ring-simulation";
import type { RingPhase, RingState } from "@/lib/node-ring";
import { NodeRing } from "./node-ring";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const STEPS: { phase: RingPhase; title: string; body: string }[] = [
  {
    phase: "failed",
    title: "Detect the failure",
    body: "A node stops answering heartbeats. Every object it held is flagged as down to two copies.",
  },
  {
    phase: "repairing",
    title: "Re-replicate from neighbours",
    body: "The two nodes that still hold those objects send the missing copies back into place.",
  },
  {
    phase: "healed",
    title: "Verify and return to 3/3",
    body: "Checksums confirm each rebuilt copy before the cluster reports itself protected again.",
  },
];

function describeRingState(state: RingState): string {
  const failed = state.failedNode === null ? "" : `node-${state.failedNode + 1}`;
  switch (state.phase) {
    case "healthy":
      return "All 5 nodes online. Every object has 3 copies.";
    case "failed":
      return `${failed} stopped responding. Affected objects are down to 2 copies, and reads continue from the others.`;
    case "repairing":
      return `Rebuilding ${failed} from node-${state.sources[0] + 1} and node-${state.sources[1] + 1}.`;
    case "healed":
      return `${failed} restored. 3/3 copies, no data lost.`;
  }
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [paused, setPaused] = useState(false);
  const state = useRingSimulation(inView && !paused);

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-[600px] max-w-4xl -translate-y-1/2 rounded-full bg-ember/10 blur-[120px]"
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Watch a node fail and heal."
            description="This is the loop Vault runs whenever a machine disappears: notice it, copy what was lost from the survivors, and prove the data is intact."
          />
        </Reveal>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <ol className="flex flex-col gap-3">
              {STEPS.map((step, index) => {
                const active = state.phase === step.phase;
                return (
                  <li
                    key={step.phase}
                    className={cn(
                      "relative rounded-lg border p-5 transition-[background-color,border-color] duration-500",
                      active ? "border-ember/40 bg-ember/[0.06]" : "border-white/[0.06] bg-surface/60",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors duration-500",
                          active ? "border-transparent bg-ember-gradient text-[#0b0b0d]" : "border-white/10 text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-heading text-base font-semibold tracking-tight">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{step.body}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal className="order-1 lg:order-2" delay={0.1}>
            <div ref={ref} className="surface-card relative overflow-hidden rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Simulation
                </span>
                <button
                  type="button"
                  aria-pressed={paused}
                  onClick={() => setPaused((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-bone/80 transition-colors hover:border-white/20 hover:text-bone focus-visible:ring-2 focus-visible:ring-ember-soft focus-visible:outline-none"
                >
                  {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
                  {paused ? "Resume" : "Pause"}
                </button>
              </div>
              <div className="mx-auto mt-2 max-w-[440px]">
                <NodeRing state={state} />
              </div>
              <p
                aria-live="polite"
                className="mt-2 min-h-12 rounded-lg border border-white/[0.06] bg-black/30 px-4 py-3 font-mono text-xs leading-relaxed text-bone/80"
              >
                <span className="text-ember-soft">$ vault status</span>
                <br />
                {describeRingState(state)}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
