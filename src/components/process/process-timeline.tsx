import type { CSSProperties } from "react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  no: string;
  name: string;
}

/**
 * 번호 노드 타임라인 — 채널별 채용절차 단계 시각화.
 * 단계 수(steps.length)에 맞춰 가로 그리드 자동 분배, 좌측 연결선.
 * 콘텐츠 1:1 보존: 단계명(name)·번호(no)는 데이터 원문 그대로 렌더.
 */
export function ProcessTimeline({
  steps,
  tone = "light",
}: {
  steps: TimelineStep[];
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <RevealGroup className="relative" stagger={0.07}>
      {/* connecting line (lg+) */}
      <div
        aria-hidden
        className={cn(
          "absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] lg:block",
          dark ? "bg-white/15" : "bg-line",
        )}
      />
      <ol
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": String(steps.length) } as CSSProperties}
      >
        {steps.map((step, i) => (
          <RevealItem key={`${step.no}-${i}`} as="li" className="relative">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <span
                className={cn(
                  "relative z-10 grid size-10 shrink-0 place-items-center rounded-full font-mono text-sm font-semibold",
                  dark ? "bg-accent text-ink" : "bg-ink text-paper",
                )}
              >
                {step.no}
              </span>
              <div className="lg:mt-5">
                <p
                  className={cn(
                    "text-base font-bold tracking-tight sm:text-lg",
                    dark ? "text-paper" : "text-ink",
                  )}
                >
                  {step.name}
                </p>
                {i < steps.length - 1 && (
                  <span
                    className={cn(
                      "mt-1 hidden text-xs lg:block",
                      dark ? "text-muted-ink" : "text-muted-ink",
                    )}
                  >
                    STEP {step.no} →
                  </span>
                )}
              </div>
            </div>
          </RevealItem>
        ))}
      </ol>
    </RevealGroup>
  );
}
