import { Copy, ShieldCheck, Timer } from "lucide-react";
import { Reveal } from "./reveal";

const STATS = [
  {
    icon: Copy,
    value: "3x",
    label: "replication",
    detail: "Every object lives on three nodes",
    bars: [3, 3, 3],
  },
  {
    icon: Timer,
    value: "< 30s",
    label: "recovery",
    detail: "Target time to restore full redundancy",
    bars: [1, 2, 3],
  },
  {
    icon: ShieldCheck,
    value: "0",
    label: "data loss on 2-node failure",
    detail: "One surviving copy is enough to rebuild",
    bars: [1, 0, 0],
  },
] as const;

export function TrustBar() {
  return (
    <section aria-label="Durability guarantees" className="relative pb-24">
      <div className="mx-auto grid max-w-5xl gap-3 px-5 sm:grid-cols-3 sm:px-8">
        {STATS.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.08}>
            <div className="glass-card flex h-full items-start gap-4 rounded-lg p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]">
                <stat.icon className="size-4 text-ember-soft" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-heading text-2xl font-bold tracking-tight whitespace-nowrap">{stat.value}</span>
                  <span className="text-sm text-bone/70">{stat.label}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                <div aria-hidden="true" className="mt-3 flex gap-1">
                  {stat.bars.map((filled, i) => (
                    <span
                      key={i}
                      className={filled ? "h-1 flex-1 rounded-full bg-ember-gradient" : "h-1 flex-1 rounded-full bg-white/[0.08]"}
                      style={{ opacity: filled ? 0.45 + filled * 0.18 : 1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
