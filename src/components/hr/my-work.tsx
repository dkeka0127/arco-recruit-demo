"use client";

// ════════════════════════════════════════════════════════════════
//  내 업무 — 현재 담당자 개인 관점의 할 일 모음.
//  팀 전체 대시보드와 달리 "나에게 배정된 것 · 내가 평가할 것 · 나를
//  @멘션한 것"만 모아 보여준다. (그리팅 '내 업무' 대응)
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ClipboardCheck,
  CalendarClock,
  Mail,
  Briefcase,
  ArrowRight,
  Video,
  MapPin,
} from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import {
  useHrState,
  memberName,
  applicantNo,
  appsWithUnreadEmail,
  CURRENT_MEMBER_ID,
} from "@/lib/hr/store";
import { Panel, StatCard, Avatar, EmptyState, fmtDate, daysAgo } from "@/components/hr/ui";

export function MyWork() {
  const s = useHrState();
  const me = s.members.find((m) => m.id === CURRENT_MEMBER_ID);
  const myName = me?.name ?? "";

  const nameOfApp = (appId: string) => {
    const app = s.applications.find((a) => a.id === appId);
    return s.candidates.find((c) => c.id === app?.candidateId)?.name ?? "";
  };
  const jobOfApp = (appId: string) => {
    const app = s.applications.find((a) => a.id === appId);
    return (
      s.jobs.find((j) => j.id === app?.jobId)?.title.replace(/^\[[^\]]*\]\s*/, "") ??
      ""
    );
  };

  // 내가 담당하는 공고 (managerId) → 그 공고의 진행 지원자
  const myJobIds = useMemo(
    () => new Set(s.jobs.filter((j) => j.managerId === CURRENT_MEMBER_ID).map((j) => j.id)),
    [s],
  );
  const myApplicants = useMemo(
    () =>
      s.applications
        .filter((a) => {
          const st = s.stages.find((x) => x.id === a.stageId);
          return myJobIds.has(a.jobId) && st?.kind === "active";
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [s, myJobIds],
  );

  // 내가 면접관인 면접
  const myInterviews = useMemo(
    () =>
      s.interviews
        .filter((iv) => iv.interviewerIds.includes(CURRENT_MEMBER_ID))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [s],
  );
  const myPendingEval = myInterviews.filter((iv) => iv.status === "평가대기");
  const myUpcoming = myInterviews.filter((iv) => iv.status === "예정");

  // 미확인 지원자 이메일 회신 (담당 공고 기준)
  const unreadReplies = useMemo(
    () => appsWithUnreadEmail(s).filter((a) => myJobIds.has(a.jobId)),
    [s, myJobIds],
  );

  // 나를 @멘션한 코멘트
  const myMentions = useMemo(() => {
    const token = `@${myName}`;
    return s.applications
      .flatMap((a) =>
        a.comments
          .filter((c) => c.text.includes(token) && c.authorId !== CURRENT_MEMBER_ID)
          .map((c) => ({ ...c, applicationId: a.id })),
      )
      .sort((x, y) => y.at.localeCompare(x.at));
  }, [s, myName]);

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-[1200px] flex-col gap-6"
    >
      <motion.div variants={fadeUp}>
        <p className="kicker text-accent-ink">My Work</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
          {myName}님의 업무
        </h2>
        <p className="mt-1 text-sm text-muted">
          내가 담당하는 공고·면접·멘션만 모아 봅니다. 팀 전체 현황은 대시보드에서
          확인하세요.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="내 평가 대기" value={myPendingEval.length} icon={<ClipboardCheck className="size-4" />} sub="면접 후 미제출" />
        <StatCard label="내 면접 예정" value={myUpcoming.length} icon={<CalendarClock className="size-4" />} sub="면접관 배정됨" />
        <StatCard label="미확인 회신" value={unreadReplies.length} icon={<Mail className="size-4" />} sub="지원자 이메일" />
        <StatCard label="담당 지원자" value={myApplicants.length} icon={<Briefcase className="size-4" />} sub="진행 중" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 평가 대기 */}
        <motion.div variants={fadeUp}>
          <Panel title="평가 대기" bodyClassName="flex flex-col gap-2.5 p-4">
            {myPendingEval.length === 0 && <EmptyState text="제출할 평가가 없습니다." />}
            {myPendingEval.map((iv) => (
              <Link
                key={iv.id}
                href={`/hr/applicants/${iv.applicationId}`}
                className="group flex items-center gap-3 rounded-xl border border-accent bg-pure p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Avatar name={nameOfApp(iv.applicationId)} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="font-bold tracking-tight text-ink">
                    {nameOfApp(iv.applicationId)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {iv.round} · {jobOfApp(iv.applicationId)}
                  </span>
                </span>
                <span className="shrink-0 text-[0.78rem] font-bold text-accent-ink">
                  평가하기
                </span>
              </Link>
            ))}
          </Panel>
        </motion.div>

        {/* 내 면접 일정 */}
        <motion.div variants={fadeUp}>
          <Panel title="내 면접 일정" bodyClassName="flex flex-col gap-2.5 p-4">
            {myUpcoming.length === 0 && <EmptyState text="예정된 면접이 없습니다." />}
            {myUpcoming.map((iv) => {
              const remote = iv.location.includes("화상");
              return (
                <Link
                  key={iv.id}
                  href={`/hr/applicants/${iv.applicationId}`}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-pure p-3.5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
                >
                  <span className="rounded-lg bg-ink px-2.5 py-1.5 font-mono text-[0.72rem] font-semibold text-paper">
                    {iv.date.slice(5).replace("-", ".")} {iv.start}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-bold tracking-tight text-ink">
                      {nameOfApp(iv.applicationId)}{" "}
                      <span className="text-xs font-medium text-muted">
                        {iv.round}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      {remote ? <Video className="size-3" /> : <MapPin className="size-3" />}
                      {remote ? "화상" : iv.location.replace("본관 7층 ", "")}
                    </span>
                  </span>
                </Link>
              );
            })}
          </Panel>
        </motion.div>
      </div>

      {/* 나를 멘션한 코멘트 */}
      <motion.div variants={fadeUp}>
        <Panel title="나를 멘션한 코멘트" bodyClassName="flex flex-col gap-2.5 p-4">
          {myMentions.length === 0 && <EmptyState text="받은 멘션이 없습니다." />}
          {myMentions.map((c) => (
            <Link
              key={c.id}
              href={`/hr/applicants/${c.applicationId}`}
              className="group flex gap-3 rounded-xl border border-line bg-pure p-3.5 transition-colors hover:border-accent"
            >
              <Avatar name={memberName(s, c.authorId)} size="sm" dark />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.85rem] font-bold text-ink">
                    {memberName(s, c.authorId)} → {nameOfApp(c.applicationId)}
                  </span>
                  <span className="font-mono text-[0.62rem] text-muted-ink">
                    {daysAgo(c.at)}
                  </span>
                </span>
                <span className="mt-0.5 block text-[0.85rem] leading-snug text-muted">
                  {c.text.split(/(@\S+)/g).map((part, i) =>
                    part.startsWith("@") ? (
                      <b key={i} className="text-accent-ink">
                        {part}
                      </b>
                    ) : (
                      <span key={i}>{part}</span>
                    ),
                  )}
                </span>
              </span>
            </Link>
          ))}
        </Panel>
      </motion.div>

      {/* 담당 지원자 */}
      <motion.div variants={fadeUp}>
        <Panel
          title="담당 지원자"
          action={
            <Link href="/hr/applicants" className="text-xs font-semibold text-accent-ink hover:underline">
              전체 파이프라인
            </Link>
          }
          bodyClassName="p-0"
        >
          {myApplicants.length === 0 ? (
            <EmptyState text="담당 중인 진행 지원자가 없습니다." />
          ) : (
            <ul className="divide-y divide-line">
              {myApplicants.slice(0, 10).map((a) => {
                const stage = s.stages.find((st) => st.id === a.stageId);
                return (
                  <li key={a.id}>
                    <Link
                      href={`/hr/applicants/${a.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent-soft/30"
                    >
                      <Avatar name={nameOfApp(a.id)} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="font-bold tracking-tight text-ink">
                          {nameOfApp(a.id)}
                        </span>
                        <span className="ml-2 font-mono text-[0.68rem] text-muted-ink">
                          {applicantNo(s, a.id)}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {jobOfApp(a.id)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[0.7rem] font-bold text-accent-ink">
                        {stage?.name}
                      </span>
                      <span className="shrink-0 font-mono text-[0.62rem] text-muted-ink">
                        {fmtDate(a.updatedAt)}
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-ink" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
