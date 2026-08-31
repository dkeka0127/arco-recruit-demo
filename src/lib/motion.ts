// ════════════════════════════════════════════════════════════════
//  공통 모션 토큰 — 전 사이트 일관 적용 (절제된 프리미엄 모션)
//  transform/opacity 기반, prefers-reduced-motion은 컴포넌트에서 처리.
// ════════════════════════════════════════════════════════════════

import type { Variants } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DUR = {
  fast: 0.18,
  base: 0.35,
  slow: 0.55,
} as const;

export const STAGGER = 0.08;

/** 아래에서 부드럽게 떠오르는 기본 등장 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

/** 스태거 컨테이너 */
export function staggerContainer(stagger: number = STAGGER, delay: number = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
}

/** hover/tap 마이크로 인터랙션 (motion 컴포넌트용) */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { duration: DUR.fast, ease: EASE },
} as const;
