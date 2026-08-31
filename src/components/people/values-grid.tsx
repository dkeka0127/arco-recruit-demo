"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Flame, Mountain, Award, MessagesSquare, type LucideIcon } from "lucide-react";
import type { TalentValue } from "@/lib/types";

/** keyword → lucide 아이콘 매핑 (원문 텍스트는 데이터에서만) */
const ICONS: Record<string, LucideIcon> = {
  열정인: Flame,
  도전인: Mountain,
  전문인: Award,
  소통인: MessagesSquare,
};

export function ValuesGrid({ values }: { values: TalentValue[] }) {
  // 첫 카드는 기본 다크 강조. hover/focus 시 해당 카드로 강조 이동.
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {values.map((v, i) => {
        const Icon = ICONS[v.keyword] ?? Award;
        const isActive = active === i;
        return (
          <motion.button
            key={v.keyword}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            className={
              "group relative flex h-full flex-col overflow-hidden rounded-card border p-9 text-left transition-all duration-500 " +
              (isActive
                ? "border-transparent bg-ink text-paper shadow-lift"
                : "surface-card text-ink hover:border-accent/40 hover:-translate-y-1 hover:shadow-lift")
            }
            aria-pressed={isActive}
          >
            {/* 다크 카드 배경 텍스처 */}
            {isActive && (
              <span className="bg-grid-dark pointer-events-none absolute inset-0 opacity-60" />
            )}
            {/* 코너 워터마크 영문 */}
            <span
              className={
                "serif-italic pointer-events-none absolute -right-1 -bottom-4 text-[5.5rem] leading-none transition-colors duration-500 " +
                (isActive ? "text-white/[0.06]" : "text-accent-ink/[0.05]")
              }
              aria-hidden
            >
              {i + 1}
            </span>

            {/* index + icon */}
            <div className="relative flex items-center justify-between">
              <span
                className={
                  "font-mono text-xs tracking-[0.2em] " +
                  (isActive ? "text-accent" : "text-muted-ink")
                }
              >
                0{i + 1}
              </span>
              <span
                className={
                  "flex size-12 items-center justify-center rounded-full transition-colors duration-500 " +
                  (isActive
                    ? "bg-accent text-ink"
                    : "bg-accent-soft text-accent-ink")
                }
              >
                <Icon className="size-6" strokeWidth={1.5} />
              </span>
            </div>

            {/* keyword + en */}
            <div className="relative mt-10">
              <h3 className="text-3xl font-bold tracking-tight">{v.keyword}</h3>
              <p
                className={
                  "serif-italic mt-2 text-lg " +
                  (isActive ? "text-accent" : "text-accent-ink")
                }
              >
                {v.en}
              </p>
            </div>

            {/* desc 2줄 — 원문 그대로 */}
            <ul className="relative mt-7 flex-1 space-y-3">
              {v.desc.map((line, di) => (
                <li
                  key={di}
                  className={
                    "flex gap-3 text-[0.95rem] leading-relaxed " +
                    (isActive ? "text-muted-ink" : "text-muted")
                  }
                >
                  <span
                    className={
                      "mt-2 inline-block size-1.5 shrink-0 rounded-full " +
                      (isActive ? "bg-accent" : "bg-line-strong")
                    }
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.button>
        );
      })}
    </div>
  );
}
