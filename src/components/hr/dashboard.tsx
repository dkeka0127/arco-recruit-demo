"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Megaphone,
  Users,
  CalendarClock,
  ClipboardCheck,
  ArrowRight,
  Video,
  MapPin,
  Sparkles,
  Copy,
  Clock,
  Award,
  PhoneCall,
  Mail,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  useHrState,
  memberName,
  findDuplicateGroups,
  appsWithUnreadEmail,
  CURRENT_MEMBER_ID,
} from "@/lib/hr/store";
import { buildTalentProfiles, recontactQueue } from "@/lib/hr/talent-intel";
import {
  Panel,
  StatCard,
  Avatar,
  EmptyState,
  fmtDateTime,
  daysAgo,
  dDay,
} from "@/components/hr/ui";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function HrDashboard() {
  const s = useHrState();
  const today = todayStr();
  const me = s.members.find((m) => m.id === CURRENT_MEMBER_ID);

  const activeStages = s.stages.filter((st) => st.kind === "active");
  const activeApps = s.applications.filter((a) =>
    activeStages.some((st) => st.id === a.stageId),
  );
  const openJobs = s.jobs.filter((j) => j.status === "게시중");
  const todayInterviews = s.interviews
    .filter((iv) => iv.date === today && iv.status !== "취소")
    .sort((a, b) => a.start.localeCompare(b.start));
  const pendingEvalCount = s.interviews.filter(
    (iv) => iv.status === "평가대기",
  ).length;
  const weekAgo = new Date().getTime() - 7 * 86400000;
  const newThisWeek = s.applications.filter(
    (a) => new Date(a.appliedAt).getTime() > weekAgo,
  ).length;

  // 퍼널: 단계별 지원서 수 (진행 단계 + 최종합격)
  const funnel = useMemo(() => {
    const stages = s.stages
      .filter((st) => st.kind !== "rejected")
      .sort((a, b) => a.order - b.order);
    return stages.map((st) => ({
      stage: st,
      count: s.applications.filter((a) => a.stageId === st.id).length,
    }));
  }, [s]);
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  // 할 일
  const screeningQueue = s.applications.filter(
    (a) => a.stageId === "screening",
  ).length;
  const newApplied = s.applications.filter(
    (a) => a.stageId === "applied",
  ).length;
  const expiringTalent = s.talent.filter(
    (t) => dDay(t.expiresAt) <= 30,
  ).length;

  const todos = [
    {
      label: "신규 접수 지원서 분류",
      count: newApplied,
      href: "/hr/applicants?stage=applied",
    },
    {
      label: "서류 검토 대기",
      count: screeningQueue,
      href: "/hr/applicants?stage=screening",
    },
    {
      label: "면접 평가 미제출",
      count: pendingEvalCount,
      href: "/hr/interviews",
    },
    {
      label: "일정 조율 — 지원자 응답 대기",
      count: s.proposals.filter((p) => p.status === "대기").length,
      href: "/hr/interviews",
    },
    {
      label: "인재풀 보관기한 만료 임박",
      count: expiringTalent,
      href: "/hr/talent",
    },
  ].filter((t) => t.count > 0);

  // ── 우선 처리 큐 — 구체적 지원자 단위 액션 아이템 ──────────────
  const priorityItems = useMemo(() => {
    type Item = {
      key: string;
      icon: typeof ClipboardCheck;
      who: string;
      what: string;
      cta: string;
      href: string;
      tone: "accent" | "ink" | "signal";
    };
    const items: Item[] = [];
    const nameOf = (appId: string) => {
      const app = s.applications.find((a) => a.id === appId);
      return s.candidates.find((c) => c.id === app?.candidateId)?.name ?? "";
    };

    // 0) 미확인 지원자 이메일 회신 (가장 먼저)
    for (const a of appsWithUnreadEmail(s)) {
      items.push({
        key: `reply-${a.id}`,
        icon: Mail,
        who: nameOf(a.id),
        what: "지원자 이메일 회신 · 미확인",
        cta: "메일 확인",
        href: `/hr/applicants/${a.id}`,
        tone: "accent",
      });
    }

    // 0.9) 면접관 일정 변경 요청 — 면접 전에 처리해야 하는 조율 건
    for (const iv of s.interviews.filter(
      (i) => i.rescheduleRequest && i.status === "예정",
    )) {
      items.push({
        key: `resched-${iv.id}`,
        icon: CalendarClock,
        who: nameOf(iv.applicationId),
        what: `${iv.round} 일정 변경 요청 — ${memberName(s, iv.rescheduleRequest!.by)}: "${iv.rescheduleRequest!.reason}"`,
        cta: "일정 확인",
        href: `/hr/interviews`,
        tone: "signal",
      });
    }
    // 1) 평가 대기 면접
    for (const iv of s.interviews.filter((i) => i.status === "평가대기")) {
      items.push({
        key: `eval-${iv.id}`,
        icon: ClipboardCheck,
        who: nameOf(iv.applicationId),
        what: `${iv.round} 완료 · 평가 미작성`,
        cta: "평가 확인",
        href: `/hr/applicants/${iv.applicationId}`,
        tone: "accent",
      });
    }
    // 1.5) 필기시험 채점 대기 (제출 완료, 미채점)
    for (const ex of s.examSessions.filter((e) => e.status === "제출")) {
      const t = s.examTemplates.find((x) => x.id === ex.templateId);
      items.push({
        key: `grade-exam-${ex.id}`,
        icon: FileCheck,
        who: nameOf(ex.applicationId),
        what: `${t?.title ?? "필기시험"} 제출 · 채점 대기`,
        cta: "채점하기",
        href: `/hr/exams/${ex.id}`,
        tone: "accent",
      });
    }
    // 1.6) 필기시험 기한 임박 미응시 (D-1 이내) — 리마인드·연장 판단
    for (const ex of s.examSessions.filter((e) => e.status === "발급")) {
      const d = Math.ceil(
        (new Date(ex.expiresAt).getTime() - new Date().getTime()) / 86400000,
      );
      if (d > 1) continue;
      const t = s.examTemplates.find((x) => x.id === ex.templateId);
      items.push({
        key: `exam-due-${ex.id}`,
        icon: Clock,
        who: nameOf(ex.applicationId),
        what: `${t?.title ?? "필기시험"} 미응시 · 기한 ${d < 0 ? "경과" : d === 0 ? "오늘" : "내일"}`,
        cta: "리마인드/연장",
        href: `/hr/exams`,
        tone: "signal",
      });
    }
    // 2) 중복 지원 의심
    for (const g of findDuplicateGroups(s)) {
      const names = g.candidateIds
        .map((id) => s.candidates.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .join(" · ");
      items.push({
        key: `dup-${g.key}`,
        icon: Copy,
        who: names,
        what: `${g.matchedBy.join("·")} 동일 · 중복 지원 의심`,
        cta: "병합/무시",
        href: `/hr/applicants`,
        tone: "ink",
      });
    }
    // 3) 인재풀 보관기한 임박 (D-30 이내)
    for (const t of s.talent) {
      const d = Math.ceil(
        (new Date(t.expiresAt).getTime() - new Date().getTime()) / 86400000,
      );
      if (d <= 30) {
        items.push({
          key: `talent-${t.id}`,
          icon: Clock,
          who: t.name,
          what: `개인정보 보관기한 D-${d > 0 ? d : 0}`,
          cta: "검토",
          href: `/hr/talent`,
          tone: "ink",
        });
      }
    }
    // 4) 재접촉 추천 (Talent Intelligence — 공고 오픈·보관임박·우수 후보)
    const profiles = buildTalentProfiles(s);
    for (const r of recontactQueue(profiles, s).slice(0, 4)) {
      items.push({
        key: `recontact-${r.profile.id}`,
        icon: r.urgency === "high" ? PhoneCall : Award,
        who: r.profile.name,
        what: r.reason,
        cta: "재접촉 검토",
        href: `/hr/talent`,
        tone: r.urgency === "high" ? "signal" : "ink",
      });
    }
    return items.slice(0, 10);
  }, [s]);

  // 최근 활동 (전체 지원서의 activity 평탄화)
  const recent = useMemo(
    () =>
      s.applications
        .flatMap((a) =>
          a.activities.map((act) => ({
            ...act,
            applicationId: a.id,
            candidate: s.candidates.find((c) => c.id === a.candidateId)?.name ?? "",
          })),
        )
        .sort((x, y) => y.at.localeCompare(x.at))
        .slice(0, 8),
    [s],
  );

  const now = new Date();

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-[1400px] flex-col gap-6"
    >
      {/* greeting */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="kicker text-accent-ink">
            {now.getFullYear()}. {now.getMonth() + 1}. {now.getDate()}. (
            {WEEKDAYS[now.getDay()]}) — Recruiting Control Room
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {me?.name}님, 오늘 면접이{" "}
            <em className="serif-italic text-accent-ink">
              {todayInterviews.length}건
            </em>{" "}
            있어요
          </h2>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/hr/jobs"
            className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-ink-700"
          >
            <Megaphone className="size-4 text-accent" />새 공고 만들기
          </Link>
          <Link
            href="/hr/applicants"
            className="flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-pure px-5 text-sm font-medium text-ink transition-all hover:-translate-y-0.5 hover:border-ink"
          >
            파이프라인 보기
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </motion.div>

      {/* KPI */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        <StatCard
          label="게시중 공고"
          value={openJobs.length}
          sub={`전체 ${s.jobs.length}건 중`}
          icon={<Megaphone className="size-4" />}
        />
        <StatCard
          label="진행 중 지원자"
          value={activeApps.length}
          sub={`이번 주 신규 +${newThisWeek}`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="오늘 면접"
          value={todayInterviews.length}
          sub="일정 탭에서 상세 확인"
          icon={<CalendarClock className="size-4" />}
        />
        <StatCard
          label="평가 대기"
          value={pendingEvalCount}
          sub="면접 완료 후 미제출 평가"
          icon={<ClipboardCheck className="size-4" />}
        />
      </motion.div>

      {/* funnel */}
      <motion.div variants={fadeUp}>
        <Panel
          title="채용 퍼널 현황"
          action={
            <Link
              href="/hr/analytics"
              className="text-xs font-semibold text-accent-ink hover:underline"
            >
              리포트 전체 보기
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {funnel.map(({ stage, count }, i) => (
              <Link
                key={stage.id}
                href={`/hr/applicants?stage=${stage.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-transparent p-3 transition-colors hover:border-line hover:bg-paper"
              >
                <span className="flex items-baseline justify-between">
                  <span className="font-mono text-[0.65rem] text-muted-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xl font-semibold",
                      stage.kind === "hired" ? "text-signal" : "text-ink",
                    )}
                  >
                    {count}
                  </span>
                </span>
                <span
                  className="h-1.5 overflow-hidden rounded-full bg-paper-dim"
                  aria-hidden
                >
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / funnelMax) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + i * 0.06 }}
                    className={cn(
                      "block h-full rounded-full",
                      stage.kind === "hired" ? "bg-signal" : "bg-accent",
                    )}
                  />
                </span>
                <span className="text-[0.78rem] font-semibold tracking-tight text-muted group-hover:text-ink">
                  {stage.name}
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </motion.div>

      {/* 우선 처리 큐 — 오늘 무엇을 처리할지 */}
      <motion.div variants={fadeUp}>
        <Panel
          title="오늘 처리할 일"
          action={
            priorityItems.length > 0 ? (
              <span className="rounded-full bg-accent px-2.5 py-0.5 font-mono text-[0.7rem] font-bold text-ink">
                {priorityItems.length}
              </span>
            ) : undefined
          }
          bodyClassName="grid gap-2.5 p-4 sm:grid-cols-2"
        >
          {priorityItems.length === 0 && (
            <div className="col-span-full flex items-center gap-2 py-6 text-center text-sm text-muted sm:justify-center">
              <CheckCircle2 className="size-4 text-signal" /> 우선 처리할 일이
              없습니다. 훌륭해요!
            </div>
          )}
          {priorityItems.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              className="group flex items-center gap-3 rounded-xl border border-line bg-pure p-3.5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  it.tone === "accent" && "bg-accent-soft text-accent-ink",
                  it.tone === "ink" && "bg-ink text-paper",
                  it.tone === "signal" && "bg-signal/12 text-signal",
                )}
              >
                <it.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold tracking-tight text-ink">
                  {it.who}
                </span>
                <span className="block truncate text-xs text-muted">
                  {it.what}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[0.78rem] font-bold text-accent-ink">
                {it.cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </Panel>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* today interviews */}
        <motion.div variants={fadeUp} className="xl:col-span-1">
          <Panel
            title="오늘의 면접"
            action={
              <Link
                href="/hr/interviews"
                className="text-xs font-semibold text-accent-ink hover:underline"
              >
                전체 일정
              </Link>
            }
            bodyClassName="flex flex-col gap-3 p-4"
          >
            {todayInterviews.length === 0 && (
              <EmptyState text="오늘 예정된 면접이 없습니다." />
            )}
            {todayInterviews.map((iv) => {
              const app = s.applications.find((a) => a.id === iv.applicationId);
              const candidate = s.candidates.find(
                (c) => c.id === app?.candidateId,
              );
              const job = s.jobs.find((j) => j.id === app?.jobId);
              const remote = iv.location.includes("화상");
              return (
                <Link
                  key={iv.id}
                  href={`/hr/applicants/${iv.applicationId}`}
                  className="group flex items-center gap-3.5 rounded-xl border border-line bg-pure p-3.5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
                >
                  <span className="flex flex-col items-center rounded-lg bg-ink px-2.5 py-1.5 font-mono leading-tight text-paper">
                    <span className="text-[0.82rem] font-semibold">
                      {iv.start}
                    </span>
                    <span className="text-[0.6rem] text-white/50">
                      {iv.end}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-bold tracking-tight text-ink">
                        {candidate?.name}
                      </span>
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] font-bold text-accent-ink">
                        {iv.round}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                      {remote ? (
                        <Video className="size-3 shrink-0" />
                      ) : (
                        <MapPin className="size-3 shrink-0" />
                      )}
                      <span className="truncate">
                        {job?.title.replace(/^\[[^\]]*\]\s*/, "")}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-ink transition-transform group-hover:translate-x-0.5 group-hover:text-accent-ink" />
                </Link>
              );
            })}
          </Panel>
        </motion.div>

        {/* todos */}
        <motion.div variants={fadeUp} className="xl:col-span-1">
          <Panel title="처리할 일" bodyClassName="flex flex-col gap-2.5 p-4">
            {todos.length === 0 && (
              <EmptyState text="모든 업무를 처리했습니다. 훌륭해요!" />
            )}
            {todos.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="group flex items-center justify-between rounded-xl border border-line bg-pure px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
              >
                <span className="text-sm font-semibold tracking-tight text-ink">
                  {t.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent font-mono text-[0.72rem] font-bold text-ink">
                    {t.count}
                  </span>
                  <ArrowRight className="size-4 text-muted-ink transition-transform group-hover:translate-x-0.5 group-hover:text-accent-ink" />
                </span>
              </Link>
            ))}

            {/* AI 하이라이트 */}
            <div className="mt-1 rounded-xl bg-ink p-4 text-paper">
              <p className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-accent">
                <Sparkles className="size-3.5" /> AI 인사이트
              </p>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-white/85">
                {(() => {
                  const top = [...s.applications]
                    .filter(
                      (a) =>
                        s.stages.find((st) => st.id === a.stageId)?.kind ===
                        "active",
                    )
                    .sort((a, b) => b.ai.matchScore - a.ai.matchScore)[0];
                  const c = s.candidates.find(
                    (c) => c.id === top?.candidateId,
                  );
                  return top && c ? (
                    <>
                      진행 중 최고 적합 후보는{" "}
                      <Link
                        href={`/hr/applicants/${top.id}`}
                        className="font-bold text-accent underline-offset-2 hover:underline"
                      >
                        {c.name}
                      </Link>
                      님(매치 {top.ai.matchScore}점)입니다. 전형이 지연되지
                      않도록 우선 처리하세요.
                    </>
                  ) : (
                    "진행 중인 지원서가 없습니다."
                  );
                })()}
              </p>
            </div>
          </Panel>
        </motion.div>

        {/* recent activity */}
        <motion.div variants={fadeUp} className="xl:col-span-1">
          <Panel title="최근 활동" bodyClassName="p-4">
            <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-line">
              {recent.map((act) => (
                <li key={`${act.applicationId}-${act.id}`} className="relative flex gap-3.5 pl-1">
                  <Avatar
                    name={memberName(s, act.actor)}
                    size="sm"
                    dark={act.actor !== "system"}
                    className="relative z-10 ring-4 ring-[#fbfdfe]"
                  />
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[0.82rem] leading-snug text-ink">
                      <Link
                        href={`/hr/applicants/${act.applicationId}`}
                        className="font-bold hover:text-accent-ink"
                      >
                        {act.candidate}
                      </Link>{" "}
                      — {act.text}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.65rem] text-muted-ink">
                      {memberName(s, act.actor)} · {daysAgo(act.at)} ·{" "}
                      {fmtDateTime(act.at).slice(11)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}
