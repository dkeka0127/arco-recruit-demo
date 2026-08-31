import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineNode {
  label: string;
  date: string | null;
  done: boolean;
}

/**
 * 지원 전형 단계 타임라인 — done/pending 시각화.
 * 콘텐츠 1:1 보존: 단계 라벨(label)·날짜(date)는 데이터 원문 그대로.
 */
export function StepTimeline({ timeline }: { timeline: TimelineNode[] }) {
  /** 진행 중인(현재) 단계 = 마지막 done 노드 다음 첫 pending */
  const lastDone = timeline.reduce(
    (acc, n, i) => (n.done ? i : acc),
    -1,
  );
  const currentIdx = lastDone + 1 < timeline.length ? lastDone + 1 : -1;

  return (
    <ol
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
      style={{ "--n": String(timeline.length) } as CSSProperties}
    >
      {timeline.map((node, i) => {
        const isCurrent = i === currentIdx;
        return (
          <li key={`${node.label}-${i}`} className="relative">
            {/* connector */}
            {i < timeline.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-4 top-4 hidden h-px w-[calc(100%+1rem)] lg:block",
                  node.done ? "bg-accent" : "bg-line",
                )}
              />
            )}
            <div className="flex items-center gap-3 lg:flex-col lg:items-start">
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                  node.done
                    ? "bg-accent text-ink"
                    : isCurrent
                      ? "border-2 border-accent bg-pure text-accent-ink"
                      : "border border-line bg-pure text-muted-ink",
                )}
              >
                {node.done ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              <div className="lg:mt-3">
                <p
                  className={cn(
                    "text-sm font-semibold tracking-tight",
                    node.done || isCurrent ? "text-ink" : "text-muted-ink",
                  )}
                >
                  {node.label}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-ink">
                  {node.date ?? (isCurrent ? "진행중" : "예정")}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
