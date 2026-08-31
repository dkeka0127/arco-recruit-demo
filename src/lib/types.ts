// ════════════════════════════════════════════════════════════════
//  아르코채용 — 데이터 레이어 타입 (레거시 1:1 보존)
//  docs/legacy/01~07*.md 의 verbatim 콘텐츠를 담기 위한 도메인 타입.
// ════════════════════════════════════════════════════════════════

// ── 일반직 채용공고 ───────────────────────────────────────────────

/** 공고 형태(원문 그대로). 예: "경력" | "신입" | "신입,경력" | "인턴" */
export type JobFormat = "경력" | "신입" | "신입,경력" | "인턴";

/** 공고 상태(원문 버튼/뱃지). "지원하기" = 접수중, "마감" = 마감 */
export type JobStatus = "지원하기" | "마감";

/** 일반직 채용공고 목록 항목 (A등급: 제목·형태·접수기간·상태 원문 보존) */
export interface JobPosting {
  /** slug id (라우팅용). 레거시 idx가 있으면 함께 보존 */
  id: string;
  /** 레거시 목록 번호 (전체보기 기준) */
  no: number;
  /** 레거시 idx (상세가 있는 공고만) */
  legacyIdx?: number;
  /** 형태(구분) 원문 그대로 */
  format: JobFormat;
  /** 카테고리 라벨 — 제목 머리의 [개발]/[기획] 등 원문 */
  categoryLabel: string;
  /** 제목 원문 그대로 (머리 대괄호 포함하지 않은 본문 제목) */
  title: string;
  /** 접수기간 원문 string (예: "2026.06.10 ~ 채용시까지") */
  period: string;
  /** 상태/버튼 원문 */
  status: JobStatus;
  /** 상세 페이지 데이터가 존재하는가 */
  hasDetail?: boolean;
}

/** 상세 공고의 "담당업무 및 자격/우대사항" 표 (행: 라벨/내용) */
export interface JobDetailRow {
  label: string;
  /** 내용. 여러 줄은 배열로 보존 (원문 <br> 단위) */
  value: string[];
}

/** 일반직 채용공고 상세 (idx-786, idx-858) */
export interface JobDetail {
  id: string;
  legacyIdx: number;
  /** 공고 제목 바 원문 (예: "[신입/경력][기획] 교재 영업사원 채용") */
  titleBar: string;
  /** 채용형태 표기 원문 (예: "[신입/경력]") */
  employmentType: string;
  /** 접수기간 원문 */
  period: string;
  /** 좌측 셀 라벨 원문 (예: "교재 영업사원 채용 [채용 시 마감]") */
  detailLabel: string;
  /** 담당업무 및 자격/우대사항 표 */
  rows: JobDetailRow[];
  /** ※ 기타사항 (원문 불릿) */
  etc: string[];
  /** 서류접수/지원방법 (idx-858 등 일부 공고에만 존재) */
  applyMethod?: { heading: string; items: string[] }[];
  /** 채용절차 (idx-858 등 일부 공고에만 존재) */
  processGroups?: { heading: string; steps: string[] }[];
  /** 공고 하단 라인 원문 */
  footerLine?: string;
}

/** 일반직 채용절차 (공통) — 두 가지 절차 + 단계 설명 */
export interface GeneralProcess {
  /** "1. 필기 전형이 진행되는 직무 채용 절차" 등 */
  title: string;
  steps: { no: string; name: string }[];
}

// ── 채널: 영어연구원 / 전문강사 / Foreign ─────────────────────────

export type ChannelKey = "english-research" | "teacher" | "foreign";

/** 전형절차 단계 (단계명 원문 보존) */
export interface ProcessStage {
  /** "01" 등 단계 번호 */
  no: string;
  /** 단계명 원문 */
  name: string;
}

/** 영어연구원모집 */
export interface EngResearch {
  bannerTitle: string;
  bannerLead: string[];
  jobGuide: string[];
  qualifications: string[];
  process: ProcessStage[];
  documentsNote: string;
  documents: string[];
  etc: string[];
  applyButton: string;
  applyNote: string;
}

/** 전문강사 모집분야 (22개) */
export interface TeacherField {
  /** 분야명 (예: "영어", "중국어") */
  field: string;
  /** 과목/내용 원문 (여러 줄 보존) */
  content: string[];
}

/** 전문강사모집 */
export interface TeacherRecruit {
  bannerTitle: string[];
  bannerLead: string[];
  fields: TeacherField[];
  /** 모집분야 표 하단 ※ 안내 */
  fieldsNote: string;
  qualifications: string[];
  process: ProcessStage[];
  /** 전형절차 단계별 설명 */
  processNotes: string[];
  documentsNote: string;
  documents: string[];
  etc: string[];
  applyButton: string;
  applyNote: string;
}

/** Foreign Recruiting (영문 전체 구조) */
export interface ForeignRecruit {
  pageTitle: string;
  position: string; // "Writer/Editor Position"
  jobDescription: string[];
  basicQualifications: string[];
  benefits: { label: string; detail: string }[];
  applicationStages: { stage: string; description: string }[];
  applicationNote: string;
  requiredDocuments: string[];
  documentNotes: string[];
  contact: { person: string; email: string; address: string; addressKo: string };
  mapLabels: string[];
}

// ── 공지사항 ──────────────────────────────────────────────────────

/** 공지 목록 항목 (번호/제목/작성일 원문) */
export interface Notice {
  /** slug/idx id */
  id: string;
  legacyIdx?: number;
  /** 번호 칸 원문 ("알림" 또는 숫자 문자열) */
  no: string;
  /** 제목 원문 */
  title: string;
  /** 작성일 원문 (예: "2025.12.11") */
  date: string;
  /** [FAQ] 등 분류 라벨 (제목에서 추출, 원문 보존) */
  category?: string;
  /** 첨부 아이콘 여부 */
  hasAttachment?: boolean;
  /** 빨간색 강조 여부 */
  highlight?: boolean;
  /** 상세 본문(있을 경우) */
  body?: NoticeBody;
}

/** 공지 상세 본문 — 자유 블록 구조 (원문 보존) */
export interface NoticeBody {
  /** 게시글 제목(박스) 원문 */
  title: string;
  /** 날짜 원문 (상세 기준) */
  date?: string;
  /** 본문 블록 (단락/리스트 등) */
  blocks: NoticeBlock[];
}

export type NoticeBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "button"; label: string }
  | { type: "note"; text: string };

// ── FAQ / Q&A ────────────────────────────────────────────────────

/** FAQ 주제 (원문) */
export type FaqTopic = "온라인입사지원" | "채용일반사항" | "채용프로세스";

/** FAQ 목록 항목 (번호/주제/제목/답변 원문) */
export interface FaqItem {
  no: number;
  topic: FaqTopic;
  title: string;
  /** 답변 본문 — 여러 단락은 "\n"으로 구분, 원문 그대로 보존 */
  answer: string;
}

/** Q&A 폼 안내/정책 */
export interface QnaInfo {
  titleBar: { title: string; desc: string };
  notices: string[];
  faqButtonLabel: string;
  fields: { label: string; hint?: string }[];
  privacyTitle: string;
  privacyItems: string[];
  agreeLabel: string;
  submitLabel: string;
}

// ── 아르코 피플 ────────────────────────────────────────────────────

/** 인재상 4 (키워드/영문/2줄 설명 원문) */
export interface TalentValue {
  position: "좌상" | "우상" | "좌하" | "우하";
  keyword: string; // 열정인 등
  en: string; // Passionate 등
  desc: string[]; // 2줄 설명 원문
}

/** 직무소개 (19개) */
export interface JobIntro {
  /** slug id */
  id: string;
  /** 직무명 원문 (예: "기획/마케팅") */
  name: string;
  /** 헤드라인 원문 (없으면 미보유) */
  headline?: string;
  /** 설명 본문 원문 */
  description?: string;
  /** 주요업무 원문 */
  responsibilities?: string[];
  /** 우대사항 원문 */
  preferred?: string[];
  /** 상세 본문 확보 여부 (false면 목록 타일만 존재) */
  hasDetail: boolean;
}

/** 복리후생 ARCOEDU 7블록 (영문명·국문 슬로건·세부항목) */
export interface BenefitBlock {
  /** Health 등 영문명 */
  en: string;
  /** "건강한 아르코에듀" 등 국문 슬로건 */
  ko: string;
  /** 세부 항목 원문 */
  items: string[];
}

/** 기업문화 카피 */
export interface CultureCopy {
  header: { title: string; desc: string };
  videoCaption: string[];
}

// ── 회사소개 ──────────────────────────────────────────────────────

/** 아르코에듀 소개 + ARCO MOVIE */
export interface CompanyGroup {
  heading: string;
  paragraphs: string[];
  movies: string[]; // 8편 제목
  playerLabels: string[];
}

/** 아르코에듀 철학 */
export interface CompanyPhilosophy {
  intro: { title: string; body: string };
  ideal: { title: string; body: string };
  diagram: {
    center: string;
    nodes: { position: string; text: string; figure: string }[];
    bottomLabel: string;
  };
  bottomBody: string[];
}

/** 아르코에듀 나눔 활동 (헤더만, 본문 빈 상태 — 원문 그대로 보존) */
export interface CompanySharing {
  titleBar: { title: string; desc: string };
  /** 본문 비어있음(레거시 캡처가 헤더만 존재) */
  bodyEmpty: true;
}

/** 연혁 — 연도별 그룹 */
export interface CompanyHistoryYear {
  year: string; // "2025." 등 원문
  items: { month: string; text: string }[];
}

/** 사업분야 — 카테고리별 브랜드 묶음 */
export interface BusinessCategory {
  category: string; // "공무원" 등
  brands: string[]; // 브랜드명 원문
}

/** 사업분야 — 브랜드 상세 설명 (40섹션) */
export interface BusinessBrand {
  name: string; // 섹션 제목 원문
  description: string; // 상세 설명 원문
}

/** 장학제도 */
export interface Scholarship {
  titleBar: { title: string; desc: string };
  purpose: { title: string; body: string };
  scholarship: {
    title: string;
    amount: string;
    note: string;
    rows: { col1: string; col2: string; content: string }[];
  };
  announcement: {
    title: string;
    body: string;
    rows: { label: string; content: string }[];
  };
  contest: {
    title: string;
    intro: string;
    rows: { col1: string; col2: string; essay: string; speech: string }[];
    note: string;
  };
  contestSchedule: {
    headers: string[];
    essay: string[];
    speech: string[];
  };
  judges: { name: string; credentials: string[] }[];
}

/** 오시는 길 */
export interface Location {
  titleBar: { title: string; desc: string };
  mapLabels: { roads: string[]; buildings: string[]; exits: string[] };
  address: string;
  mainDirection: { summary: string; steps: string[] };
  /** 별관 ①~⑥ */
  annexes: { no: string; name: string; summary: string; steps: string[] }[];
  buttons: string[];
}

// ── 입사지원 ──────────────────────────────────────────────────────

export type ApplyTypeKey =
  | "general"
  | "english-research"
  | "teacher"
  | "talent-pool"
  | "modify"
  | "result";

/** 입사지원 유형/화면 안내 (정책 문구 원문 보존) */
export interface ApplyType {
  key: ApplyTypeKey;
  /** 페이지 배너 원문 */
  banner: { title: string; desc: string };
  /** 상단 안내 문구 (리드) */
  lead?: string[];
  /** ※ 참고 항목 */
  notes?: string[];
  /** 안내 섹션 (○ 등록방법 / ○ 유의사항 등) */
  sections?: { heading: string; items: string[] }[];
  /** 탭 (영어연구원/인재DB) */
  tabs?: string[];
  /** 로그인 영역 라벨 */
  loginLabels?: string[];
}

/** 입사지원서 작성 메인 (유형 카드 + 바로가기) */
export interface ApplyMain {
  banner: { title: string; desc: string };
  illustrationText: string[];
  categoryCards: string[];
  shortcuts: string[];
}

// ── 사이트 공통 (메인/네비/푸터) ──────────────────────────────────

export interface SiteData {
  hero: { lines: string[] };
  floatingButtons: string[];
  /** 진행중인 채용 탭 라벨 (NEW/신입/경력/인턴/전문강사) */
  ongoingTabs: string[];
  /** 진행중인 채용 목록 (메인 노출 원문) */
  ongoingJobs: string[];
  rightColumnBlocks: string[];
  centerBanner: { title: string; cta: string };
  homeNoticeAccordion: { title: string; highlight?: boolean }[];
  /** 패밀리(상단 띠) 메뉴 14개 */
  familyMenu: string[];
  logo: string;
  /** 메인 GNB */
  gnb: string[];
  /** 푸터 */
  footer: {
    brandBand: string[];
    links: string[];
    socials: string[];
    bottomLinks: string[];
    copyright: string;
  };
}

// ════════════════════════════════════════════════════════════════
//  Application payload / 마이페이지 (기존 — provider 가 계속 사용)
// ════════════════════════════════════════════════════════════════

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ApplicationPayload {
  jobId: string;
  name: string;
  email: string;
  phone: string;
  birth?: string;
  educations: {
    school: string;
    major: string;
    status: string;
    period: string;
  }[];
  experiences: {
    company: string;
    role: string;
    period: string;
    desc: string;
  }[];
  coverLetter: string;
  portfolioUrl?: string;
  files: UploadedFile[];
  agreePrivacy: boolean;
}

export interface ApplicationResult {
  applicationId: string;
  status: "submitted";
  submittedAt: string;
}

export type ApplicationStatus =
  | "접수완료"
  | "서류검토"
  | "서류합격"
  | "면접진행"
  | "최종합격"
  | "불합격";

export interface ApplicationRecord {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  team: string;
  submittedAt: string;
  status: ApplicationStatus;
  timeline: { label: string; date: string | null; done: boolean }[];
}
