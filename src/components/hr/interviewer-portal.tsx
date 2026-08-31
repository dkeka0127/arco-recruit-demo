"use client";

// ════════════════════════════════════════════════════════════════
//  면접관 포털 — 개인 고정 링크(/interviewer/[token])로 접속.
//  그린하우스/애쉬비의 면접관 경험을 참고한 구성:
//   · 면접 준비 킷 — 후보 프로필 · JD 검증 포인트 · AI 인사이트 ·
//     라운드별 추천 질문 (구조화 면접)
//   · 독립 평가 — 내 평가 제출 전에는 타 면접관 평가 잠금(편향 방지)
//   · 면접 중 메모 — 이 기기에만 저장, 평가 작성 시 코멘트로 이어짐
//   · 캘린더(.ics) 추가 · 화상 면접 원클릭 입장
//  HR 콘솔과 같은 스토어를 읽으므로 Supabase 모드에서는 실시간
//  양방향 공유. 새 알림은 알림함 + 데스크톱 알림(Notification API).
// ════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ShieldCheck,
  CalendarClock,
  CalendarPlus,
  ClipboardCheck,
  Video,
  MapPin,
  Bell,
  BellRing,
  CheckCheck,
  CircleCheck,
  MessageSquare,
  Send,
  ChevronDown,
  BookOpenCheck,
  NotebookPen,
  Lock,
  History,
  Sparkles,
  TriangleAlert,
  GraduationCap,
  Briefcase,
  Link2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  memberName,
  memberByToken,
  stageOf,
} from "@/lib/hr/store";
import type {
  EvaluationDecision,
  Interview,
  InterviewerNotice,
  HrState,
} from "@/lib/hr/types";
import {
  Panel,
  StatCard,
  Avatar,
  EmptyState,
  DecisionBadge,
  StageBadge,
  MatchRing,
  daysAgo,
  dDay,
} from "@/components/hr/ui";
import { ScorecardForm, type ScorecardValue } from "@/components/hr/scorecard-form";
import {
  interviewGuide,
  buildInterviewIcs,
  downloadIcs,
} from "@/lib/hr/interview-kit";

/** 면접 종료 시각이 지났는가 (로컬 시간 기준 — 데모 범위) */
function isEnded(iv: Interview): boolean {
  return new Date(`${iv.date}T${iv.end}:00`).getTime() < Date.now();
}

/** 이 면접에 대한 내 평가가 이미 제출되었는가 */
function hasMyEval(s: HrState, iv: Interview, memberId: string): boolean {
  const app = s.applications.find((a) => a.id === iv.applicationId);
  return (app?.evaluations ?? []).some(
    (e) => e.evaluatorId === memberId && e.round === iv.round,
  );
}

const NOTICE_TONE: Record<InterviewerNotice["kind"], string> = {
  일정조율: "bg-accent-soft text-accent-ink",
  면접확정: "bg-signal/12 text-signal",
  면접취소: "bg-ink/8 text-muted",
  평가요청: "bg-accent text-ink",
};

// ── 데스크톱 알림 권한 (외부 시스템 → useSyncExternalStore) ─────
type NotifPerm = NotificationPermission | "unsupported";
const permListeners = new Set<() => void>();
const subscribePerm = (cb: () => void) => {
  permListeners.add(cb);
  return () => void permListeners.delete(cb);
};
const getPerm = (): NotifPerm =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;
const getServerPerm = (): NotifPerm => "unsupported";
function requestNotifPermission() {
  void Notification.requestPermission().then(() =>
    permListeners.forEach((l) => l()),
  );
}

// ── 패널 종합 의견 작성 (대표 면접관 전용) ───────────────────────

const SUMMARY_DECISIONS: EvaluationDecision[] = ["강력추천", "추천", "보류", "비추천"];

function PanelSummaryForm({
  iv,
  s,
  memberId,
}: {
  iv: Interview;
  s: HrState;
  memberId: string;
}) {
  const [decision, setDecision] = useState<EvaluationDecision>("추천");
  const [text, setText] = useState("");
  const [reminded, setReminded] = useState(false);

  const app = s.applications.find((a) => a.id === iv.applicationId);
  const roundEvals = (app?.evaluations ?? []).filter((e) => e.round === iv.round);
  const submittedIds = new Set(roundEvals.map((e) => e.evaluatorId));
  const missing = iv.interviewerIds.filter((mid) => !submittedIds.has(mid));

  return (
    <div className="mt-4 border-t border-line pt-4">
      {/* 배석 제출 현황 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.78rem] font-bold text-ink">
          배석 평가 {roundEvals.length}/{iv.interviewerIds.length}
        </span>
        {iv.interviewerIds.map((mid) => (
          <span
            key={mid}
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
              submittedIds.has(mid)
                ? "bg-signal/12 text-signal"
                : "bg-paper-dim text-muted",
            )}
          >
            {memberName(s, mid)} {submittedIds.has(mid) ? "✓" : "…"}
          </span>
        ))}
        {missing.length > 0 && (
          <button
            onClick={() => {
              hrActions.remindPanel(iv.id, missing.filter((m) => m !== memberId));
              setReminded(true);
            }}
            disabled={reminded}
            className="ml-auto rounded-full border border-line px-3 py-1 text-[0.68rem] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-50"
          >
            {reminded ? "리마인드 발송됨" : "미제출자 리마인드"}
          </button>
        )}
      </div>

      {/* 개별 평가 요약 */}
      {roundEvals.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {roundEvals.map((ev) => (
            <div key={ev.id} className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[0.78rem]">
              <DecisionBadge decision={ev.decision} />
              <b className="text-ink">{memberName(s, ev.evaluatorId)}</b>
              {ev.comment && (
                <span className="min-w-0 flex-1 truncate text-muted">— {ev.comment}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 종합 판정 + 의견 */}
      <div className="mt-3 flex gap-1.5">
        {SUMMARY_DECISIONS.map((d) => (
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
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="패널 종합 의견 — 배석 평가를 취합한 결론과 근거, 다음 전형에서 확인할 사항을 남겨주세요. 인사팀은 이 의견을 근거로 다음 단계를 결정합니다."
        rows={4}
        className="mt-3 w-full rounded-xl border border-line bg-pure p-4 text-sm leading-relaxed focus:border-accent focus:outline-none"
      />
      <button
        onClick={() => {
          if (text.trim().length < 10) {
            alert("종합 의견을 10자 이상 작성해 주세요.");
            return;
          }
          hrActions.submitPanelSummary(iv.id, memberId, { decision, text: text.trim() });
        }}
        className="mt-3 h-12 w-full rounded-full bg-ink text-[0.95rem] font-bold text-paper transition-all hover:-translate-y-0.5 hover:bg-ink-700"
      >
        패널 결론 제출 — 인사팀에 전달
      </button>
    </div>
  );
}

// ── 면접 중 메모 — 이 기기(localStorage)에만 저장 ────────────────
// 동기화하지 않는 것이 의도: 정제 전 메모는 개인 초안으로 남기고,
// 공유는 평가 제출로 한다. (그린하우스 private notes 대응)

const noteKey = (memberId: string, interviewId: string) =>
  `talent-os-ivnote-${memberId}-${interviewId}`;

function loadNote(memberId: string, interviewId: string): string {
  try {
    return window.localStorage.getItem(noteKey(memberId, interviewId)) ?? "";
  } catch {
    return "";
  }
}
function saveNote(memberId: string, interviewId: string, text: string) {
  try {
    if (text) window.localStorage.setItem(noteKey(memberId, interviewId), text);
    else window.localStorage.removeItem(noteKey(memberId, interviewId));
  } catch {
    // 저장 실패는 무시 (메모는 보조 수단)
  }
}

/** 펼친 뒤에만 마운트되므로 SSR 하이드레이션과 충돌하지 않는다 */
function InterviewNotes({
  memberId,
  interviewId,
}: {
  memberId: string;
  interviewId: string;
}) {
  const [text, setText] = useState(() => loadNote(memberId, interviewId));
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[0.78rem] font-bold text-ink">
        <NotebookPen className="size-3.5 text-accent-ink" /> 면접 중 메모
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          saveNote(memberId, interviewId, e.target.value);
        }}
        placeholder="면접 중 관찰한 것을 자유롭게 — 답변 요지, 근거, 확인 못 한 것"
        rows={4}
        className="mt-2 w-full rounded-xl border border-line bg-pure p-3.5 text-[0.82rem] leading-relaxed focus:border-accent focus:outline-none"
      />
      <p className="mt-1 text-[0.65rem] text-muted-ink">
        이 기기에만 저장됩니다. 평가 작성 시 코멘트에 자동으로 채워집니다.
      </p>
    </div>
  );
}

export function InterviewerPortal({ token }: { token: string }) {
  const s = useHrState();
  const member = memberByToken(s, token);

  // ── 데스크톱 알림 ──────────────────────────────────────────────
  const notifPerm = useSyncExternalStore(subscribePerm, getPerm, getServerPerm);

  const myNotices = useMemo(
    () => s.notices.filter((n) => n.memberId === member?.id),
    [s.notices, member?.id],
  );
  const unread = myNotices.filter((n) => !n.read);

  // 첫 스냅샷의 알림은 조용히 기억만 하고, 이후 "새로 추가된" 알림만
  // 데스크톱 알림으로 띄운다 (같은 브라우저 액션·Realtime 반영 공통).
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!member) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(myNotices.map((n) => n.id));
      return;
    }
    for (const n of myNotices) {
      if (seenIds.current.has(n.id)) continue;
      seenIds.current.add(n.id);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(n.title, { body: n.body, tag: n.id });
      }
    }
  }, [myNotices, member]);

  // ── 인라인 평가/준비킷/코멘트 로컬 상태 ───────────────────────
  const [openEval, setOpenEval] = useState<string | null>(null);
  const [openKit, setOpenKit] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [justSubmitted, setJustSubmitted] = useState<Set<string>>(new Set());
  /** 일정 변경 요청 인라인 폼 — 대상 면접 id + 사유 초안 */
  const [reschedFor, setReschedFor] = useState<string | null>(null);
  const [reschedReason, setReschedReason] = useState("");

  if (!member) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-dim px-6">
        <p className="text-muted">
          유효하지 않은 면접관 링크입니다. 링크가 재발급되었을 수 있으니
          인사팀에 문의해 주세요.
        </p>
      </main>
    );
  }

  const myInterviews = s.interviews
    .filter((iv) => iv.interviewerIds.includes(member.id))
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  // 평가할 면접: 끝났는데(평가대기/완료 포함) 내 평가가 아직 없는 것
  const needsEval = myInterviews.filter(
    (iv) =>
      iv.status !== "취소" &&
      (iv.status === "평가대기" || isEnded(iv)) &&
      !hasMyEval(s, iv, member.id) &&
      !justSubmitted.has(iv.id),
  );
  const upcoming = myInterviews.filter(
    (iv) => iv.status === "예정" && !isEnded(iv),
  );

  // 패널 결론 작성 대상: 내가 대표이고, 면접이 끝났으며, 아직 결론이 없는 것
  const needsSummary = myInterviews.filter(
    (iv) =>
      (iv.leadId ?? iv.interviewerIds[0]) === member.id &&
      iv.status !== "취소" &&
      (iv.status === "평가대기" || iv.status === "완료" || isEnded(iv)) &&
      !iv.panelSummary,
  );

  // 진행 공유: 내가 면접관으로 얽힌 지원서 (최근 업데이트순)
  const sharedApps = [...new Set(myInterviews.map((iv) => iv.applicationId))]
    .map((id) => s.applications.find((a) => a.id === id))
    .filter((a) => a !== undefined)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // 내가 제출한 평가 이력 (전체 지원서 대상, 최신순)
  const myEvalHistory = s.applications
    .flatMap((app) =>
      app.evaluations
        .filter((e) => e.evaluatorId === member.id)
        .map((e) => ({ ...e, applicationId: app.id })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));

  const appOf = (appId: string) => s.applications.find((a) => a.id === appId);
  const candidateOf = (appId: string) =>
    s.candidates.find((c) => c.id === appOf(appId)?.candidateId);
  const jobOf = (appId: string) => s.jobs.find((j) => j.id === appOf(appId)?.jobId);
  const jobTitleOf = (appId: string) =>
    jobOf(appId)?.title.replace(/^\[[^\]]*\]\s*/, "") ?? "";

  function submitEval(iv: Interview, value: ScorecardValue) {
    hrActions.submitEvalViaLink(iv.id, member!.id, { round: iv.round, ...value });
    saveNote(member!.id, iv.id, ""); // 메모는 평가로 옮겨졌으니 비운다
    setJustSubmitted((prev) => new Set(prev).add(iv.id));
    setOpenEval(null);
  }

  function addIcs(iv: Interview) {
    const candidate = candidateOf(iv.applicationId);
    downloadIcs(
      `arco-interview-${iv.date}.ics`,
      buildInterviewIcs(iv, {
        candidateName: candidate?.name ?? "지원자",
        jobTitle: jobTitleOf(iv.applicationId),
      }),
    );
  }

  function InterviewMeta({ iv }: { iv: Interview }) {
    const remote = iv.location.includes("화상");
    return (
      <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted">
        {remote ? <Video className="size-3" /> : <MapPin className="size-3" />}
        {iv.date} {iv.start}–{iv.end} · {iv.location}
      </span>
    );
  }

  /** 면접 준비 킷 — 후보 프로필 · JD 검증 포인트 · 추천 질문 · 메모 */
  function PrepKit({ iv }: { iv: Interview }) {
    const app = appOf(iv.applicationId);
    const candidate = candidateOf(iv.applicationId);
    const job = jobOf(iv.applicationId);
    if (!app || !candidate) return null;
    const guide = interviewGuide(iv.round, job);
    return (
      <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-2">
        {/* 후보 프로필 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <MatchRing score={app.ai.matchScore} size={48} />
            <div className="min-w-0">
              <p className="text-[0.78rem] font-bold text-ink">AI 적합도 요약</p>
              <p className="text-[0.75rem] leading-snug text-muted">{app.ai.summary}</p>
            </div>
          </div>

          {candidate.experiences.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[0.78rem] font-bold text-ink">
                <Briefcase className="size-3.5 text-accent-ink" /> 경력
              </p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {candidate.experiences.map((ex) => (
                  <p key={`${ex.company}${ex.period}`} className="text-[0.78rem] leading-snug">
                    <b className="text-ink">{ex.company}</b>{" "}
                    <span className="text-muted">{ex.role} · {ex.period}</span>
                    {ex.desc && (
                      <span className="block text-[0.72rem] text-muted">{ex.desc}</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {candidate.educations.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[0.78rem] font-bold text-ink">
                <GraduationCap className="size-3.5 text-accent-ink" /> 학력
              </p>
              {candidate.educations.map((ed) => (
                <p key={ed.school} className="mt-1 text-[0.78rem] text-muted">
                  {ed.school} {ed.major} · {ed.status}
                </p>
              ))}
            </div>
          )}

          {candidate.coverLetter && (
            <div>
              <p className="flex items-center gap-1.5 text-[0.78rem] font-bold text-ink">
                <FileText className="size-3.5 text-accent-ink" /> 자기소개서
              </p>
              <p className="mt-1 line-clamp-5 rounded-xl bg-paper px-3.5 py-2.5 text-[0.75rem] leading-relaxed text-muted">
                {candidate.coverLetter}
              </p>
            </div>
          )}

          {candidate.portfolioUrl && (
            <a
              href={candidate.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1.5 text-[0.75rem] font-bold text-accent-ink hover:underline"
            >
              <Link2 className="size-3.5" /> 포트폴리오 열기
            </a>
          )}
        </div>

        {/* 검증 포인트 + 추천 질문 */}
        <div className="flex flex-col gap-3">
          {app.ai.strengths.length > 0 && (
            <div className="rounded-xl bg-signal/8 px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[0.75rem] font-bold text-signal">
                <Sparkles className="size-3.5" /> 강점 (서류 기준)
              </p>
              <ul className="mt-1 list-disc pl-4 text-[0.75rem] leading-relaxed text-ink/80">
                {app.ai.strengths.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {app.ai.concerns.length > 0 && (
            <div className="rounded-xl bg-accent-soft px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[0.75rem] font-bold text-accent-ink">
                <TriangleAlert className="size-3.5" /> 면접에서 검증할 포인트
              </p>
              <ul className="mt-1 list-disc pl-4 text-[0.75rem] leading-relaxed text-ink/80">
                {app.ai.concerns.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {job?.qualifications && job.qualifications.length > 0 && (
            <div>
              <p className="text-[0.78rem] font-bold text-ink">
                이 공고의 자격 요건 — 충족 여부를 확인하세요
              </p>
              <ul className="mt-1 list-disc pl-4 text-[0.75rem] leading-relaxed text-muted">
                {job.qualifications.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-[0.78rem] font-bold text-ink">
              <BookOpenCheck className="size-3.5 text-accent-ink" /> 추천 질문
              <span className="font-normal text-muted-ink">
                — 후보 경력에 맞게 변형해 쓰세요
              </span>
            </p>
            <div className="mt-1.5 flex flex-col gap-2">
              {guide.map((set) => (
                <div key={set.title} className="rounded-xl bg-paper px-3.5 py-2.5">
                  <p className="text-[0.72rem] font-bold text-accent-ink">{set.title}</p>
                  <ul className="mt-1 list-disc pl-4 text-[0.75rem] leading-relaxed text-ink/85">
                    {set.questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <InterviewNotes memberId={member!.id} interviewId={iv.id} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-paper-dim px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker flex items-center gap-2 text-accent-ink">
              <ShieldCheck className="size-4" /> ARCO HR — 면접관 포털
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {member.name}님의 면접 워크스페이스
            </h1>
            <p className="mt-1 text-sm text-muted">
              {member.team} · 배정된 면접과 평가, 진행 상황을 인사팀과 실시간으로
              공유합니다.
            </p>
          </div>
          {notifPerm !== "unsupported" && (
            notifPerm === "granted" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-signal/12 px-3.5 py-2 text-[0.78rem] font-bold text-signal">
                <BellRing className="size-3.5" /> 데스크톱 알림 켜짐
              </span>
            ) : (
              <button
                onClick={requestNotifPermission}
                className="flex items-center gap-1.5 rounded-full border border-line bg-pure px-3.5 py-2 text-[0.78rem] font-bold text-ink transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Bell className="size-3.5" /> 데스크톱 알림 켜기
              </button>
            )
          )}
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="평가할 면접" value={needsEval.length} icon={<ClipboardCheck className="size-4" />} sub="내 평가 미제출" />
          <StatCard label="예정 면접" value={upcoming.length} icon={<CalendarClock className="size-4" />} sub="면접관 배정됨" />
          <StatCard label="진행 공유" value={sharedApps.length} icon={<MessageSquare className="size-4" />} sub="함께 보는 지원자" />
          <StatCard label="새 알림" value={unread.length} icon={<Bell className="size-4" />} sub="미확인 통지" />
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
          {/* ── main column ── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* 패널 결론 작성 — 대표 면접관 전용 */}
            {needsSummary.length > 0 && (
              <Panel
                title={
                  <span className="flex items-center gap-1.5">
                    <ClipboardCheck className="size-4 text-accent-ink" />
                    패널 결론 작성 — 대표 면접관인 면접입니다
                  </span>
                }
                bodyClassName="flex flex-col gap-3 p-4"
              >
                {needsSummary.map((iv) => {
                  const candidate = candidateOf(iv.applicationId);
                  return (
                    <div key={iv.id} className="rounded-xl border-2 border-ink/70 bg-pure p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={candidate?.name ?? "?"} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold tracking-tight text-ink">
                            {candidate?.name}
                            <span className="ml-1.5 rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-bold text-paper">
                              대표 ★
                            </span>
                            <span className="ml-1.5 rounded-full bg-paper-dim px-2 py-0.5 text-[0.62rem] font-bold text-muted">
                              {iv.round}
                            </span>
                          </span>
                          <InterviewMeta iv={iv} />
                        </span>
                      </div>
                      <PanelSummaryForm iv={iv} s={s} memberId={member.id} />
                    </div>
                  );
                })}
              </Panel>
            )}

            {/* 평가할 면접 */}
            {needsEval.length > 0 && (
              <Panel
                title={
                  <span className="flex items-center gap-1.5">
                    <ClipboardCheck className="size-4 text-accent-ink" />
                    평가할 면접 — 제출 즉시 인사팀에 공유됩니다
                  </span>
                }
                bodyClassName="flex flex-col gap-3 p-4"
              >
                {needsEval.map((iv) => {
                  const candidate = candidateOf(iv.applicationId);
                  const open = openEval === iv.id;
                  return (
                    <div key={iv.id} className="rounded-xl border border-accent bg-pure p-4">
                      <button
                        onClick={() => setOpenEval(open ? null : iv.id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <Avatar name={candidate?.name ?? "?"} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold tracking-tight text-ink">
                            {candidate?.name}
                            <span className="ml-1.5 rounded-full bg-paper-dim px-2 py-0.5 text-[0.62rem] font-bold text-muted">
                              {iv.round}
                            </span>
                          </span>
                          <InterviewMeta iv={iv} />
                        </span>
                        <ChevronDown
                          className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
                        />
                      </button>
                      {open && (
                        <div className="mt-4 border-t border-line pt-4">
                          <ScorecardForm
                            defaultComment={loadNote(member.id, iv.id)}
                            onSubmit={(v) => submitEval(iv, v)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </Panel>
            )}

            {/* 예정 면접 */}
            <Panel
              title={
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-accent-ink" /> 예정된 면접
                </span>
              }
              bodyClassName="flex flex-col gap-3 p-4"
            >
              {upcoming.length === 0 && <EmptyState text="예정된 면접이 없습니다." />}
              {upcoming.map((iv) => {
                const candidate = candidateOf(iv.applicationId);
                const d = dDay(iv.date);
                const others = iv.interviewerIds.filter((m) => m !== member.id);
                const isLead = (iv.leadId ?? iv.interviewerIds[0]) === member.id;
                const kitOpen = openKit === iv.id;
                return (
                  <div key={iv.id} className="rounded-xl border border-line bg-pure p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={candidate?.name ?? "?"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold tracking-tight text-ink">
                          {candidate?.name}
                          {isLead && (
                            <span
                              className="ml-1.5 rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-bold text-paper"
                              title="대표 면접관 — 면접 후 패널 종합 의견을 작성합니다"
                            >
                              대표 ★
                            </span>
                          )}
                          <span className="ml-1.5 rounded-full bg-paper-dim px-2 py-0.5 text-[0.62rem] font-bold text-muted">
                            {iv.round}
                          </span>
                        </p>
                        <p className="truncate text-[0.75rem] text-muted">
                          {jobTitleOf(iv.applicationId)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 font-mono text-[0.68rem] font-bold",
                          d <= 1 ? "bg-accent text-ink" : "bg-paper-dim text-muted",
                        )}
                      >
                        {d === 0 ? "오늘" : d === 1 ? "내일" : `D-${d}`}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <InterviewMeta iv={iv} />
                      {others.length > 0 && (
                        <span className="flex items-center gap-1.5 text-[0.7rem] text-muted">
                          공동 면접관
                          <span className="flex -space-x-1.5">
                            {others.map((mid) => (
                              <Avatar key={mid} name={memberName(s, mid)} size="sm" dark className="size-6 text-[0.6rem] ring-2 ring-white" />
                            ))}
                          </span>
                        </span>
                      )}
                    </div>
                    {iv.note && (
                      <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-[0.72rem] leading-snug text-muted">
                        {iv.note}
                      </p>
                    )}
                    {/* actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setOpenKit(kitOpen ? null : iv.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.72rem] font-bold transition-colors",
                          kitOpen
                            ? "bg-ink text-paper"
                            : "bg-accent-soft text-accent-ink hover:bg-accent/30",
                        )}
                      >
                        <BookOpenCheck className="size-3.5" />
                        면접 준비 킷 {kitOpen ? "닫기" : "열기"}
                      </button>
                      <button
                        onClick={() => addIcs(iv)}
                        className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.72rem] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                      >
                        <CalendarPlus className="size-3.5" /> 내 캘린더에 추가
                      </button>
                      {!iv.rescheduleRequest && (
                        <button
                          onClick={() => {
                            setReschedFor(reschedFor === iv.id ? null : iv.id);
                            setReschedReason("");
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[0.72rem] font-bold transition-colors",
                            reschedFor === iv.id
                              ? "border-ink bg-ink text-paper"
                              : "border-line text-muted hover:border-accent hover:text-accent-ink",
                          )}
                        >
                          <CalendarClock className="size-3.5" /> 일정 변경 요청
                        </button>
                      )}
                      {iv.meetingUrl && (
                        <a
                          href={iv.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-700"
                        >
                          <Video className="size-3.5" /> 화상 면접 입장
                        </a>
                      )}
                    </div>
                    {/* 일정 변경 요청 — 대기 상태 표시 */}
                    {iv.rescheduleRequest && (
                      <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-100/60 px-3 py-2 text-[0.72rem] font-semibold text-amber-700">
                        <CalendarClock className="size-3.5 shrink-0" />
                        일정 변경 요청됨 — 인사팀 확인 중입니다
                        {iv.rescheduleRequest.by === member.id &&
                          ` ("${iv.rescheduleRequest.reason}")`}
                      </p>
                    )}
                    {/* 일정 변경 요청 — 사유 입력 폼 */}
                    {reschedFor === iv.id && !iv.rescheduleRequest && (
                      <div className="mt-2.5 flex flex-col gap-2 rounded-xl bg-paper px-3.5 py-3">
                        <textarea
                          value={reschedReason}
                          onChange={(e) => setReschedReason(e.target.value)}
                          rows={2}
                          placeholder="예: 해당 시간에 강의가 있습니다. 오후 4시 이후 가능해요."
                          className="rounded-lg border border-line bg-pure p-2.5 text-[0.78rem] leading-relaxed outline-none focus:border-accent"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const reason = reschedReason.trim();
                              if (!reason) return;
                              const ok = hrActions.requestReschedule(iv.id, member.id, reason);
                              if (ok) setReschedFor(null);
                            }}
                            disabled={!reschedReason.trim()}
                            className={cn(
                              "rounded-full bg-ink px-4 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-700",
                              !reschedReason.trim() && "cursor-not-allowed opacity-50",
                            )}
                          >
                            요청 보내기
                          </button>
                          <button
                            onClick={() => setReschedFor(null)}
                            className="text-[0.72rem] font-semibold text-muted hover:text-ink"
                          >
                            취소
                          </button>
                          <span className="text-[0.65rem] text-muted-ink">
                            인사팀 면접 보드·대시보드에 표시됩니다
                          </span>
                        </div>
                      </div>
                    )}
                    {kitOpen && <PrepKit iv={iv} />}
                  </div>
                );
              })}
            </Panel>

            {/* 진행 공유 */}
            <Panel
              title={
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-accent-ink" />
                  진행 공유 — 인사팀과 함께 보는 화면
                </span>
              }
              bodyClassName="flex flex-col gap-3 p-4"
            >
              {sharedApps.length === 0 && (
                <EmptyState text="아직 함께 진행 중인 지원자가 없습니다." />
              )}
              {sharedApps.map((app) => {
                const candidate = candidateOf(app.id);
                const stage = stageOf(s, app.stageId);
                const draft = commentDraft[app.id] ?? "";
                // 독립 평가: 내 평가 제출 전에는 타 면접관 평가를 잠근다
                const iSubmitted = app.evaluations.some(
                  (e) => e.evaluatorId === member.id,
                );
                const visibleEvals = iSubmitted
                  ? app.evaluations
                  : app.evaluations.filter((e) => e.evaluatorId === member.id);
                const lockedCount = app.evaluations.length - visibleEvals.length;
                return (
                  <div key={app.id} className="rounded-xl border border-line bg-pure p-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Avatar name={candidate?.name ?? "?"} size="sm" />
                      <span className="font-bold tracking-tight text-ink">
                        {candidate?.name}
                      </span>
                      <span className="truncate text-[0.75rem] text-muted">
                        {jobTitleOf(app.id)}
                      </span>
                      <span className="ml-auto">
                        <StageBadge stage={stage} />
                      </span>
                    </div>

                    {/* 평가 현황 — 독립 평가 원칙 적용 */}
                    {(visibleEvals.length > 0 || lockedCount > 0) && (
                      <div className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                        {visibleEvals.map((ev) => (
                          <div key={ev.id} className="flex items-center gap-2 text-[0.78rem]">
                            <DecisionBadge decision={ev.decision} />
                            <span className="font-semibold text-ink">
                              {memberName(s, ev.evaluatorId)}
                            </span>
                            <span className="text-muted">{ev.round}</span>
                            {ev.comment && (
                              <span className="min-w-0 flex-1 truncate text-muted">
                                — {ev.comment}
                              </span>
                            )}
                          </div>
                        ))}
                        {lockedCount > 0 && (
                          <p className="flex items-center gap-1.5 rounded-lg bg-paper px-3 py-2 text-[0.72rem] text-muted">
                            <Lock className="size-3.5" />
                            다른 면접관 평가 {lockedCount}건 — 독립적인 판단을
                            위해 내 평가 제출 후 공개됩니다.
                          </p>
                        )}
                      </div>
                    )}

                    {/* 코멘트 스레드 (HR 콘솔과 동일 데이터) */}
                    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                      {app.comments.slice(-3).map((c) => (
                        <p key={c.id} className="text-[0.8rem] leading-relaxed">
                          <b className="text-ink">{memberName(s, c.authorId)}</b>{" "}
                          <span className="text-muted">{c.text}</span>
                          <span className="ml-1.5 font-mono text-[0.62rem] text-muted-ink">
                            {daysAgo(c.at)}
                          </span>
                        </p>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={draft}
                          onChange={(e) =>
                            setCommentDraft((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && draft.trim()) {
                              hrActions.addComment(app.id, draft.trim(), member.id);
                              setCommentDraft((prev) => ({ ...prev, [app.id]: "" }));
                            }
                          }}
                          placeholder="인사팀과 공유할 코멘트 남기기"
                          className="h-10 flex-1 rounded-full border border-line bg-pure px-4 text-[0.82rem] focus:border-accent focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            if (!draft.trim()) return;
                            hrActions.addComment(app.id, draft.trim(), member.id);
                            setCommentDraft((prev) => ({ ...prev, [app.id]: "" }));
                          }}
                          aria-label="코멘트 등록"
                          className="flex size-10 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-ink-700"
                        >
                          <Send className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Panel>
          </div>

          {/* ── side column ── */}
          <div className="flex flex-col gap-6">
            <Panel
              title={
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <Bell className="size-4 text-accent-ink" /> 알림
                    {unread.length > 0 && (
                      <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[0.62rem] font-bold text-ink">
                        {unread.length}
                      </span>
                    )}
                  </span>
                  {unread.length > 0 && (
                    <button
                      onClick={() => hrActions.markNoticesRead(member.id)}
                      className="flex items-center gap-1 text-[0.7rem] font-semibold text-muted hover:text-ink"
                    >
                      <CheckCheck className="size-3.5" /> 모두 읽음
                    </button>
                  )}
                </span>
              }
              bodyClassName="flex flex-col gap-2.5 p-4"
            >
              {myNotices.length === 0 && <EmptyState text="아직 알림이 없습니다." />}
              {myNotices.slice(0, 12).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border p-3.5",
                    n.read ? "border-line/70 bg-paper/60" : "border-accent bg-pure",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.62rem] font-bold",
                        NOTICE_TONE[n.kind],
                      )}
                    >
                      {n.kind}
                    </span>
                    <span className="ml-auto font-mono text-[0.62rem] text-muted-ink">
                      {daysAgo(n.at)}
                    </span>
                    {!n.read && <span className="size-1.5 rounded-full bg-accent" />}
                  </div>
                  <p className="mt-2 text-[0.82rem] font-bold leading-snug tracking-tight text-ink">
                    {n.title}
                  </p>
                  <p className="mt-1 text-[0.75rem] leading-relaxed text-muted">
                    {n.body}
                  </p>
                </div>
              ))}
              {justSubmitted.size > 0 && (
                <p className="flex items-center gap-1.5 rounded-xl bg-signal/8 px-3.5 py-2.5 text-[0.75rem] font-semibold text-signal">
                  <CircleCheck className="size-4" /> 평가 {justSubmitted.size}건이
                  인사팀에 공유되었습니다.
                </p>
              )}
            </Panel>

            {/* 내가 제출한 평가 */}
            <Panel
              title={
                <span className="flex items-center gap-1.5">
                  <History className="size-4 text-accent-ink" /> 내가 제출한 평가
                </span>
              }
              bodyClassName="flex flex-col gap-2.5 p-4"
            >
              {myEvalHistory.length === 0 && (
                <EmptyState text="아직 제출한 평가가 없습니다." />
              )}
              {myEvalHistory.slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-paper/60 px-3.5 py-2.5"
                >
                  <Avatar name={candidateOf(ev.applicationId)?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-bold text-ink">
                      {candidateOf(ev.applicationId)?.name}
                      <span className="ml-1.5 font-normal text-muted">{ev.round}</span>
                    </p>
                    <p className="font-mono text-[0.62rem] text-muted-ink">
                      {daysAgo(ev.at)}
                    </p>
                  </div>
                  <DecisionBadge decision={ev.decision} />
                </div>
              ))}
            </Panel>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[0.62rem] text-muted-ink">
          이 링크는 {member.name}님 전용입니다 — 외부 공유 금지 · 유출 시 인사팀에서
          재발급(기존 링크 즉시 무효화)
        </p>
      </div>
    </main>
  );
}
