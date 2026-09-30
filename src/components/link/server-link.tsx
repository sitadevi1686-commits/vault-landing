"use client";

import Link from "next/link";
import { LINK_SERVERS, type ServerId, type ServerProbe } from "@/lib/vault/link-demo";
import { useLiveLink } from "./use-live-link";
import "./server-link.css";

export function ServerLink() {
  const { snapshot, pending, setServerUp, restoreAll } = useLiveLink();
  const probeFor = (id: ServerId) => snapshot.probes.find((probe) => probe.id === id);

  return (
    <div className="link-demo">
      <div className="link-shell">
        <div className="link-top">
          <Link className="link-brand" href="/">Hydras</Link>
          <Link className="link-back" href="/app">Open the file app</Link>
        </div>
        <p className="link-kicker">LIVE CHECK · TWO SERVERS</p>
        <h1>These two servers are calling each other.</h1>
        <p className="link-lead">
          server-a and server-b each hold family-trip-2024.zip and check each other over HTTP.
          Stop A and that check fails. B still answers, so the file stays readable.
        </p>

        <div className="link-stage">
          <ServerCard id="a" probe={probeFor("a")} pending={pending} onToggle={setServerUp} />
          <Beam open={snapshot.linkOpen} copies={snapshot.copies} peerMs={probeFor("a")?.peerMs ?? null} />
          <ServerCard id="b" probe={probeFor("b")} pending={pending} onToggle={setServerUp} />
        </div>

        <ThirdCopy probe={probeFor("c")} pending={pending} onToggle={setServerUp} />
        <p className="link-status" role="status">
          {snapshot.ready ? `${snapshot.copies}/3 copies. ${snapshot.label}` : "Connecting to the two servers on this machine."}
        </p>
        <div className="link-actions">
          <button className="danger" type="button" disabled={pending} onClick={() => setServerUp("a", probeFor("a")?.ok !== true)}>
            {probeFor("a")?.ok ? "Stop server A" : "Bring server A back"}
          </button>
          <button type="button" disabled={pending} onClick={() => void restoreAll()}>
            Restore all servers
          </button>
        </div>
      </div>
    </div>
  );
}

function ServerCard({
  id,
  probe,
  pending,
  onToggle,
}: {
  id: ServerId;
  probe: ServerProbe | undefined;
  pending: boolean;
  onToggle: (id: ServerId, up: boolean) => Promise<void>;
}) {
  const server = LINK_SERVERS.find((item) => item.id === id)!;
  const up = probe?.ok === true;
  return (
    <article className={`server-card ${up ? "" : "is-down"}`}>
      <header>
        <h2>{server.name}</h2>
        <span className={`pill ${up ? "" : "down"}`}>{up ? "online" : "down"}</span>
      </header>
      <p>{server.zone} · port {probe?.port ?? (id === "a" ? 4101 : 4102)}</p>
      <p>{up ? `HTTP check answered in ${probe?.ms ?? 0} ms` : "HTTP check failed. This copy is offline."}</p>
      <p>{peerLine(id, probe)}</p>
      <div className="link-actions">
        <button type="button" disabled={pending} onClick={() => onToggle(id, !up)}>
          {up ? "Stop this server" : "Start this server"}
        </button>
      </div>
    </article>
  );
}

function peerLine(id: ServerId, probe: ServerProbe | undefined) {
  const other = id === "a" ? "server-b" : "server-a";
  if (probe?.ok !== true) return "No checks leaving this server.";
  if (probe.peerOk) return `Reached ${other} in ${probe.peerMs ?? 0} ms`;
  return `Could not reach ${other}.`;
}

function ThirdCopy({
  probe,
  pending,
  onToggle,
}: {
  probe: ServerProbe | undefined;
  pending: boolean;
  onToggle: (id: ServerId, up: boolean) => Promise<void>;
}) {
  const up = probe?.ok === true;
  return (
    <div className={`link-third ${up ? "" : "is-down"}`}>
      <div>
        <strong>server-c</strong>
        <p>zone-c · third copy · {up ? `answered in ${probe?.ms ?? 0} ms` : "no answer"}</p>
      </div>
      <button className="link-back" type="button" disabled={pending} onClick={() => onToggle("c", !up)}>
        {up ? "Stop server C" : "Bring server C back"}
      </button>
    </div>
  );
}

function Beam({ open, copies, peerMs }: { open: boolean; copies: number; peerMs: number | null }) {
  return (
    <div className="link-beam" aria-hidden="true">
      <div className={`link-line ${open ? "open" : "cut"}`} />
      {open && [0, 1, 2].map((item) => <span key={item} className="packet" />)}
      <div className="link-hub">
        <div>
          <strong>{copies}/3</strong>
          <span>{open && peerMs !== null ? `${peerMs} ms` : "copies"}</span>
        </div>
      </div>
    </div>
  );
}
