/**
 * Shared motion tokens for motion/react.
 * Aligns with ECC motion-foundations: transform/opacity only, reduced-motion gate.
 */

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.35,
    slow: 0.5,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    emphasized: [0.2, 0, 0, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  distance: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  scale: {
    press: 0.98,
    pop: 1.02,
  },
} as const;

export const springs = {
  snappy: { stiffness: 400, damping: 30, mass: 0.8 },
  soft: { stiffness: 200, damping: 24, mass: 1 },
  bouncy: { stiffness: 300, damping: 18, mass: 0.9 },
  gentle: { stiffness: 120, damping: 20, mass: 1 },
  stiff: { stiffness: 500, damping: 40, mass: 0.7 },
} as const;

export function shouldAnimate(prefersReduced: boolean | null): boolean {
  return prefersReduced !== true;
}
