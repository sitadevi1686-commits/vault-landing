import { Copy, Database, RefreshCw, Scale, ScanSearch, Unplug } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const FEATURES = [
  {
    icon: Copy,
    title: "Replication & Durability",
    description: "Each object is written to three nodes, so one dead disk never takes a file with it.",
  },
  {
    icon: RefreshCw,
    title: "Auto-Repair",
    description: "When a node drops, missing copies are rebuilt from healthy replicas without anyone getting paged.",
  },
  {
    icon: ScanSearch,
    title: "Corruption Detection",
    description: "Checksums catch silent bit-rot on read, and the bad copy is replaced from a good one.",
  },
  {
    icon: Unplug,
    title: "Partition Tolerance",
    description: "If a flaky switch splits the cluster, reads keep flowing and both sides reconcile on reconnect.",
  },
  {
    icon: Database,
    title: "Metadata Consistency",
    description: "Nodes agree on which buckets and objects exist, so a file never half-disappears.",
  },
  {
    icon: Scale,
    title: "Rebalancing",
    description: "Add a machine and data spreads onto it gradually, with no maintenance window.",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title={
              <>
                Built for the day <span className="text-ember-gradient">something breaks.</span>
              </>
            }
            description="Disks wear out, laptops get unplugged, and cables get kicked. Each part of Hydras handles one of those failures, so files stay readable through them."
          />
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 0.08}>
              <article className="surface-card group relative h-full overflow-hidden rounded-lg p-6 transition-colors duration-300 hover:border-ember/30">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-ember/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <span className="relative flex size-10 items-center justify-center rounded-lg border border-ember/25 bg-ember/10">
                  <feature.icon className="size-5 text-ember-soft" aria-hidden="true" />
                </span>
                <h3 className="relative mt-5 font-heading text-lg font-semibold tracking-tight">{feature.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
