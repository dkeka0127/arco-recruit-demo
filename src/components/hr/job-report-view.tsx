"use client";

// ════════════════════════════════════════════════════════════════
//  공고별 리포트 — 처방전. "이 공고를 성공시키려면 지금 뭘 해야 하는가"
//  요약 → 퍼널+병목 → 유입채널(절대수치) → 추천 액션 → 바로가기
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  CalendarClock,
  Sparkles,
  TriangleAlert,
  CircleCheck,
  Info,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState } from "@/lib/hr/store";
import { buildJobReport, MIN_SAMPLE } from "@/lib/hr/job-report";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Panel, StatCard, EmptyState } from "@/components/hr/ui";

export function JobReportView({ jobId }: { jobId: string }) {
  const s = useHrState();
  const report = useMemo(() => buildJobReport(s, jobId), [s, jobId]);

  if (!report) {
    return (
      <div className="mx-auto max-w-xl py-20">
        <EmptyState text="공고를 찾을 수 없습니다." />
        <div className="mt-4 text-center">
          <Link href="/hr/analytics" className="text-sm font-semibold text-accent-ink hover:underline">
            ← 리포트로
          </Link>
        </div>
      </div>
    );
  }

  const { job } = report;
  const funnelMax = Math.max(1, ...report.funnel.map((f) => f.reached));

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-[1200px] flex-col gap-6"
    >
      <motion.div variants={fadeUp}>
        <Link
          href="/hr/analytics"
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" /> 전체 리포트
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker text-accent-ink">공고별 리포트</p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight">
              {job.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {job.department} · {job.track}/{job.employment} · 상태 {job.status}
              {report.dday !== null &&
                ` · 마감 D-${Math.max(0, report.dday)}`}
            </p>
          </div>
          <Link
            href={`/hr/applicants?job=${job.id}`}
            className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-ink-700"
          >
            <Users className="size-4 text-accent" /> 지원자 파이프라인
          </Link>
        </div>
      </motion.div>

      {/* small-N 경고 */}
      {report.smallSample && report.total > 0 && (
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-2 rounded-card border border-line-strong bg-paper-dim px-4 py-3 text-[0.85rem] text-muted"
        >
          <Info className="size-4 shrink-0" />
          지원자가 {report.total}명({MIN_SAMPLE}명 미만)이라 전환율·비율은 참고용입니다. 절대 수치 위주로 판단하세요.
        </motion.div>
      )}

      {/* 요약 */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="지원자" value={report.total} sub={`이번 주 +${report.newThisWeek} · 진행 ${report.active}`} icon={<Users className="size-4" />} />
        <StatCard label="합격 / 목표" value={`${report.hired}/${job.headcount}`} sub={report.headcountGap > 0 ? `${report.headcountGap}명 더 필요` : "충원 완료"} icon={<CircleCheck className="size-4" />} />
        <StatCard label="평균 AI 매치" value={report.avgMatch || "-"} sub={report.avgRating ? `면접 평가 ${report.avgRating}/5` : "평가 없음"} icon={<Sparkles className="size-4" />} />
        <StatCard label="병목 단계" value={report.bottleneck ? `${report.bottleneck.avgDays}일` : "-"} sub={report.bottleneck ? `${report.bottleneck.stageName} · ${report.bottleneck.count}명` : "지연 없음"} icon={<CalendarClock className="size-4" />} />
      </motion.div>

      {/* 추천 액션 (핵심) */}
      <motion.div variants={fadeUp}>
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent-ink" /> 추천 액션
            </span>
          }
          bodyClassName="flex flex-col gap-2.5 p-4"
        >
          {report.insights.length === 0 && (
            <EmptyState text="지금 특별히 조치할 항목이 없습니다." />
          )}
          {report.insights.map((it, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5",
                it.tone === "warn" && "border-accent bg-accent-soft/40",
                it.tone === "good" && "border-signal/30 bg-signal/8",
                it.tone === "info" && "border-line bg-pure",
              )}
            >
              <span className="mt-0.5 shrink-0">
                {it.tone === "warn" ? (
                  <TriangleAlert className="size-4 text-accent-ink" />
                ) : it.tone === "good" ? (
                  <CircleCheck className="size-4 text-signal" />
                ) : (
                  <Info className="size-4 text-muted" />
                )}
              </span>
              <p className="min-w-0 flex-1 text-[0.88rem] leading-relaxed text-ink">
                {it.text}
              </p>
              {it.href && it.cta && (
                <Link
                  href={it.href}
                  className="flex shrink-0 items-center gap-1 text-[0.78rem] font-bold text-accent-ink hover:underline"
                >
                  {it.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          ))}
          <p className="mt-1 font-mono text-[0.62rem] text-muted-ink">
            * 규칙 기반 자동 분석입니다. 판단은 담당자가 합니다.
          </p>
        </Panel>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 이 공고 퍼널 */}
        <motion.div variants={fadeUp}>
          <Panel title="이 공고의 채용 퍼널" bodyClassName="flex flex-col gap-2.5 p-5">
            {report.total === 0 ? (
              <EmptyState text="지원자가 없습니다." />
            ) : (
              report.funnel.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-right text-[0.78rem] font-semibold text-muted">
                    {f.name}
                  </span>
                  <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-paper">
                    <div
                      className={cn(
                        "flex h-full items-center rounded-lg px-3",
                        f.kind === "hired" ? "bg-signal" : "bg-accent",
                      )}
                      style={{ width: `${Math.max(7, (f.reached / funnelMax) * 100)}%` }}
                    >
                      <span
                        className={cn(
                          "font-mono text-[0.78rem] font-bold",
                          f.kind === "hired" ? "text-white" : "text-ink",
                        )}
                      >
                        {f.reached}명
                      </span>
                    </div>
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-[0.68rem] text-muted">
                    {i === 0
                      ? "100%"
                      : f.conversion === null
                        ? "—"
                        : `${f.conversion}%`}
                  </span>
                </div>
              ))
            )}
            <p className="mt-1 font-mono text-[0.62rem] text-muted-ink">
              * 막대=단계 도달 인원(절대수), 우측=직전 단계 대비 전환율
            </p>
          </Panel>
        </motion.div>

        {/* 유입 채널 */}
        <motion.div variants={fadeUp}>
          <Panel title="유입 채널 성과" bodyClassName="p-0">
            {report.channels.length === 0 ? (
              <EmptyState text="유입 데이터가 없습니다." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-paper text-left">
                      {["채널", "지원", "평균 매치", "면접", "합격"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.channels.map((c) => (
                      <tr key={c.source} className="border-b border-line/70 last:border-0">
                        <td className="px-4 py-2.5 font-semibold text-ink">{c.source}</td>
                        <td className="px-4 py-2.5 font-mono">{c.count}명</td>
                        <td className="px-4 py-2.5 font-mono text-accent-ink">{c.avgMatch}</td>
                        <td className="px-4 py-2.5 font-mono">{c.interviewed}명</td>
                        <td className="px-4 py-2.5 font-mono text-signal">{c.hired}명</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="px-4 py-3 font-mono text-[0.62rem] text-muted-ink">
              * 절대 수치 기준. 표본이 작을 때 채널별 비율은 신뢰도가 낮습니다.
            </p>
          </Panel>
        </motion.div>
      </div>

      {/* 바로가기 */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5">
        <Link href={`/hr/applicants?job=${job.id}`} className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-pure px-4 text-sm font-medium text-ink transition-colors hover:border-accent">
          <Users className="size-4 text-accent-ink" /> 지원자 보기
        </Link>
        <Link href="/hr/talent" className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-pure px-4 text-sm font-medium text-ink transition-colors hover:border-accent">
          <Sparkles className="size-4 text-accent-ink" /> 인재풀 추천
        </Link>
        <Link href="/hr/jobs" className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-pure px-4 text-sm font-medium text-ink transition-colors hover:border-accent">
          <Megaphone className="size-4 text-accent-ink" /> 공고 수정
        </Link>
      </motion.div>
    </motion.div>
  );
}
