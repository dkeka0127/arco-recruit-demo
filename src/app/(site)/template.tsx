"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE, DUR } from "@/lib/motion";

/**
 * 라우트 전환 시 페이지 콘텐츠가 부드럽게 페이드인.
 * opacity만 사용(transform X) → 레이아웃/스크롤/CLS 영향 없음.
 * prefers-reduced-motion 사용자는 즉시 표시.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className="flex flex-1 flex-col">{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.base, ease: EASE }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
