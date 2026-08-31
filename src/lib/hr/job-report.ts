// ════════════════════════════════════════════════════════════════
//  공고별 리포트 계산 — "이 공고를 성공시키려면 지금 뭘 해야 하는가"
//
//  원칙(검토 반영):
//   · small-N 정직성 — 비율보다 절대 수치 우선, 표본 적으면 경고
//   · 규칙 기반 인사이트 — LLM 없이 결정론적으로 추천 액션 산출(설명 가능)
//   · 이미 만든 로직 재사용 — 병목/체류일/중복 등
// ════════════════════════════════════════════════════════════════

import type { HrState, HrJob, HrApplication } from "./types";
import { findDuplicateGroups } from "./store";

/** 신뢰 가능한 비율을 위한 최소 표본 */
export const MIN_SAMPLE = 5;

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function dDay(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── 퍼널 (해당 공고) ─────────────────────────────────────────────

export interface FunnelStage {
  id: string;
  name: string;
  kind: "active" | "hired" | "rejected";
  /** 현재 이 단계에 있는 인원 */
  current: number;
  /** 이 단계 이상 도달한 인원(진행 단계 기준 근사) */
  reached: number;
  /** 직전 단계 대비 전환율(%) — 표본 작으면 신뢰 낮음 */
  conversion: number | null;
}

export interface JobReport {
  job: HrJob;
  apps: HrApplication[];
  total: number;
  active: number;
  hired: number;
  rejected: number;
  newThisWeek: number;
  avgMatch: number;
  avgRating: number | null;
  dday: number | null;
  headcountGap: number;
  funnel: FunnelStage[];
  /** 병목 단계(체류일 최댓값) */
  bottleneck: { stageName: string; avgDays: number; count: number } | null;
  channels: ChannelPerf[];
  insights: Insight[];
  smallSample: boolean;
}

export interface ChannelPerf {
  source: string;
  count: number;
  avgMatch: number;
  interviewed: number;
  hired: number;
}

export interface Insight {
  tone: "warn" | "good" | "info";
  text: string;
  /** 바로 이동할 경로(있으면) */
  href?: string;
  cta?: string;
}

export function buildJobReport(s: HrState, jobId: string): JobReport | null {
  const job = s.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const apps = s.applications.filter((a) => a.jobId === jobId);
  const stageOf = (a: HrApplication) => s.stages.find((st) => st.id === a.stageId);

  const hired = apps.filter((a) => stageOf(a)?.kind === "hired").length;
  const rejected = apps.filter((a) => stageOf(a)?.kind === "rejected").length;
  const active = apps.length - hired - rejected;
  const weekAgo = new Date().getTime() - 7 * 86400000;
  const newThisWeek = apps.filter(
    (a) => new Date(a.appliedAt).getTime() > weekAgo,
  ).length;
  const avgMatch =
    apps.length > 0
      ? Math.round(apps.reduce((n, a) => n + a.ai.matchScore, 0) / apps.length)
      : 0;
  const allScores = apps.flatMap((a) =>
    a.evaluations.flatMap((e) => e.scores.map((x) => x.score)),
  );
  const avgRating =
    allScores.length > 0
      ? Math.round((allScores.reduce((x, y) => x + y, 0) / allScores.length) * 10) / 10
      : null;

  // 퍼널 (진행 단계 + 최종합격)
  const flow = s.stages
    .filter((st) => st.kind !== "rejected")
    .sort((a, b) => a.order - b.order);
  const funnel: FunnelStage[] = flow.map((st, i) => {
    const current = apps.filter((a) => a.stageId === st.id).length;
    const reached = apps.filter((a) => {
      const cur = stageOf(a);
      if (!cur) return false;
      if (cur.kind === "rejected") return st.order === 0; // 탈락자는 접수만 확정 인정
      return cur.order >= st.order;
    }).length;
    return {
      id: st.id,
      name: st.name,
      kind: st.kind,
      current,
      reached,
      conversion:
        i === 0
          ? 100
          : (() => {
              const prev = apps.filter((a) => {
                const cur = stageOf(a);
                if (!cur || cur.kind === "rejected") return false;
                return cur.order >= flow[i - 1].order;
              }).length;
              return prev > 0 ? Math.round((reached / prev) * 100) : null;
            })(),
    };
  });

  // 병목 — 진행 단계별 평균 체류일 최댓값
  let bottleneck: JobReport["bottleneck"] = null;
  for (const st of flow.filter((x) => x.kind === "active")) {
    const inStage = apps.filter((a) => a.stageId === st.id);
    if (inStage.length === 0) continue;
    const avgDays =
      Math.round(
        (inStage.reduce((n, a) => n + daysBetween(a.updatedAt), 0) /
          inStage.length) *
          10,
      ) / 10;
    if (!bottleneck || avgDays > bottleneck.avgDays) {
      bottleneck = { stageName: st.name, avgDays, count: inStage.length };
    }
  }

  // 유입 채널별 성과 (절대 수치 우선)
  const chMap = new Map<string, ChannelPerf>();
  for (const a of apps) {
    const src = s.candidates.find((c) => c.id === a.candidateId)?.source ?? "기타";
    const cur = chMap.get(src) ?? {
      source: src,
      count: 0,
      avgMatch: 0,
      interviewed: 0,
      hired: 0,
    };
    cur.count += 1;
    cur.avgMatch += a.ai.matchScore;
    if (s.interviews.some((iv) => iv.applicationId === a.id)) cur.interviewed += 1;
    if (stageOf(a)?.kind === "hired") cur.hired += 1;
    chMap.set(src, cur);
  }
  const channels = [...chMap.values()]
    .map((c) => ({ ...c, avgMatch: Math.round(c.avgMatch / c.count) }))
    .sort((a, b) => b.count - a.count);

  // ── 규칙 기반 인사이트/추천 액션 ──
  const insights: Insight[] = [];
  const smallSample = apps.length < MIN_SAMPLE;

  // 마감 임박 + 합격 부족
  const dday = dDay(job.closesAt);
  if (dday !== null && dday <= 7 && hired < job.headcount) {
    insights.push({
      tone: "warn",
      text: `마감 D-${Math.max(0, dday)}인데 합격자가 ${hired}/${job.headcount}명입니다. 후보 재발굴을 검토하세요.`,
      href: "/hr/talent",
      cta: "인재풀 추천 보기",
    });
  }
  // 병목: 체류일이 긴 단계
  if (bottleneck && bottleneck.avgDays >= 7) {
    insights.push({
      tone: "warn",
      text: `'${bottleneck.stageName}' 단계에 ${bottleneck.count}명이 평균 ${bottleneck.avgDays}일 머물러 있습니다. 검토·평가를 진행하세요.`,
      href: `/hr/applicants?job=${job.id}`,
      cta: "지원자 보기",
    });
  }
  // 평가 대기
  const pendingEval = s.interviews.filter(
    (iv) => apps.some((a) => a.id === iv.applicationId) && iv.status === "평가대기",
  ).length;
  if (pendingEval > 0) {
    insights.push({
      tone: "warn",
      text: `면접 후 평가 미제출 ${pendingEval}건 — 전형 지연 원인이 됩니다.`,
      href: `/hr/applicants?job=${job.id}`,
      cta: "평가 확인",
    });
  }
  // 고매치인데 아직 면접 안 본 후보
  const highNotInterviewed = apps.filter(
    (a) =>
      a.ai.matchScore >= 85 &&
      stageOf(a)?.kind === "active" &&
      !s.interviews.some((iv) => iv.applicationId === a.id),
  ).length;
  if (highNotInterviewed > 0) {
    insights.push({
      tone: "good",
      text: `AI 매치 85점 이상 후보 ${highNotInterviewed}명이 아직 면접 전입니다. 면접 제안을 검토하세요.`,
      href: `/hr/applicants?job=${job.id}`,
      cta: "후보 보기",
    });
  }
  // 후보 품질 요약
  if (apps.length > 0) {
    if (avgMatch >= 80 && active > 0 && funnel.find((f) => f.id === "interview1")?.reached === 0) {
      insights.push({
        tone: "info",
        text: `지원자 평균 매치가 ${avgMatch}점으로 높지만 면접 단계 진입이 없습니다. 서류 검토 기준이 과도하거나 검토가 지연됐을 수 있습니다.`,
      });
    }
  } else {
    insights.push({ tone: "info", text: "아직 지원자가 없습니다." });
  }
  // 중복
  const dupNames = new Set(
    findDuplicateGroups(s).flatMap((g) => g.candidateIds),
  );
  const dupInJob = apps.filter((a) => dupNames.has(a.candidateId)).length;
  if (dupInJob > 0) {
    insights.push({
      tone: "warn",
      text: `중복 지원 의심 ${dupInJob}건 — 통합 검토가 필요합니다.`,
      href: "/hr/applicants",
      cta: "중복 검토",
    });
  }

  return {
    job,
    apps,
    total: apps.length,
    active,
    hired,
    rejected,
    newThisWeek,
    avgMatch,
    avgRating,
    dday,
    headcountGap: Math.max(0, job.headcount - hired),
    funnel,
    bottleneck,
    channels,
    insights,
    smallSample,
  };
}
