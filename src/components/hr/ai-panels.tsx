"use client";

// ════════════════════════════════════════════════════════════════
//  AI Phase 2 패널 (목업) — 지원자 상세에 삽입.
//  ① 자소서 표절/AI작성 탐지  ② 면접 인텔리전스(코멘트→요약·후속질문)
//  ai.ts의 MockAiProvider 사용. Bedrock 키 연동 시 provider만 교체.
//  규제 원칙: 결과는 "보조 신호"로만, 근거 동반, 자동 탈락 없음.
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { ShieldQuestion, Sparkles, Loader2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { ai } from "@/lib/hr/ai";
import type { AuthenticitySignal, InterviewDigest } from "@/lib/hr/ai";
import type { HrApplication } from "@/lib/hr/types";
import { Panel } from "@/components/hr/ui";

const AI_BADGE = ai.live ? "AI" : "AI · 목업";

/** 공용 "AI 보조" 고지 배너 */
function AiNotice() {
  return (
    <p className="mt-3 rounded-lg bg-paper-dim px-3 py-2 font-mono text-[0.62rem] leading-relaxed text-muted">
      ⓘ AI 보조 분석입니다. 참고 신호로만 활용하고 합불 판단은 담당자가 직접
      합니다. {ai.live ? "" : "(현재 목업 — Bedrock 연동 시 실제 분석)"}
    </p>
  );
}

// ── ① 자소서 표절 / AI 작성 탐지 ────────────────────────────────

export function AuthenticityPanel({ coverLetter }: { coverLetter: string }) {
  const [signal, setSignal] = useState<AuthenticitySignal | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const result = await ai.detectAuthenticity(coverLetter);
    setSignal(result);
    setBusy(false);
  }

  const tone =
    signal?.verdict === "높음"
      ? "text-ink"
      : signal?.verdict === "보통"
        ? "text-accent-ink"
        : "text-signal";

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <ShieldQuestion className="size-4 text-accent-ink" /> 자소서 진위 검토
        </span>
      }
      action={
        <span className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[0.6rem] font-bold text-muted">
          {AI_BADGE}
        </span>
      }
      bodyClassName="p-5"
    >
      {!signal ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[0.85rem] leading-relaxed text-muted">
            자기소개서의 표절·생성형 AI 작성 의심 신호를 검토합니다. 국내
            채용에서 보편화된 절차이며, 결과는 <b>플래그</b>로만 제공되고 자동
            탈락에는 쓰이지 않습니다.
          </p>
          <button
            onClick={run}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            진위 검토 실행
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center rounded-xl bg-paper px-5 py-3">
              <span className={cn("font-mono text-3xl font-semibold", tone)}>
                {signal.aiLikelihood}
              </span>
              <span className="text-[0.62rem] text-muted-ink">
                AI작성 의심도
              </span>
            </div>
            <div>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-[0.75rem] font-bold",
                  signal.verdict === "높음" && "bg-ink text-paper",
                  signal.verdict === "보통" && "bg-accent-soft text-accent-ink",
                  signal.verdict === "낮음" && "bg-signal/12 text-signal",
                )}
              >
                의심도 {signal.verdict}
              </span>
              <ul className="mt-2 flex flex-col gap-1">
                {signal.notes.map((n) => (
                  <li
                    key={n}
                    className="flex items-start gap-1.5 text-[0.8rem] leading-snug text-ink"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => setSignal(null)}
            className="w-fit text-[0.75rem] font-semibold text-muted hover:text-ink"
          >
            다시 검토
          </button>
        </div>
      )}
      <AiNotice />
    </Panel>
  );
}

// ── ② 면접 인텔리전스 ───────────────────────────────────────────
//  면접 코멘트(팀 코멘트 + 평가 코멘트)를 모아 AI가 요약·후속질문 제안.

export function InterviewIntelPanel({ app }: { app: HrApplication }) {
  const [digest, setDigest] = useState<InterviewDigest | null>(null);
  const [busy, setBusy] = useState(false);

  const notesText = [
    ...app.evaluations.map((e) => `[${e.round}] ${e.comment}`),
    ...app.comments.map((c) => c.text),
  ].join("\n");

  const hasNotes = notesText.trim().length > 0;

  async function run() {
    setBusy(true);
    const result = await ai.summarizeInterview(notesText);
    setDigest(result);
    setBusy(false);
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-4 text-accent-ink" /> 면접 인텔리전스
        </span>
      }
      action={
        <span className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[0.6rem] font-bold text-muted">
          {AI_BADGE}
        </span>
      }
      bodyClassName="p-5"
    >
      {!digest ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-[0.85rem] leading-relaxed text-muted">
            평가·코멘트를 모아 핵심 요약과 다음 전형 질문을 제안합니다. 면접관이
            기록에 덜 매이고 대화에 집중하도록 돕는 보조 기능입니다.
          </p>
          <button
            onClick={run}
            disabled={busy || !hasNotes}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {hasNotes ? "면접 요약 생성" : "요약할 코멘트 없음"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-paper p-4 text-[0.88rem] leading-relaxed text-ink">
            {digest.summary}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-wider text-signal">
                강점
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {digest.strengths.map((t) => (
                  <li key={t} className="text-[0.82rem] text-ink">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted">
                확인 필요
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {digest.concerns.map((t) => (
                  <li key={t} className="text-[0.82rem] text-ink">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wider text-accent-ink">
              <ListChecks className="size-3.5" /> 다음 전형 추천 질문
            </p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {digest.suggestedQuestions.map((q) => (
                <li
                  key={q}
                  className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] text-ink"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setDigest(null)}
            className="w-fit text-[0.75rem] font-semibold text-muted hover:text-ink"
          >
            다시 생성
          </button>
        </div>
      )}
      <AiNotice />
    </Panel>
  );
}
