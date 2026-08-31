"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { JobPosting } from "@/lib/types";
import { JobCard } from "@/components/job-card";
import { BrandScene } from "@/components/visuals/brand-scene";
import { cn } from "@/lib/utils";

type Bucket = {
  key: string;
  label: string;
  /** 정적 목록(신입/경력/인턴) — 카드 그리드 노출 */
  jobs?: JobPosting[];
  /** 외부 링크형 탭(전문 강사) */
  href?: string;
};

/**
 * 메인 홈 "진행중인 채용" — 레거시 탭(신입/경력/인턴/전문강사) 전환.
 * 신입/경력/인턴은 카드 그리드, 전문 강사는 별도 채널로 링크.
 */
export function OngoingJobs({ buckets }: { buckets: Bucket[] }) {
  const [active, setActive] = useState(0);
  const current = buckets[active];

  return (
    <div>
      <div
        role="tablist"
        aria-label="진행중인 채용 분류"
        className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
      >
        {buckets.map((b, i) => {
          const selected = i === active;
          return (
            <button
              key={b.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium tracking-tight transition-colors duration-300",
                selected
                  ? "text-paper"
                  : "text-muted hover:text-ink",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="ongoing-tab-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {b.label}
                {b.jobs && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.65rem] font-mono",
                      selected
                        ? "bg-white/15 text-paper"
                        : "bg-paper-dim text-muted-ink",
                    )}
                  >
                    {b.jobs.length}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {current.href ? (
              <Link
                href={current.href}
                className="group relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-card border border-line bg-pure p-10 transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift sm:flex-row sm:items-center"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-70 transition-opacity duration-500 group-hover:opacity-100 [mask-image:linear-gradient(to_right,transparent,black_60%)] sm:block"
                >
                  <BrandScene variant="people" tone="light" />
                </span>
                <div className="relative">
                  <p className="kicker text-accent-ink">Professional Instructors</p>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                    전문 강사 모집
                  </h3>
                  <p className="mt-3 max-w-xl leading-relaxed text-muted">
                    어학·자격증 등 각 분야의 전문 강사를 상시 모집합니다. 강의
                    경험과 전문성을 아르코에듀에서 펼쳐보세요.
                  </p>
                </div>
                <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                  <ArrowUpRight className="size-6 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ) : current.jobs && current.jobs.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {current.jobs.slice(0, 6).map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-card border border-dashed border-line bg-pure text-center">
                <p className="text-lg font-semibold text-ink">
                  진행중인 채용이 없습니다
                </p>
                <p className="mt-2 text-sm text-muted">
                  새로운 채용공고가 등록되면 이곳에 노출됩니다.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
