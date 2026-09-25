"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { springs } from "@/lib/motion-tokens";
import { AppMockup } from "./app-mockup";
import { DataShards } from "./data-shards";

const BASE_TILT = { x: 12, y: -16 };
const MOUSE_RANGE = { x: 10, y: 14 };

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, springs.gentle);
  const smoothY = useSpring(pointerY, springs.gentle);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end start"] });
  const scrollTilt = useTransform(scrollYProgress, [0, 1], [0, 16]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -48]);

  const rotateX = useTransform(() => BASE_TILT.x - smoothY.get() * MOUSE_RANGE.x + (reduce ? 0 : scrollTilt.get()));
  const rotateY = useTransform(() => BASE_TILT.y + smoothX.get() * MOUSE_RANGE.y);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, pointerX, pointerY]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[680px] [perspective:1600px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgb(255 77 28 / 0.6), rgb(255 110 50 / 0.24) 42%, transparent 72%)",
          filter: "blur(24px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[18%] left-1/2 -z-10 h-[34%] w-[90%] -translate-x-1/2 rounded-[50%]"
        style={{
          background: "radial-gradient(closest-side, rgb(255 90 36 / 0.55), transparent)",
          filter: "blur(30px)",
        }}
      />

      <motion.div
        className="relative"
        style={{ rotateX, rotateY, y: reduce ? 0 : lift, transformStyle: "preserve-3d" }}
      >
        <DataShards />

        <div style={{ transform: "translateZ(0px)" }}>
          <AppMockup />
        </div>

        <div
          className="glass-card absolute -top-5 right-2 hidden items-center gap-2.5 rounded-lg px-3.5 py-2.5 sm:-right-8 sm:flex"
          style={{ transform: "translateZ(90px)" }}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-ok/15">
            <CircleCheck className="size-4 text-ok" />
          </span>
          <span>
            <span className="block text-xs font-medium text-bone">node-3 rebuilt</span>
            <span className="block font-mono text-[10px] text-muted-foreground">3/3 copies · 12.4s</span>
          </span>
        </div>

        <div
          className="glass-card absolute -bottom-6 left-2 hidden items-center gap-2.5 rounded-lg px-3.5 py-2.5 sm:-left-10 sm:flex"
          style={{ transform: "translateZ(60px)" }}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-ember/15">
            <ShieldCheck className="size-4 text-ember-soft" />
          </span>
          <span>
            <span className="block text-xs font-medium text-bone">0 bytes lost</span>
            <span className="block font-mono text-[10px] text-muted-foreground">checksums verified</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
