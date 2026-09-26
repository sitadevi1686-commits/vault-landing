"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react";

type Shard = {
  kind: "cube" | "dot";
  size: number;
  angle: number;
  radius: number;
  height: number;
  speed: number;
  spin: number;
};

const SHARDS: readonly Shard[] = [
  { kind: "cube", size: 30, angle: 0.2, radius: 0.62, height: -0.26, speed: 0.16, spin: 16 },
  { kind: "cube", size: 22, angle: 1.5, radius: 0.58, height: 0.22, speed: 0.16, spin: 12 },
  { kind: "cube", size: 26, angle: 2.7, radius: 0.64, height: -0.08, speed: 0.16, spin: 18 },
  { kind: "cube", size: 18, angle: 3.9, radius: 0.6, height: 0.3, speed: 0.16, spin: 11 },
  { kind: "cube", size: 24, angle: 5.1, radius: 0.63, height: 0.02, speed: 0.16, spin: 14 },
  { kind: "dot", size: 6, angle: 0.9, radius: 0.72, height: 0.12, speed: 0.11, spin: 0 },
  { kind: "dot", size: 4, angle: 2.2, radius: 0.76, height: -0.32, speed: 0.11, spin: 0 },
  { kind: "dot", size: 5, angle: 3.3, radius: 0.7, height: 0.36, speed: 0.11, spin: 0 },
  { kind: "dot", size: 4, angle: 4.6, radius: 0.78, height: -0.18, speed: 0.11, spin: 0 },
  { kind: "dot", size: 6, angle: 5.7, radius: 0.74, height: 0.26, speed: 0.11, spin: 0 },
];

const FACES = [
  "rotateY(0deg)",
  "rotateY(90deg)",
  "rotateY(180deg)",
  "rotateY(-90deg)",
  "rotateX(90deg)",
  "rotateX(-90deg)",
];

function Cube({ size, spin }: { size: number; spin: number }) {
  return (
    <div
      className="cube-spin relative"
      style={
        {
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          "--spin-duration": `${spin}s`,
        } as CSSProperties
      }
    >
      {FACES.map((face) => (
        <span
          key={face}
          className="absolute inset-0 rounded-[3px] border border-ember-soft/70"
          style={{
            transform: `${face} translateZ(${size / 2}px)`,
            background: "linear-gradient(135deg, rgb(255 77 28 / 0.38), rgb(255 138 61 / 0.06))",
            boxShadow: "inset 0 0 10px rgb(255 138 61 / 0.35)",
          }}
        />
      ))}
    </div>
  );
}

function ShardNode({
  shard,
  time,
  width,
  animate,
}: {
  shard: Shard;
  time: MotionValue<number>;
  width: MotionValue<number>;
  animate: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const z = useMotionValue(0);

  useAnimationFrame(() => {
    const t = animate ? time.get() : 0;
    const w = width.get();
    const theta = shard.angle + t * shard.speed;
    x.set(Math.cos(theta) * w * shard.radius);
    z.set(Math.sin(theta) * w * shard.radius * 0.7);
    y.set(shard.height * w * 0.62 + Math.sin(t * 0.9 + shard.angle * 2) * 6);
  });

  return (
    <motion.div
      className="absolute top-1/2 left-1/2"
      style={{ x, y, z, marginLeft: -shard.size / 2, marginTop: -shard.size / 2, transformStyle: "preserve-3d" }}
    >
      {shard.kind === "cube" ? (
        <Cube size={shard.size} spin={shard.spin} />
      ) : (
        <span
          className="block rounded-full bg-ember-soft"
          style={{ width: shard.size, height: shard.size, boxShadow: "0 0 12px 2px rgb(255 138 61 / 0.7)" }}
        />
      )}
    </motion.div>
  );
}

export function DataShards() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Only drive animation when the hero section is visible — stops 60fps
  // cos/sin work on all 10 shard nodes while the user has scrolled away.
  const inView = useInView(ref, { margin: "200px 0px" });
  const time = useMotionValue(0);
  const width = useMotionValue(560);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => width.set(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  useAnimationFrame((ms) => {
    if (!reduce && inView) time.set(ms / 1000);
  });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ transformStyle: "preserve-3d" }}
    >
      {SHARDS.map((shard) => (
        <ShardNode key={`${shard.kind}-${shard.angle}`} shard={shard} time={time} width={width} animate={!reduce} />
      ))}
    </div>
  );
}
