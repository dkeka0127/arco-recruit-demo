"use client";

// ════════════════════════════════════════════════════════════════
//  지원 현황 (라이브) — HR 콘솔 스토어와 실시간 연동.
//  인사팀이 /hr 에서 단계를 옮기거나 공개 설정을 바꾸면
//  이 화면이 즉시 바뀐다. (그리팅의 "지원자 상태 공개" 대체)
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import {
  Briefcase,
  FileText,
  ChevronRight,
  Info,
  Inbox,
  CalendarClock,
  CircleCheck,
  MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, Kicker, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { StepTimeline } from "@/components/my/step-timeline";
import { useHrState, hrActions } from "@/lib/hr/store";
import { useMyCandidateIds } from "@/lib/hr/receive";
import { applicantAuth, useApplicantSession } from "@/lib/applicant-auth";
import type { HrApplication, HrState, PipelineStage } from "@/lib/hr/types";
import { fmtDate } from "@/components/hr/ui";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

// 렌더 순수성 규칙 밖 (모듈 스코프)
const nowMs = () => Date.now();

function slotLabel(date: string, start: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}.${d.getDate()} (${WEEKDAY[d.getDay()]}) ${start}`;
}

/** 면접 일정 선택 — HR이 보낸 시간 후보 중 하나를 고르면 자동 확정 */
function ProposalPicker({ app, s }: { app: HrApplication; s: HrState }) {
  const pending = s.proposals.filter(
    (p) => p.applicationId === app.id && p.status === "대기",
  );
  const confirmed = s.proposals.filter(
    (p) => p.applicationId === app.id && p.status === "확정",
  );

  if (pending.length === 0 && confirmed.length === 0) return null;

  return (
    <div className="border-t border-line">
      {pending.map((pr) => (
        <div key={pr.id} className="bg-accent-soft/40 p-6 sm:p-8">
          <p className="flex items-center gap-2 font-bold tracking-tight text-ink">
            <CalendarClock className="size-4 text-accent-ink" />
            {pr.round} 일정을 선택해 주세요
          </p>
          <p className="mt-1 text-sm text-muted">
            가능한 시간을 고르시면 즉시 확정되며, 안내 메일이 발송됩니다. 장소:{" "}
            {pr.location}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {pr.slots.map((sl, i) => (
              <button
                key={i}
                onClick={() => {
                  if (
                    confirm(
                      `${slotLabel(sl.date, sl.start)} ~ ${sl.end}\n이 시간으로 확정할까요?`,
                    )
                  ) {
                    hrActions.confirmProposal(pr.id, i);
                  }
                }}
                className="rounded-full border border-ink/20 bg-pure px-5 py-2.5 text-sm font-semibold tracking-tight text-ink transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:shadow-lift"
              >
                {slotLabel(sl.date, sl.start)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-ink">
            제안된 시간이 모두 어려우시면 회신 메일로 알려주세요.
          </p>
        </div>
      ))}
      {confirmed.map((pr) => (
        <div key={pr.id} className="flex items-start gap-2.5 bg-paper p-6 sm:px-8">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-signal" />
          <p className="text-sm text-ink">
            <b>{pr.round}</b>이 확정되었습니다 —{" "}
            {pr.confirmedSlot &&
              `${slotLabel(pr.confirmedSlot.date, pr.confirmedSlot.start)} ~ ${pr.confirmedSlot.end}`}
            , {pr.location}
          </p>
        </div>
      ))}
    </div>
  );
}

/** 필기시험 응시 안내 — HR이 시험을 배정하면 여기 응시 버튼이 뜬다 */
function ExamInvite({ app, s }: { app: HrApplication; s: HrState }) {
  const sessions = s.examSessions.filter((x) => x.applicationId === app.id);
  const pending = sessions.filter(
    (x) =>
      (x.status === "발급" || x.status === "진행중") &&
      new Date(x.expiresAt).getTime() >= nowMs(),
  );
  const submitted = sessions.filter(
    (x) => x.status === "제출" || x.status === "채점완료",
  );

  if (pending.length === 0 && submitted.length === 0) return null;

  return (
    <div className="border-t border-line">
      {pending.map((ex) => {
        const t = s.examTemplates.find((x) => x.id === ex.templateId);
        return (
          <div key={ex.id} className="bg-accent-soft/40 p-6 sm:p-8">
            <p className="flex items-center gap-2 font-bold tracking-tight text-ink">
              <MonitorPlay className="size-4 text-accent-ink" />
              온라인 필기시험이 배정되었습니다
              {ex.status === "진행중" && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700">
                  응시 중 — 이어서 진행 가능
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t?.title} · {t?.durationMin}분 · 응시 기한{" "}
              {ex.expiresAt.slice(0, 10)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button href={`/exam/${ex.token}`} variant="accent" size="sm" arrow>
                {ex.status === "진행중" ? "이어서 응시하기" : "시험 응시하기"}
              </Button>
              <p className="text-xs text-muted-ink">
                카메라·마이크·화면 공유가 필요합니다. 크롬 브라우저로 조용한
                곳에서 응시해 주세요.
              </p>
            </div>
          </div>
        );
      })}
      {submitted.map((ex) => {
        const t = s.examTemplates.find((x) => x.id === ex.templateId);
        return (
          <div
            key={ex.id}
            className="flex items-start gap-2.5 bg-paper p-6 sm:px-8"
          >
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-signal" />
            <p className="text-sm text-ink">
              <b>{t?.title}</b> 응시가 완료되었습니다
              {ex.submittedAt && ` — ${fmtDate(ex.submittedAt)} 제출`}. 결과는
              채점 후 안내드립니다.
            </p>
          </div>
        );
      })}
    </div>
  );
}

const CANDIDATE_ID = "me";

/** 현재 단계가 비공개면 직전 공개 단계를 지원자에게 보여준다 */
function visibleStageFor(s: HrState, app: HrApplication): PipelineStage | null {
  const cur = s.stages.find((st) => st.id === app.stageId);
  if (!cur) return null;
  if (cur.visibleToCandidate) return cur;
  return (
    [...s.stages]
      .filter(
        (st) =>
          st.kind === "active" &&
          st.visibleToCandidate &&
          st.order < cur.order,
      )
      .sort((a, b) => b.order - a.order)[0] ?? null
  );
}

/** 단계 이동 활동 로그에서 해당 단계 진입 날짜를 찾는다 */
function stageDate(app: HrApplication, stage: PipelineStage): string | null {
  if (stage.order === 0) return fmtDate(app.appliedAt);
  const hit = [...app.activities]
    .reverse()
    .find((act) => act.text.includes(stage.name));
  return hit ? fmtDate(hit.at) : null;
}

export function MyLiveStatus() {
  const s = useHrState();
  const session = useApplicantSession();
  // 로그인 계정 이메일과 일치하는 후보(어느 기기에서 지원했든) +
  // 이 브라우저에서 제출한 후보 + 데모 계정("me")
  const submittedIds = useMyCandidateIds();
  const accountIds = session
    ? s.candidates
        .filter(
          (c) =>
            c.email.trim().toLowerCase() === session.email.toLowerCase(),
        )
        .map((c) => c.id)
    : [];
  const myIds = new Set([CANDIDATE_ID, ...submittedIds, ...accountIds]);
  const apps = s.applications
    .filter((a) => myIds.has(a.candidateId))
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  // 로그인 이름 > 직접 제출 후보 이름 > 데모 계정 이름
  const me = session
    ? { name: session.name }
    : (s.candidates.find((c) => submittedIds.includes(c.id)) ??
      s.candidates.find((c) => c.id === CANDIDATE_ID));

  const flowStages = [...s.stages]
    .filter((st) => st.kind !== "rejected" && st.visibleToCandidate)
    .sort((a, b) => a.order - b.order);

  const inProgress = apps.filter((a) => {
    const st = s.stages.find((x) => x.id === a.stageId);
    return st?.kind === "active";
  }).length;

  return (
    <>
      {/* ── Header ─────────────────────────────────────────── */}
      <section className="bg-paper pb-12 pt-32 sm:pb-16 sm:pt-40">
        <Container>
          <Reveal>
            <Kicker>My Page</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-7">
              {me?.name ?? "지원자"} 님의
              <br />
              지원 현황
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            {session ? (
              <p className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
                <span>
                  <b className="text-ink">{session.username}</b> 계정으로
                  로그인됨 — 어느 기기에서 지원했든 이 계정 이메일(
                  {session.email})로 접수된 지원이 모두 표시됩니다.
                </span>
                <button
                  onClick={() => applicantAuth.signOut()}
                  className="font-semibold text-accent-ink underline-offset-2 hover:underline"
                >
                  로그아웃
                </button>
              </p>
            ) : (
              <p className="mt-5 text-sm text-muted">
                지금은 이 브라우저에서 제출한 지원만 보입니다.{" "}
                <Link
                  href="/login?returnTo=/my"
                  className="font-semibold text-accent-ink underline-offset-2 hover:underline"
                >
                  로그인
                </Link>
                하면 어느 기기에서든 지원 현황을 확인할 수 있습니다.
              </p>
            )}
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-3 rounded-card border border-line bg-pure px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-ink text-paper">
                  <Briefcase className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums">
                    {apps.length}
                  </p>
                  <p className="mt-1 text-xs text-muted">총 지원</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-card border border-line bg-pure px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-white">
                  <FileText className="size-5" />
                </span>
                <div>
                  <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums">
                    {inProgress}
                  </p>
                  <p className="mt-1 text-xs text-muted">진행중</p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Applications ───────────────────────────────────── */}
      <section className="bg-paper pb-24 sm:pb-32">
        <Container>
          {apps.length > 0 ? (
            <RevealGroup className="flex flex-col gap-6" stagger={0.08}>
              {apps.map((app) => {
                const job = s.jobs.find((j) => j.id === app.jobId);
                const cur = s.stages.find((st) => st.id === app.stageId);
                const shown = visibleStageFor(s, app);
                const rejected = cur?.kind === "rejected";
                const hired = cur?.kind === "hired";
                const statusLabel = rejected
                  ? (cur?.candidateLabel ?? "불합격")
                  : (shown?.candidateLabel ?? shown?.name ?? "전형 진행중");

                const timeline = flowStages.map((st) => ({
                  label: st.candidateLabel ?? st.name,
                  date: stageDate(app, st),
                  done: rejected
                    ? st.order === 0
                    : (shown?.order ?? -1) >= st.order,
                }));

                return (
                  <RevealItem key={app.id}>
                    <article className="overflow-hidden rounded-lg border border-line bg-pure shadow-lift">
                      <div className="flex flex-col gap-4 border-b border-line p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {s.settings.showStageToCandidate ? (
                              <Badge
                                tone={
                                  hired
                                    ? "signal"
                                    : rejected
                                      ? "neutral"
                                      : "accent"
                                }
                              >
                                {statusLabel}
                              </Badge>
                            ) : (
                              <Badge tone="ink">전형 진행중</Badge>
                            )}
                            <span className="font-mono text-xs text-muted-ink">
                              ARC-{app.id.toUpperCase()}
                            </span>
                          </div>
                          <h2 className="mt-4 text-2xl font-bold tracking-tight">
                            {job?.title}
                          </h2>
                          <p className="mt-1.5 text-sm text-muted">
                            아르코에듀 · {job?.department}
                          </p>
                          <p className="mt-3 text-sm text-muted-ink">
                            지원일 {fmtDate(app.appliedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            href={`/jobs/general/${app.jobId}`}
                            variant="outline"
                            size="sm"
                          >
                            공고 보기
                          </Button>
                          <Button href="/faq" variant="primary" size="sm">
                            문의하기
                          </Button>
                        </div>
                      </div>

                      {/* 필기시험 응시 안내 — HR 배정과 실시간 연동 */}
                      <ExamInvite app={app} s={s} />

                      {/* 면접 일정 선택/확정 안내 — HR 제안과 실시간 연동 */}
                      <ProposalPicker app={app} s={s} />

                      {s.settings.showStageToCandidate &&
                        s.settings.showTimelineToCandidate && (
                          <div className="bg-paper p-6 sm:p-8">
                            <p className="kicker mb-6 text-muted-ink">
                              전형 진행 단계
                            </p>
                            <StepTimeline timeline={timeline} />
                          </div>
                        )}
                      {!s.settings.showStageToCandidate && (
                        <div
                          className={cn(
                            "flex items-start gap-2.5 bg-paper p-6 text-sm text-muted sm:px-8",
                          )}
                        >
                          <Info className="mt-0.5 size-4 shrink-0" />
                          전형 결과는 각 단계 종료 후 개별 안내드립니다.
                        </div>
                      )}
                    </article>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          ) : (
            <EmptyState />
          )}

          <div className="mt-10 flex items-start gap-2.5 text-sm text-muted-ink">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              본 화면은 데모입니다. HR 콘솔(/hr)에서 단계를 이동하거나 공개
              설정을 바꾸면 이 화면에 즉시 반영됩니다.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-line-strong bg-pure px-6 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-paper-dim text-muted-ink">
        <Inbox className="size-7" />
      </span>
      <div>
        <p className="text-xl font-bold tracking-tight">
          아직 지원 내역이 없어요
        </p>
        <p className="mt-2 text-muted">
          관심 있는 포지션에 지원하고 진행 상황을 여기서 확인하세요.
        </p>
      </div>
      <Button href="/jobs" variant="accent" arrow className="mt-2">
        채용공고 둘러보기
      </Button>
      <Link
        href="/process"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        채용 절차 먼저 보기 <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
