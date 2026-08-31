"use client";

import { useEffect, useRef, useState } from "react";
import type { CompanyHistoryYear } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 연혁 타임라인 + 연도 점프 네비 (스크롤 스파이).
 * - 좌측 sticky 연도 네비는 스크롤 위치에 따라 active 연도를 자동 하이라이트
 * - 본문은 연도 헤더(큰 타이포) + 월 뱃지 + 또렷한 본문 텍스트로 밀도 높게 렌더
 * - 핵심 연혁(런칭/오픈/캠퍼스/수상 등)은 강조 처리
 * 모든 연도/월/항목을 누락 없이 렌더링한다.
 */
const slug = (year: string) => `y-${year.replace(/\./g, "")}`;

/** 강조 대상 키워드 — 런칭/오픈/설립/인수/1위/대상 등 마일스톤 */
const HIGHLIGHT = /(런칭|오픈|개관|설립|출범|출시|인수|확장|1위|대상|수상|개원|출항)/;

export function HistoryTimeline({ years }: { years: CompanyHistoryYear[] }) {
  const [active, setActive] = useState<string>(years[0]?.year ?? "");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const jump = (year: string) => {
    setActive(year);
    const el = document.getElementById(slug(year));
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // scroll-spy: 가장 위에 걸린 연도 섹션을 active로
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const yr = visible[0].target.getAttribute("data-year");
          if (yr) setActive(yr);
        }
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [years]);

  return (
    <div className="lg:grid lg:grid-cols-[150px_1fr] lg:gap-14">
      {/* 연도 점프 네비 (sticky + 스크롤스파이) */}
      <aside className="mb-8 lg:mb-0">
        <div className="lg:sticky lg:top-28">
          <p className="mb-3 font-mono text-[0.7rem] tracking-[0.25em] text-muted-ink">
            JUMP TO
          </p>
          <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:max-h-[72vh] lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:px-0">
            {years.map((y) => {
              const isActive = active === y.year;
              return (
                <button
                  key={y.year}
                  type="button"
                  onClick={() => jump(y.year)}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-semibold tabular-nums tracking-tight transition-all lg:w-full",
                    isActive
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-paper-dim hover:text-ink",
                  )}
                >
                  {/* desktop active marker */}
                  <span
                    className={cn(
                      "hidden h-1.5 w-1.5 shrink-0 rounded-full transition-colors lg:block",
                      isActive ? "bg-accent" : "bg-line-strong group-hover:bg-accent/60",
                    )}
                  />
                  {y.year.replace(".", "")}
                  <span
                    className={cn(
                      "ml-auto hidden text-[0.7rem] font-medium tabular-nums lg:block",
                      isActive ? "text-paper/60" : "text-muted-ink",
                    )}
                  >
                    {y.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 타임라인 */}
      <div className="relative">
        {/* 세로 라인 */}
        <span
          aria-hidden
          className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/60 via-line-strong to-transparent sm:left-[9px]"
        />
        {years.map((y, yi) => (
          <section
            key={y.year}
            id={slug(y.year)}
            data-year={y.year}
            ref={(el) => {
              if (el) sectionRefs.current.set(y.year, el);
            }}
            className="relative scroll-mt-28 pb-14 pl-8 last:pb-0 sm:pl-12"
          >
            {/* year node */}
            <span className="absolute left-0 top-1.5 flex size-4 items-center justify-center sm:left-0.5">
              <span
                className={cn(
                  "size-3.5 rounded-full border-2 transition-colors",
                  yi === 0
                    ? "border-accent bg-accent"
                    : "border-accent bg-paper",
                )}
              />
            </span>

            {/* year header */}
            <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-4xl font-bold tracking-tight text-ink tabular-nums sm:text-5xl">
                {y.year.replace(".", "")}
              </h2>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">
                {y.items.length}건
              </span>
              {yi === 0 && (
                <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper">
                  최신
                </span>
              )}
            </div>

            {/* items */}
            <ul className="flex flex-col gap-2.5">
              {y.items.map((item, i) => {
                const isKey = HIGHLIGHT.test(item.text);
                return (
                  <li
                    key={i}
                    className={cn(
                      "flex gap-3 rounded-lg px-3 py-2.5 transition-colors sm:gap-4",
                      isKey
                        ? "bg-accent-soft/60 ring-1 ring-accent/15"
                        : "hover:bg-paper-dim",
                    )}
                  >
                    {item.month ? (
                      <span
                        className={cn(
                          "mt-px inline-flex h-7 w-10 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold tabular-nums",
                          isKey
                            ? "bg-accent text-ink"
                            : "bg-ink text-paper",
                        )}
                      >
                        {item.month}
                      </span>
                    ) : (
                      <span className="mt-px inline-flex h-7 w-10 shrink-0" />
                    )}
                    <span className="text-[0.95rem] font-medium leading-relaxed text-ink sm:text-base">
                      {item.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
