"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, ChevronRight, Compass, Database, HardDrive, LayoutGrid, RefreshCw, Search, ShieldCheck, Unplug, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { checkMark, incidentKindLabel, incidentStatusLabel, nodeSituation, proofChecks } from "@/lib/vault/explain";
import { formatBytes, formatDuration, formatPercent } from "@/lib/vault/format";
import type { VaultNode } from "@/lib/vault/types";
import { clusterVerdict } from "@/lib/vault/verdict";
import { DashboardTour, TOUR, type PanelView } from "./dashboard-tour";
import { ActivityChart, ClusterMap, EmptyState, VaultMark } from "./dashboard-visuals";
import { useVault } from "./use-vault";
import "./dashboard.css";

const NAV: { id: PanelView; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "disks", label: "Storage nodes", icon: HardDrive },
  { id: "repairs", label: "Repairs", icon: Wrench },
];

export function ConsoleView() {
  const { mode, overview, error, refreshing, updatedAt, samples, pending, refresh, act, resetDemo } = useVault();
  const demo = mode === "demo";
  const [view, setView] = useState<PanelView>("overview");
  const [tourStep, setTourStep] = useState(-1);
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("all");
  const [repairFilter, setRepairFilter] = useState("all");
  const tourButton = useRef<HTMLButtonElement>(null);
  const nodesUp = overview?.nodes.filter((node) => node.running && node.state === "up" && node.link !== "partitioned").length ?? 0;
  const input = { reachable: Boolean(overview), unavailable: overview?.durability.unavailable ?? 0, degraded: overview?.durability.degraded ?? 0, atRisk: overview?.durability.atRisk ?? 0, openIncidents: overview?.incidentSummary.open ?? 0, nodesUp, nodesTotal: overview?.nodes.length ?? 0, objectsSafe: overview?.durability.objectsSafe ?? 0, objects: overview?.durability.objects ?? 0 };
  const verdict = clusterVerdict(input);
  const checks = proofChecks({ ...input, known: Boolean(overview || error), resolvedIncidents: overview?.incidentSummary.resolved ?? 0, lastRecoveryMs: overview?.incidentSummary.lastRecoveryMs ?? 0 });
  const zones = overview ? [...new Set([...overview.zones, ...overview.nodes.map((node) => node.zone)])] : [];
  const filteredNodes = overview?.nodes.filter((node) => (zone === "all" || node.zone === zone) && `${node.id} ${node.zone}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const incidents = overview?.incidents.filter((incident) => repairFilter === "all" || incident.status === repairFilter) ?? [];
  const status = overview ? (demo ? "Demo · simulated cluster" : "Live connection") : error ? "Not connected" : "Connecting";
  const hasFiles = Boolean(overview?.durability.objects);
  const headline = overview ? !hasFiles && verdict.tone === "safe" ? "Ready for your first file." : verdict.title : error ? "Let’s connect your cluster." : "Finding your local cluster…";

  function navigate(next: PanelView) { setView(next); window.scrollTo({ top: 0, behavior: "instant" }); }
  function closeTour() { setTourStep(-1); requestAnimationFrame(() => tourButton.current?.focus()); }
  function moveTour(next: number) {
    if (next < 0 || next >= TOUR.length) { closeTour(); return; }
    setView(TOUR[next].view);
    setTourStep(next);
  }
  function exportSnapshot() {
    if (!overview) return;
    const blob = new Blob([JSON.stringify({ capturedAt: updatedAt ? new Date(updatedAt).toISOString() : null, ...(demo ? { simulated: true } : {}), ...overview }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vault-${demo ? "demo-" : ""}snapshot-${new Date(updatedAt ?? Date.now()).toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="vault-dashboard">
    <div className="dashboard-shell" inert={tourStep >= 0}>
      <aside className="dash-sidebar">
        <Link className="vault-brand" href="/" aria-label="Vault home"><VaultMark /><span>Vault<small>RESILIENT BY DESIGN</small></span></Link>
        <div className="workspace-card"><div className="workspace-icon"><Database size={18} /></div><div><strong>Personal workspace</strong><span>Your local storage cluster</span></div></div>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Workspace">{NAV.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={`nav-item ${view === id ? "active" : ""}`} aria-current={view === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={19} /><span>{label}</span>{id === "repairs" && overview && overview.incidentSummary.open > 0 ? <small>{overview.incidentSummary.open}</small> : view === id ? <i /> : null}</button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><ShieldCheck size={18} /><p>Built for the unexpected.<span>Keep files available when a machine fails.</span></p></div><button className="tour-launch" ref={tourButton} onClick={() => moveTour(0)}><Compass size={22} /><span><small>START HERE</small><strong>Dashboard tour</strong><span>A little guidance goes a long way</span></span><ArrowUpRight size={17} /></button><div className="sidebar-footer"><span className={`status-dot ${overview ? "online" : ""}`} />{overview ? (demo ? "Simulated cluster running" : "Local cluster connected") : "Waiting for local cluster"}<span>v0.1</span></div></div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar"><div><ShieldCheck size={19} /><span>Workspace</span><ChevronRight size={14} /><strong>{NAV.find((item) => item.id === view)?.label}</strong></div><span className={`connection-pill ${overview ? "connected" : ""}`} role="status"><i />{status}</span></header>
        <main className="dash-content" id="main-content">
          <section className="dash-welcome" data-tour="welcome"><div><p className="eyebrow">YOUR DATA, IN GOOD HANDS</p><h1>{view === "overview" ? headline : view === "disks" ? "Every machine. One clear view." : "Recovery you can account for."}</h1><p>{view === "overview" ? overview ? verdict.detail : "Your backups, media, and datasets deserve more than a single point of failure." : view === "disks" ? "See where your copies live, understand each machine, and test recovery." : "Follow real failures from detection to restored copies."}</p></div><button className="primary-button" onClick={() => view === "overview" ? navigate("disks") : navigate("overview")}>{view === "overview" ? <HardDrive size={17} /> : <LayoutGrid size={17} />}{view === "overview" ? "Explore storage" : "Back to overview"}<ArrowUpRight size={17} /></button></section>

          <div className="dash-toolbar" data-tour="toolbar"><div className="toolbar-context"><span className={`status-dot ${overview ? "online" : ""}`} /><span>{overview ? (demo ? "Simulated cluster" : "Local cluster") : "Awaiting connection"}</span><span className="toolbar-divider" /><span>Auto-refresh · 2 seconds</span></div><div className="toolbar-actions"><span className="last-updated">{updatedAt ? `${overview ? "Updated" : "Last seen"} ${new Date(updatedAt).toLocaleTimeString()}` : "No snapshot yet"}</span><button className="secondary-button" disabled={refreshing} onClick={() => void refresh()}><RefreshCw size={15} className={refreshing ? "is-spinning" : ""} />{refreshing ? "Checking…" : "Refresh"}</button><button className="secondary-button" disabled={!overview} onClick={exportSnapshot}><ArrowDownToLine size={16} />Export snapshot</button></div></div>

          {demo && overview && <DemoNotice onTry={() => navigate("disks")} onReset={() => void resetDemo()} />}
          {error && <div className="connection-notice" role="status"><Unplug size={22} /><div><strong>{updatedAt ? "Connection lost. Protection is not currently verified." : "Start Vault to bring your dashboard to life."}</strong><p>{error} Open the Vault desktop app, or run <code>vault start --no-browser</code> from your installed Vault folder. This page reconnects automatically.</p></div></div>}

          {view === "overview" && <>
            <section className="stats-grid" data-tour="stats" aria-label="Cluster summary">
              <Metric icon={ShieldCheck} label="Files fully protected" value={overview ? overview.durability.objectsSafe.toLocaleString() : "—"} hint={overview ? `${overview.durability.objects.toLocaleString()} total files · every copy reachable` : "Waiting for a live measurement"} accent />
              <Metric icon={HardDrive} label="Machines online" value={overview ? `${nodesUp} / ${overview.nodes.length}` : "—"} hint={overview ? `Across ${zones.length} independent storage zones` : "Your connected storage machines"} />
              <Metric icon={Wrench} label="Repairs in queue" value={overview ? overview.repair.queue.toLocaleString() : "—"} hint={overview ? `${overview.incidentSummary.open} open incidents · ${overview.repair.repaired} repairs completed` : "Copies waiting to be restored"} />
              <Metric icon={Activity} label="Last recovery" value={formatDuration(overview?.incidentSummary.lastRecoveryMs ?? 0)} hint={overview?.incidentSummary.resolved ? `${overview.incidentSummary.resolved} incidents resolved` : "Measured after a real recovery"} />
            </section>
            <div className="overview-grid"><ActivityChart samples={samples} connected={Boolean(overview)} /><ClusterMap overview={overview} demo={demo} onNodes={() => navigate("disks")} /></div>
            <div className="detail-grid">
              <section className="dash-card proof-card" data-tour="checks"><div className="card-heading"><div><h2>Protection, explained</h2><p>Evidence behind the status</p></div><ShieldCheck size={19} /></div><div className="proof-list">{checks.map((check) => <div className="proof-item" key={check.id}><span className={`check-icon ${check.state}`}>{check.state === "pass" ? <Check size={15} /> : check.state === "working" ? <RefreshCw size={15} /> : <span>·</span>}</span><div><strong>{check.title}</strong><p>{check.evidence}</p></div><span className={`check-label ${check.state}`}>{checkMark(check.state)}</span></div>)}</div></section>
              <section className="dash-card" data-tour="storage"><div className="card-heading"><div><h2>Room for resilience</h2><p>What your file copies use</p></div><Database size={19} /></div><div className="storage-number">{overview ? formatBytes(overview.storage.physicalBytes) : "—"}<span>total disk space used</span></div><div className="storage-bar"><span style={{ width: overview?.storage.physicalBytes ? `${Math.min(100, overview.storage.logicalBytes / overview.storage.physicalBytes * 100)}%` : "0%" }} /></div><dl className="storage-breakdown"><div><dt><i />Original data</dt><dd>{overview ? formatBytes(overview.storage.logicalBytes) : "—"}</dd></div><div><dt><i />Copies and overhead</dt><dd>{overview ? formatBytes(Math.max(0, overview.storage.physicalBytes - overview.storage.logicalBytes)) : "—"}</dd></div></dl><p className="panel-footnote">{overview ? `${overview.overhead.toFixed(2)}× storage overhead` : "Usage appears when Vault connects"} · extra copies help files survive a failure.</p></section>
              <section className="dash-card recovery-card"><p className="eyebrow">BUILT TO BOUNCE BACK</p><Wrench size={26} /><h2>A failure shouldn’t<br />be the end of a file.</h2><p>Vault detects missing copies and rebuilds them on available machines. See the evidence in your repair log.</p><div className="recovery-summary"><div><strong>{overview ? overview.incidentSummary.resolved : "—"}</strong><span>resolved incidents</span></div><div><strong>{formatDuration(overview?.incidentSummary.meanRecoveryMs ?? 0)}</strong><span>average recovery</span></div></div><button className="text-button" onClick={() => navigate("repairs")}>Follow the repairs<ArrowRight size={17} /></button></section>
            </div>
          </>}

          {view === "disks" && <section data-tour="disks" className="nodes-section"><div className="section-toolbar"><div><h2>Storage nodes <span className="count-badge">{overview?.nodes.length ?? "—"}</span></h2><p>Copies are spread across zones so one failure doesn’t take everything.</p></div><div className="filter-group"><label className="search-field"><Search size={16} /><input aria-label="Search storage nodes" placeholder="Find a machine…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="select-field"><span className="sr-only">Storage zone</span><select aria-label="Storage zone" value={zone} onChange={(event) => setZone(event.target.value)}><option value="all">All zones</option>{zones.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div></div>{filteredNodes.length ? <div className="nodes-grid">{filteredNodes.map((node) => <NodeCard key={node.id} node={node} busy={pending !== null || !overview} pending={pending} onAct={act} demo={demo} />)}</div> : <EmptyState title={overview ? "No matching machines" : "No machines to show yet"} detail={overview ? "Try a different machine name or choose All zones." : "Start your local Vault cluster. Connected machines and their health will appear here."} />}<div className="node-explainer"><ShieldCheck size={20} /><p><strong>A zone is a shared failure boundary.</strong> Think of machines in the same rack. Copies in different zones help your files survive a rack outage. {demo ? "In this demo, failure controls only affect the simulated cluster." : "Failure controls below each machine affect your running local cluster."}</p></div></section>}

          {view === "repairs" && <section data-tour="repairs"><div className="stats-grid repair-stats"><Metric icon={Wrench} label="Open incidents" value={overview ? String(overview.incidentSummary.open) : "—"} hint="Failures still being resolved" accent /><Metric icon={ShieldCheck} label="Resolved incidents" value={overview ? String(overview.incidentSummary.resolved) : "—"} hint="Recovery completed" /><Metric icon={Activity} label="Mean recovery time" value={formatDuration(overview?.incidentSummary.meanRecoveryMs ?? 0)} hint="Average across measured recoveries" /><Metric icon={Database} label="Successful operations" value={overview ? formatPercent(overview.engine.availability) : "—"} hint="Reads and writes that succeeded" /></div><div className="dash-card repair-log"><div className="section-toolbar"><div><h2>Recovery log</h2><p>What happened, and what Vault did about it.</p></div><select aria-label="Filter repairs" value={repairFilter} onChange={(event) => setRepairFilter(event.target.value)}><option value="all">All incidents</option><option value="open">Open repairs</option><option value="resolved">Resolved</option></select></div>{incidents.length ? <div className="table-scroll"><table><thead><tr><th>What happened</th><th>Machine</th><th>Status</th><th>Recovery time</th></tr></thead><tbody>{incidents.map((incident) => <tr key={incident.id}><td><strong>{incidentKindLabel(incident.kind)}</strong><span>{incident.detail}</span></td><td><code>{incident.subject}</code></td><td><span className={`incident-status ${incident.status === "resolved" ? "resolved" : ""}`}>{incidentStatusLabel(incident.status)}</span></td><td>{incident.status === "open" ? "In progress" : formatDuration(incident.recoveryMs)}</td></tr>)}</tbody></table></div> : <EmptyState title={overview ? repairFilter === "all" ? "A quiet log is a good start." : "No incidents match this filter." : "Waiting for recovery evidence"} detail={overview ? "Real incidents appear here when Vault detects a failure. Try a controlled disk failure from Storage nodes after storing a file." : "Connect Vault to inspect failures and measured recovery times."} />}</div></section>}

          <footer className="dash-footer"><span><ShieldCheck size={14} />Your files. More than one way home.</span><span>Vault / Local workspace</span></footer>
        </main>
      </div>
    </div>
    {tourStep >= 0 && <DashboardTour step={tourStep} demo={demo} onMove={moveTour} onClose={closeTour} />}
  </div>;
}

function DemoNotice({ onTry, onReset }: { onTry: () => void; onReset: () => void }) {
  return <div className="connection-notice demo-notice" role="note"><Compass size={22} /><div><strong>Demo mode · simulated five-machine cluster</strong><p>Nothing here is connected to real storage. Open <b>Storage nodes</b>, stop a disk or cut its network, and watch Vault detect the failure, rebuild the missing copies, and record the recovery time. Stop three machines to see what happens when too many fail at once. To see your own cluster, run Vault locally.</p><div className="demo-actions"><button type="button" className="primary-button" onClick={onTry}>Try a failure<ArrowRight size={15} /></button><button type="button" className="secondary-button" onClick={onReset}><RefreshCw size={15} />Reset demo</button></div></div></div>;
}

function Metric({ icon: Icon, label, value, hint, accent }: { icon: LucideIcon; label: string; value: string; hint: string; accent?: boolean }) {
  return <div className={`metric-card ${accent ? "accent" : ""}`}><div><span>{label}</span><Icon size={20} /></div><strong>{value}</strong><p><span className="metric-dash" />{hint}</p></div>;
}

function NodeCard({ node, busy, pending, onAct, demo }: { node: VaultNode; busy: boolean; pending: string | null; onAct: (nodeId: string, path: string, body: object, label: string) => Promise<void>; demo: boolean }) {
  const situation = !node.running ? nodeSituation("down", "healthy") : node.state === "down" && node.link === "healthy" ? { label: "Not answering", meaning: "The process is running but has not rejoined the cluster. Check its network or restart it." } : nodeSituation(node.state, node.link);
  const stopped = !node.running;
  const cutOff = node.link === "partitioned";
  const [confirm, setConfirm] = useState<"kill" | "link" | null>(null);
  function perform(action: "kill" | "restart" | "link") {
    setConfirm(null);
    void onAct(node.id, `chaos/${action}`, { node: node.id, ...(action === "link" ? { mode: cutOff ? "healthy" : "partitioned" } : {}) }, action === "kill" ? `${node.id} stopped. Watch the recovery log.` : action === "restart" ? `${node.id} is starting again.` : cutOff ? `${node.id} is back on the network.` : `${node.id} is cut off from the network.`);
  }
  return <article className="dash-card node-card"><div className="node-card-heading"><div className="node-icon"><HardDrive size={22} /></div><div><h3>{node.id}</h3><span>{node.zone}</span></div><span className={`incident-status ${node.running && node.state === "up" && !cutOff ? "resolved" : ""}`}>{situation.label}</span></div><p>{situation.meaning}</p><div className="node-metrics"><div><strong>{node.blobs.toLocaleString()}</strong><span>pieces stored</span></div><div><strong>{formatBytes(node.bytes)}</strong><span>disk space used</span></div></div><div className="node-actions"><button className="secondary-button" disabled={busy} onClick={() => stopped ? perform("restart") : setConfirm("kill")}>{pending === `${node.id}:chaos/kill` ? "Stopping…" : pending === `${node.id}:chaos/restart` ? "Starting…" : stopped ? "Bring disk back" : "Stop this disk"}</button><button className="secondary-button" disabled={busy || stopped} onClick={() => cutOff ? perform("link") : setConfirm("link")}>{pending === `${node.id}:chaos/link` ? "Updating…" : cutOff ? "Restore network" : "Cut network"}</button></div>{confirm && <div className="node-confirm" role="group" aria-label="Confirm failure test"><p>{confirm === "kill" ? "Stop" : "Disconnect"} {node.id}? {demo ? "This runs in the simulation only." : "This tests recovery on your running cluster."}</p><button className="primary-button" disabled={busy} onClick={() => perform(confirm)}>Run failure test</button><button className="quiet-button" onClick={() => setConfirm(null)}>Cancel</button></div>}</article>;
}


