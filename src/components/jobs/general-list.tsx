"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { JobPosting } from "@/lib/types";
import { JobCard } from "@/components/job-card";
import { cn } from "@/lib/utils";

type FilterKey = "전체" | "신입" | "경력" | "인턴";
type SortKey = "latest" | "deadline";

const FILTERS: FilterKey[] = ["전체", "신입", "경력", "인턴"];

/** 접수기간 문자열에서 시작일(YYYY.MM.DD) 추출 → 정렬용 숫자 키 */
function startKey(period: string): number {
  const m = period.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return 0;
  return Number(m[1] + m[2] + m[3]);
}

/**
 * 일반직 38공고 목록 — 필터(전체/신입/경력/인턴) + 제목 검색 + 정렬(최신/마감).
 * 데이터셋 분기는 레거시 보존 규칙(JOB_POSTINGS_*)을 그대로 따른다.
 */
export function GeneralList({
  buckets,
}: {
  buckets: Record<FilterKey, JobPosting[]>;
}) {
  const [filter, setFilter] = useState<FilterKey>("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("latest");

  const results = useMemo(() => {
    const base = buckets[filter] ?? [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((j) => j.title.toLowerCase().includes(q))
      : base;
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "latest") return startKey(b.period) - startKey(a.period);
      // 마감 임박: 접수중 우선 → 시작일 빠른 순
      const ac = a.status === "마감" ? 1 : 0;
      const bc = b.status === "마감" ? 1 : 0;
      if (ac !== bc) return ac - bc;
      return startKey(a.period) - startKey(b.period);
    });
    return sorted;
  }, [buckets, filter, query, sort]);

  return (
    <div>
      {/* 컨트롤 바 */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="채용 형태 필터"
          className="no-scrollbar flex gap-2 overflow-x-auto"
        >
          {FILTERS.map((f) => {
            const selected = f === filter;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2.5 text-sm font-medium tracking-tight transition-colors duration-300",
                  selected
                    ? "bg-ink text-paper"
                    : "border border-line bg-pure text-muted hover:text-ink",
                )}
              >
                {f}
                <span
                  className={cn(
                    "ml-2 font-mono text-[0.7rem]",
                    selected ? "text-paper/70" : "text-muted-ink",
                  )}
                >
                  {(buckets[f] ?? []).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="공고 제목 검색"
              aria-label="공고 제목 검색"
              className="h-11 w-full rounded-full border border-line bg-pure pl-11 pr-10 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink focus:border-accent sm:w-64"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="정렬"
            className="flex shrink-0 rounded-full border border-line bg-pure p-1"
          >
            {(
              [
                { key: "latest", label: "최신순" },
                { key: "deadline", label: "마감임박" },
              ] as { key: SortKey; label: string }[]
            ).map((s) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={sort === s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300",
                  sort === s.key ? "bg-ink text-paper" : "text-muted hover:text-ink",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 결과수 */}
      <p className="mt-8 text-sm text-muted">
        총 <span className="font-semibold text-ink">{results.length}</span>건의
        공고
      </p>

      {/* 그리드 / 빈상태 */}
      {results.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex min-h-[240px] flex-col items-center justify-center rounded-card border border-dashed border-line bg-pure text-center">
          <p className="text-lg font-semibold text-ink">
            조건에 맞는 공고가 없습니다
          </p>
          <p className="mt-2 text-sm text-muted">
            다른 검색어나 형태를 선택해 보세요.
          </p>
          {(query || filter !== "전체") && (
            <button
              onClick={() => {
                setQuery("");
                setFilter("전체");
              }}
              className="mt-5 rounded-full border border-line px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-dim"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
