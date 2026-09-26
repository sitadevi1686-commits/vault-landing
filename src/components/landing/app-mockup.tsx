import { useId } from "react";
import { Activity, Boxes, HardDrive, LayoutGrid, RefreshCw, Settings } from "lucide-react";
import { cn } from "cn";

const SIDEBAR = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Buckets", icon: Boxes },
  { label: "Nodes", icon: HardDrive },
  { label: "Repairs", icon: RefreshCw },
  { label: "Settings", icon: Settings },
];

const NODES = [
  { name: "node-1", used: 62, state: "online" },
  { name: "node-2", used: 58, state: "online" },
  { name: "node-3", used: 41, state: "repairing" },
  { name: "node-4", used: 66, state: "online" },
  { name: "node-5", used: 55, state: "online" },
] as const;

const THROUGHPUT = [22, 28, 25, 34, 30, 38, 36, 44, 18, 12, 26, 40, 46, 42, 50, 48, 56, 52, 60, 58];

function chartPath(values: readonly number[], width: number, height: number) {
  const max = Math.max(...values);
  const step = width / (values.length - 1);
  const points = values.map((v, i) => [i * step, height - (v / max) * (height - 6)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}

const CHART = chartPath(THROUGHPUT, 300, 72);

export function AppMockup() {
  // useId() guarantees unique IDs even if AppMockup renders more than once,
  // preventing duplicate SVG gradient ID collisions in the document.
  const id = useId();
  const areaGradId = `${id}-area`;
  const lineGradId = `${id}-line`;

  return (
    // aria-hidden: the entire mockup is a decorative UI illustration.
    // All the "real" text (node counts, stats) is conveyed through adjacent
    // labelled sections; duplicating it here only pollutes the AT tree.
    <div
      aria-hidden="true"
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-[#111113] shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(245_241_234/0.06)]"
    >
      <div className="flex h-8 items-center gap-2 border-b border-white/[0.06] bg-[#0e0e10] px-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto font-mono text-[10px] text-muted-foreground">Vault — local cluster</span>
        <span className="flex items-center gap-1 rounded-full bg-ok/10 px-2 py-0.5 text-[9px] font-medium text-ok">
          <span className="size-1.5 rounded-full bg-ok" />
          Protected
        </span>
      </div>

      <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr] sm:grid-cols-[112px_1fr]">
        <aside className="hidden flex-col gap-0.5 border-r border-white/[0.06] bg-[#0f0f11] p-2 sm:flex">
          {SIDEBAR.map(({ label, icon: Icon, active }) => (
            <span
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]",
                active ? "bg-white/[0.06] text-bone" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-3", active && "text-ember-soft")} />
              {label}
            </span>
          ))}
        </aside>

        <div className="flex min-w-0 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Objects" value="184,392" />
            <MiniStat label="Copies" value="3 / 3" accent />
            <MiniStat label="Last repair" value="12.4s" />
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-[#141416] p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Activity className="size-3 text-ember-soft" />
                Reads served · last hour
              </span>
              <span className="font-mono text-[9px] text-muted-foreground">node-3 dropped at 14:02</span>
            </div>
            <svg viewBox="0 0 300 72" className="mt-1.5 h-12 w-full sm:h-16" preserveAspectRatio="none">
              <defs>
                <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ff4d1c" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#ff4d1c" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#ff4d1c" />
                  <stop offset="1" stopColor="#ff8a3d" />
                </linearGradient>
              </defs>
              <path d={CHART.area} fill={`url(#${areaGradId})`} />
              <path d={CHART.line} fill="none" stroke={`url(#${lineGradId})`} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden rounded-lg border border-white/[0.06] bg-[#141416] p-2">
            {NODES.map((node) => (
              <div key={node.name} className="flex items-center gap-2 text-[10px]">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    node.state === "online" ? "bg-ok" : "animate-pulse bg-ember-soft",
                  )}
                />
                <span className="w-12 font-mono text-bone/80">{node.name}</span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      node.state === "online" ? "bg-bone/40" : "bg-ember-gradient",
                    )}
                    style={{ width: `${node.used}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "w-14 text-right",
                    node.state === "online" ? "text-muted-foreground" : "text-ember-soft",
                  )}
                >
                  {node.state === "online" ? `${node.used}% used` : "rebuilding"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#141416] px-2 py-1.5 sm:px-2.5 sm:py-2">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-heading text-xs font-semibold sm:text-sm", accent && "text-ember-gradient")}>
        {value}
      </p>
    </div>
  );
}
