"use client";

// ════════════════════════════════════════════════════════════════
//  리포트 — 채용 퍼널 · 지원 추이 · 유입 채널 · 공고별 성과
//  모든 수치는 스토어 데이터에서 실시간 파생 (목업이지만 살아있는 숫자)
// ════════════════════════════════════════════════════════════════

import { useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, ArrowRight, FileCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState } from "@/lib/hr/store";
import { Panel, EmptyState } from "@/components/hr/ui";

// ── 주간 버킷 유틸 ───────────────────────────────────────────────

function weekLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function HrAnalytics() {
  const s = useHrState();
  const router = useRouter();

  // 퍼널: 각 단계 "도달" 수 — 현재 단계 order 이상 도달한 지원서 수로 근사
  const funnel = useMemo(() => {
    const stages = s.stages
      .filter((st) => st.kind !== "rejected")
      .sort((a, b) => a.order - b.order);
    return stages.map((st) => {
      const reached = s.applications.filter((a) => {
        const cur = s.stages.find((x) => x.id === a.stageId);
        if (!cur) return false;
        if (cur.kind === "rejected") {
          // 탈락자는 탈락 전 활동에서 도달 여부를 알 수 없어 접수만 인정
          return st.order === 0;
        }
        return cur.order >= st.order;
      }).length;
      return { stage: st, reached };
    });
  }, [s]);
  const funnelMax = Math.max(1, funnel[0]?.reached ?? 1);

  // 주간 지원 추이 (최근 8주)
  const weekly = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(0, 0, 0, 0);
    for (let i = 7; i >= 0; i--) {
      const start = new Date(monday);
      start.setDate(monday.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const count = s.applications.filter((a) => {
        const t = new Date(a.appliedAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      buckets.push({ label: weekLabel(start), count });
    }
    return buckets;
  }, [s]);
  const weeklyMax = Math.max(1, ...weekly.map((w) => w.count));

  // 소스별 유입
  const sources = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of s.applications) {
      const src =
        s.candidates.find((c) => c.id === a.candidateId)?.source ?? "기타";
      map.set(src, (map.get(src) ?? 0) + 1);
    }
    return [...map.entries()].sort((x, y) => y[1] - x[1]);
  }, [s]);
  const sourceMax = Math.max(1, ...sources.map(([, n]) => n));
  const totalApps = s.applications.length;

  // 공고별 성과
  const jobPerf = useMemo(
    () =>
      s.jobs
        .filter((j) => j.status !== "임시저장")
        .map((j) => {
          const apps = s.applications.filter((a) => a.jobId === j.id);
          const hired = apps.filter((a) => a.stageId === "hired").length;
          const rejected = apps.filter((a) => a.stageId === "rejected").length;
          const avgMatch =
            apps.length > 0
              ? Math.round(
                  apps.reduce((sum, a) => sum + a.ai.matchScore, 0) /
                    apps.length,
                )
              : 0;
          return {
            job: j,
            total: apps.length,
            active: apps.length - hired - rejected,
            hired,
            avgMatch,
          };
        })
        .sort((a, b) => b.total - a.total),
    [s],
  );

  // 사업부(부서)별 그룹 + 소계
  const byDept = useMemo(() => {
    const map = new Map<string, typeof jobPerf>();
    for (const row of jobPerf) {
      const arr = map.get(row.job.department) ?? [];
      arr.push(row);
      map.set(row.job.department, arr);
    }
    return [...map.entries()]
      .map(([dept, rows]) => {
        const total = rows.reduce((n, r) => n + r.total, 0);
        return {
          dept,
          rows,
          total,
          active: rows.reduce((n, r) => n + r.active, 0),
          hired: rows.reduce((n, r) => n + r.hired, 0),
          avgMatch:
            total > 0
              ? Math.round(
                  rows.reduce((n, r) => n + r.avgMatch * r.total, 0) / total,
                )
              : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [jobPerf]);

  // 필기시험 전형 지표 — 시험 세트별 응시율·통과율·평균 점수·무결성
  const examStats = useMemo(() => {
    return s.examTemplates
      .map((t) => {
        const sess = s.examSessions.filter((x) => x.templateId === t.id);
        const assigned = sess.length;
        const done = sess.filter(
          (x) => x.status === "제출" || x.status === "채점완료",
        );
        const graded = sess.filter((x) => x.status === "채점완료");
        const avgScore =
          graded.length > 0
            ? Math.round(
                (graded.reduce((n, x) => n + (x.totalScore ?? 0), 0) /
                  graded.length) *
                  10,
              ) / 10
            : null;
        const passLine = t.passingScore;
        const passCount =
          passLine != null
            ? graded.filter((x) => (x.totalScore ?? 0) >= passLine).length
            : null;
        const integ = sess.filter((x) => typeof x.integrityScore === "number");
        const avgIntegrity =
          integ.length > 0
            ? Math.round(
                integ.reduce((n, x) => n + (x.integrityScore ?? 0), 0) /
                  integ.length,
              )
            : null;
        const flagged = integ.filter((x) => (x.integrityScore ?? 100) < 70).length;
        return {
          t,
          assigned,
          doneCount: done.length,
          gradedCount: graded.length,
          avgScore,
          passLine,
          passCount,
          avgIntegrity,
          flagged,
        };
      })
      .filter((r) => r.assigned > 0)
      .sort((a, b) => b.assigned - a.assigned);
  }, [s]);

  // 추이 SVG 좌표
  const W = 560;
  const H = 150;
  const PAD = 8;
  const points = weekly.map((w, i) => ({
    x: PAD + (i / (weekly.length - 1)) * (W - PAD * 2),
    y: H - PAD - (w.count / weeklyMax) * (H - PAD * 2),
  }));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const area = `${path} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {/* 퍼널 */}
        <Panel title="채용 퍼널 — 단계별 도달">
          <div className="flex flex-col gap-2.5">
            {funnel.map(({ stage, reached }, i) => {
              const prev = i > 0 ? funnel[i - 1].reached : reached;
              const conv = prev > 0 ? Math.round((reached / prev) * 100) : 0;
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-right text-[0.78rem] font-semibold tracking-tight text-muted">
                    {stage.name}
                  </span>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-paper">
                    <div
                      className={cn(
                        "flex h-full items-center rounded-lg px-3 transition-[width] duration-700",
                        stage.kind === "hired" ? "bg-signal" : "bg-accent",
                      )}
                      style={{
                        width: `${Math.max(8, (reached / funnelMax) * 100)}%`,
                      }}
                    >
                      <span
                        className={cn(
                          "font-mono text-[0.8rem] font-bold",
                          stage.kind === "hired" ? "text-white" : "text-ink",
                        )}
                      >
                        {reached}
                      </span>
                    </div>
                  </div>
                  <span className="w-14 shrink-0 font-mono text-[0.68rem] text-muted">
                    {i > 0 ? `${conv}%` : "100%"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 font-mono text-[0.62rem] text-muted-ink">
            * 우측 %는 직전 단계 대비 전환율
          </p>
        </Panel>

        {/* 주간 추이 */}
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <TrendingUp className="size-4 text-accent-ink" /> 주간 지원 추이
              (최근 8주)
            </span>
          }
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="주간 지원 추이 차트"
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52b3d8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#52b3d8" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((t) => (
              <line
                key={t}
                x1={PAD}
                x2={W - PAD}
                y1={H * t}
                y2={H * t}
                stroke="var(--color-line)"
                strokeDasharray="3 5"
              />
            ))}
            <path d={area} fill="url(#areaGrad)" />
            <path
              d={path}
              fill="none"
              stroke="var(--color-accent-deep)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#fff"
                  stroke="var(--color-accent-deep)"
                  strokeWidth="2"
                />
                {weekly[i].count > 0 && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="fill-ink font-mono"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {weekly[i].count}
                  </text>
                )}
              </g>
            ))}
          </svg>
          <div className="mt-1 flex justify-between px-1">
            {weekly.map((w) => (
              <span
                key={w.label}
                className="font-mono text-[0.62rem] text-muted-ink"
              >
                {w.label}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* 소스별 유입 */}
        <Panel title="유입 채널" className="xl:col-span-2">
          <div className="flex flex-col gap-3">
            {sources.map(([src, n]) => (
              <div key={src} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-[0.8rem] font-semibold text-ink">
                  {src}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700"
                    style={{ width: `${(n / sourceMax) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-[0.72rem] text-muted">
                  {n}건 ·{" "}
                  {totalApps > 0 ? Math.round((n / totalApps) * 100) : 0}%
                </span>
              </div>
            ))}
            {sources.length === 0 && <EmptyState text="데이터가 없습니다." />}
          </div>
        </Panel>

        {/* 필기시험 전형 — 세트별 응시·통과·무결성 */}
        {examStats.length > 0 && (
          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <FileCheck className="size-4 text-accent-ink" /> 필기시험 전형
              </span>
            }
            className="xl:col-span-3"
            bodyClassName="p-0"
          >
            <table className="w-full text-[0.8rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.68rem] font-bold text-muted">
                  <th className="px-5 py-2.5">시험</th>
                  <th className="px-3 py-2.5 text-right">배정</th>
                  <th className="px-3 py-2.5 text-right">응시 완료</th>
                  <th className="px-3 py-2.5 text-right">응시율</th>
                  <th className="px-3 py-2.5 text-right">평균 점수</th>
                  <th className="px-3 py-2.5 text-right">합격선 통과</th>
                  <th className="px-5 py-2.5 text-right">무결성</th>
                </tr>
              </thead>
              <tbody>
                {examStats.map((r) => (
                  <tr key={r.t.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-bold tracking-tight text-ink">{r.t.title}</p>
                      {r.t.category && (
                        <p className="text-[0.65rem] text-muted-ink">{r.t.category}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{r.assigned}</td>
                    <td className="px-3 py-3 text-right font-mono">{r.doneCount}</td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.assigned > 0
                        ? `${Math.round((r.doneCount / r.assigned) * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.avgScore != null ? r.avgScore : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {r.passLine != null && r.gradedCount > 0 ? (
                        <span
                          className={cn(
                            "font-bold",
                            (r.passCount ?? 0) / r.gradedCount >= 0.5
                              ? "text-signal"
                              : "text-amber-600",
                          )}
                        >
                          {r.passCount}/{r.gradedCount}명
                        </span>
                      ) : (
                        <span className="text-muted-ink">
                          {r.passLine == null ? "합격선 미설정" : "채점 전"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.avgIntegrity != null ? (
                        <span className="inline-flex items-center gap-1.5 font-mono">
                          <ShieldCheck
                            className={cn(
                              "size-3.5",
                              r.avgIntegrity >= 90
                                ? "text-signal"
                                : r.avgIntegrity >= 70
                                  ? "text-amber-500"
                                  : "text-red-500",
                            )}
                          />
                          평균 {r.avgIntegrity}
                          {r.flagged > 0 && (
                            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[0.62rem] font-bold text-red-600">
                              주의 {r.flagged}건
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-ink">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {/* 공고별 성과 — 행 클릭 시 공고별 리포트로 drill-down */}
        <Panel
          title="사업부별 · 공고별 성과"
          action={
            <span className="font-mono text-[0.62rem] text-muted-ink">
              공고 행 클릭 → 공고별 리포트
            </span>
          }
          className="xl:col-span-3"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left">
                  {["공고", "지원", "진행중", "합격", "평균 AI 매치", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byDept.map((grp) => (
                  <Fragment key={grp.dept}>
                    {/* 사업부 소계 행 */}
                    <tr className="border-b border-line bg-paper/70">
                      <td className="px-5 py-2.5 text-[0.82rem] font-extrabold tracking-tight text-ink">
                        {grp.dept}
                        <span className="ml-2 font-mono text-[0.62rem] font-medium text-muted-ink">
                          공고 {grp.rows.length}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 font-mono font-bold">{grp.total}</td>
                      <td className="px-5 py-2.5 font-mono font-bold text-accent-ink">
                        {grp.active}
                      </td>
                      <td className="px-5 py-2.5 font-mono font-bold text-signal">
                        {grp.hired}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[0.72rem] text-muted">
                        {grp.avgMatch || "—"}
                      </td>
                      <td />
                    </tr>
                    {/* 공고 행 */}
                    {grp.rows.map(({ job, total, active, hired, avgMatch }) => (
                      <tr
                        key={job.id}
                        onClick={() => router.push(`/hr/analytics/jobs/${job.id}`)}
                        className="group cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-accent-soft/30"
                      >
                        <td className="max-w-64 truncate py-3 pl-9 pr-5 text-[0.88rem] text-ink group-hover:text-accent-ink">
                          {job.title}
                        </td>
                        <td className="px-5 py-3 font-mono">{total}</td>
                        <td className="px-5 py-3 font-mono text-accent-ink">{active}</td>
                        <td className="px-5 py-3 font-mono text-signal">{hired}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-paper">
                              <span
                                className="block h-full rounded-full bg-accent"
                                style={{ width: `${avgMatch}%` }}
                              />
                            </span>
                            <span className="font-mono text-[0.72rem] text-muted">
                              {avgMatch || "—"}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <ArrowRight className="ml-auto size-4 text-muted-ink transition-transform group-hover:translate-x-0.5 group-hover:text-accent-ink" />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
