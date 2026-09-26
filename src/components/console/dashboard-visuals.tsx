"use client";

import { useId, useState } from "react";
import { Activity, ArrowUpRight, Box, HardDrive, Layers3 } from "lucide-react";
import type { VaultOverview } from "@/lib/vault/types";
import type { ActivitySample } from "./use-vault";

export function VaultMark() {
  const id = useId();
  return <svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true"><defs><linearGradient id={id} x2="1" y2="1"><stop stopColor="#ff4d1c" /><stop offset="1" stopColor="#ff8a3d" /></linearGradient></defs><path d="M16 2.5 28 9.25v13.5L16 29.5 4 22.75V9.25z" fill={`url(#${id})`} /><path d="M16 2.5 28 9.25 16 16 4 9.25zM16 16v13.5" fill="none" stroke="#0b0b0d" strokeOpacity=".55" strokeWidth="1.6" /></svg>;
}

export function ActivityChart({ samples, connected }: { samples: ActivitySample[]; connected: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...samples.flatMap((sample) => [sample.reads, sample.writes]));
  const points = (key: "reads" | "writes") => samples.map((sample, index) => `${40 + index / Math.max(1, samples.length - 1) * 680},${180 - sample[key] / max * 145}`).join(" ");
  const current = samples[selected ?? samples.length - 1];
  return <section className="dash-card activity-card" data-tour="activity">
    <div className="card-heading"><div><h2>Storage activity</h2><p>Reads and writes, as they happen</p></div><Activity size={19} /></div>
    <div className="chart-summary"><div><strong>{current ? (current.reads + current.writes).toFixed(1) : "—"}</strong><span>operations / second</span></div><div className="chart-legend"><span><i />Reads</span><span><i />Writes</span></div></div>
    {samples.length >= 2 ? <div className="chart-wrap">
      <svg viewBox="0 0 740 215" role="img" aria-label="Reads and writes per second measured during this browser session">
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff6b35" stopOpacity=".24" /><stop offset="1" stopColor="#ff6b35" stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((fraction) => <g key={fraction}><line x1="40" x2="720" y1={180 - fraction * 145} y2={180 - fraction * 145} stroke="currentColor" strokeDasharray="3 5" opacity=".18" /><text x="0" y={184 - fraction * 145}>{(max * fraction).toFixed(1)}</text></g>)}
        <polygon points={`40,180 ${points("reads")} 720,180`} fill={`url(#${id})`} />
        <polyline points={points("writes")} fill="none" stroke="#c0b7a9" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={points("reads")} fill="none" stroke="#ff793e" strokeWidth="2.5" strokeLinejoin="round" />
        {samples.map((sample, index) => <circle key={sample.at} cx={40 + index / Math.max(1, samples.length - 1) * 680} cy={180 - sample.reads / max * 145} r="5" fill="#ff793e" opacity={index === (selected ?? samples.length - 1) ? 1 : 0.05} tabIndex={0} role="img" aria-label={`${new Date(sample.at).toLocaleTimeString()}: ${sample.reads.toFixed(1)} reads and ${sample.writes.toFixed(1)} writes per second`} onMouseEnter={() => setSelected(index)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(index)} onBlur={() => setSelected(null)}><title>{sample.reads.toFixed(1)} reads/s · {sample.writes.toFixed(1)} writes/s</title></circle>)}
        <text x="40" y="208">{new Date(samples[0].at).toLocaleTimeString()}</text><text x="720" y="208" textAnchor="end">{new Date(samples[samples.length - 1].at).toLocaleTimeString()}</text>
      </svg>
      <div className="chart-caption">{current ? `${new Date(current.at).toLocaleTimeString()} · ${current.reads.toFixed(1)} reads/s · ${current.writes.toFixed(1)} writes/s` : ""}<span>This browser session · up to 90 samples</span></div>
    </div> : <div className="chart-empty"><Activity size={34} /><strong>{connected ? "Listening for activity" : "Your activity will appear here"}</strong><p>{connected ? "Collecting live samples. Read or save a file to see activity." : "Connect your local cluster to see measured reads and writes."}</p><div className="empty-grid" /></div>}
  </section>;
}

export function ClusterMap({ overview, demo, onNodes }: { overview: VaultOverview | null; demo: boolean; onNodes: () => void }) {
  const zones = overview ? [...new Set([...overview.zones, ...overview.nodes.map((node) => node.zone)])] : [];
  return <section className="dash-card topology-card" data-tour="topology"><div className="card-heading"><div><h2>Your storage network</h2><p>Independent zones. Resilient copies.</p></div><span className="micro-tag">{demo ? "Simulated" : "Local cluster"}</span></div>
    <div className="cluster-map"><div className="cluster-orbit orbit-one" /><div className="cluster-orbit orbit-two" /><div className="cluster-core"><Box size={32} /><span>VAULT</span></div>
      {zones.length ? <div className="zone-orbit">{zones.map((zone) => <div className="zone-pill" key={zone}><Layers3 size={15} /><span>{zone.replace("zone-", "Zone ")}</span><div className="node-dots">{overview?.nodes.filter((node) => node.zone === zone).map((node) => <span key={node.id} className={node.running && node.state === "up" && node.link !== "partitioned" ? "up" : "down"} title={`${node.id}: ${node.state}, ${node.link}`} aria-label={`${node.id}: ${node.state}, ${node.link}`} />)}</div></div>)}</div> : <p className="map-empty">Waiting for your storage machines</p>}
    </div><div className="network-footer"><div><strong>{overview ? overview.nodes.length : "—"}</strong><span>machines</span></div><div><strong>{overview ? zones.length : "—"}</strong><span>storage zones</span></div><button className="icon-button round-button" aria-label="Explore storage nodes" onClick={onNodes}><ArrowUpRight size={21} /></button></div>
  </section>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="dash-empty"><HardDrive size={27} /><h3>{title}</h3><p>{detail}</p></div>;
}

