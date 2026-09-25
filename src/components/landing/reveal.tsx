"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion-tokens";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 32, rotateX: 14 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", ...springs.soft, delay }}
      style={{ transformPerspective: 1000, transformOrigin: "50% 100%" }}
    >
      {children}
    </motion.div>
  );
}
