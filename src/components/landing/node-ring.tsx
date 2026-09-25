"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { NODE_COUNT, PHASE_MS, type RingState } from "@/lib/node-ring";

const SIZE = 440;
const CENTER = SIZE / 2;
const RING_RADIUS = 150;
const NODE_RADIUS = 30;

type NodeStatus = "healthy" | "down" | "rebuilding" | "restored" | "source";

const STATUS_STYLE: Record<NodeStatus, { stroke: string; glow: string; label: string }> = {
  healthy: { stroke: "rgb(245 241 234 / 0.28)", glow: "transparent", label: "online" },
  source: { stroke: "var(--ember-soft)", glow: "rgb(255 138 61 / 0.35)", label: "sending" },
  down: { stroke: "var(--danger)", glow: "rgb(240 68 56 / 0.45)", label: "down" },
  rebuilding: { stroke: "var(--ember)", glow: "rgb(255 77 28 / 0.5)", label: "rebuilding" },
  restored: { stroke: "var(--ok)", glow: "rgb(60 203 127 / 0.45)", label: "restored" },
};

const NODES = Array.from({ length: NODE_COUNT }, (_, i) => {
  const angle = ((-90 + (360 / NODE_COUNT) * i) * Math.PI) / 180;
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  return {
    index: i,
    x: CENTER + dir.x * RING_RADIUS,
    y: CENTER + dir.y * RING_RADIUS,
    labelX: CENTER + dir.x * (RING_RADIUS + 50),
    labelY: CENTER + dir.y * (RING_RADIUS + 50) + 4,
  };
});

function statusOf(index: number, state: RingState): NodeStatus {
  if (state.sources.includes(index)) return "source";
  if (index !== state.failedNode) return "healthy";
  if (state.phase === "failed") return "down";
  if (state.phase === "repairing") return "rebuilding";
  return "restored";
}

function trimmedLine(from: number, to: number) {
  const a = NODES[from];
  const b = NODES[to];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const pad = NODE_RADIUS + 6;
  return { x1: a.x + ux * pad, y1: a.y + uy * pad, x2: b.x - ux * pad, y2: b.y - uy * pad };
}

export function copiesFor(state: RingState): number {
  return state.phase === "failed" || state.phase === "repairing" ? 2 : 3;
}

export function NodeRing({ state }: { state: RingState }) {
  const reduce = useReducedMotion();
  const degraded = copiesFor(state) < 3;
  const repairSeconds = (PHASE_MS.repairing / 1000) * 0.9;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full" role="img" aria-label="Five storage nodes arranged in a ring">
      <defs>
        <radialGradient id="ring-hub" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff4d1c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff4d1c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="repair-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ff4d1c" />
        </linearGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} fill="none" stroke="rgb(245 241 234 / 0.06)" strokeWidth="1" />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RING_RADIUS}
        fill="none"
        stroke={degraded ? "rgb(240 68 56 / 0.35)" : "rgb(255 138 61 / 0.45)"}
        strokeWidth="1.5"
        strokeDasharray="4 12"
        className="flow-dash transition-[stroke] duration-500"
      />

      {NODES.map((node) => (
        <line
          key={`spoke-${node.index}`}
          x1={CENTER}
          y1={CENTER}
          x2={node.x}
          y2={node.y}
          stroke="rgb(245 241 234 / 0.05)"
          strokeDasharray="2 6"
        />
      ))}

      <AnimatePresence>
        {state.phase === "repairing" && state.failedNode !== null
          ? state.sources.map((source, i) => {
              const line = trimmedLine(source, state.failedNode as number);
              return (
                <motion.g key={`repair-${state.cycle}-${source}`} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <motion.line
                    {...line}
                    stroke="url(#repair-line)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduce ? 0 : repairSeconds, ease: "easeInOut" }}
                  />
                  {reduce ? null : (
                    <motion.circle
                      r={4}
                      fill="#ffb27a"
                      style={{ filter: "drop-shadow(0 0 6px #ff8a3d)" }}
                      initial={{ cx: line.x1, cy: line.y1 }}
                      animate={{ cx: [line.x1, line.x2], cy: [line.y1, line.y2] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "easeIn", delay: i * 0.3 }}
                    />
                  )}
                </motion.g>
              );
            })
          : null}
      </AnimatePresence>

      <circle cx={CENTER} cy={CENTER} r={78} fill="url(#ring-hub)" />
      <circle cx={CENTER} cy={CENTER} r={46} fill="#141416" stroke="rgb(245 241 234 / 0.1)" />
      <text
        x={CENTER}
        y={CENTER + 2}
        textAnchor="middle"
        className="font-heading text-[22px] font-bold transition-[fill] duration-500"
        fill={degraded ? "var(--danger)" : "var(--bone)"}
      >
        {copiesFor(state)}/3
      </text>
      <text x={CENTER} y={CENTER + 20} textAnchor="middle" className="text-[10px]" fill="#a09a90">
        copies
      </text>

      {NODES.map((node) => {
        const status = statusOf(node.index, state);
        const style = STATUS_STYLE[status];
        return (
          <g key={node.index}>
            {status === "down" && !reduce ? (
              <motion.circle
                cx={node.x}
                cy={node.y}
                fill="none"
                stroke="var(--danger)"
                initial={{ r: NODE_RADIUS, opacity: 0.8 }}
                animate={{ r: NODE_RADIUS + 22, opacity: 0 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              />
            ) : null}
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_RADIUS}
              fill="#161616"
              stroke={style.stroke}
              strokeWidth="2"
              style={{ filter: `drop-shadow(0 0 14px ${style.glow})`, transition: "stroke 400ms, filter 400ms" }}
            />
            <g
              transform={`translate(${node.x - 10} ${node.y - 11})`}
              fill="none"
              stroke={status === "healthy" ? "rgb(245 241 234 / 0.6)" : style.stroke}
              strokeWidth="1.6"
              style={{ transition: "stroke 400ms" }}
            >
              <rect x="0" y="0" width="20" height="9" rx="2" />
              <rect x="0" y="13" width="20" height="9" rx="2" />
              <circle cx="15.5" cy="4.5" r="1" fill="currentColor" />
              <circle cx="15.5" cy="17.5" r="1" fill="currentColor" />
            </g>
            <text x={node.labelX} y={node.labelY - 7} textAnchor="middle" className="font-mono text-[11px]" fill="var(--bone)">
              node-{node.index + 1}
            </text>
            <text
              x={node.labelX}
              y={node.labelY + 8}
              textAnchor="middle"
              className="text-[10px]"
              fill={status === "healthy" ? "#a09a90" : style.stroke}
            >
              {style.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
