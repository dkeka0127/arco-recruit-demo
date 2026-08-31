"use client";

// ════════════════════════════════════════════════════════════════
//  지원자 상세 — 지원서 열람 · AI 인사이트 · 평가 · 협업 · 커뮤니케이션
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Star,
  Mail,
  Phone,
  Link2,
  FileText,
  Sparkles,
  CircleCheck,
  TriangleAlert,
  Send,
  UserX,
  FolderHeart,
  CalendarClock,
  Video,
  MapPin,
  FileCheck,
  Link2 as LinkIcon,
  Ban,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  memberName,
  stageOf,
} from "@/lib/hr/store";
import type {
  EvaluationDecision,
  MessageChannel,
  HrApplication,
  HrState,
  Interview,
} from "@/lib/hr/types";
import {
  AuthenticityPanel,
  InterviewIntelPanel,
} from "@/components/hr/ai-panels";
import { confirmAction, toast } from "@/components/hr/feedback";
import { findDuplicateGroups, applicantNo, selectableInterviewers, examSessionsOfApp, examMatchesJob } from "@/lib/hr/store";
import { IntegrityBadge } from "@/components/hr/exams";
import {
  Panel,
  StageBadge,
  DecisionBadge,
  MatchRing,
  Stars,
  Avatar,
  EmptyState,
  fmtDate,
  fmtDateTime,
  daysAgo,
} from "@/components/hr/ui";

const SCORE_ITEMS = ["직무 전문성", "문제 해결", "커뮤니케이션", "컬처핏"];
const DECISIONS: EvaluationDecision[] = ["강력추천", "추천", "보류", "비추천"];
const CHANNELS: MessageChannel[] = ["이메일", "문자", "알림톡"];

// 날짜 헬퍼 (모듈 스코프 — 렌더 순수성 규칙 밖)
const todayStr = () => new Date().toISOString().slice(0, 10);
const futureStr = (years: number) =>
  new Date(Date.now() + years * 365 * 86400000).toISOString().slice(0, 10);

const plusDaysStr = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

/** HH:mm 에 시간을 더한다 (일정 종료 시각 자동 계산) */
function addHour(start: string): string {
  const [h, m] = start.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ── 필기시험 패널 — 배정·링크·상태·채점 바로가기 ─────────────────

function ExamPanel({ app, s }: { app: HrApplication; s: HrState }) {
  const [open, setOpen] = useState(false);
  const job = s.jobs.find((j) => j.id === app.jobId);
  // 지원 공고의 직군과 맞는 시험을 추천 그룹으로 우선 노출
  const recommended = s.examTemplates.filter((t) => examMatchesJob(t, job));
  const others = s.examTemplates.filter((t) => !recommended.includes(t));
  const [templateId, setTemplateId] = useState(
    recommended[0]?.id ?? s.examTemplates[0]?.id ?? "",
  );
  const [deadline, setDeadline] = useState(() => plusDaysStr(7));
  /** 재응시 배정 인라인 편집 대상 세션 */
  const [retaking, setRetaking] = useState<{ id: string; date: string } | null>(
    null,
  );
  const sessions = examSessionsOfApp(s, app.id);
  const optionLabel = (t: (typeof s.examTemplates)[number]) =>
    `${t.category ? `[${t.category}] ` : ""}${t.title} (${t.durationMin}분 · ${t.questions.length}문항)`;

  function assign() {
    if (!templateId) return;
    const r = hrActions.assignExam(app.id, templateId, `${deadline}T23:59:00+09:00`);
    if (r) {
      toast.show("응시 링크가 발급되고 안내 메일이 발송되었습니다.");
      setOpen(false);
    }
  }

  function copyLink(token: string) {
    void navigator.clipboard.writeText(`${window.location.origin}/exam/${token}`);
    toast.show("응시 링크를 복사했습니다.");
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <FileCheck className="size-4 text-accent-ink" /> 필기시험
        </span>
      }
      action={
        s.examTemplates.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
          >
            {open ? "닫기" : "시험 배정"}
          </button>
        )
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      {open && (
        <div className="rounded-xl bg-paper-dim p-3.5">
          <div className="flex flex-col gap-2">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.8rem] outline-none focus:border-accent"
            >
              {recommended.length > 0 && (
                <optgroup label={`✦ 이 공고 직군 추천 (${job?.department ?? ""})`}>
                  {recommended.map((t) => (
                    <option key={t.id} value={t.id}>{optionLabel(t)}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label={recommended.length > 0 ? "전체 시험" : "시험 목록"}>
                {others.map((t) => (
                  <option key={t.id} value={t.id}>{optionLabel(t)}</option>
                ))}
              </optgroup>
            </select>
            <label className="flex items-center gap-2 text-[0.75rem] font-semibold text-muted">
              응시 기한
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-pure px-3 py-2 text-[0.8rem] outline-none focus:border-accent"
              />
            </label>
            <button
              onClick={assign}
              className="rounded-full bg-accent px-4 py-2 text-[0.78rem] font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
            >
              링크 발급 + 안내 발송
            </button>
            <p className="text-[0.65rem] leading-relaxed text-muted-ink">
              지원자는 개인 링크로 로그인 없이 응시합니다. 캠·화면 녹화와
              이탈 감지가 자동 적용되며, /my 페이지에도 응시 버튼이 뜹니다.
            </p>
          </div>
        </div>
      )}

      {sessions.length === 0 && !open && (
        <p className="text-[0.78rem] text-muted">
          배정된 시험이 없습니다. 필기·인적성 단계 진행 시 시험을 배정하세요.
        </p>
      )}
      {sessions.map((ex) => {
        const t = s.examTemplates.find((x) => x.id === ex.templateId);
        return (
          <div key={ex.id} className="rounded-xl border border-line bg-pure p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.82rem] font-bold tracking-tight text-ink">
                {t?.title ?? "시험"}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                  ex.status === "채점완료" && "bg-signal/12 text-signal",
                  ex.status === "제출" && "bg-accent text-ink",
                  ex.status === "진행중" && "bg-amber-100 text-amber-700",
                  ex.status === "발급" && "bg-accent-soft text-accent-ink",
                  (ex.status === "만료" || ex.status === "중단") && "bg-ink/8 text-muted",
                )}
              >
                {ex.status}
              </span>
              {(ex.attempt ?? 1) > 1 && (
                <span
                  title="재응시 회차"
                  className="rounded-full border border-accent bg-accent-soft px-2 py-0.5 font-mono text-[0.62rem] font-bold text-accent-ink"
                >
                  {ex.attempt}차
                </span>
              )}
              <IntegrityBadge score={ex.integrityScore} />
              {typeof ex.totalScore === "number" && (
                <span className="font-mono text-[0.78rem] font-bold text-ink">
                  {ex.totalScore}/{ex.maxScore}점
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.68rem] text-muted-ink">
              {ex.submittedAt
                ? `제출 ${fmtDateTime(ex.submittedAt)}`
                : `응시 기한 ${ex.expiresAt.slice(0, 10)}`}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(ex.status === "발급" || ex.status === "진행중") && (
                <>
                  <button
                    onClick={() => copyLink(ex.token)}
                    className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[0.7rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <LinkIcon className="size-3" /> 링크 복사
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: "응시 링크를 취소할까요?",
                        lines: ["링크가 즉시 무효화됩니다."],
                        confirmLabel: "취소(무효화)",
                        danger: true,
                      });
                      if (ok) hrActions.cancelExamSession(ex.id);
                    }}
                    className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[0.7rem] font-semibold text-muted transition-colors hover:border-red-300 hover:text-red-500"
                  >
                    <Ban className="size-3" /> 취소
                  </button>
                </>
              )}
              {(ex.status === "제출" || ex.status === "채점완료") && (
                <Link
                  href={`/hr/exams/${ex.id}`}
                  className="flex items-center gap-1 rounded-full bg-ink px-3.5 py-1.5 text-[0.7rem] font-bold text-paper transition-colors hover:bg-ink-800"
                >
                  {ex.status === "제출" ? "채점하기" : "결과 리포트"}
                  <ChevronRight className="size-3" />
                </Link>
              )}
              {(ex.status === "채점완료" ||
                ex.status === "만료" ||
                ex.status === "중단") && (
                <button
                  onClick={() =>
                    setRetaking((cur) =>
                      cur?.id === ex.id
                        ? null
                        : { id: ex.id, date: plusDaysStr(7) },
                    )
                  }
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors",
                    retaking?.id === ex.id
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line text-muted hover:border-accent hover:text-accent-ink",
                  )}
                >
                  <RotateCcw className="size-3" /> 재응시
                </button>
              )}
            </div>

            {/* 재응시 배정 인라인 편집 */}
            {retaking?.id === ex.id && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft/40 px-3 py-2.5">
                <span className="text-[0.7rem] font-bold text-accent-ink">
                  재응시 기한
                </span>
                <input
                  type="date"
                  value={retaking.date}
                  onChange={(e) =>
                    setRetaking({ id: ex.id, date: e.target.value })
                  }
                  className="rounded-lg border border-line bg-pure px-2.5 py-1.5 text-[0.75rem] outline-none focus:border-accent"
                />
                <button
                  onClick={() => {
                    const r = hrActions.retakeExam(
                      ex.id,
                      `${retaking.date}T23:59:00+09:00`,
                    );
                    if (r)
                      toast.show(
                        r.duplicate
                          ? "이미 진행 중인 회차가 있어 새로 발급하지 않았습니다."
                          : "재응시 링크가 발급되고 안내 메일이 발송되었습니다.",
                      );
                    setRetaking(null);
                  }}
                  className="rounded-full bg-ink px-3.5 py-1.5 text-[0.7rem] font-bold text-paper transition-colors hover:bg-ink-800"
                >
                  재응시 발급
                </button>
                <span className="text-[0.62rem] text-muted-ink">
                  새 링크·새 회차 — 이전 기록은 그대로 남습니다
                </span>
              </div>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

// ── 평가 카드 — 인라인 수정·삭제 (오제출 정정, 수정 시각 표시) ────

function EvaluationCard({
  ev,
  appId,
  s,
}: {
  ev: import("@/lib/hr/types").Evaluation;
  appId: string;
  s: HrState;
}) {
  const [editing, setEditing] = useState(false);
  const [decision, setDecision] = useState<EvaluationDecision>(ev.decision);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(ev.scores.map((sc) => [sc.item, sc.score])),
  );
  const [comment, setComment] = useState(ev.comment);

  function save() {
    hrActions.updateEvaluation(appId, ev.id, {
      decision,
      scores: ev.scores.map((sc) => ({ item: sc.item, score: scores[sc.item] ?? sc.score })),
      comment,
    });
    setEditing(false);
  }

  async function remove() {
    const ok = await confirmAction({
      title: "이 평가를 삭제할까요?",
      lines: ["삭제는 감사 로그에 기록되며 되돌리기가 가능합니다."],
      facts: [
        { label: "평가자", value: memberName(s, ev.evaluatorId) },
        { label: "라운드", value: `${ev.round} (${ev.decision})` },
      ],
      confirmLabel: "삭제",
      danger: true,
    });
    if (ok) hrActions.removeEvaluation(appId, ev.id);
  }

  return (
    <div className="rounded-xl border border-line bg-pure p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Avatar name={memberName(s, ev.evaluatorId)} size="sm" dark />
        <span className="font-bold tracking-tight text-ink">
          {memberName(s, ev.evaluatorId)}
        </span>
        <span className="rounded-full bg-paper-dim px-2.5 py-0.5 text-[0.7rem] font-semibold text-muted">
          {ev.round}
        </span>
        <DecisionBadge decision={ev.decision} />
        {ev.editedAt && (
          <span
            className="text-[0.62rem] font-semibold text-muted-ink"
            title={`수정됨 — ${fmtDateTime(ev.editedAt)}`}
          >
            (수정됨)
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-[0.65rem] text-muted-ink">
            {fmtDate(ev.at)}
          </span>
          <button
            onClick={() => setEditing((v) => !v)}
            title="평가 수정"
            className="text-[0.68rem] font-semibold text-muted transition-colors hover:text-accent-ink"
          >
            수정
          </button>
          <button
            onClick={() => void remove()}
            title="평가 삭제"
            className="text-[0.68rem] font-semibold text-muted transition-colors hover:text-red-500"
          >
            삭제
          </button>
        </span>
      </div>

      {!editing ? (
        <>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {ev.scores.map((sc) => (
              <div
                key={sc.item}
                className="flex items-center justify-between rounded-lg bg-paper px-3 py-1.5"
              >
                <span className="text-[0.78rem] text-muted">{sc.item}</span>
                <Stars value={sc.score} size={13} />
              </div>
            ))}
          </div>
          {ev.comment && (
            <p className="mt-3 text-[0.88rem] leading-relaxed text-ink">
              {ev.comment}
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-accent-soft/40 p-3">
          <div className="flex flex-wrap gap-1.5">
            {DECISIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDecision(d)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.75rem] font-bold transition-colors",
                  decision === d
                    ? "bg-ink text-paper"
                    : "bg-pure text-muted hover:text-ink",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {ev.scores.map((sc) => (
              <div
                key={sc.item}
                className="flex items-center justify-between rounded-lg bg-pure px-3 py-1.5"
              >
                <span className="text-[0.78rem] text-muted">{sc.item}</span>
                <Stars
                  value={scores[sc.item] ?? sc.score}
                  size={14}
                  onChange={(v) => setScores((prev) => ({ ...prev, [sc.item]: v }))}
                />
              </div>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] focus:border-accent focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              className="rounded-full bg-ink px-4 py-1.5 text-[0.75rem] font-bold text-paper transition-colors hover:bg-ink-800"
            >
              수정 저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[0.75rem] font-semibold text-muted hover:text-ink"
            >
              취소
            </button>
            <span className="text-[0.65rem] text-muted-ink">
              수정 사실과 시각이 카드에 표시됩니다
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 팀 코멘트 — 인라인 수정·삭제 ─────────────────────────────────

function CommentItem({
  cm,
  appId,
  s,
}: {
  cm: import("@/lib/hr/types").HrComment;
  appId: string;
  s: HrState;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(cm.text);

  return (
    <div className="group flex gap-3">
      <Avatar name={memberName(s, cm.authorId)} size="sm" dark />
      <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-paper p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.8rem] font-bold text-ink">
            {memberName(s, cm.authorId)}
            {cm.editedAt && (
              <span
                className="ml-1.5 text-[0.62rem] font-semibold text-muted-ink"
                title={`수정됨 — ${fmtDateTime(cm.editedAt)}`}
              >
                (수정됨)
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[0.62rem] text-muted-ink">
              {daysAgo(cm.at)}
            </span>
            <button
              onClick={() => {
                setText(cm.text);
                setEditing((v) => !v);
              }}
              className="text-[0.65rem] font-semibold text-muted-ink opacity-0 transition-opacity hover:text-accent-ink group-hover:opacity-100"
            >
              수정
            </button>
            <button
              onClick={async () => {
                const ok = await confirmAction({
                  title: "코멘트를 삭제할까요?",
                  lines: [cm.text.length > 80 ? cm.text.slice(0, 80) + "…" : cm.text],
                  confirmLabel: "삭제",
                  danger: true,
                });
                if (ok) hrActions.removeComment(appId, cm.id);
              }}
              className="text-[0.65rem] font-semibold text-muted-ink opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
            >
              삭제
            </button>
          </span>
        </div>
        {!editing ? (
          <p className="mt-1 text-[0.85rem] leading-relaxed text-ink">
            {cm.text.split(/(@\S+)/g).map((part, i) =>
              part.startsWith("@") ? (
                <span key={i} className="font-bold text-accent-ink">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.82rem] focus:border-accent focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (text.trim()) {
                    hrActions.updateComment(appId, cm.id, text.trim());
                    setEditing(false);
                  }
                }}
                className="rounded-full bg-ink px-3.5 py-1 text-[0.72rem] font-bold text-paper hover:bg-ink-800"
              >
                저장
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-[0.72rem] font-semibold text-muted hover:text-ink"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 철회 / 개인정보 파기 (GDPR) ──────────────────────────────────

function DangerZone({
  app,
  candidate,
}: {
  app: HrApplication;
  candidate: { id: string; name: string; anonymizedAt?: string };
}) {
  const anonymized = Boolean(candidate.anonymizedAt);
  const withdrawn = Boolean(app.withdrawnAt);

  async function withdraw() {
    const ok = await confirmAction({
      title: "이 지원을 철회 처리할까요?",
      lines: ["파이프라인에서 빠지고 목록에 '철회'로 표시됩니다. 필요하면 되돌릴 수 있습니다."],
      confirmLabel: "철회 처리",
    });
    if (!ok) return;
    const reason = prompt("철회 사유 (선택 — 예: 지원자 요청)") ?? "";
    hrActions.withdrawApplication(app.id, reason || undefined);
  }

  async function anonymize() {
    const ok = await confirmAction({
      title: "개인정보를 파기할까요? (되돌릴 수 없음)",
      lines: [
        "GDPR·개인정보 삭제 요청 대응입니다.",
        "이름·연락처·자기소개서·첨부파일·이메일이 영구 삭제되고,",
        "통계·감사용 비식별 기록(직군·평가 점수·단계 이력)만 남습니다.",
      ],
      facts: [{ label: "대상", value: candidate.name }],
      confirmLabel: "영구 파기",
      danger: true,
      irreversible: true,
    });
    if (!ok) return;
    hrActions.anonymizeCandidate(candidate.id);
  }

  if (anonymized) {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-ink/5 px-3.5 py-2.5 text-[0.78rem] font-semibold text-muted">
        <ShieldOff className="size-3.5" /> 개인정보가 파기된 지원자입니다 (익명화 완료 ·{" "}
        {candidate.anonymizedAt && fmtDate(candidate.anonymizedAt)})
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <span className="mr-1 text-[0.72rem] font-bold text-muted-ink">위험 구역</span>
      {withdrawn ? (
        <>
          <span className="rounded-full bg-paper-dim px-3 py-1.5 text-[0.75rem] font-semibold text-muted">
            철회됨{app.withdrawReason ? ` · ${app.withdrawReason}` : ""}
          </span>
          <button
            onClick={() => hrActions.reopenApplication(app.id)}
            className="rounded-full border border-line px-3 py-1.5 text-[0.75rem] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            철회 취소
          </button>
        </>
      ) : (
        <button
          onClick={() => void withdraw()}
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.75rem] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
        >
          <Ban className="size-3.5" /> 지원 철회
        </button>
      )}
      <button
        onClick={() => void anonymize()}
        className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.75rem] font-semibold text-muted transition-colors hover:border-red-300 hover:text-red-500"
      >
        <ShieldOff className="size-3.5" /> 개인정보 파기 (GDPR)
      </button>
    </div>
  );
}

// ── 후보 정보 수정 (오타 정정 — 이름·이메일·전화·태그) ────────────

function CandidateEditButton({
  candidate,
}: {
  candidate: { id: string; name: string; email: string; phone: string; tags: string[] };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(candidate.name);
  const [email, setEmail] = useState(candidate.email);
  const [phone, setPhone] = useState(candidate.phone);
  const [tags, setTags] = useState(candidate.tags.join(", "));

  function openEditor() {
    setName(candidate.name);
    setEmail(candidate.email);
    setPhone(candidate.phone);
    setTags(candidate.tags.join(", "));
    setOpen(true);
  }

  function save() {
    if (!name.trim()) return toast.show("이름을 입력하세요.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return toast.show("올바른 이메일 형식이 아닙니다.");
    hrActions.updateCandidate(candidate.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={openEditor}
        title="지원자 정보 수정 (이름·이메일·전화·태그)"
        className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.7rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
      >
        정보 수정
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-card bg-pure p-5 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[0.95rem] font-bold text-ink">지원자 정보 수정</h3>
            <p className="mt-1 text-[0.72rem] text-muted">
              오타 정정용입니다. 변경 내역은 활동 타임라인·감사 로그에 남습니다.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {(
                [
                  ["이름", name, setName, "text"],
                  ["이메일", email, setEmail, "email"],
                  ["전화", phone, setPhone, "tel"],
                ] as const
              ).map(([label, value, setter, type]) => (
                <label key={label} className="flex flex-col gap-1 text-[0.72rem] font-semibold text-muted">
                  {label}
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.85rem] font-normal text-ink focus:border-accent focus:outline-none"
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1 text-[0.72rem] font-semibold text-muted">
                태그 (쉼표 구분 — AI 매칭에 사용)
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-lg border border-line bg-pure px-3 py-2 text-[0.85rem] font-normal text-ink focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-line px-4 py-2 text-[0.8rem] font-semibold text-muted hover:text-ink"
              >
                취소
              </button>
              <button
                onClick={save}
                className="rounded-full bg-ink px-5 py-2 text-[0.8rem] font-bold text-paper transition-colors hover:bg-ink-800"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── 면접 카드 — 인라인 수정 (시간·장소·화상링크, 취소 없이 변경) ──

function InterviewCard({ iv, s }: { iv: Interview; s: HrState }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(iv.date);
  const [start, setStart] = useState(iv.start);
  const [end, setEnd] = useState(iv.end);
  const [location, setLocation] = useState(iv.location);
  const [meetingUrl, setMeetingUrl] = useState(iv.meetingUrl ?? "");
  const editable = iv.status === "예정" || iv.status === "평가대기";

  function save() {
    hrActions.updateInterview(iv.id, {
      date,
      start,
      end,
      location,
      meetingUrl: meetingUrl.trim() || undefined,
    });
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-line bg-pure p-3.5">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-ink px-2.5 py-1.5 font-mono text-[0.75rem] font-semibold text-paper">
          {iv.date.slice(5).replace("-", ".")} {iv.start}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">{iv.round}</span>
          <span className="flex items-center gap-1 text-xs text-muted">
            {iv.location.includes("화상") ? (
              <Video className="size-3" />
            ) : (
              <MapPin className="size-3" />
            )}
            {iv.location} ·{" "}
            {iv.interviewerIds.map((mid) => memberName(s, mid)).join(", ")}
          </span>
        </span>
        {editable && (
          <button
            onClick={() => setEditing((v) => !v)}
            title="일정 변경 (시간·장소·화상 링크) — 면접관에게 변경 통지"
            className={cn(
              "flex size-7 items-center justify-center rounded-full border transition-colors",
              editing
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-line text-muted hover:border-accent hover:text-accent-ink",
            )}
          >
            <CalendarClock className="size-3.5" />
          </button>
        )}
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
            iv.status === "예정" && "bg-accent-soft text-accent-ink",
            iv.status === "평가대기" && "bg-accent text-ink",
            iv.status === "완료" && "bg-signal/12 text-signal",
            iv.status === "취소" && "bg-paper-dim text-muted",
          )}
        >
          {iv.status}
        </span>
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-accent-soft/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 rounded-lg border border-line bg-pure px-2.5 text-[0.78rem] focus:border-accent focus:outline-none"
            />
            <input
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setEnd(addHour(e.target.value));
              }}
              className="h-8 rounded-lg border border-line bg-pure px-2.5 text-[0.78rem] focus:border-accent focus:outline-none"
            />
            <span className="text-[0.72rem] text-muted">~</span>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-8 rounded-lg border border-line bg-pure px-2.5 text-[0.78rem] focus:border-accent focus:outline-none"
            />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-8 rounded-lg border border-line bg-pure px-2.5 text-[0.78rem] focus:border-accent focus:outline-none"
            >
              {[
                "본관 7층 면접실 A",
                "본관 7층 면접실 B",
                "화상 면접 (Google Meet)",
                ...(["본관 7층 면접실 A", "본관 7층 면접실 B", "화상 면접 (Google Meet)"].includes(location)
                  ? []
                  : [location]),
              ].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          {location.includes("화상") && (
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="화상 회의 링크 (면접관 포털 입장 버튼에 연결)"
              className="h-8 w-full rounded-lg border border-line bg-pure px-2.5 text-[0.75rem] focus:border-accent focus:outline-none"
            />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              className="rounded-full bg-ink px-4 py-1.5 text-[0.75rem] font-bold text-paper transition-colors hover:bg-ink-800"
            >
              변경 저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[0.75rem] font-semibold text-muted hover:text-ink"
            >
              취소
            </button>
            <span className="text-[0.65rem] text-muted-ink">
              저장 시 면접관 전원에게 변경 통지가 나갑니다
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 면접 일정 조율 패널 ──────────────────────────────────────────

function SchedulePanel({ app, s }: { app: HrApplication; s: HrState }) {
  const [open, setOpen] = useState(false);
  /** "제안" = 지원자가 시간 선택 / "직접" = 조율 끝난 일정 바로 확정 */
  const [mode, setMode] = useState<"제안" | "직접">("제안");
  const [round, setRound] = useState("1차 면접");
  const [location, setLocation] = useState("본관 7층 면접실 A");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [interviewers, setInterviewers] = useState<string[]>(["m-suhyun"]);
  const [leadId, setLeadId] = useState<string>("m-suhyun");
  const [memberQuery, setMemberQuery] = useState("");
  const [slots, setSlots] = useState<{ date: string; start: string }[]>([
    { date: "", start: "10:00" },
    { date: "", start: "14:00" },
  ]);
  const isRemote = location.includes("화상");

  const proposals = s.proposals.filter(
    (p) => p.applicationId === app.id && p.status !== "취소",
  );

  // 활성 멤버만, 검색어 필터, 팀별 그룹 (면접관 풀 100명+ 스케일 대응)
  const mq = memberQuery.trim().toLowerCase();
  const pool = selectableInterviewers(s).filter(
    (m) => !mq || m.name.toLowerCase().includes(mq) || m.team.toLowerCase().includes(mq),
  );
  const byTeam = new Map<string, typeof pool>();
  for (const m of pool) {
    byTeam.set(m.team, [...(byTeam.get(m.team) ?? []), m]);
  }

  function toggleInterviewer(id: string) {
    const on = interviewers.includes(id);
    const next = on ? interviewers.filter((x) => x !== id) : [...interviewers, id];
    setInterviewers(next);
    // 대표가 빠지면 첫 번째로 승계, 처음 선택되는 사람은 자동 대표
    if (on && leadId === id) setLeadId(next[0] ?? "");
    if (!on && next.length === 1) setLeadId(id);
  }

  function submit() {
    const valid = slots.filter((sl) => sl.date && sl.start);
    if (valid.length === 0) {
      toast.show("최소 1개의 날짜/시간을 입력하세요.");
      return;
    }
    if (interviewers.length === 0) {
      toast.show("면접관을 1명 이상 선택하세요.");
      return;
    }
    const lead = interviewers.includes(leadId) ? leadId : interviewers[0];
    if (mode === "직접") {
      // 첫 번째 입력된 시간으로 바로 확정 (조율 완료된 경우)
      const sl = valid[0];
      hrActions.createInterview(app.id, {
        round,
        date: sl.date,
        start: sl.start,
        end: addHour(sl.start),
        location,
        ...(isRemote && meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}),
        interviewerIds: interviewers,
        leadId: lead,
      });
      toast.show(`${round}을 ${sl.date} ${sl.start}로 확정하고 면접관·지원자에게 안내했습니다.`);
    } else {
      hrActions.proposeInterview(app.id, {
        round,
        location,
        interviewerIds: interviewers,
        leadId: lead,
        slots: valid.map((sl) => ({
          date: sl.date,
          start: sl.start,
          end: addHour(sl.start),
        })),
      });
    }
    setOpen(false);
    setMeetingUrl("");
    setSlots([
      { date: "", start: "10:00" },
      { date: "", start: "14:00" },
    ]);
  }

  return (
    <Panel
      title="면접 일정 조율"
      action={
        <button
          onClick={() => setOpen(!open)}
          className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-ink-700"
        >
          {open ? "닫기" : "일정 제안"}
        </button>
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      {open && (
        <div className="rounded-xl border border-accent bg-accent-soft/40 p-4">
          {/* 모드: 제안(지원자 선택) vs 직접 확정(조율 완료) */}
          <div className="mb-3 flex gap-1 rounded-full bg-pure p-1">
            {(["제안", "직접"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-[0.75rem] font-bold transition-colors",
                  mode === m ? "bg-ink text-paper" : "text-muted hover:text-ink",
                )}
              >
                {m === "제안" ? "시간 제안 (지원자 선택)" : "직접 확정 (조율 완료)"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="h-9 rounded-full border border-line bg-pure px-3.5 text-[0.8rem] font-medium focus:border-accent focus:outline-none"
            >
              {["1차 면접", "2차 면접", "처우 미팅"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 rounded-full border border-line bg-pure px-3.5 text-[0.8rem] font-medium focus:border-accent focus:outline-none"
            >
              {[
                "본관 7층 면접실 A",
                "본관 7층 면접실 B",
                "화상 면접 (Google Meet)",
              ].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          {isRemote && (
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="화상 회의 링크 (예: https://meet.google.com/xxx) — 면접관 포털에 입장 버튼으로 표시"
              className="mt-2.5 h-9 w-full rounded-full border border-line bg-pure px-3.5 text-[0.78rem] focus:border-accent focus:outline-none"
            />
          )}
          {/* 면접관 선택 — 검색 + 팀 그룹, ★ 클릭으로 대표 지정 */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="면접관 검색 (이름·팀)"
                className="h-8 w-44 rounded-full border border-line bg-pure px-3.5 text-[0.75rem] focus:border-accent focus:outline-none"
              />
              <span className="text-[0.68rem] text-muted">
                선택 {interviewers.length}명
                {interviewers.includes(leadId) && ` · 대표 ★${memberName(s, leadId)}`}
              </span>
            </div>
            <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
              {[...byTeam.entries()].map(([team, members]) => (
                <div key={team} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-20 shrink-0 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-muted-ink">
                    {team}
                  </span>
                  {members.map((m) => {
                    const on = interviewers.includes(m.id);
                    const isLead = on && leadId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => (on ? undefined : toggleInterviewer(m.id))}
                        className={cn(
                          "group flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.75rem] font-semibold transition-colors",
                          isLead
                            ? "border-ink bg-ink text-paper"
                            : on
                              ? "border-accent bg-accent-soft text-accent-ink"
                              : "border-line bg-pure text-muted hover:text-ink",
                        )}
                      >
                        {on && (
                          <span
                            role="button"
                            title={isLead ? "대표 면접관" : "대표로 지정"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadId(m.id);
                            }}
                            className={cn(!isLead && "opacity-40 hover:opacity-100")}
                          >
                            ★
                          </span>
                        )}
                        <span onClick={() => on && toggleInterviewer(m.id)}>
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {pool.length === 0 && (
                <p className="text-[0.72rem] text-muted">검색 결과가 없습니다.</p>
              )}
            </div>
            <p className="mt-1.5 text-[0.65rem] leading-snug text-muted-ink">
              ★ = 대표 면접관 — 면접 후 배석 평가를 취합해 패널 종합 의견을
              작성합니다. 선택된 이름을 다시 클릭하면 제외됩니다.
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {(mode === "직접" ? slots.slice(0, 1) : slots).map((sl, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 font-mono text-[0.68rem] text-muted">
                  {mode === "직접" ? "일시" : `${i + 1}.`}
                </span>
                <input
                  type="date"
                  value={sl.date}
                  onChange={(e) =>
                    setSlots(
                      slots.map((x, xi) =>
                        xi === i ? { ...x, date: e.target.value } : x,
                      ),
                    )
                  }
                  className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.8rem] focus:border-accent focus:outline-none"
                />
                <input
                  type="time"
                  value={sl.start}
                  onChange={(e) =>
                    setSlots(
                      slots.map((x, xi) =>
                        xi === i ? { ...x, start: e.target.value } : x,
                      ),
                    )
                  }
                  className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.8rem] focus:border-accent focus:outline-none"
                />
                {slots.length > 1 && (
                  <button
                    onClick={() => setSlots(slots.filter((_, xi) => xi !== i))}
                    aria-label="후보 삭제"
                    className="text-muted-ink hover:text-ink"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {mode === "제안" && slots.length < 4 && (
              <button
                onClick={() => setSlots([...slots, { date: "", start: "16:00" }])}
                className="w-fit text-[0.78rem] font-semibold text-accent-ink hover:underline"
              >
                + 시간 후보 추가
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[0.7rem] leading-snug text-muted">
              {mode === "제안" ? (
                <>
                  지원자가 마이페이지에서 시간을 고르면
                  <br />
                  자동 확정되고 면접관에게 통지됩니다.
                </>
              ) : (
                <>
                  선택 없이 즉시 확정됩니다.
                  <br />
                  면접관·지원자에게 확정 안내가 나갑니다.
                </>
              )}
            </p>
            <button
              onClick={submit}
              className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
            >
              {mode === "제안" ? "제안 발송" : "바로 확정"}
            </button>
          </div>
        </div>
      )}

      {proposals.length === 0 && !open && (
        <EmptyState text="시간 후보를 보내면 지원자가 직접 선택해 자동 확정됩니다." />
      )}
      {proposals.map((pr) => (
        <div
          key={pr.id}
          className={cn(
            "rounded-xl border p-3.5",
            pr.status === "대기" ? "border-accent bg-pure" : "border-line bg-pure",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-ink">{pr.round}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
                pr.status === "대기" && "bg-accent text-ink",
                pr.status === "확정" && "bg-signal/12 text-signal",
              )}
            >
              {pr.status === "대기" ? "지원자 응답 대기" : "확정됨"}
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {pr.slots.map((sl, i) => {
              const chosen =
                pr.confirmedSlot &&
                pr.confirmedSlot.date === sl.date &&
                pr.confirmedSlot.start === sl.start;
              return (
                <span
                  key={i}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 font-mono text-[0.72rem] font-semibold",
                    chosen
                      ? "bg-signal text-white"
                      : "bg-paper-dim text-muted",
                  )}
                >
                  {sl.date.slice(5).replace("-", ".")} {sl.start}
                </span>
              );
            })}
          </div>
          {pr.status === "대기" && (
            <button
              onClick={() => hrActions.cancelProposal(pr.id)}
              className="mt-2.5 text-[0.72rem] font-semibold text-muted hover:text-ink"
            >
              제안 취소
            </button>
          )}
        </div>
      ))}
    </Panel>
  );
}

// ── 워크스페이스 이메일 대화 패널 ───────────────────────────────

function EmailThreadPanel({ app, s }: { app: HrApplication; s: HrState }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const emails = [...(app.emails ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const wsEmail = s.settings.workspaceEmail ?? "recruit@arco.example";
  const connected = s.settings.mailInboundConnected;

  useEffect(() => {
    // 상세를 열면 수신 메일 확인 처리
    if ((app.emails ?? []).some((e) => e.direction === "수신" && !e.read)) {
      hrActions.markEmailsRead(app.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  function send() {
    if (!subject.trim() && !body.trim()) return;
    const subj = subject.trim() || "(제목 없음)";
    hrActions.sendApplicantEmail(app.id, subj, body.trim());
    setSubject("");
    setBody("");
    toast.show("이메일을 발신했습니다.");
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <Mail className="size-4 text-accent-ink" /> 이메일 대화
        </span>
      }
      action={
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-bold",
            connected ? "bg-signal/12 text-signal" : "bg-paper-dim text-muted",
          )}
          title="워크스페이스 수신 이메일 연동 상태"
        >
          {wsEmail} · {connected ? "수신 연동됨" : "수신 대기"}
        </span>
      }
      bodyClassName="flex flex-col gap-3 p-4"
    >
      {/* 스레드 */}
      <div className="flex max-h-80 flex-col gap-2.5 overflow-y-auto">
        {emails.length === 0 && (
          <EmptyState text="아직 주고받은 이메일이 없습니다. 아래에서 첫 메일을 보내보세요." />
        )}
        {emails.map((e) => {
          const outbound = e.direction === "발신";
          return (
            <div
              key={e.id}
              className={cn(
                "max-w-[85%] rounded-xl p-3",
                outbound
                  ? "self-end rounded-br-sm bg-accent-soft"
                  : "self-start rounded-bl-sm border border-line bg-pure",
              )}
            >
              <p className="flex items-center gap-1.5 text-[0.68rem] font-bold text-muted">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5",
                    outbound ? "bg-accent text-ink" : "bg-ink text-paper",
                  )}
                >
                  {e.direction}
                </span>
                {e.subject}
              </p>
              <p className="mt-1.5 whitespace-pre-line text-[0.85rem] leading-relaxed text-ink">
                {e.body}
              </p>
              <p className="mt-1.5 font-mono text-[0.6rem] text-muted-ink">
                {outbound ? e.from : e.from} · {fmtDateTime(e.at)}
              </p>
            </div>
          );
        })}
      </div>

      {/* 작성 */}
      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="제목"
          className="h-9 rounded-lg border border-line bg-pure px-3 text-[0.82rem] focus:border-accent focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="메일 내용을 입력하세요"
          rows={3}
          className="rounded-lg border border-line bg-pure p-3 text-[0.85rem] leading-relaxed focus:border-accent focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              hrActions.receiveInboundEmail(app.id, {
                subject: emails.length
                  ? `RE: ${emails[emails.length - 1].subject}`
                  : "문의드립니다",
                body: "안녕하세요, 회신 확인했습니다. 안내해 주신 내용대로 진행하겠습니다. 감사합니다.",
              })
            }
            className="text-[0.72rem] font-semibold text-muted hover:text-ink"
            title="데모: 지원자 회신을 시뮬레이션합니다 (운영에서는 수신 웹훅이 처리)"
          >
            ↩ 지원자 회신 시뮬레이션
          </button>
          <button
            onClick={send}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.8rem] font-bold text-paper transition-colors hover:bg-ink-700"
          >
            <Send className="size-3.5" /> 발신
          </button>
        </div>
        {!connected && (
          <p className="font-mono text-[0.6rem] leading-relaxed text-muted-ink">
            * 현재는 목업입니다. 설정에서 워크스페이스 이메일 수신을 연동하면
            지원자 실제 회신이 이 스레드로 자동 수신됩니다.
          </p>
        )}
      </div>
    </Panel>
  );
}

export function ApplicantDetail({ id }: { id: string }) {
  const s = useHrState();
  const router = useRouter();
  const app = s.applications.find((a) => a.id === id);

  const [comment, setComment] = useState("");
  const [templateId, setTemplateId] = useState(s.templates[0]?.id ?? "");
  const [channel, setChannel] = useState<MessageChannel>("이메일");
  const [scheduleAt, setScheduleAt] = useState("");
  /** 발송 문안 초안 — null이면 선택된 템플릿을 변수 치환해 표시 */
  const [msgDraft, setMsgDraft] = useState<{ subject: string; body: string } | null>(null);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalRound, setEvalRound] = useState("서류 평가");
  const [evalDecision, setEvalDecision] = useState<EvaluationDecision>("추천");
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalComment, setEvalComment] = useState("");

  // ── 같은 단계 이전/다음 지원자 (연속 검토 흐름) — 접수순 ────────
  const stageApps = useMemo(() => {
    if (!app) return [] as HrApplication[];
    return s.applications
      .filter((a) => a.stageId === app.stageId)
      .sort(
        (a, b) =>
          a.appliedAt.localeCompare(b.appliedAt) || a.id.localeCompare(b.id),
      );
  }, [s.applications, app]);
  const navIdx = stageApps.findIndex((a) => a.id === id);
  const prevApp = navIdx > 0 ? stageApps[navIdx - 1] : undefined;
  const nextApp =
    navIdx >= 0 && navIdx < stageApps.length - 1
      ? stageApps[navIdx + 1]
      : undefined;

  // ←/→ 키로 이전/다음 지원자 이동 (입력 중에는 무시)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
          el.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft" && prevApp)
        router.push(`/hr/applicants/${prevApp.id}`);
      if (e.key === "ArrowRight" && nextApp)
        router.push(`/hr/applicants/${nextApp.id}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevApp, nextApp, router]);

  if (!app) {
    return (
      <div className="mx-auto max-w-xl py-20">
        <EmptyState text="지원서를 찾을 수 없습니다." />
        <div className="mt-4 text-center">
          <Link
            href="/hr/applicants"
            className="text-sm font-semibold text-accent-ink hover:underline"
          >
            ← 지원자 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const candidate = s.candidates.find((c) => c.id === app.candidateId);
  const job = s.jobs.find((j) => j.id === app.jobId);
  const stage = stageOf(s, app.stageId);
  const interviews = s.interviews.filter((iv) => iv.applicationId === app.id);
  const flowStages = [...s.stages]
    .filter((st) => st.kind !== "rejected")
    .sort((a, b) => a.order - b.order);
  const timeline = [...app.activities].sort((a, b) => b.at.localeCompare(a.at));

  // ── 의사결정 지표 ──────────────────────────────────────────────
  const allScores = app.evaluations.flatMap((ev) => ev.scores.map((sc) => sc.score));
  const avgRating =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;
  const nextStage = flowStages.find((st) => st.order === (stage?.order ?? -1) + 1);
  const interviews0 = s.interviews.filter((iv) => iv.applicationId === app.id);
  const nextInterview = interviews0.find((iv) => iv.status === "예정");
  const pendingEval = interviews0.some((iv) => iv.status === "평가대기");
  const isDup = findDuplicateGroups(s).some((g) =>
    g.candidateIds.includes(app.candidateId),
  );

  // ── 가드 액션 (확인 모달 → 실행 → 토스트/되돌리기) ────────────
  async function moveWithGuard(targetId: string) {
    const target = s.stages.find((st) => st.id === targetId);
    if (!target || target.id === app!.stageId) return;
    const risky = target.kind === "hired" || target.kind === "rejected";
    if (risky) {
      const ok = await confirmAction({
        title:
          target.kind === "hired"
            ? `${candidate?.name} 님을 최종 합격 처리할까요?`
            : `${candidate?.name} 님을 불합격 처리할까요?`,
        facts: [
          { label: "지원자", value: candidate?.name ?? "" },
          { label: "공고", value: job?.title ?? "" },
          { label: "단계 변경", value: `${stage?.name} → ${target.name}` },
          {
            label: "지원자 공개",
            value: target.visibleToCandidate ? "공개됨" : "비공개",
          },
          {
            label: "자동 알림",
            value:
              s.settings.notifyOnStageChange && target.visibleToCandidate
                ? "메일 발송됨"
                : "발송 안 함",
          },
        ],
        confirmLabel: target.kind === "hired" ? "합격 처리" : "불합격 처리",
        danger: target.kind === "rejected",
      });
      if (!ok) return;
    }
    hrActions.moveStage(app!.id, targetId);
  }

  async function rejectWithGuard() {
    const ok = await confirmAction({
      title: `${candidate?.name} 님을 불합격 처리할까요?`,
      lines: ["불합격 사유는 내부 기록용이며 지원자에게 자동 공개되지 않습니다."],
      facts: [
        { label: "지원자", value: candidate?.name ?? "" },
        { label: "공고", value: job?.title ?? "" },
        { label: "단계 변경", value: `${stage?.name} → 불합격` },
      ],
      confirmLabel: "불합격 처리",
      danger: true,
    });
    if (!ok) return;
    const reason = prompt("불합격 사유를 입력하세요 (선택)") ?? "";
    hrActions.moveStage(app!.id, "rejected", reason || undefined);
  }

  function addToTalent() {
    hrActions.addTalent({
      name: candidate?.name ?? "",
      role: job ? job.title.replace(/^\[[^\]]*\]\s*/, "") : "",
      tags: candidate?.tags ?? [],
      addedAt: todayStr(),
      expiresAt: futureStr(s.settings.retentionYears),
      source: `지원 이력 (${job?.title.replace(/^\[[^\]]*\]\s*/, "")})`,
      note: "지원자 상세에서 등록",
      lastApplied: job?.title,
    });
  }

  function submitEvaluation() {
    hrActions.addEvaluation(app!.id, {
      round: evalRound,
      decision: evalDecision,
      scores: SCORE_ITEMS.map((item) => ({
        item,
        score: evalScores[item] ?? 3,
      })),
      comment: evalComment,
    });
    setEvalOpen(false);
    setEvalScores({});
    setEvalComment("");
  }

  // ── 발송 문안: 템플릿 변수 자동 치환 + 발송 전 수정 가능 ────────
  // {{기한}}·{{링크}}는 살아있는 필기시험 세션이 있으면 자동으로 채워진다.
  const liveExam = examSessionsOfApp(s, app.id).find(
    (x) => x.status === "발급" || x.status === "진행중",
  );
  const upcomingIv = s.interviews.find(
    (iv) => iv.applicationId === app.id && iv.status === "예정",
  );
  function fillVars(text: string): string {
    return text
      .replaceAll("{{이름}}", candidate?.name ?? "")
      .replaceAll("{{공고명}}", job?.title ?? "")
      .replaceAll(
        "{{기한}}",
        liveExam ? liveExam.expiresAt.slice(0, 10) : "{{기한}}",
      )
      .replaceAll("{{링크}}", liveExam ? `/exam/${liveExam.token}` : "{{링크}}")
      .replaceAll(
        "{{일시}}",
        upcomingIv ? `${upcomingIv.date} ${upcomingIv.start}` : "{{일시}}",
      )
      .replaceAll("{{장소}}", upcomingIv ? upcomingIv.location : "{{장소}}");
  }
  const msgTpl = s.templates.find((t) => t.id === templateId);
  const msgSubject = msgDraft?.subject ?? fillVars(msgTpl?.subject ?? "");
  const msgBody = msgDraft?.body ?? fillVars(msgTpl?.body ?? "");
  /** 치환되지 않고 남은 변수 — 발송 전 경고 표시 */
  const unresolvedVars = [
    ...new Set(`${msgSubject}\n${msgBody}`.match(/{{[^}]+}}/g) ?? []),
  ];

  async function sendTemplate() {
    if (!msgTpl) return;
    const scheduled = Boolean(scheduleAt);
    const risky = msgTpl.kind === "불합격" || msgTpl.kind === "최종합격";
    const ok = await confirmAction({
      title: scheduled ? "예약 발송하시겠어요?" : "메시지를 발송하시겠어요?",
      lines: [
        msgBody.length > 200 ? msgBody.slice(0, 200) + "…" : msgBody,
        ...(unresolvedVars.length > 0
          ? [`⚠ 치환되지 않은 변수가 그대로 발송됩니다: ${unresolvedVars.join(", ")}`]
          : []),
      ],
      facts: [
        { label: "수신자", value: `${candidate?.name} (${candidate?.email})` },
        { label: "채널", value: channel },
        { label: "제목", value: msgSubject },
        scheduled
          ? { label: "예약 시각", value: scheduleAt.replace("T", " ") }
          : { label: "발송", value: "즉시" },
      ],
      confirmLabel: scheduled ? "예약" : "발송",
      danger: risky || unresolvedVars.length > 0,
      irreversible: !scheduled,
    });
    if (!ok) return;
    hrActions.sendMessage(app!.id, msgSubject, msgTpl.kind, {
      channel,
      body: msgBody,
      ...(scheduleAt ? { scheduledAt: scheduleAt } : {}),
    });
    setScheduleAt("");
    setMsgDraft(null);
    toast.show(scheduled ? "메시지를 예약했습니다." : "메시지를 발송했습니다.");
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/hr/applicants"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" /> 지원자 목록
        </Link>

        {/* 같은 단계 연속 검토 — 이전/다음 (키보드 ←/→) */}
        {stageApps.length > 1 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[0.75rem] font-semibold text-muted">
              {stage?.name}{" "}
              <span className="font-mono text-muted-ink">
                {navIdx + 1}/{stageApps.length}
              </span>
            </span>
            <button
              onClick={() => prevApp && router.push(`/hr/applicants/${prevApp.id}`)}
              disabled={!prevApp}
              title={
                prevApp
                  ? `이전 지원자 (키보드 ←) — ${s.candidates.find((c) => c.id === prevApp.candidateId)?.name ?? ""}`
                  : "이 단계의 첫 지원자입니다"
              }
              className="flex h-8 items-center gap-1 rounded-full border border-line bg-pure px-3 text-[0.75rem] font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-35"
            >
              <ChevronLeft className="size-3.5" /> 이전
            </button>
            <button
              onClick={() => nextApp && router.push(`/hr/applicants/${nextApp.id}`)}
              disabled={!nextApp}
              title={
                nextApp
                  ? `다음 지원자 (키보드 →) — ${s.candidates.find((c) => c.id === nextApp.candidateId)?.name ?? ""}`
                  : "이 단계의 마지막 지원자입니다"
              }
              className="flex h-8 items-center gap-1 rounded-full border border-line bg-pure px-3 text-[0.75rem] font-bold text-ink transition-colors hover:border-line-strong disabled:opacity-35"
            >
              다음 <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* header */}
      <div className="surface-card rounded-card p-6 shadow-lift">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={candidate?.name ?? "?"} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-extrabold tracking-tight">
                {candidate?.name}
              </h2>
              <StageBadge stage={stage} />
              <button
                onClick={() => hrActions.toggleStar(app.id)}
                aria-label="주요 후보 표시"
              >
                <Star
                  className={cn(
                    "size-5 transition-all hover:scale-110",
                    app.starred
                      ? "fill-accent text-accent"
                      : "fill-transparent text-line-strong hover:text-accent",
                  )}
                />
              </button>
            </div>
            <p className="mt-1 text-sm font-medium text-accent-ink">
              {job?.title}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.82rem] text-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" /> {candidate?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" /> {candidate?.phone}
              </span>
              <span className="font-mono text-xs">
                접수 {fmtDate(app.appliedAt)} · {candidate?.source}
              </span>
              <span
                className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[0.7rem] font-semibold text-muted"
                title="수험번호"
              >
                수험번호 {applicantNo(s, app.id)}
              </span>
              {candidate && (
                <CandidateEditButton candidate={candidate} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate?.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-paper-dim px-2.5 py-1 text-[0.7rem] font-semibold text-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
          <MatchRing score={app.ai.matchScore} size={72} />
        </div>

        {/* Decision facts — 3초 안에 판단 정보 파악 */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "현재 단계", value: stage?.name ?? "-" },
            { label: "AI 매치", value: `${app.ai.matchScore}점` },
            {
              label: "평가 평균",
              value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : "미평가",
            },
            {
              label: "면접",
              value: pendingEval
                ? "평가 대기"
                : nextInterview
                  ? `${nextInterview.date.slice(5).replace("-", ".")} 예정`
                  : "없음",
            },
            { label: "중복 지원", value: isDup ? "의심" : "없음" },
            {
              label: "보관 기한",
              value: `${s.settings.retentionYears}년`,
            },
          ].map((f) => (
            <div key={f.label} className="rounded-lg bg-paper px-3 py-2">
              <p className="text-[0.62rem] text-muted-ink">{f.label}</p>
              <p
                className={cn(
                  "mt-0.5 text-[0.85rem] font-bold tracking-tight",
                  f.label === "중복 지원" && isDup
                    ? "text-accent-ink"
                    : "text-ink",
                )}
              >
                {f.value}
              </p>
            </div>
          ))}
        </div>

        {/* Next Best Action — 추천 다음 액션 */}
        {stage?.kind === "active" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft/50 px-4 py-3">
            <span className="kicker text-accent-ink">추천 다음 액션</span>
            {pendingEval ? (
              <span className="text-[0.85rem] font-semibold text-ink">
                면접이 끝났습니다 — 평가를 먼저 확인하세요.
              </span>
            ) : nextStage ? (
              <button
                onClick={() => moveWithGuard(nextStage.id)}
                className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.82rem] font-bold text-paper transition-colors hover:bg-ink-700"
              >
                {nextStage.name}(으)로 이동
                {app.ai.matchScore >= 80 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6rem] text-ink">
                    적합도 높음
                  </span>
                )}
              </button>
            ) : null}
            {isDup && (
              <Link
                href="/hr/applicants"
                className="rounded-full border border-accent bg-pure px-4 py-2 text-[0.82rem] font-bold text-accent-ink"
              >
                중복 지원 검토
              </Link>
            )}
          </div>
        )}

        {/* stage stepper */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
            전형 단계 이동
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {flowStages.map((st, i) => {
              const current = st.id === app.stageId;
              const passed =
                stage && stage.kind !== "rejected"
                  ? st.order < (stage?.order ?? 0)
                  : false;
              return (
                <span key={st.id} className="flex items-center gap-2">
                  {i > 0 && <span className="h-px w-3 bg-line-strong" />}
                  <button
                    onClick={() => moveWithGuard(st.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[0.78rem] font-semibold tracking-tight transition-all",
                      current &&
                        (st.kind === "hired"
                          ? "border-signal bg-signal text-white"
                          : "border-ink bg-ink text-paper"),
                      !current &&
                        passed &&
                        "border-accent-soft bg-accent-soft text-accent-ink hover:border-accent",
                      !current &&
                        !passed &&
                        "border-line bg-pure text-muted hover:border-ink hover:text-ink",
                    )}
                  >
                    {st.name}
                  </button>
                </span>
              );
            })}
            <span className="mx-1 h-4 w-px bg-line-strong" />
            <button
              onClick={rejectWithGuard}
              className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.78rem] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
            >
              <UserX className="size-3.5" /> 불합격 처리
            </button>
            <button
              onClick={addToTalent}
              className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.78rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
            >
              <FolderHeart className="size-3.5" /> 인재풀 등록
            </button>
          </div>
          {app.rejectReason && (
            <p className="mt-3 rounded-lg bg-paper-dim px-3.5 py-2.5 text-[0.8rem] text-muted">
              불합격 사유: {app.rejectReason}
            </p>
          )}
          {/* 철회 / 개인정보 파기 — 지원자 요청·GDPR 대응 */}
          {candidate && (
            <DangerZone app={app} candidate={candidate} />
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* ── left: 지원서 + AI + 평가 ── */}
        <div className="flex flex-col gap-6 xl:col-span-3">
          {/* AI insight */}
          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-accent-ink" /> AI 이력서 분석
              </span>
            }
          >
            <p className="text-[0.92rem] leading-relaxed text-ink">
              {app.ai.summary}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-signal/6 p-4">
                <p className="text-[0.72rem] font-bold uppercase tracking-wider text-signal">
                  강점
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {app.ai.strengths.map((t) => (
                    <li
                      key={t}
                      className="flex items-start gap-2 text-[0.85rem] leading-snug text-ink"
                    >
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-signal" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-paper-dim p-4">
                <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted">
                  확인 필요
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {app.ai.concerns.length === 0 && (
                    <li className="text-[0.85rem] text-muted">
                      특이 사항 없음
                    </li>
                  )}
                  {app.ai.concerns.map((t) => (
                    <li
                      key={t}
                      className="flex items-start gap-2 text-[0.85rem] leading-snug text-ink"
                    >
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-muted" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 font-mono text-[0.62rem] text-muted-ink">
              * 데모용 목업 분석입니다. 실서비스에서는 LLM이 이력서 원문을
              분석합니다.
            </p>
          </Panel>

          {/* AI Phase 2 — 자소서 진위 검토 + 면접 인텔리전스 */}
          <AuthenticityPanel coverLetter={candidate?.coverLetter ?? ""} />
          <InterviewIntelPanel app={app} />

          {/* 지원서 */}
          <Panel title="지원서">
            <div className="flex flex-col gap-6">
              <section>
                <h4 className="mb-2.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                  경력
                </h4>
                <div className="flex flex-col gap-3">
                  {candidate?.experiences.map((ex) => (
                    <div
                      key={ex.company + ex.period}
                      className="rounded-xl border border-line bg-pure p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-bold tracking-tight text-ink">
                          {ex.company}{" "}
                          <span className="font-medium text-muted">
                            · {ex.role}
                          </span>
                        </p>
                        <p className="font-mono text-xs text-muted">
                          {ex.period}
                        </p>
                      </div>
                      <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">
                        {ex.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="mb-2.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                  학력
                </h4>
                <div className="flex flex-col gap-2">
                  {candidate?.educations.map((ed) => (
                    <div
                      key={ed.school + ed.period}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-line bg-pure px-4 py-3"
                    >
                      <p className="text-[0.9rem] font-semibold text-ink">
                        {ed.school}{" "}
                        <span className="font-medium text-muted">
                          {ed.major} · {ed.status}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {ed.period}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="mb-2.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                  자기소개
                </h4>
                <p className="rounded-xl bg-paper p-4 text-[0.9rem] leading-relaxed text-ink">
                  {candidate?.coverLetter}
                </p>
              </section>
              <section className="flex flex-wrap items-center gap-2">
                {candidate?.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-2 text-[0.8rem] font-semibold text-accent-ink transition-colors hover:bg-accent hover:text-ink"
                  >
                    <Link2 className="size-3.5" /> 포트폴리오
                  </a>
                )}
                {candidate?.files.map((f) => (
                  <span
                    key={f.name}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-pure px-3.5 py-2 text-[0.8rem] font-medium text-ink"
                  >
                    <FileText className="size-3.5 text-accent-ink" /> {f.name}
                    <span className="font-mono text-[0.65rem] text-muted-ink">
                      {f.size}
                    </span>
                  </span>
                ))}
              </section>
            </div>
          </Panel>

          {/* 평가 */}
          <Panel
            title={`평가 (${app.evaluations.length})`}
            action={
              <button
                onClick={() => setEvalOpen(!evalOpen)}
                className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-ink-700"
              >
                {evalOpen ? "닫기" : "평가 작성"}
              </button>
            }
            bodyClassName="flex flex-col gap-4 p-5"
          >
            {evalOpen && (
              <div className="rounded-xl border border-accent bg-accent-soft/40 p-4">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={evalRound}
                    onChange={(e) => setEvalRound(e.target.value)}
                    className="h-9 rounded-full border border-line bg-pure px-3.5 text-[0.8rem] font-medium focus:border-accent focus:outline-none"
                  >
                    {["서류 평가", "필기 평가", "1차 면접", "2차 면접"].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      ),
                    )}
                  </select>
                  <div className="flex gap-1.5">
                    {DECISIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setEvalDecision(d)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[0.75rem] font-bold transition-colors",
                          evalDecision === d
                            ? "border-ink bg-ink text-paper"
                            : "border-line bg-pure text-muted hover:text-ink",
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {SCORE_ITEMS.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-lg bg-pure px-3.5 py-2.5"
                    >
                      <span className="text-[0.82rem] font-semibold text-ink">
                        {item}
                      </span>
                      <Stars
                        value={evalScores[item] ?? 0}
                        onChange={(v) =>
                          setEvalScores((prev) => ({ ...prev, [item]: v }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <textarea
                  value={evalComment}
                  onChange={(e) => setEvalComment(e.target.value)}
                  placeholder="평가 코멘트를 남겨주세요"
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-line bg-pure p-3.5 text-sm leading-relaxed focus:border-accent focus:outline-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={submitEvaluation}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
                  >
                    평가 제출
                  </button>
                </div>
              </div>
            )}

            {/* 패널 종합 의견 — 대표 면접관의 결론 (개별 평가보다 우선 노출) */}
            {interviews0
              .filter((iv) => iv.panelSummary)
              .map((iv) => (
                <div
                  key={`ps-${iv.id}`}
                  className="rounded-xl border-2 border-ink/80 bg-pure p-4"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-ink px-2.5 py-1 text-[0.65rem] font-bold text-paper">
                      패널 결론
                    </span>
                    <span className="font-bold tracking-tight text-ink">
                      {memberName(s, iv.panelSummary!.byId)}
                      <span className="ml-1.5 text-[0.72rem] font-semibold text-muted">
                        대표 면접관
                      </span>
                    </span>
                    <span className="rounded-full bg-paper-dim px-2.5 py-0.5 text-[0.7rem] font-semibold text-muted">
                      {iv.round}
                    </span>
                    <DecisionBadge decision={iv.panelSummary!.decision} />
                    <span className="ml-auto font-mono text-[0.65rem] text-muted-ink">
                      {fmtDate(iv.panelSummary!.at)}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.88rem] leading-relaxed text-ink">
                    {iv.panelSummary!.text}
                  </p>
                  <p className="mt-2 text-[0.68rem] text-muted-ink">
                    배석 개별 평가 {app.evaluations.filter((e) => e.round === iv.round).length}건을
                    취합한 결론입니다. 개별 평가는 아래에서 확인하세요.
                  </p>
                </div>
              ))}

            {app.evaluations.length === 0 && !evalOpen && (
              <EmptyState text="아직 등록된 평가가 없습니다." />
            )}
            {app.evaluations.map((ev) => (
              <EvaluationCard key={ev.id} ev={ev} appId={app.id} s={s} />
            ))}
          </Panel>
        </div>

        {/* ── right: 협업 + 커뮤니케이션 + 타임라인 ── */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* 필기시험 — 배정·응시 상태·채점 */}
          <ExamPanel app={app} s={s} />

          {/* 면접 일정 조율 (제안 → 지원자 선택 → 자동 확정) */}
          <SchedulePanel app={app} s={s} />

          {/* 면접 일정 */}
          {interviews.length > 0 && (
            <Panel
              title={
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-accent-ink" /> 면접
                  일정
                </span>
              }
              bodyClassName="flex flex-col gap-2.5 p-4"
            >
              {interviews.map((iv) => (
                <InterviewCard key={iv.id} iv={iv} s={s} />
              ))}
            </Panel>
          )}

          {/* 팀 코멘트 */}
          <Panel
            title={`팀 코멘트 (${app.comments.length})`}
            bodyClassName="flex flex-col gap-3.5 p-4"
          >
            {app.comments.length === 0 && (
              <EmptyState text="첫 코멘트를 남겨보세요. @이름 으로 멘션할 수 있습니다." />
            )}
            {app.comments.map((cm) => (
              <CommentItem key={cm.id} cm={cm} appId={app.id} s={s} />
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) {
                  hrActions.addComment(app.id, comment.trim());
                  setComment("");
                }
              }}
              className="flex gap-2"
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="코멘트 입력…"
                className="h-10 min-w-0 flex-1 rounded-full border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                aria-label="코멘트 등록"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-700"
              >
                <Send className="size-4" />
              </button>
            </form>
          </Panel>

          {/* 워크스페이스 이메일 — 지원자와 양방향 대화 */}
          <EmailThreadPanel app={app} s={s} />

          {/* 지원자 커뮤니케이션 (템플릿 발송 이력) */}
          <Panel
            title={`지원자 알림 이력 (${app.messages.length})`}
            bodyClassName="flex flex-col gap-3 p-4"
          >
            <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-pure p-3.5">
              <div className="flex gap-1">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      "flex-1 rounded-full py-1.5 text-[0.75rem] font-bold transition-colors",
                      channel === ch
                        ? "bg-ink text-paper"
                        : "bg-paper text-muted hover:text-ink",
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    setMsgDraft(null); // 템플릿 변경 → 치환 문안으로 초기화
                  }}
                  className="h-10 min-w-0 flex-1 rounded-full border border-line bg-pure px-3.5 text-[0.8rem] font-medium focus:border-accent focus:outline-none"
                >
                  {s.templates
                    .filter((t) =>
                      ["메일", "문자"].includes(t.templateType ?? "메일"),
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={sendTemplate}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-[0.8rem] font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
                >
                  <Mail className="size-3.5" />
                  {scheduleAt ? "예약" : "발송"}
                </button>
              </div>

              {/* 발송 문안 — 변수 치환 완료본, 발송 전 직접 수정 가능 */}
              <input
                value={msgSubject}
                onChange={(e) =>
                  setMsgDraft({ subject: e.target.value, body: msgBody })
                }
                placeholder="제목"
                className="rounded-lg border border-line bg-paper px-3 py-2 text-[0.78rem] font-semibold focus:border-accent focus:outline-none"
              />
              <textarea
                value={msgBody}
                onChange={(e) =>
                  setMsgDraft({ subject: msgSubject, body: e.target.value })
                }
                rows={5}
                placeholder="본문"
                className="rounded-lg border border-line bg-paper px-3 py-2 text-[0.78rem] leading-relaxed focus:border-accent focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {unresolvedVars.length > 0 ? (
                  <>
                    <span className="text-[0.68rem] font-bold text-amber-700">
                      ⚠ 미치환 변수
                    </span>
                    {unresolvedVars.map((v) => (
                      <span
                        key={v}
                        className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-amber-700"
                      >
                        {v}
                      </span>
                    ))}
                    <span className="text-[0.65rem] text-muted-ink">
                      — 직접 값을 입력하거나 그대로 두면 원문이 발송됩니다
                    </span>
                  </>
                ) : (
                  <span className="text-[0.65rem] text-muted-ink">
                    이름·공고명{liveExam ? "·응시 기한·링크" : ""}이 자동으로
                    채워졌습니다. 발송 전 문안을 수정할 수 있어요.
                  </span>
                )}
                {msgDraft && (
                  <button
                    onClick={() => setMsgDraft(null)}
                    className="ml-auto text-[0.65rem] font-bold text-accent-ink hover:underline"
                  >
                    템플릿 원문으로 되돌리기
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-[0.75rem] font-medium text-muted">
                예약 발송
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-line bg-paper px-2.5 text-[0.75rem] focus:border-accent focus:outline-none"
                />
                {scheduleAt && (
                  <button
                    onClick={() => setScheduleAt("")}
                    className="text-muted-ink hover:text-ink"
                    aria-label="예약 해제"
                  >
                    ✕
                  </button>
                )}
              </label>
            </div>
            <div className="flex flex-col gap-2">
              {[...app.messages].reverse().map((ms) => (
                <div
                  key={ms.id}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5",
                    ms.status === "예약됨"
                      ? "border-dashed border-accent bg-accent-soft/30"
                      : "border-line bg-pure",
                  )}
                >
                  <p className="text-[0.8rem] font-semibold leading-snug text-ink">
                    {ms.subject}
                  </p>
                  {ms.body && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[0.65rem] font-bold text-accent-ink hover:underline">
                        발송 문면 보기
                      </summary>
                      <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-paper px-3 py-2 text-[0.75rem] leading-relaxed text-ink">
                        {ms.body}
                      </p>
                    </details>
                  )}
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[0.62rem] text-muted-ink">
                    <span className="rounded bg-paper-dim px-1.5 py-0.5 font-bold text-muted">
                      {ms.channel ?? "이메일"}
                    </span>
                    {ms.kind} · {ms.status}
                    {ms.status === "예약됨" && ms.scheduledAt
                      ? ` (${ms.scheduledAt.replace("T", " ")} 예정)`
                      : ` · ${fmtDateTime(ms.at)}`}
                    {ms.status === "예약됨" && (
                      <button
                        onClick={() =>
                          hrActions.cancelScheduledMessage(app.id, ms.id)
                        }
                        className="font-sans font-bold text-accent-ink hover:underline"
                      >
                        예약 취소
                      </button>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {/* 활동 타임라인 */}
          <Panel title="활동 타임라인" bodyClassName="p-4">
            <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
              {timeline.map((act) => (
                <li key={act.id} className="relative flex gap-3.5">
                  <span
                    className={cn(
                      "relative z-10 mt-1 size-[11px] shrink-0 rounded-full border-2 border-[#fbfdfe]",
                      act.actor === "system" ? "bg-muted-ink" : "bg-accent",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-[0.82rem] leading-snug text-ink">
                      {act.text}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.62rem] text-muted-ink">
                      {memberName(s, act.actor)} · {fmtDateTime(act.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
