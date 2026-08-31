"use client";

// ════════════════════════════════════════════════════════════════
//  면접관 전용 평가 화면 — 로그인 없이 링크로 접속 (그리팅의 면접관
//  전용 화면 대체). HR이 복사해 준 /eval/[면접id] 링크로 열린다.
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { ShieldCheck, CircleCheck, Video, MapPin } from "lucide-react";
import { useHrState, hrActions, memberName } from "@/lib/hr/store";
import { Avatar, MatchRing } from "@/components/hr/ui";
import { ScorecardForm, type ScorecardValue } from "@/components/hr/scorecard-form";

export function EvalRoom({ interviewId }: { interviewId: string }) {
  const s = useHrState();
  const iv = s.interviews.find((x) => x.id === interviewId);
  const app = s.applications.find((a) => a.id === iv?.applicationId);
  const candidate = s.candidates.find((c) => c.id === app?.candidateId);
  const job = s.jobs.find((j) => j.id === app?.jobId);

  const [evaluatorId, setEvaluatorId] = useState<string>(
    iv?.interviewerIds[0] ?? "",
  );
  const [done, setDone] = useState(false);

  if (!iv || !app || !candidate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-dim px-6">
        <p className="text-muted">유효하지 않은 평가 링크입니다.</p>
      </main>
    );
  }

  function submit(value: ScorecardValue) {
    hrActions.submitEvalViaLink(interviewId, evaluatorId, {
      round: iv!.round,
      ...value,
    });
    setDone(true);
  }

  const remote = iv.location.includes("화상");

  return (
    <main className="min-h-screen bg-paper-dim px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="kicker flex items-center gap-2 text-accent-ink">
          <ShieldCheck className="size-4" /> ARCO HR — 면접관 전용
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {iv.round} 평가
        </h1>
        <p className="mt-1 text-sm text-muted">
          이 화면은 링크를 받은 면접관 전용입니다. 로그인 없이 평가를 제출할 수
          있습니다.
        </p>

        {/* candidate card */}
        <div className="surface-card mt-6 rounded-card p-5 shadow-lift">
          <div className="flex items-center gap-4">
            <Avatar name={candidate.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-extrabold tracking-tight">
                {candidate.name}
              </p>
              <p className="truncate text-sm text-accent-ink">{job?.title}</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-[0.7rem] text-muted">
                {remote ? (
                  <Video className="size-3" />
                ) : (
                  <MapPin className="size-3" />
                )}
                {iv.date} {iv.start}–{iv.end} · {iv.location}
              </p>
            </div>
            <MatchRing score={app.ai.matchScore} size={56} />
          </div>
          <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[0.85rem] leading-relaxed">
            {candidate.experiences.slice(0, 2).map((ex) => (
              <p key={ex.company} className="text-ink">
                <b>{ex.company}</b>{" "}
                <span className="text-muted">
                  {ex.role} · {ex.period}
                </span>
              </p>
            ))}
            <p className="text-muted">{app.ai.summary}</p>
          </div>
        </div>

        {done ? (
          <div className="surface-card mt-6 flex flex-col items-center gap-3 rounded-card p-10 text-center shadow-lift">
            <CircleCheck className="size-10 text-signal" />
            <p className="text-lg font-extrabold tracking-tight">
              평가가 제출되었습니다
            </p>
            <p className="text-sm text-muted">
              인사팀과 채용 파이프라인에 즉시 반영되었습니다. 창을 닫으셔도
              됩니다.
            </p>
          </div>
        ) : (
          <div className="surface-card mt-6 rounded-card p-5 shadow-lift">
            <label className="flex items-center gap-3 text-sm font-bold text-ink">
              평가자
              <select
                value={evaluatorId}
                onChange={(e) => setEvaluatorId(e.target.value)}
                className="h-10 flex-1 rounded-full border border-line bg-pure px-3.5 text-sm font-medium focus:border-accent focus:outline-none"
              >
                {iv.interviewerIds.map((mid) => (
                  <option key={mid} value={mid}>
                    {memberName(s, mid)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4">
              <ScorecardForm onSubmit={submit} />
            </div>
          </div>
        )}

        <p className="mt-6 text-center font-mono text-[0.62rem] text-muted-ink">
          데모 환경 — 제출 즉시 HR 콘솔 파이프라인에 반영됩니다
        </p>
      </div>
    </main>
  );
}
