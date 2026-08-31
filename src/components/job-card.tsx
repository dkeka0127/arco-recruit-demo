import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { JobPosting } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 일반직 채용공고 카드 — JobPosting(레거시 보존 데이터) 표시 */
export function JobCard({ job, index }: { job: JobPosting; index?: number }) {
  const closed = job.status === "마감";
  // 제목 앞 머리 대괄호(categoryLabel)는 칩으로 분리해 표시
  const cleanTitle = job.categoryLabel
    ? job.title.replace(job.categoryLabel, "").trim()
    : job.title;

  return (
    <Link
      href={`/jobs/general/${job.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-line bg-pure p-6 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-accent/40 hover:shadow-lift sm:p-7",
        closed && "opacity-60",
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-x-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              job.format === "인턴"
                ? "bg-signal/12 text-signal"
                : "bg-accent-soft text-accent-ink",
            )}
          >
            {job.format}
          </span>
          {job.categoryLabel && (
            <span className="kicker text-accent-ink">{job.categoryLabel}</span>
          )}
        </div>
        {typeof index === "number" && (
          <span className="font-mono text-xs text-muted-ink">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      <h3 className="mt-5 line-clamp-2 text-lg font-bold leading-snug tracking-tight sm:text-xl">
        {cleanTitle}
      </h3>

      <div className="mt-auto flex items-end justify-between border-t border-line pt-5 mt-6">
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> {job.period}
          </span>
          <span
            className={cn(
              "font-medium",
              closed ? "text-muted" : "text-accent-ink",
            )}
          >
            {closed ? "접수 마감" : "접수 중"}
          </span>
        </div>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full border transition-all duration-300",
            closed
              ? "border-line text-muted"
              : "border-line text-ink group-hover:border-accent group-hover:bg-accent group-hover:text-ink",
          )}
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
