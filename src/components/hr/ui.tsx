"use client";

// HR 콘솔 공용 소품 — 단계 뱃지, 매치 링, 별점, 패널 등

import { type ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStage, EvaluationDecision } from "@/lib/hr/types";

// ── 포맷 유틸 ────────────────────────────────────────────────────

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function daysAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  return `${days}일 전`;
}

export function dDay(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000,
  );
}

// ── 단계 뱃지 ────────────────────────────────────────────────────

export function StageBadge({
  stage,
  className,
}: {
  stage?: PipelineStage;
  className?: string;
}) {
  if (!stage) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-tight",
        stage.kind === "hired" && "bg-signal/12 text-signal",
        stage.kind === "rejected" && "bg-ink/8 text-muted",
        stage.kind === "active" && "bg-accent-soft text-accent-ink",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          stage.kind === "hired" && "bg-signal",
          stage.kind === "rejected" && "bg-muted-ink",
          stage.kind === "active" && "bg-accent",
        )}
      />
      {stage.name}
    </span>
  );
}

// ── 평가 결정 뱃지 ───────────────────────────────────────────────

export function DecisionBadge({ decision }: { decision: EvaluationDecision }) {
  const tone: Record<EvaluationDecision, string> = {
    강력추천: "bg-signal/12 text-signal",
    추천: "bg-accent-soft text-accent-ink",
    보류: "bg-paper-dim text-muted",
    비추천: "bg-ink/8 text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold tracking-tight",
        tone[decision],
      )}
    >
      {decision}
    </span>
  );
}

// ── AI 매치 스코어 링 ────────────────────────────────────────────

export function MatchRing({
  score,
  size = 48,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const tone =
    score >= 85 ? "var(--color-signal)" : score >= 65 ? "var(--color-accent)" : "var(--color-muted-ink)";
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      title={`AI 매치 스코어 ${score}점`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-ink"
        style={{ fontSize: size * 0.28 }}
      >
        {score}
      </span>
    </span>
  );
}

// ── 별점 ─────────────────────────────────────────────────────────

export function Stars({
  value,
  max = 5,
  onChange,
  size = 16,
}: {
  value: number;
  max?: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(value);
        const star = (
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              filled ? "fill-accent text-accent" : "fill-transparent text-line-strong",
              onChange && "hover:text-accent",
            )}
          />
        );
        return onChange ? (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            aria-label={`${i + 1}점`}
            className="cursor-pointer"
          >
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </span>
  );
}

// ── 아바타 ───────────────────────────────────────────────────────

export function Avatar({
  name,
  size = "md",
  dark,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        size === "sm" && "size-7 text-[0.7rem]",
        size === "md" && "size-9 text-sm",
        size === "lg" && "size-12 text-lg",
        dark ? "bg-ink text-paper" : "bg-accent-soft text-accent-ink",
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

// ── 패널 카드 ────────────────────────────────────────────────────

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "surface-card overflow-hidden rounded-card shadow-lift",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h3 className="text-[0.92rem] font-bold tracking-tight text-ink">
            {title}
          </h3>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

// ── 빈 상태 ──────────────────────────────────────────────────────

export function EmptyState({
  icon,
  text,
  className,
}: {
  icon?: ReactNode;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-10 text-center",
        className,
      )}
    >
      {icon && <span className="text-muted-ink">{icon}</span>}
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

// ── 통계 카드 ────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-card group relative overflow-hidden rounded-card p-5 shadow-lift transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[0.78rem] font-semibold tracking-tight text-muted">
          {label}
        </p>
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[0.78rem] text-muted">{sub}</p>}
    </div>
  );
}
