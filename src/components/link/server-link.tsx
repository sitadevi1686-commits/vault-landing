"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LINK_SERVERS, createLinkDemo, linkHealth, serverUp, setServer, type LinkDemo, type ServerId } from "@/lib/vault/link-demo";
import "./server-link.css";

export function ServerLink() {
  const [state, setState] = useState<LinkDemo>(createLinkDemo);
  const [tick, setTick] = useState(0);
  const health = linkHealth(state);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function toggle(id: ServerId) {
    setState((current) => setServer(current, id, !serverUp(current, id)));
  }

  return (
    <div className="link-demo">
      <div className="link-shell">
        <div className="link-top">
          <Link className="link-brand" href="/">Hydras</Link>
          <Link className="link-back" href="/app">Open the file app</Link>
        </div>
        <p className="link-kicker">TWO SERVERS · ONE FILE</p>
        <h1>Watch the link. Then cut a server.</h1>
        <p className="link-lead">family-trip-2024.zip has a copy on server-a, server-b, and server-c. The line between A and B is the live copy check. Stop A and the file stays readable from the other two.</p>

        <div className="link-stage">
          <ServerCard id="a" state={state} tick={tick} onToggle={toggle} />
          <Beam open={health.linkOpen} copies={health.copies} />
          <ServerCard id="b" state={state} tick={tick} onToggle={toggle} />
        </div>

        <div className={`link-third ${serverUp(state, "c") ? "" : "is-down"}`}>
          <div>
            <strong>server-c</strong>
            <p>zone-c · third copy · {serverUp(state, "c") ? `answered ${(tick % 3) + 1}s ago` : "no answer"}</p>
          </div>
          <button className="link-back" type="button" onClick={() => toggle("c")}>{serverUp(state, "c") ? "Stop server C" : "Bring server C back"}</button>
        </div>

        <p className="link-status" role="status">{health.copies}/3 copies. {health.label}</p>
        <div className="link-actions">
          <button className="danger" type="button" onClick={() => toggle("a")}>{serverUp(state, "a") ? "Stop server A" : "Bring server A back"}</button>
          <button type="button" onClick={() => setState(createLinkDemo())}>Restore all servers</button>
        </div>
      </div>
    </div>
  );
}

function ServerCard({ id, state, tick, onToggle }: { id: ServerId; state: LinkDemo; tick: number; onToggle: (id: ServerId) => void }) {
  const server = LINK_SERVERS.find((item) => item.id === id)!;
  const up = serverUp(state, id);
  return (
    <article className={`server-card ${up ? "" : "is-down"}`}>
      <header>
        <h2>{server.name}</h2>
        <span className={`pill ${up ? "" : "down"}`}>{up ? "online" : "down"}</span>
      </header>
      <p>{server.zone}</p>
      <p>{up ? `Heartbeat answered ${(tick % 3) + 1}s ago` : "Heartbeat missed. This copy is offline."}</p>
      <p>{up ? `${40 + (tick % 18)} checks/min on the link` : "No checks leaving this server."}</p>
      <div className="link-actions">
        <button type="button" onClick={() => onToggle(id)}>{up ? "Stop this server" : "Start this server"}</button>
      </div>
    </article>
  );
}

function Beam({ open, copies }: { open: boolean; copies: number }) {
  return (
    <div className="link-beam" aria-hidden="true">
      <div className={`link-line ${open ? "open" : "cut"}`} />
      {open && [0, 1, 2].map((item) => <span key={item} className="packet" />)}
      <div className="link-hub"><div><strong>{copies}/3</strong><span>copies</span></div></div>
    </div>
  );
}
