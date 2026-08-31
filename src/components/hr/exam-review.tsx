"use client";

// ════════════════════════════════════════════════════════════════
//  필기시험 리뷰 — 답안 채점(자동+수동) · 무결성 리포트 · 녹화 재생.
//  녹화 원본은 응시한 브라우저의 IndexedDB(데모) 또는 Supabase
//  Storage(업로드된 경우)에서 불러온다.
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  CircleCheck,
  CircleX,
  TriangleAlert,
  Video,
  Camera,
  Monitor,
  UserX,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  applicantNo,
  memberName,
  examSpecOf,
} from "@/lib/hr/store";
import {
  computeIntegrity,
  scoreSummary,
  QUESTION_TYPE_LABEL,
} from "@/lib/hr/exam";
import {
  assembleRecording,
  listSnapshots,
  remoteRecordingUrl,
} from "@/lib/hr/proctor";
import { confirmAction, toast } from "@/components/hr/feedback";
import {
  Panel,
  Avatar,
  EmptyState,
  fmtDateTime,
} from "@/components/hr/ui";
import { IntegrityBadge } from "@/components/hr/exams";
import type { ExamQuestion } from "@/lib/hr/types";

export function ExamReview({ id }: { id: string }) {
  const s = useHrState();
  const ex = s.examSessions.find((x) => x.id === id);
  const t = ex ? examSpecOf(s, ex) : undefined;
  const app = s.applications.find((a) => a.id === ex?.applicationId);
  const cand = s.candidates.find((c) => c.id === app?.candidateId);
  const job = s.jobs.find((j) => j.id === app?.jobId);

  const [camUrl, setCamUrl] = useState<string | null>(null);
  const [screenUrl, setScreenUrl] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<{ at: string; url: string }[]>([]);
  const [mediaChecked, setMediaChecked] = useState(false);

  // 수동 점수 = 저장된 값(초기) + 이번 화면에서 입력한 값(오버라이드)
  // React Compiler가 자동 메모이제이션하므로 수동 useMemo 없이 계산.
  const savedManual: Record<string, number> = {};
  for (const a of ex?.answers ?? [])
    if (typeof a.manualScore === "number") savedManual[a.questionId] = a.manualScore;
  const [manualOverride, setManualOverride] = useState<Record<string, number>>({});
  const manual = { ...savedManual, ...manualOverride };

  // 녹화·스냅샷 로드 — IndexedDB(이 브라우저에서 응시한 경우) → Storage 순
  useEffect(() => {
    if (!ex) return;
    let alive = true;
    void (async () => {
      const [cam, screen, snapshots] = await Promise.all([
        assembleRecording(ex.id, "cam"),
        assembleRecording(ex.id, "screen"),
        listSnapshots(ex.id),
      ]);
      if (!alive) return;
      if (cam) setCamUrl(URL.createObjectURL(cam));
      else if (ex.recording?.uploaded)
        setCamUrl(await remoteRecordingUrl(ex.id, "cam"));
      if (screen) setScreenUrl(URL.createObjectURL(screen));
      else if (ex.recording?.uploaded)
        setScreenUrl(await remoteRecordingUrl(ex.id, "screen"));
      setSnaps(
        snapshots.map((x) => ({ at: x.at, url: URL.createObjectURL(x.blob) })),
      );
      setMediaChecked(true);
    })();
    return () => {
      alive = false;
      // blob URL 회수 (메모리 누수 방지) — 원격 서명 URL은 대상 아님
      setCamUrl((u) => (u?.startsWith("blob:") ? (URL.revokeObjectURL(u), null) : u));
      setScreenUrl((u) => (u?.startsWith("blob:") ? (URL.revokeObjectURL(u), null) : u));
      setSnaps((list) => {
        list.forEach((x) => URL.revokeObjectURL(x.url));
        return [];
      });
    };
  }, [ex?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const integrity = ex ? computeIntegrity(ex.events) : null;

  if (!ex || !t || !app || !cand) {
    return (
      <EmptyState
        icon={<TriangleAlert className="size-6" />}
        text="응시 세션을 찾을 수 없습니다."
      />
    );
  }

  const summary = scoreSummary(t, ex.answers);
  const manualQs = t.questions.filter((q) => q.type === "서술" || q.type === "코딩");
  const manualTotal = manualQs.reduce((sum, q) => sum + (manual[q.id] ?? 0), 0);
  const projected = summary.auto + manualTotal;
  const graded = ex.status === "채점완료";
  const usedMin =
    ex.startedAt && ex.submittedAt
      ? Math.round(
          (new Date(ex.submittedAt).getTime() - new Date(ex.startedAt).getTime()) / 60000,
        )
      : null;

  // 합격선 대비 판정 — 세트에 passingScore가 있으면 제안 근거로 쓴다
  const passLine = t.passingScore;
  const passed = passLine != null ? projected >= passLine : undefined;

  async function confirmGrade() {
    const missing = manualQs.filter((q) => !(q.id in manual));
    if (missing.length > 0) {
      const ok = await confirmAction({
        title: "채점하지 않은 서술 문항이 있습니다",
        lines: [`${missing.length}개 문항이 0점으로 처리됩니다. 계속할까요?`],
        confirmLabel: "0점으로 확정",
        danger: true,
      });
      if (!ok) return;
    }
    hrActions.gradeExam(ex!.id, manual);
    // 합격선이 설정된 시험이면 확정 직후 합불 처리까지 원클릭 제안
    if (passLine != null) {
      const isPass = projected >= passLine;
      const ok = await confirmAction({
        title: isPass
          ? "합격선 통과 — 다음 단계로 이동할까요?"
          : "합격선 미달 — 불합격 처리할까요?",
        lines: ["지금 결정하지 않아도 됩니다 — 나중에 상단 버튼으로 처리할 수 있어요."],
        facts: [
          { label: "확정 점수", value: `${projected}/${summary.max}점` },
          { label: "합격선", value: `${passLine}점 (${isPass ? "통과" : `${passLine - projected}점 미달`})` },
          { label: "무결성", value: ex!.integrityScore != null ? `${ex!.integrityScore}점` : "—" },
        ],
        confirmLabel: isPass ? "합격 · 다음 단계로" : "불합격 처리",
        danger: !isPass,
      });
      if (ok) {
        await moveStage(isPass, true);
        return;
      }
    }
    toast.show("채점을 확정했습니다.");
  }

  async function moveStage(pass: boolean, skipConfirm = false) {
    const cur = s.stages.find((st) => st.id === app!.stageId);
    const target = pass
      ? [...s.stages]
          .filter((st) => st.kind === "active" && st.order > (cur?.order ?? 0))
          .sort((a, b) => a.order - b.order)[0]
      : s.stages.find((st) => st.kind === "rejected");
    if (!target) return;
    if (!skipConfirm) {
      const ok = await confirmAction({
        title: pass ? "필기 합격 처리할까요?" : "불합격 처리할까요?",
        facts: [
          { label: "지원자", value: `${cand!.name} · ${job?.title ?? ""}` },
          { label: "이동", value: `${cur?.name ?? ""} → ${target.name}` },
        ],
        confirmLabel: pass ? "합격 · 다음 단계로" : "불합격 처리",
        danger: !pass,
      });
      if (!ok) return;
    }
    hrActions.moveStage(
      app!.id,
      target.id,
      pass ? undefined : `필기시험 결과 (${projected}/${summary.max}점)`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/hr/exams"
        className="flex w-fit items-center gap-1.5 text-[0.8rem] font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> 필기시험 목록
      </Link>

      {/* 헤더 */}
      <div className="surface-card flex flex-wrap items-center gap-4 rounded-card p-5 shadow-lift">
        <Avatar name={cand.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            {cand.name}
            <span className="font-mono text-[0.7rem] font-medium text-muted-ink">
              {applicantNo(s, app.id)}
            </span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.8rem] text-muted">
            {t.title} · {job?.title}
            {(ex.attempt ?? 1) > 1 && (
              <span
                title="재응시 회차"
                className="rounded-full border border-accent bg-accent-soft px-2 py-0.5 font-mono text-[0.62rem] font-bold text-accent-ink"
              >
                {ex.attempt}차
              </span>
            )}
          </p>
          <p className="mt-1 flex items-center gap-3 text-[0.72rem] text-muted-ink">
            {ex.submittedAt && <span>제출 {fmtDateTime(ex.submittedAt)}</span>}
            {usedMin !== null && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {usedMin}분 소요 / {t.durationMin}분
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-[0.65rem] font-semibold text-muted">무결성</p>
            <div className="mt-1"><IntegrityBadge score={ex.integrityScore} /></div>
          </div>
          <div className="text-center">
            <p className="text-[0.65rem] font-semibold text-muted">
              {graded ? "확정 점수" : "예상 점수"}
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-ink">
              {graded ? ex.totalScore : projected}
              <span className="text-sm text-muted-ink">/{summary.max}</span>
            </p>
            {passLine != null && (
              <p
                className={cn(
                  "mt-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                  passed
                    ? "bg-signal/12 text-signal"
                    : "bg-red-50 text-red-600",
                )}
              >
                합격선 {passLine}점 {passed ? "통과" : "미달"}
              </p>
            )}
          </div>
        </div>
        <div className="flex w-full gap-2 border-t border-line pt-4 sm:w-auto sm:border-0 sm:pt-0">
          <button
            onClick={() => void moveStage(true)}
            className="flex items-center gap-1.5 rounded-full bg-signal px-4 py-2 text-[0.78rem] font-bold text-white transition-opacity hover:opacity-90"
          >
            <CircleCheck className="size-3.5" /> 필기 합격
          </button>
          <button
            onClick={() => void moveStage(false)}
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[0.78rem] font-bold text-muted transition-colors hover:border-red-300 hover:text-red-500"
          >
            <UserX className="size-3.5" /> 불합격
          </button>
          {graded && (
            <button
              onClick={async () => {
                const date = new Date(Date.now() + 7 * 86400000)
                  .toISOString()
                  .slice(0, 10);
                const ok = await confirmAction({
                  title: `${cand.name} 님에게 재응시를 배정할까요?`,
                  lines: [
                    "이번 회차 점수·기록은 그대로 남습니다. 기한을 직접 정하려면 응시 현황 목록의 재응시 버튼을 사용하세요.",
                  ],
                  facts: [
                    { label: "회차", value: `${(ex.attempt ?? 1) + 1}차 (새 링크 발급)` },
                    { label: "응시 기한", value: `${date} (7일)` },
                  ],
                  confirmLabel: "재응시 배정",
                });
                if (!ok) return;
                const r = hrActions.retakeExam(ex.id, `${date}T23:59:00+09:00`);
                if (r) toast.show("재응시 링크가 발급되고 안내 메일이 발송되었습니다.");
              }}
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[0.78rem] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              <RotateCcw className="size-3.5" /> 재응시 배정
            </button>
          )}
          <Link
            href={`/hr/applicants/${app.id}`}
            className="flex items-center gap-1 rounded-full border border-line px-4 py-2 text-[0.78rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            지원자 상세 <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* ── 좌: 답안·채점 ── */}
        <div className="flex flex-col gap-6 xl:col-span-3">
          <Panel
            title={`답안 · 채점 (자동 ${summary.auto}점 + 수동 ${graded ? (ex.totalScore ?? 0) - summary.auto : manualTotal}점)`}
            action={
              !graded && (
                <button
                  onClick={() => void confirmGrade()}
                  className="rounded-full bg-ink px-4 py-2 text-[0.78rem] font-bold text-paper transition-colors hover:bg-ink-800"
                >
                  채점 확정 ({projected}/{summary.max}점)
                </button>
              )
            }
            bodyClassName="flex flex-col gap-4 p-4"
          >
            {t.questions.map((q, i) => (
              <AnswerCard
                key={q.id}
                index={i}
                q={q}
                answer={ex.answers.find((a) => a.questionId === q.id)}
                graded={graded}
                manualValue={manual[q.id]}
                onManual={(v) => setManualOverride((m) => ({ ...m, [q.id]: v }))}
              />
            ))}
          </Panel>
        </div>

        {/* ── 우: 무결성·녹화 ── */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-accent-ink" /> 무결성 리포트
              </span>
            }
            bodyClassName="p-4"
          >
            {integrity && integrity.flags.length > 0 ? (
              <div className="flex flex-col gap-2">
                {integrity.flags.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between rounded-lg bg-red-50 px-3.5 py-2 text-[0.8rem]"
                  >
                    <span className="font-semibold text-red-700">
                      {f.label} × {f.count}
                    </span>
                    <span className="font-mono text-[0.72rem] text-red-500">
                      -{f.deducted}점
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-ink">
                  무결성 점수는 참고 신호입니다. 자동 탈락 근거로 쓰지 말고,
                  녹화·스냅샷과 함께 사람이 판단하세요.
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-[0.82rem] text-signal">
                <CircleCheck className="size-4" /> 이상 신호가 감지되지 않았습니다.
              </p>
            )}

            {/* 이벤트 타임라인 */}
            <p className="mt-5 text-[0.7rem] font-bold text-muted">응시 타임라인</p>
            <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
              {ex.events.map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 text-[0.75rem]">
                  <span className="font-mono text-[0.65rem] text-muted-ink">
                    {e.at.slice(11, 19)}
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      ["탭이탈", "전체화면이탈", "복사시도", "붙여넣기시도", "화면공유중단", "카메라중단", "다중모니터감지", "위반한도초과", "우클릭차단"].includes(e.type)
                        ? "text-red-600"
                        : "text-ink",
                    )}
                  >
                    {e.type}
                  </span>
                  {e.detail && <span className="text-muted-ink">{e.detail}</span>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <Video className="size-4 text-accent-ink" /> 녹화 · 스냅샷
              </span>
            }
            bodyClassName="flex flex-col gap-4 p-4"
          >
            {camUrl && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[0.72rem] font-bold text-muted">
                  <Camera className="size-3" /> 응시자 캠
                </p>
                <video src={camUrl} controls className="w-full rounded-xl bg-ink" />
              </div>
            )}
            {screenUrl && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[0.72rem] font-bold text-muted">
                  <Monitor className="size-3" /> 화면 녹화
                </p>
                <video src={screenUrl} controls className="w-full rounded-xl bg-ink" />
              </div>
            )}
            {snaps.length > 0 && (
              <div>
                <p className="mb-1.5 text-[0.72rem] font-bold text-muted">
                  스냅샷 {snaps.length}장 (신분 확인 포함, 20초 간격)
                </p>
                <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto">
                  {snaps.map((sn, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={sn.url}
                      alt={`스냅샷 ${i}`}
                      title={sn.at}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
            {mediaChecked && !camUrl && !screenUrl && snaps.length === 0 && (
              <p className="text-[0.78rem] leading-relaxed text-muted">
                이 브라우저에서 녹화 원본을 찾을 수 없습니다.
                {ex.recording ? (
                  <>
                    {" "}
                    응시 기기에는 캠 {ex.recording.camChunks}청크 · 화면{" "}
                    {ex.recording.screenChunks}청크 · 스냅샷{" "}
                    {ex.recording.snapshots}장이 기록되었습니다.
                    {!ex.recording.uploaded &&
                      " (데모 모드 — 녹화는 응시자 브라우저에 저장되며, Supabase Storage 연동 시 자동 업로드됩니다.)"}
                  </>
                ) : (
                  " 녹화 없이 응시한 세션입니다."
                )}
              </p>
            )}
          </Panel>

          {graded && (
            <div className="rounded-card bg-paper-dim p-4 text-[0.78rem] text-muted">
              {memberName(s, ex.gradedBy ?? "")} 님이{" "}
              {ex.gradedAt && fmtDateTime(ex.gradedAt)}에 채점을 확정했습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 문항별 답안 카드 ─────────────────────────────────────────────

function AnswerCard({
  index,
  q,
  answer,
  graded,
  manualValue,
  onManual,
}: {
  index: number;
  q: ExamQuestion;
  answer?: { selected?: number[]; text?: string; autoScore?: number; manualScore?: number };
  graded: boolean;
  manualValue?: number;
  onManual: (v: number) => void;
}) {
  const isManual = q.type === "서술" || q.type === "코딩";
  const auto = answer?.autoScore ?? 0;
  const correct = !isManual && auto >= q.points;
  const noAnswer =
    !answer || ((answer.selected?.length ?? 0) === 0 && !(answer.text ?? "").trim());

  return (
    <div className="rounded-xl border border-line bg-pure p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[0.65rem] font-bold text-paper">
          Q{index + 1}
        </span>
        <span className="rounded-full bg-paper-dim px-2 py-0.5 text-[0.65rem] font-semibold text-muted">
          {QUESTION_TYPE_LABEL[q.type]}
        </span>
        {!isManual ? (
          <span
            className={cn(
              "ml-auto flex items-center gap-1 font-mono text-[0.78rem] font-bold",
              correct ? "text-signal" : "text-red-500",
            )}
          >
            {correct ? <CircleCheck className="size-3.5" /> : <CircleX className="size-3.5" />}
            {auto}/{q.points}점
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-1.5 text-[0.78rem] font-semibold text-muted">
            {graded ? (
              <span className="font-mono font-bold text-ink">
                {answer?.manualScore ?? 0}/{q.points}점
              </span>
            ) : (
              <>
                <input
                  type="number"
                  min={0}
                  max={q.points}
                  value={manualValue ?? ""}
                  placeholder="0"
                  onChange={(e) =>
                    onManual(Math.max(0, Math.min(q.points, Number(e.target.value) || 0)))
                  }
                  className="w-16 rounded-lg border border-line bg-pure px-2 py-1 text-right font-mono text-sm outline-none focus:border-accent"
                />
                <span className="text-muted-ink">/{q.points}점</span>
              </>
            )}
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-[0.85rem] font-semibold leading-relaxed text-ink">
        {q.prompt}
      </p>
      {q.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={q.imageUrl}
          alt="문항 이미지"
          className="mt-3 max-h-64 rounded-xl border border-line"
        />
      )}

      {/* 답안 표시 */}
      <div className="mt-3">
        {noAnswer ? (
          <p className="rounded-lg bg-paper-dim px-3.5 py-2.5 text-[0.8rem] text-muted-ink">
            미응답
          </p>
        ) : q.type === "단일선택" || q.type === "다중선택" ? (
          <div className="flex flex-col gap-1.5">
            {(q.options ?? []).map((opt, i) => {
              const picked = (answer?.selected ?? []).includes(i);
              const isKey = ((q.answerKey as number[]) ?? []).includes(i);
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[0.8rem]",
                    picked && isKey && "bg-signal/12 font-semibold text-signal",
                    picked && !isKey && "bg-red-50 font-semibold text-red-600",
                    !picked && isKey && "bg-accent-soft text-accent-ink",
                    !picked && !isKey && "bg-paper text-muted",
                  )}
                >
                  <span className="font-mono text-[0.68rem]">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {picked && <span className="ml-auto text-[0.65rem] font-bold">응답</span>}
                  {!picked && isKey && <span className="ml-auto text-[0.65rem] font-bold">정답</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <pre
            className={cn(
              "max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-[0.8rem] leading-relaxed",
              q.type === "코딩" ? "bg-ink font-mono text-paper" : "bg-paper text-ink",
            )}
          >
            {answer?.text}
          </pre>
        )}
        {q.type === "단답" && (
          <p className="mt-1.5 text-[0.68rem] text-muted-ink">
            허용 답안: {((q.answerKey as string[]) ?? []).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
