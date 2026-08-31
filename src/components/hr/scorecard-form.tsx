"use client";

// ════════════════════════════════════════════════════════════════
//  공용 스코어카드 폼 — 판정 · 항목별 별점 · 코멘트.
//  면접관 평가 링크(/eval/[id])와 면접관 포털이 함께 쓴다.
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvaluationDecision } from "@/lib/hr/types";
import { Stars } from "@/components/hr/ui";
import { SCORE_RUBRIC } from "@/lib/hr/interview-kit";

export const SCORE_ITEMS = ["직무 전문성", "문제 해결", "커뮤니케이션", "컬처핏"];
const DECISIONS: EvaluationDecision[] = ["강력추천", "추천", "보류", "비추천"];

export interface ScorecardValue {
  decision: EvaluationDecision;
  scores: { item: string; score: number }[];
  comment: string;
}

export function ScorecardForm({
  submitLabel = "평가 제출",
  defaultComment = "",
  onSubmit,
}: {
  submitLabel?: string;
  /** 면접 중 메모 등으로 미리 채울 코멘트 */
  defaultComment?: string;
  onSubmit: (value: ScorecardValue) => void;
}) {
  const [decision, setDecision] = useState<EvaluationDecision>("추천");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState(defaultComment);
  const [showRubric, setShowRubric] = useState(false);

  return (
    <div>
      <div className="flex gap-1.5">
        {DECISIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDecision(d)}
            className={cn(
              "flex-1 rounded-full border py-2 text-[0.8rem] font-bold transition-colors",
              decision === d
                ? "border-ink bg-ink text-paper"
                : "border-line bg-pure text-muted hover:text-ink",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowRubric((v) => !v)}
        className="mt-3 flex items-center gap-1 text-[0.7rem] font-semibold text-muted transition-colors hover:text-accent-ink"
      >
        <Info className="size-3.5" />
        별점 기준 {showRubric ? "닫기" : "보기"} — 면접관 간 점수 일관성을 위해 확인해 주세요
      </button>

      <div className="mt-2 flex flex-col gap-2.5">
        {SCORE_ITEMS.map((item) => {
          const rubric = SCORE_RUBRIC[item];
          return (
            <div key={item} className="rounded-xl bg-paper px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[0.88rem] font-semibold text-ink">
                  {item}
                </span>
                <Stars
                  value={scores[item] ?? 0}
                  size={20}
                  onChange={(v) => setScores((prev) => ({ ...prev, [item]: v }))}
                />
              </div>
              {showRubric && rubric && (
                <div className="mt-2 grid gap-1 border-t border-line/70 pt-2 text-[0.68rem] leading-snug text-muted sm:grid-cols-3">
                  <span>★1 {rubric.low}</span>
                  <span>★3 {rubric.mid}</span>
                  <span>★5 {rubric.high}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="면접 코멘트 — 근거와 함께 남겨주시면 다음 전형 판단에 큰 도움이 됩니다."
        rows={4}
        className="mt-4 w-full rounded-xl border border-line bg-pure p-4 text-sm leading-relaxed focus:border-accent focus:outline-none"
      />

      <button
        onClick={() =>
          onSubmit({
            decision,
            scores: SCORE_ITEMS.map((item) => ({
              item,
              score: scores[item] ?? 3,
            })),
            comment,
          })
        }
        className="mt-4 h-12 w-full rounded-full bg-ink text-[0.95rem] font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-ink-700"
      >
        {submitLabel}
      </button>
    </div>
  );
}
