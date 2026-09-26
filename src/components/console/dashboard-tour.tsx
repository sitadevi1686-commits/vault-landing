"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

export type PanelView = "overview" | "disks" | "repairs";
export const TOUR = [
  { view: "overview", target: "welcome", title: "Your files. The whole picture.", body: "Start with this sentence. It tells you whether Hydras can protect your files, is rebuilding copies, or needs your attention.", tip: "If the connection drops, protection becomes unknown until Hydras answers again." },
  { view: "overview", target: "toolbar", title: "Stay connected to the facts", body: "The dashboard checks your local cluster every two seconds. Refresh asks again now. Export saves the latest complete snapshot as a JSON file.", tip: "Every number comes from your running cluster. There is no sample data here.", demoTip: "Demo mode: these numbers come from a simulated five-machine cluster running in your browser. Run Hydras locally to see your real cluster." },
  { view: "overview", target: "stats", title: "Four numbers to start with", body: "See how many files have every copy, how many machines are serving, how much work remains, and the last measured recovery time.", tip: "A dash means that a measurement is not available. Zero means a measured count of none." },
  { view: "overview", target: "activity", title: "See the work happening", body: "Reads retrieve files. Writes save them. This chart calculates operations per second from successive measurements while this page is open.", tip: "A quiet line means no new operations. Hover or focus a point for the exact sample." },
  { view: "overview", target: "topology", title: "Copies live in different places", body: "Each group is a storage zone: machines that could fail together, such as a rack. Keeping copies across zones helps a file survive one zone failing.", tip: "Green means a machine is serving. Orange means it needs attention." },
  { view: "overview", target: "checks", title: "Protection you can explain", body: "These checks translate the cluster state into evidence: whether Hydras answers, whether file copies remain, and whether a recovery has been measured.", tip: "No files or no previous failure means there is not yet evidence for that check." },
  { view: "overview", target: "storage", title: "Understand the cost of copies", body: "Original data is the size of your files. Disk space used includes the extra copies that help those files survive a failure.", tip: "These are measured bytes used, not a disk capacity estimate." },
  { view: "disks", target: "disks", title: "Explore a machine safely", body: "Search by machine name or choose a zone. Each card explains its condition and shows the pieces of data it holds. Stopping a disk or cutting its network is a deliberate failure test.", tip: "The tour never runs a failure test. Close the tour to use the controls.", demoTip: "Close the tour, then stop a disk or cut its network. In the demo this only affects the simulation." },
  { view: "repairs", target: "repairs", title: "Follow the recovery", body: "This log shows what went wrong and how long it took to restore copies. Filter for open repairs to see what still needs attention.", tip: "Recovery time is measured from a real failure. No incidents means no repair time to report yet.", demoTip: "In the demo, recovery times are measured from failures you trigger in the simulation, not from a real cluster." },
] satisfies { view: PanelView; target: string; title: string; body: string; tip: string; demoTip?: string }[];

export function DashboardTour({ step, demo, onMove, onClose }: { step: number; demo: boolean; onMove: (next: number) => void; onClose: () => void }) {
  const card = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState({ top: 0, left: 0, width: 0, height: 0, cardTop: 100, cardLeft: 24 });
  const current = TOUR[step];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    card.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  useLayoutEffect(() => {
    const target = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    target?.scrollIntoView({ behavior: "instant", block: "center" });
    function measure() {
      if (!target || !card.current) return;
      const rect = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      const viewportWidth = document.documentElement.clientWidth;
      const height = card.current.offsetHeight;
      const width = card.current.offsetWidth;
      const top = Math.max(8, rect.top - 7);
      const bottom = Math.min(viewport - 8, rect.bottom + 7);
      let cardTop = bottom + 18;
      if (cardTop + height > viewport - 16) cardTop = rect.top - height - 22;
      if (cardTop < 16) cardTop = viewport - height - 20;
      setGeometry({ top, left: Math.max(8, rect.left - 7), width: Math.min(rect.width + 14, viewportWidth - 16), height: Math.max(0, bottom - top), cardTop: Math.max(12, cardTop), cardLeft: Math.max(12, Math.min(rect.left, viewportWidth - width - 12)) });
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [current]);

  return <div className="tour-layer" onKeyDown={(event) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "ArrowRight") { event.preventDefault(); onMove(step + 1); }
    if (event.key === "ArrowLeft" && step > 0) { event.preventDefault(); onMove(step - 1); }
    if (event.key === "Tab") {
      const buttons = card.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === card.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === card.current)) { event.preventDefault(); first.focus(); }
    }
  }}>
    <div className="tour-shield" aria-hidden="true" />
    <div className="tour-spotlight" aria-hidden="true" style={{ top: geometry.top, left: geometry.left, width: geometry.width, height: geometry.height }} />
    <div className="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body" tabIndex={-1} ref={card} style={{ top: geometry.cardTop, left: geometry.cardLeft }}>
      <div className="tour-kicker"><span>Your dashboard, explained · {step + 1} / {TOUR.length}</span><button aria-label="Close tour" className="icon-button" onClick={onClose}><X size={18} /></button></div>
      <h2 id="tour-title">{current.title}</h2>
      <p id="tour-body">{current.body}</p>
      <aside>{demo && "demoTip" in current && current.demoTip ? current.demoTip : current.tip}</aside>
      <div className="tour-dots" aria-label={`Step ${step + 1} of ${TOUR.length}`}>{TOUR.map((item, index) => <span key={item.target} className={index === step ? "active" : ""} />)}</div>
      <div className="tour-actions"><button className="quiet-button" disabled={step === 0} onClick={() => onMove(step - 1)}>Back</button><button className="quiet-button" onClick={onClose}>Skip tour</button><button className="primary-button" onClick={() => onMove(step + 1)}>{step === TOUR.length - 1 ? "Finish tour" : "Next step"}<ArrowRight size={17} /></button></div>
    </div>
  </div>;
}
