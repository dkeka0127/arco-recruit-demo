"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import type { BusinessBrand, BusinessCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * 사업분야 탐색기 — 카테고리 그룹 + 접힘 카드.
 * - 상단: 칩 필터(전체 + 카테고리). 단순 스크롤 하이라이트.
 * - 본문: 카테고리별 카드. 기본 접힘(카테고리명 + 한줄요약 + 브랜드 키워드 칩).
 *   펼치면 해당 카테고리에 속한 BUSINESS_BRANDS 원문 description 전체 노출.
 *
 * 카테고리 brands 와 상세 name 표기가 일부 달라 공백 제거 후 느슨하게 매칭.
 */
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** description 첫 문장 → 한 줄 요약 */
const summarize = (desc: string) => {
  const first = desc.split(/(?<=[.다])\s/)[0] ?? desc;
  return first.length > 95 ? `${first.slice(0, 92)}…` : first;
};

export function BusinessExplorer({
  categories,
  brands,
}: {
  categories: BusinessCategory[];
  brands: BusinessBrand[];
}) {
  const [filter, setFilter] = useState<string>("전체");
  const [open, setOpen] = useState<string | null>(categories[0]?.category ?? null);

  // 카테고리별 매칭된 상세 브랜드
  const detailsByCategory = useMemo(() => {
    const map = new Map<string, BusinessBrand[]>();
    for (const cat of categories) {
      const matched = cat.brands.map((bName) => {
        const k = norm(bName);
        const found = brands.find((b) => {
          const n = norm(b.name);
          return n.includes(k) || k.includes(n);
        });
        return found ?? { name: bName, description: "" };
      });
      // dedupe by name
      const seen = new Set<string>();
      map.set(
        cat.category,
        matched.filter((m) => {
          if (seen.has(m.name)) return false;
          seen.add(m.name);
          return true;
        }),
      );
    }
    return map;
  }, [categories, brands]);

  const shown =
    filter === "전체"
      ? categories
      : categories.filter((c) => c.category === filter);

  return (
    <div>
      {/* 칩 필터 */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {["전체", ...categories.map((c) => c.category)].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setFilter(c);
              if (c !== "전체") setOpen(c);
            }}
            aria-pressed={filter === c}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium tracking-tight transition-colors",
              filter === c
                ? "border-ink bg-ink text-paper"
                : "border-line bg-pure text-muted hover:border-accent/50 hover:text-accent-ink",
            )}
          >
            {c}
            {c !== "전체" && (
              <span className="ml-1.5 text-xs text-muted-ink">
                {categories.find((x) => x.category === c)?.brands.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 카테고리 카드 */}
      <div className="mt-8 grid gap-4">
        {shown.map((cat) => {
          const details = detailsByCategory.get(cat.category) ?? [];
          const isOpen = open === cat.category;
          const lead = summarize(details[0]?.description || "");
          return (
            <div
              key={cat.category}
              className={cn(
                "surface-card overflow-hidden rounded-card transition-shadow",
                isOpen && "shadow-lift",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : cat.category)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-5 p-6 text-left sm:p-7"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold tabular-nums text-accent-ink">
                  {cat.brands.length}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                    {cat.category}
                  </h3>
                  {lead && (
                    <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-muted">
                      {lead}
                    </p>
                  )}
                  {/* 키워드 칩 */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cat.brands.map((b) => (
                      <span
                        key={b}
                        className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-accent-ink"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-muted-ink transition-all duration-300",
                    isOpen
                      ? "rotate-45 border-accent bg-accent text-ink"
                      : "group-hover:border-accent",
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
                      {details.map((b) => (
                        <article
                          key={b.name}
                          className="flex flex-col gap-2.5 bg-pure p-6 sm:p-7"
                        >
                          <h4 className="text-base font-semibold tracking-tight text-ink">
                            {b.name}
                          </h4>
                          {b.description ? (
                            <p className="text-sm leading-relaxed text-muted">
                              {b.description}
                            </p>
                          ) : (
                            <p className="text-sm leading-relaxed text-muted-ink">
                              아르코에듀 {b.name} — 전문 교육 서비스를 제공합니다.
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
