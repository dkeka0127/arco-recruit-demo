// ════════════════════════════════════════════════════════════════
//  공고 템플릿 — 직군/사업부별 JD 프리셋 + 면접 프로세스 프리셋.
//
//  아르코에듀는 사업·직군마다 담당업무·자격요건이 다르고, 직무마다
//  전형절차(필기/인적성/과제/시강)가 다르다. 새 공고 작성 시 템플릿을
//  고르면 해당 직군의 JD와 전형절차가 자동으로 채워진다.
//  (실제 아르코 채용공고 구조 참고)
// ════════════════════════════════════════════════════════════════

import type { HrJob } from "./types";

// ── 면접(전형) 프로세스 프리셋 ──────────────────────────────────

export interface ProcessTemplate {
  id: string;
  name: string;
  /** 어떤 직무에 적합한지 힌트 */
  hint: string;
  steps: string[];
}

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  {
    id: "standard",
    name: "표준 (3단계)",
    hint: "대부분의 일반직",
    steps: ["서류 전형", "실무 면접", "임원 면접", "최종 합격"],
  },
  {
    id: "written",
    name: "필기 전형 포함",
    hint: "필기 평가가 필요한 직무",
    steps: ["서류 전형", "필기 전형", "실무 면접", "임원 면접", "최종 합격"],
  },
  {
    id: "aptitude",
    name: "인적성 포함",
    hint: "인적성 검사 실시 직무",
    steps: ["서류 전형", "인적성 검사", "실무 면접", "임원 면접", "최종 합격"],
  },
  {
    id: "assignment",
    name: "과제 전형 포함",
    hint: "개발·연구·디자인 등 실무 과제",
    steps: ["서류 전형", "과제 전형", "실무 면접", "임원 면접", "최종 합격"],
  },
  {
    id: "teacher",
    name: "전문강사 (시강)",
    hint: "강사 — 시강/실기 평가",
    steps: ["서류 전형", "1차 면접", "시강(실기) 평가", "최종 합격"],
  },
  {
    id: "simple",
    name: "간소 (상담·운영)",
    hint: "상담/운영직 등 신속 전형",
    steps: ["서류 전형", "면접", "최종 합격"],
  },
];

export function processSteps(id: string): string[] {
  return PROCESS_TEMPLATES.find((p) => p.id === id)?.steps ?? PROCESS_TEMPLATES[0].steps;
}

// ── 직군/사업부 JD 템플릿 ────────────────────────────────────────

export interface JobTemplate {
  id: string;
  /** 사업부 묶음 (그룹 표시용) */
  group: string;
  /** 템플릿 이름 (직군) */
  label: string;
  department: string;
  track: HrJob["track"];
  employment: HrJob["employment"];
  description: string;
  responsibilities: string[];
  qualifications: string[];
  preferred: string[];
  workType: string;
  location: string;
  /** 권장 전형 프로세스 */
  processId: string;
}

const HQ = "서울 어딘가구 아르코에듀 본사";

export const JOB_TEMPLATES: JobTemplate[] = [
  // ── 개발 ──
  {
    id: "t-dev",
    group: "개발·데이터",
    label: "개발 (웹/앱/서버)",
    department: "개발본부",
    track: "일반직",
    employment: "경력",
    description:
      "아르코에듀 교육 서비스의 웹·앱·서버를 개발합니다. 학습자 경험을 코드로 구현합니다.",
    responsibilities: [
      "PC/Mobile Web·App 서비스 개발 및 운영",
      "신규 기능 설계·구현 및 성능 개선",
      "프론트엔드·백엔드 협업 및 코드 리뷰",
    ],
    qualifications: [
      "HTML/CSS/JavaScript 능숙",
      "Python/Java/Node.js 중 1개 이상 개발 경험",
      "REST API 설계·연동 경험",
    ],
    preferred: [
      "React 등 프레임워크 실무 경험",
      "AWS 등 클라우드 운영 경험",
      "교육 도메인 이해",
    ],
    workType: "정규직 (수습 3개월)",
    location: HQ,
    processId: "assignment",
  },
  {
    id: "t-data",
    group: "개발·데이터",
    label: "데이터 분석",
    department: "개발본부",
    track: "일반직",
    employment: "경력",
    description: "학습·마케팅 데이터를 분석해 의사결정을 돕습니다.",
    responsibilities: [
      "학습·서비스 데이터 분석 및 지표 설계",
      "대시보드 구축·운영",
      "A/B 테스트 설계 및 결과 분석",
    ],
    qualifications: ["SQL 능숙", "Python·통계 분석 경험"],
    preferred: ["BI 툴 경험", "머신러닝 기초 이해"],
    workType: "정규직",
    location: HQ,
    processId: "assignment",
  },
  // ── 콘텐츠 연구 ──
  {
    id: "t-research",
    group: "콘텐츠 연구",
    label: "교재개발/편집기획",
    department: "콘텐츠연구소",
    track: "일반직",
    employment: "신입/경력",
    description:
      "아르코에듀 교재를 기획·집필·편집합니다. 20년 연속 베스트셀러 콘텐츠를 만듭니다.",
    responsibilities: [
      "교재 기획 및 원고 집필·편집",
      "문항 개발 및 해설 작성",
      "콘텐츠 품질 검수 및 개정",
    ],
    qualifications: [
      "해당 과목 전문 지식 보유",
      "국문 문서 작성·편집 역량",
    ],
    preferred: ["교재/콘텐츠 개발 경험", "관련 전공 석사 이상"],
    workType: "정규직",
    location: HQ,
    processId: "written",
  },
  {
    id: "t-eng-research",
    group: "콘텐츠 연구",
    label: "영어 연구원",
    department: "콘텐츠연구소",
    track: "영어연구원",
    employment: "신입/경력",
    description: "토익·토플 등 영어 콘텐츠를 연구·개발합니다.",
    responsibilities: [
      "영어 시험 문항 분석 및 개발",
      "교재·강의 콘텐츠 기획·집필",
      "해설·부가 자료 제작",
    ],
    qualifications: ["영어 능통(공인 성적 우대)", "영어교육/영문 관련 전공"],
    preferred: ["토익·토플 고득점", "교재 집필 경험", "TESOL 등 자격"],
    workType: "정규직",
    location: HQ,
    processId: "written",
  },
  // ── 마케팅 ──
  {
    id: "t-planning",
    group: "기획·마케팅",
    label: "콘텐츠 기획/마케팅",
    department: "마케팅본부",
    track: "일반직",
    employment: "신입/경력",
    description: "교육 콘텐츠를 채널에 맞게 기획하고 성장시킵니다.",
    responsibilities: [
      "유튜브·SNS 콘텐츠 기획·운영",
      "채널 성장 전략 수립 및 성과 분석",
      "제작팀 협업 및 일정 관리",
    ],
    qualifications: ["콘텐츠·마케팅 기획 역량", "데이터 기반 운영 이해"],
    preferred: ["교육 콘텐츠 경험", "바이럴 성공 사례 보유"],
    workType: "정규직",
    location: HQ,
    processId: "standard",
  },
  {
    id: "t-video",
    group: "기획·마케팅",
    label: "영상/디자인",
    department: "마케팅본부",
    track: "일반직",
    employment: "신입/경력",
    description: "강의·마케팅 영상과 콘텐츠 디자인을 제작합니다.",
    responsibilities: [
      "영상 촬영·편집 및 모션그래픽",
      "콘텐츠·브랜드 디자인",
      "제작 일정 관리",
    ],
    qualifications: ["프리미어·애프터이펙트 등 편집 툴 능숙", "포트폴리오 보유"],
    preferred: ["교육 영상 제작 경험", "디자인 전공"],
    workType: "정규직",
    location: HQ,
    processId: "assignment",
  },
  // ── 학원사업 ──
  {
    id: "t-academy",
    group: "학원사업",
    label: "학원 운영/교육상담",
    department: "학원사업본부",
    track: "일반직",
    employment: "신입/경력",
    description: "어학원·공무원학원 등 캠퍼스 운영과 교육 상담을 담당합니다.",
    responsibilities: [
      "수강생 학사 관리 및 교육 상담",
      "캠퍼스 운영·마케팅 실행",
      "강의 운영 지원",
    ],
    qualifications: ["원활한 커뮤니케이션", "고객 응대 역량"],
    preferred: ["학원·교육 서비스 경험", "상담 경력"],
    workType: "정규직",
    location: "해당 캠퍼스 (가온/북부/남부 등)",
    processId: "simple",
  },
  {
    id: "t-cs",
    group: "학원사업",
    label: "교육상담 (CS)",
    department: "학원사업본부",
    track: "일반직",
    employment: "신입/경력",
    description: "인바운드 학습 상담으로 수강생의 학습 설계를 돕습니다.",
    responsibilities: ["인바운드 상담 및 학습 설계", "수강 등록·사후 관리"],
    qualifications: ["친절한 상담 태도", "기본 PC 활용"],
    preferred: ["상담·CS 경험"],
    workType: "정규직",
    location: HQ,
    processId: "simple",
  },
  // ── 출판/영업 ──
  {
    id: "t-sales",
    group: "출판·영업",
    label: "교재 영업",
    department: "출판사업본부",
    track: "일반직",
    employment: "신입/경력",
    description: "학원·서점 대상 교재 영업 및 채널을 관리합니다.",
    responsibilities: [
      "학원·서점 교재 납품·관리",
      "거래처 관계 관리 및 신규 개척",
      "매출·재고 관리",
    ],
    qualifications: ["운전 가능", "대외 커뮤니케이션 역량"],
    preferred: ["교재·출판 영업 경험", "학원 네트워크 보유"],
    workType: "정규직",
    location: "수도권 (외근 포함)",
    processId: "standard",
  },
  // ── 경영지원 ──
  {
    id: "t-backoffice",
    group: "경영지원",
    label: "경영지원 (회계/인사/SCM)",
    department: "경영지원본부",
    track: "일반직",
    employment: "신입/경력",
    description: "회계·인사·물류 등 경영지원 업무를 담당합니다.",
    responsibilities: ["회계·결산 또는 인사·총무·물류 업무", "내부 프로세스 운영"],
    qualifications: ["관련 실무 지식", "엑셀 등 오피스 활용"],
    preferred: ["관련 자격증(회계 등)", "ERP 사용 경험"],
    workType: "정규직",
    location: HQ,
    processId: "aptitude",
  },
  // ── 전문강사 ──
  {
    id: "t-teacher",
    group: "전문강사",
    label: "전문강사",
    department: "학원사업본부",
    track: "전문강사",
    employment: "경력",
    description: "아르코에듀 강의를 담당할 전문 강사를 모집합니다.",
    responsibilities: ["강의 진행 및 커리큘럼 운영", "교재·부교재 활용 수업"],
    qualifications: ["해당 과목 강의 역량", "관련 분야 전문성"],
    preferred: ["강의 경력", "고득점·합격 지도 실적"],
    workType: "강사 계약",
    location: "해당 캠퍼스 / 온라인",
    processId: "teacher",
  },
];

/** 그룹 순서 (표시용) */
export const TEMPLATE_GROUPS = [
  "개발·데이터",
  "콘텐츠 연구",
  "기획·마케팅",
  "학원사업",
  "출판·영업",
  "경영지원",
  "전문강사",
];
