// ════════════════════════════════════════════════════════════════
//  면접 준비 킷 — 구조화 면접 가이드 (그린하우스 Interview Kit 대응)
//
//  라운드(1차/2차/처우)와 공고의 직군·부서에 맞는 추천 질문 세트,
//  별점 기준 앵커(루브릭), 캘린더(.ics) 생성을 제공한다.
//  질문은 시작점일 뿐 — 면접관이 후보 경력에 맞게 변형해 쓰도록
//  포털에서 안내한다.
// ════════════════════════════════════════════════════════════════

import type { HrJob, Interview } from "./types";

export interface QuestionSet {
  title: string;
  questions: string[];
}

// ── 라운드 공통 세트 ─────────────────────────────────────────────

const OPENING: QuestionSet = {
  title: "오프닝 · 경력 개요 (5분)",
  questions: [
    "간단히 자기소개와 함께, 최근 업무에서 가장 몰입했던 일을 들려주세요.",
    "이번 포지션에 지원하신 동기가 궁금합니다 — 아르코에듀에서 무엇을 하고 싶으신가요?",
  ],
};

const ROUND1_CORE: QuestionSet = {
  title: "직무 역량 검증 (STAR 기법 권장)",
  questions: [
    "가장 성과가 컸던 프로젝트를 상황(S)–과제(T)–행동(A)–결과(R) 순으로 설명해 주세요.",
    "그 프로젝트에서 본인이 직접 한 일과 팀이 한 일을 구분해 주시겠어요?",
    "실패했거나 목표에 못 미쳤던 경험은요? 원인을 어떻게 분석했고 이후 무엇이 달라졌나요?",
    "지금 하는 일에서 스스로 개선한 프로세스나 방식이 있다면 소개해 주세요.",
  ],
};

const ROUND2_CORE: QuestionSet = {
  title: "심화 · 상황 판단",
  questions: [
    "동료 또는 유관 부서와 의견이 강하게 충돌했던 경험과 해결 과정을 들려주세요.",
    "우선순위가 다른 업무 3개가 동시에 떨어지면 어떤 기준으로 정리하시나요? 실제 사례가 있다면요.",
    "리소스가 절반뿐인 상황에서 목표를 달성해야 한다면 무엇부터 포기하시겠어요?",
    "1년 뒤 이 포지션에서 '성공했다'고 말할 수 있으려면 무엇이 달성돼야 할까요?",
  ],
};

const CULTURE: QuestionSet = {
  title: "컬처핏 · 협업",
  questions: [
    "피드백을 받았을 때 동의하기 어려웠던 경험이 있나요? 어떻게 반응하셨나요?",
    "함께 일하기 좋았던 동료의 특징을 꼽는다면? 본인은 어떤 동료인가요?",
    "빠르게 바뀌는 목표와 계획 속에서 일해본 경험이 있다면 들려주세요.",
  ],
};

const OFFER_MEETING: QuestionSet = {
  title: "처우 미팅 체크리스트",
  questions: [
    "기대 연봉과 협의 가능 범위 확인 (현재 처우 기준 인상률 포함)",
    "입사 가능 시점과 현 직장 인수인계 일정 확인",
    "타사 전형 진행 현황과 의사결정 기한 확인",
    "직급·직책·조직 배치에 대한 기대 확인",
    "후보자 질문 응대 — 조직 구성, 온보딩, 평가/보상 주기",
  ],
};

// ── 직군·부서 특화 세트 ──────────────────────────────────────────

const DEPT_SETS: { match: (job: HrJob) => boolean; set: QuestionSet }[] = [
  {
    match: (j) => j.department.includes("개발") || j.title.includes("개발"),
    set: {
      title: "기술 검증 (개발)",
      questions: [
        "최근 내린 기술적 의사결정 하나를 골라, 검토한 대안과 트레이드오프를 설명해 주세요.",
        "본인이 짠 코드가 장애를 냈던 경험과 재발 방지 방법을 들려주세요.",
        "코드 리뷰에서 자주 지적하는 것과 자주 지적받는 것은 무엇인가요?",
        "성능 문제를 계측→원인 규명→개선까지 끌고 간 사례가 있나요?",
      ],
    },
  },
  {
    match: (j) => j.department.includes("마케팅") || j.title.includes("마케팅") || j.title.includes("유튜브") || j.title.includes("바이럴"),
    set: {
      title: "마케팅 역량 검증",
      questions: [
        "직접 운영한 캠페인 중 ROI가 가장 좋았던 것과 나빴던 것을 지표와 함께 설명해 주세요.",
        "타깃 오디언스를 새로 정의해 성과를 낸 경험이 있나요?",
        "성과 지표(KPI)를 무엇으로 잡고, 어떤 주기로 무엇을 보며 조정하나요?",
      ],
    },
  },
  {
    match: (j) => j.track === "영어연구원" || j.title.includes("연구원") || j.department.includes("콘텐츠") || j.department.includes("연구"),
    set: {
      title: "콘텐츠·연구 역량 검증",
      questions: [
        "직접 기획/집필한 콘텐츠 중 학습자 반응이 가장 좋았던 것과 그 이유를 분석해 주세요.",
        "콘텐츠 품질과 마감 일정이 충돌할 때 어떻게 결정하시나요?",
        "트렌드(시험 개정, 학습 방식 변화)를 콘텐츠에 반영한 사례가 있나요?",
      ],
    },
  },
  {
    match: (j) => j.track === "전문강사" || j.title.includes("강사"),
    set: {
      title: "강의 역량 검증 (시연 평가 포인트)",
      questions: [
        "수강생 수준이 크게 갈리는 반을 맡는다면 강의를 어떻게 설계하시겠어요?",
        "강의 평가가 낮게 나왔던 경험과 개선 과정을 들려주세요.",
        "본인 강의의 차별점을 30초로 설명한다면? (실제 강의 톤으로)",
      ],
    },
  },
];

/**
 * 라운드 + 공고에 맞는 추천 질문 세트.
 * 반환 순서 = 권장 진행 순서.
 */
export function interviewGuide(
  round: string,
  job: HrJob | undefined,
): QuestionSet[] {
  if (round.includes("처우")) return [OFFER_MEETING];
  const deptSet = job ? DEPT_SETS.find((d) => d.match(job))?.set : undefined;
  if (round.includes("2차") || round.includes("최종")) {
    return [ROUND2_CORE, ...(deptSet ? [deptSet] : []), CULTURE];
  }
  // 1차 및 기타 라운드
  return [OPENING, ROUND1_CORE, ...(deptSet ? [deptSet] : []), CULTURE];
}

// ── 별점 기준 앵커 (스코어카드 일관성) ───────────────────────────

export const SCORE_RUBRIC: Record<string, { low: string; mid: string; high: string }> = {
  "직무 전문성": { low: "요건 미달·경험 재현 어려움", mid: "요건 충족·즉시 투입 가능", high: "요건 초과·팀 역량을 끌어올림" },
  "문제 해결": { low: "표면적 답변에 그침", mid: "구조적으로 접근·해결", high: "원인·대안·검증까지 제시" },
  "커뮤니케이션": { low: "핵심 전달이 불명확", mid: "명확하고 간결한 소통", high: "청자에 맞춘 설득력" },
  "컬처핏": { low: "가치·방식 충돌 우려", mid: "협업에 무리 없음", high: "팀에 적극적 시너지" },
};

// ── 캘린더(.ics) — 외부 연동 없이 표준 파일로 해결 ──────────────

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** 면접 1건 → RFC 5545 VCALENDAR 텍스트 (로컬 시간, 알림 30분 전) */
export function buildInterviewIcs(
  iv: Interview,
  opts: { candidateName: string; jobTitle: string },
): string {
  const d = iv.date.replace(/-/g, "");
  const start = iv.start.replace(":", "") + "00";
  const end = iv.end.replace(":", "") + "00";
  const summary = `[아르코에듀 면접] ${iv.round} — ${opts.candidateName}`;
  const desc = `${opts.jobTitle}\n장소: ${iv.location}${iv.meetingUrl ? `\n화상 링크: ${iv.meetingUrl}` : ""}${iv.note ? `\n메모: ${iv.note}` : ""}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ARCO HR//Interviewer Portal//KO",
    "BEGIN:VEVENT",
    `UID:${iv.id}@arco-hr`,
    `DTSTART:${d}T${start}`,
    `DTEND:${d}T${end}`,
    `SUMMARY:${icsEscape(summary)}`,
    `LOCATION:${icsEscape(iv.meetingUrl ?? iv.location)}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(summary)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** 브라우저에서 .ics 파일 다운로드 */
export function downloadIcs(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
