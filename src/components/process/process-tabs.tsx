"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Layers, GraduationCap, Mic } from "lucide-react";
import type { GeneralProcess, ProcessStage } from "@/lib/types";
import { ProcessTimeline } from "@/components/process/process-timeline";
import { cn } from "@/lib/utils";

interface ChannelTab {
  key: string;
  label: string;
  badge: string;
  icon: "layers" | "cap" | "mic";
  /** 안내 리드 (채널별 절차 차이 명시) */
  lead: string;
  /** 일반직: 절차가 2종(필기/인적성) */
  general?: GeneralProcess[];
  /** 영어연구원/전문강사: 단일 절차 */
  single?: ProcessStage[];
  /** 단계 설명/유의 노트 (원문) */
  notes: string[];
}

const ICONS = {
  layers: Layers,
  cap: GraduationCap,
  mic: Mic,
} as const;

/**
 * 채널별 채용절차 안내 탭.
 * 일반직 / 영어연구원 / 전문강사 — 채널마다 절차가 다름을 탭으로 분리해 명시.
 * 콘텐츠 1:1 보존: 단계명·단계 설명은 데이터 원문 그대로.
 */
export function ProcessTabs({ tabs }: { tabs: ChannelTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      {/* 탭 헤더 */}
      <div
        role="tablist"
        aria-label="채용 채널"
        className="no-scrollbar flex gap-2 overflow-x-auto"
      >
        {tabs.map((t) => {
          const selected = t.key === active;
          const Icon = ICONS[t.icon];
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t.key)}
              className={cn(
                "relative flex shrink-0 items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium tracking-tight transition-colors duration-300",
                selected
                  ? "text-paper"
                  : "border border-line bg-pure text-muted hover:text-ink",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="process-tab-active"
                  className="absolute inset-0 -z-10 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 패널 */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10"
        role="tabpanel"
      >
        {/* 채널 헤더 */}
        <div className="flex flex-col gap-3 border-b border-line pb-8">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold tracking-tight text-accent-ink">
            {current.badge}
          </span>
          <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {current.lead}
          </p>
        </div>

        {/* 절차 타임라인 — 일반직은 2종, 단일 채널은 1종 */}
        {current.general ? (
          <div className="mt-12 flex flex-col gap-14">
            {current.general.map((proc) => (
              <div key={proc.title}>
                <h3 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                  {proc.title}
                </h3>
                <div className="mt-8">
                  <ProcessTimeline steps={proc.steps} />
                </div>
              </div>
            ))}
          </div>
        ) : current.single ? (
          <div className="mt-12">
            <ProcessTimeline steps={current.single} />
          </div>
        ) : null}

        {/* 단계 설명 / 유의 노트 */}
        {current.notes.length > 0 && (
          <div className="mt-14 rounded-lg border border-line bg-paper-dim p-6 sm:p-8">
            <p className="kicker mb-5 text-accent-ink">단계 안내</p>
            <ul className="flex flex-col gap-4">
              {current.notes.map((note, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm leading-relaxed text-muted sm:text-[0.95rem]"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="text-ink/80">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}
