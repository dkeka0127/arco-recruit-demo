// ════════════════════════════════════════════════════════════════
//  Talent Intelligence — 인재풀을 "지능형 후보 자산"으로 만드는 레이어.
//
//  철학(중요): AI는 결정자가 아니라 채용 코파일럿.
//   - 합불 결정 X, 판단 보조 O
//   - 점수만 주지 않고 반드시 "왜"(근거)와 "주의"를 함께 제시
//   - 인사팀이 놓칠 사람을 찾아주는 눈
//
//  현재는 결정론적 목업 휴리스틱. Bedrock 연동 시 이 파일의 추론 부분
//  (분류·추천 근거·요약·검색)을 서버 라우트 → Claude 호출로 교체하면
//  화면(components/hr/talent.tsx)은 그대로 유지된다.
// ════════════════════════════════════════════════════════════════

import type { HrState, HrJob } from "./types";

// ── 분류 ─────────────────────────────────────────────────────────

export type TalentCategory =
  | "개발"
  | "기획/마케팅"
  | "영어연구"
  | "교재편집"
  | "전문강사"
  | "운영/상담"
  | "디자인/퍼블리싱"
  | "기타";

export type TalentStatus =
  | "즉시 연락 가능"
  | "우수 탈락자"
  | "추후 재검토"
  | "포지션 미스매치"
  | "보류";

const CATEGORY_KEYWORDS: [TalentCategory, string[]][] = [
  ["개발", ["개발", "엔지니어", "react", "node", "python", "aws", "sre", "데이터", "go", "typescript", "프론트", "백엔드", "msa"]],
  ["영어연구", ["영어", "토익", "tesol", "영어교육", "통번역", "영문"]],
  ["교재편집", ["편집", "교재", "출판"]],
  ["전문강사", ["강사"]],
  ["운영/상담", ["상담", "운영", "cs", "학사", "학원"]],
  ["디자인/퍼블리싱", ["디자인", "모션", "퍼블", "그래픽", "영상편집", "편집자"]],
  ["기획/마케팅", ["기획", "마케팅", "콘텐츠", "sns", "유튜브", "영상기획", "pd", "퍼포먼스"]],
];

function classify(text: string): TalentCategory {
  const t = text.toLowerCase();
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => t.includes(k))) return cat;
  }
  return "기타";
}

// ── 통합 후보 프로필 ─────────────────────────────────────────────
//  인재풀 엔트리 + "우수 탈락 후보(실버)"를 한 뷰모델로 통합한다.
//  탈락 후보 쪽이 평가·사유 등 풍부한 데이터를 갖는다.

export interface TalentProfile {
  id: string;
  origin: "entry" | "rejected";
  name: string;
  role: string;
  tags: string[];
  category: TalentCategory;
  status: TalentStatus;
  note: string;
  source: string;
  addedAt: string;
  expiresAt: string;
  /** 마지막 접촉/업데이트 (재접촉 타이밍용) */
  lastContactAt: string;
  lastAppliedJob?: string;
  lastAppliedAt?: string;
  rejectReason?: string;
  avgRating?: number;
  aiScore?: number;
  positiveComments: string[];
  /** 상세로 연결(있으면) */
  applicationId?: string;
}

/** 탈락 사유가 "역량 부족"이 아닌 타이밍/처우/포지션 이슈인지 */
function isNonCompetenceReject(reason?: string): boolean {
  if (!reason) return false;
  return /미스매치|타이밍|처우|연봉|TO|마감|정원|사퇴|개인 사정/i.test(reason);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
function dDay(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function buildTalentProfiles(s: HrState): TalentProfile[] {
  const profiles: TalentProfile[] = [];
  const seenNames = new Set<string>();

  // 1) 등록된 인재풀 엔트리
  for (const t of s.talent) {
    const category = classify(`${t.role} ${t.tags.join(" ")}`);
    const status: TalentStatus = t.tags.includes("실버 메달리스트")
      ? "우수 탈락자"
      : dDay(t.expiresAt) <= 30
        ? "보류"
        : "추후 재검토";
    profiles.push({
      id: `entry-${t.id}`,
      origin: "entry",
      name: t.name,
      role: t.role,
      tags: t.tags,
      category,
      status,
      note: t.note,
      source: t.source,
      addedAt: t.addedAt,
      expiresAt: t.expiresAt,
      lastContactAt: t.addedAt,
      lastAppliedJob: t.lastApplied,
      positiveComments: [],
    });
    seenNames.add(t.name);
  }

  // 2) 우수 탈락 후보(실버) — 아직 엔트리로 등록 안 된 사람
  for (const app of s.applications) {
    const stage = s.stages.find((st) => st.id === app.stageId);
    if (stage?.kind !== "rejected") continue;
    const cand = s.candidates.find((c) => c.id === app.candidateId);
    if (!cand || seenNames.has(cand.name)) continue;

    const scores = app.evaluations.flatMap((ev) => ev.scores.map((x) => x.score));
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const positive = app.evaluations
      .filter((ev) => ev.decision === "추천" || ev.decision === "강력추천")
      .map((ev) => ev.comment)
      .filter(Boolean);
    const good = avg >= 3.5 || app.ai.matchScore >= 80 || positive.length > 0;
    if (!good) continue; // 실버 조건 미달은 통합 풀에서 제외

    const job = s.jobs.find((j) => j.id === app.jobId);
    const category = classify(`${cand.tags.join(" ")} ${job?.title ?? ""}`);
    const status: TalentStatus = isNonCompetenceReject(app.rejectReason)
      ? "우수 탈락자"
      : avg >= 4
        ? "즉시 연락 가능"
        : "추후 재검토";

    profiles.push({
      id: `rej-${app.id}`,
      origin: "rejected",
      name: cand.name,
      role: job ? job.title.replace(/^\[[^\]]*\]\s*/, "") : "",
      tags: cand.tags,
      category,
      status,
      note: app.rejectReason ?? "",
      source: `지원 이력 (${job?.title.replace(/^\[[^\]]*\]\s*/, "") ?? ""})`,
      addedAt: app.appliedAt.slice(0, 10),
      expiresAt: new Date(new Date(app.updatedAt).getTime() + s.settings.retentionYears * 365 * 86400000)
        .toISOString()
        .slice(0, 10),
      lastContactAt: app.updatedAt.slice(0, 10),
      lastAppliedJob: job?.title,
      lastAppliedAt: app.appliedAt.slice(0, 10),
      rejectReason: app.rejectReason,
      avgRating: avg || undefined,
      aiScore: app.ai.matchScore,
      positiveComments: positive,
      applicationId: app.id,
    });
    seenNames.add(cand.name);
  }

  return profiles;
}

// ── 공고별 후보 추천 (근거 + 주의) ──────────────────────────────

export interface JobRecommendation {
  profile: TalentProfile;
  score: number;
  reasons: string[];
  cautions: string[];
}

function jobText(job: HrJob): string {
  return `${job.title} ${job.department} ${job.track}`.toLowerCase();
}

export function recommendForJob(
  job: HrJob,
  profiles: TalentProfile[],
): JobRecommendation[] {
  const jt = jobText(job);
  const jobCat = classify(jt);

  return profiles
    .map((p) => {
      const reasons: string[] = [];
      const cautions: string[] = [];
      let score = 40;

      // 직무군 일치
      if (p.category === jobCat && jobCat !== "기타") {
        score += 22;
        reasons.push(`직무군 '${p.category}'가 공고와 일치`);
      }
      // 태그 겹침
      const hitTags = p.tags.filter((t) => jt.includes(t.toLowerCase()));
      if (hitTags.length) {
        score += Math.min(20, hitTags.length * 8);
        reasons.push(`역량 태그 ${hitTags.map((t) => `#${t}`).join(" ")} 부합`);
      }
      // 평가/AI
      if (p.avgRating && p.avgRating >= 4) {
        score += 8;
        reasons.push(`이전 면접 평가 평균 ${p.avgRating.toFixed(1)}점(우수)`);
      }
      if (p.aiScore && p.aiScore >= 80) {
        score += 6;
        reasons.push(`이전 공고 AI 매치 ${p.aiScore}점`);
      }
      // 긍정 코멘트
      if (p.positiveComments.length) {
        reasons.push(`면접관 코멘트: "${p.positiveComments[0].slice(0, 40)}"`);
      }
      // 탈락 사유가 역량 문제 아님 = 재검토 가치
      if (isNonCompetenceReject(p.rejectReason)) {
        score += 8;
        reasons.push("이전 탈락 사유가 역량 부족이 아님(타이밍/처우/포지션)");
      }

      // 주의사항
      const contactDays = daysSince(p.lastContactAt);
      if (contactDays >= 90)
        cautions.push(`마지막 접촉 ${contactDays}일 전 — 관심 재확인 필요`);
      if (dDay(p.expiresAt) <= 30)
        cautions.push(`개인정보 보관 D-${Math.max(0, dDay(p.expiresAt))} — 동의 갱신/파기 검토`);
      if (/처우|연봉/i.test(p.rejectReason ?? ""))
        cautions.push("과거 처우 이슈 — 희망 연봉 사전 확인");

      if (reasons.length === 0) reasons.push("일반 역량 프로필 기반 후보");

      return { profile: p, score: Math.min(97, score), reasons, cautions };
    })
    .sort((a, b) => b.score - a.score);
}

// ── 후보 히스토리 요약 (한 단락) ────────────────────────────────

export function summarizeProfile(p: TalentProfile, s: HrState): string {
  const parts: string[] = [];
  if (p.lastAppliedJob) {
    const when = p.lastAppliedAt ? `${p.lastAppliedAt.slice(0, 7).replace("-", "년 ")}월` : "이전";
    parts.push(`이 후보는 ${when} '${p.lastAppliedJob}' 공고에 지원했습니다.`);
  }
  if (p.avgRating && p.avgRating >= 3.5) {
    parts.push(`서류·면접 평가는 평균 ${p.avgRating.toFixed(1)}점으로 우수했습니다.`);
  }
  if (p.rejectReason) {
    parts.push(
      isNonCompetenceReject(p.rejectReason)
        ? `당시 불합격 사유는 역량 부족이 아니라 "${p.rejectReason}"였습니다.`
        : `불합격 사유: ${p.rejectReason}.`,
    );
  }
  // 현재 게시중 공고 중 카테고리 일치하는 것 추천
  const match = s.jobs.find(
    (j) => j.status === "게시중" && classify(jobText(j)) === p.category,
  );
  if (match) {
    parts.push(
      `현재 게시중인 '${match.title.replace(/^\[[^\]]*\]\s*/, "")}' 공고와 직무군이 유사해 재검토 가치가 있습니다.`,
    );
  } else if (p.positiveComments.length) {
    parts.push("면접관 긍정 평가가 있어 유사 공고 오픈 시 재검토를 추천합니다.");
  }
  return parts.join(" ") || "추가 이력 정보가 제한적입니다.";
}

// ── 자연어 인재 검색 (목업 파서) ────────────────────────────────
//  키워드·평가·기간 신호를 추출해 프로필을 필터·랭킹한다.
//  Bedrock 연동 시 임베딩 검색으로 교체.

export interface SearchHit {
  profile: TalentProfile;
  score: number;
  matched: string[];
}

export function searchProfiles(
  query: string,
  profiles: TalentProfile[],
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const wantsGoodEval = /평가.*(좋|우수|높)/.test(q);
  const wantsRevisit = /재검토|다시|재지원|재발굴/.test(q);
  const wantsRecent = /최근|이내|개월/.test(q);
  // 카테고리 힌트
  const catHint = classify(q);

  return profiles
    .map((p) => {
      const matched: string[] = [];
      let score = 0;
      const hay = `${p.name} ${p.role} ${p.tags.join(" ")} ${p.category} ${p.note}`.toLowerCase();

      // 토큰 겹침 (조사·불용어 제거 간이)
      const tokens = q
        .split(/[\s,]+/)
        .filter((w) => w.length >= 2 && !["있고", "있는", "찾아줘", "사람", "후보"].includes(w));
      for (const tok of tokens) {
        if (hay.includes(tok)) {
          score += 14;
          if (!matched.includes(tok)) matched.push(`'${tok}' 일치`);
        }
      }
      if (catHint !== "기타" && p.category === catHint) {
        score += 20;
        matched.push(`직무군 '${p.category}'`);
      }
      if (wantsGoodEval && p.avgRating && p.avgRating >= 3.8) {
        score += 18;
        matched.push(`평가 우수(${p.avgRating.toFixed(1)})`);
      }
      if (wantsRevisit && (p.status === "우수 탈락자" || isNonCompetenceReject(p.rejectReason))) {
        score += 16;
        matched.push("재검토 가치 있음");
      }
      if (wantsRecent && daysSince(p.lastContactAt) <= 180) {
        score += 10;
        matched.push("최근 6개월 내 접점");
      }
      return { profile: p, score, matched };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ── 재접촉 추천 큐 ───────────────────────────────────────────────

export interface RecontactItem {
  profile: TalentProfile;
  reason: string;
  urgency: "high" | "normal";
}

export function recontactQueue(
  profiles: TalentProfile[],
  s: HrState,
): RecontactItem[] {
  const openJobs = s.jobs.filter((j) => j.status === "게시중");
  const items: RecontactItem[] = [];

  for (const p of profiles) {
    // 1) 관련 공고 신규 오픈 (직무군 일치)
    const match = openJobs.find((j) => classify(jobText(j)) === p.category);
    if (match) {
      items.push({
        profile: p,
        reason: `'${match.title.replace(/^\[[^\]]*\]\s*/, "")}' 공고 오픈 — 직무군 적합`,
        urgency: "high",
      });
      continue;
    }
    // 2) 보관기한 임박
    const d = dDay(p.expiresAt);
    if (d <= 30) {
      items.push({
        profile: p,
        reason: `개인정보 보관 D-${Math.max(0, d)} — 재접촉/파기 결정 필요`,
        urgency: "high",
      });
      continue;
    }
    // 3) 오래 묵힌 우수 후보
    if (
      (p.status === "우수 탈락자" || (p.avgRating ?? 0) >= 4) &&
      daysSince(p.lastContactAt) >= 120
    ) {
      items.push({
        profile: p,
        reason: `우수 후보 · 마지막 접촉 ${daysSince(p.lastContactAt)}일 전`,
        urgency: "normal",
      });
    }
  }

  return items
    .sort((a, b) => (a.urgency === b.urgency ? 0 : a.urgency === "high" ? -1 : 1))
    .slice(0, 8);
}

// 재노출용
export { daysSince, dDay, classify };
