// ════════════════════════════════════════════════════════════════
//  아르코에듀 HR 콘솔(ATS) — 도메인 타입
//  그리팅(greetinghr.com)의 역할을 대체하는 사내 채용관리 시스템.
//  백엔드 비종속: HrProvider 뒤에서 목업 → Supabase로 교체 가능.
// ════════════════════════════════════════════════════════════════

// ── 파이프라인(채용 프로세스) ────────────────────────────────────

/** 채용 단계. 인사팀이 설정에서 편집하며, 지원자 공개 여부를 단계별로 제어한다. */
export interface PipelineStage {
  id: string;
  /** 내부 단계명 (예: "서류 검토") */
  name: string;
  /** 지원자 마이페이지에 노출할 라벨 (미지정 시 name) */
  candidateLabel?: string;
  /** 지원자에게 이 단계 진입을 공개할지 */
  visibleToCandidate: boolean;
  /** 진행 단계 / 최종합격 / 탈락 구분 */
  kind: "active" | "hired" | "rejected";
  order: number;
}

// ── 공고 (HR 관점) ───────────────────────────────────────────────

export type HrJobStatus = "게시중" | "마감" | "임시저장" | "게시예정";

export interface HrJob {
  id: string;
  /** 공고 제목 (지원자 사이트와 동일 원문) */
  title: string;
  department: string;
  /** 채용 유형 */
  track: "일반직" | "전문강사" | "영어연구원" | "인턴";
  employment: "신입" | "경력" | "신입/경력" | "인턴";
  status: HrJobStatus;
  openedAt: string;
  /** null = 채용 시까지 */
  closesAt: string | null;
  /** 게시 채널 (자사 채용사이트, 외부 잡보드) */
  channels: string[];
  headcount: number;
  /** 담당자 memberId */
  managerId: string;

  // ── JD 본문 (지원자 사이트에 노출될 실제 공고 내용) ──
  /** 직무 개요 */
  description?: string;
  /** 담당 업무 */
  responsibilities?: string[];
  /** 자격 요건 */
  qualifications?: string[];
  /** 우대 사항 */
  preferred?: string[];
  /** 전형 절차 */
  process?: string[];
  /** 근무 형태 (정규직/계약직/인턴 등) */
  workType?: string;
  /** 근무지 */
  location?: string;
  /** 급여/처우 (비공개 시 빈 값) */
  salary?: string;
}

// ── 지원자 / 지원서 ──────────────────────────────────────────────

export interface CandidateEducation {
  school: string;
  major: string;
  status: string;
  period: string;
}

export interface CandidateExperience {
  company: string;
  role: string;
  period: string;
  desc: string;
}

export interface CandidateFile {
  name: string;
  size: string;
}

/** 지원자(사람). 여러 공고에 지원할 수 있다. */
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth?: string;
  /** 유입 경로 (자사 사이트, 사람인, 추천 등) */
  source: string;
  tags: string[];
  educations: CandidateEducation[];
  experiences: CandidateExperience[];
  coverLetter: string;
  portfolioUrl?: string;
  files: CandidateFile[];
  /**
   * 개인정보 파기(GDPR 삭제권) 완료 시각. 설정되면 식별 정보는 익명화되고
   * 통계·감사용 흔적(직군 태그·평가 점수 등 비식별)만 남는다. 되돌릴 수 없음.
   */
  anonymizedAt?: string;
}

/** AI 이력서 분석 (목업 — 추후 LLM 연동 슬롯) */
export interface AiInsight {
  /** 0~100 공고 적합도 */
  matchScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
}

/** 활동 타임라인 항목 */
export interface Activity {
  id: string;
  at: string;
  /** memberId 또는 "system" */
  actor: string;
  text: string;
}

export type EvaluationDecision = "강력추천" | "추천" | "보류" | "비추천";

/** 평가표(스코어카드) — 면접관/검토자가 남긴다 */
export interface Evaluation {
  id: string;
  evaluatorId: string;
  /** "서류 평가" | "1차 면접" 등 */
  round: string;
  decision: EvaluationDecision;
  scores: { item: string; score: number }[]; // 5점 만점
  comment: string;
  at: string;
  /** 제출 후 수정된 경우 마지막 수정 시각 (투명성 표시) */
  editedAt?: string;
}

/** 내부 코멘트 (멘션 지원) */
export interface HrComment {
  id: string;
  authorId: string;
  at: string;
  text: string;
  /** 수정된 경우 마지막 수정 시각 */
  editedAt?: string;
}

export type MessageKind =
  | "접수확인"
  | "서류합격"
  | "면접안내"
  | "최종합격"
  | "불합격"
  | "기타";

/** 발송 채널 — 실발송 연동 전까지는 기록만 (이메일이 기본) */
export type MessageChannel = "이메일" | "문자" | "알림톡";

/** 템플릿 유형 (그리팅과 동일 5분류) */
export type TemplateType = "메일" | "문자" | "평가표" | "면접" | "지원서";

export interface MessageTemplate {
  id: string;
  kind: MessageKind;
  name: string;
  subject: string;
  body: string;
  /** 미지정 시 메일 */
  templateType?: TemplateType;
}

export interface MessageLog {
  id: string;
  at: string;
  subject: string;
  kind: MessageKind;
  status: "발송됨" | "예약됨";
  /** 미지정 시 이메일 */
  channel?: MessageChannel;
  /** 예약 발송 예정 시각 (status가 예약됨일 때) */
  scheduledAt?: string;
  /** 발송된 본문 (변수 치환 완료본 — 이력에서 실제 문면 확인용) */
  body?: string;
}

// ── 워크스페이스 이메일 (지원자와 양방향 대화) ──────────────────

/**
 * 지원자와 주고받는 실제 이메일 한 통.
 * 발신 = 인사팀 → 지원자, 수신 = 지원자 → 워크스페이스 이메일.
 * 운영 전환 시 발신은 SES, 수신은 메일 제공자 웹훅(/api/mail/inbound)이
 * 채운다. 목업에서는 스토어 액션으로 동일하게 동작한다.
 */
export interface EmailMessage {
  id: string;
  direction: "발신" | "수신";
  from: string;
  to: string;
  subject: string;
  body: string;
  at: string;
  /** 수신 메일 확인 여부 (발신은 항상 true) */
  read: boolean;
}

/** 지원서 = 지원자 × 공고. 파이프라인 위를 이동하는 단위. */
export interface HrApplication {
  id: string;
  candidateId: string;
  jobId: string;
  stageId: string;
  appliedAt: string;
  updatedAt: string;
  starred: boolean;
  ai: AiInsight;
  activities: Activity[];
  evaluations: Evaluation[];
  comments: HrComment[];
  messages: MessageLog[];
  /** 지원자와의 이메일 대화 스레드 (미지정 시 빈 스레드) */
  emails?: EmailMessage[];
  /** 탈락 시 사유 */
  rejectReason?: string;
  /** 지원 철회 — 지원자 요청 등. 파이프라인 밖으로 빠지고 목록에서 흐리게 표시 */
  withdrawnAt?: string;
  withdrawReason?: string;
}

// ── 면접 일정 ────────────────────────────────────────────────────

export type InterviewStatus = "예정" | "평가대기" | "완료" | "취소";

/**
 * 패널 종합 의견 — 대표 면접관이 배석 평가를 취합해 작성하는 결론.
 * HR은 개별 스코어카드 대신 이것을 1차 근거로 단계를 결정한다.
 */
export interface PanelSummary {
  decision: EvaluationDecision;
  text: string;
  /** 작성자(대표 면접관) memberId */
  byId: string;
  at: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  round: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;
  /** 장소 또는 "화상 면접" */
  location: string;
  /** 화상 면접 입장 링크 (있으면 포털에 입장 버튼 노출) */
  meetingUrl?: string;
  interviewerIds: string[];
  /** 대표 면접관 — 종합 의견 작성 책임 (미지정 시 첫 번째 면접관) */
  leadId?: string;
  status: InterviewStatus;
  note?: string;
  /** 대표 면접관의 패널 종합 의견 */
  panelSummary?: PanelSummary;
  /**
   * 면접관의 일정 변경 요청 (미해결 시에만 존재). HR이 일정을 수정하거나
   * 요청을 닫으면 제거된다 — 포털 "이 시간 안 됩니다" 채널.
   */
  rescheduleRequest?: { by: string; reason: string; at: string };
}

// ── 면접 일정 자동 조율 ──────────────────────────────────────────

export interface ProposalSlot {
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;
}

/**
 * 면접 일정 제안 — HR이 시간 후보를 보내면 지원자가 /my에서 선택,
 * 선택 즉시 Interview가 자동 생성·확정된다. (그리팅의 일정 조율 대체)
 */
export interface InterviewProposal {
  id: string;
  applicationId: string;
  round: string;
  location: string;
  interviewerIds: string[];
  /** 대표 면접관 (확정 시 Interview.leadId로 승계) */
  leadId?: string;
  slots: ProposalSlot[];
  status: "대기" | "확정" | "취소";
  sentAt: string;
  confirmedSlot?: ProposalSlot;
}

// ── 필기시험 (웹 프록터링) ───────────────────────────────────────

export type ExamQuestionType = "단일선택" | "다중선택" | "단답" | "서술" | "코딩";

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  /** 문항 이미지 (도표·그래프) — 압축된 data URL. 운영 고도화 시 Storage URL로 교체 가능 */
  imageUrl?: string;
  /** 선택형 보기 */
  options?: string[];
  /** 정답 — 선택형: 정답 보기 인덱스들 / 단답: 허용 답안 문자열들(대소문자·공백 무시) */
  answerKey?: number[] | string[];
  points: number;
  /** 코딩형 문항의 시작 코드 */
  starterCode?: string;
}

/** 부정행위 방지 정책 — 시험 세트 단위로 설정 */
export interface ExamProctorPolicy {
  /** 캠·마이크 녹화 필수 */
  camera: boolean;
  /** 전체 화면 공유·녹화 필수 */
  screen: boolean;
  /** 전체화면 모드 강제 (이탈 시 경고·기록) */
  fullscreen: boolean;
  /** 복사·붙여넣기·우클릭 차단 */
  blockCopyPaste: boolean;
  /** 이탈 경고 허용 횟수 — 초과 시 자동 제출 + 플래그 */
  maxViolations: number;
}

/**
 * 필기시험 세트 — 사내 문항으로 구성. HR이 /hr/exams에서 관리한다.
 * 직군·사업군이 많아 고정 매핑 대신 "라이브러리" 방식: category 태그로
 * 모아두고, 그때그때 새로 만들거나 기존 세트를 복제해 변형한다.
 */
export interface ExamTemplate {
  id: string;
  title: string;
  description: string;
  /** 직군/분류 태그 (자유 입력 — 예: 개발, 영어연구, 공통 인적성). 미지정 = 미분류 */
  category?: string;
  durationMin: number;
  questions: ExamQuestion[];
  proctor: ExamProctorPolicy;
  /** 응시자별 문항 순서 섞기 */
  shuffle: boolean;
  /** 합격선(총점 기준) — 채점 시 합불 제안 근거. 미설정 시 제안 없음 */
  passingScore?: number;
  createdAt: string;
}

export type ExamEventType =
  | "입장"
  | "이어하기"
  | "신분확인"
  | "장비점검완료"
  | "녹화시작"
  | "전체화면이탈"
  | "전체화면복귀"
  | "탭이탈"
  | "탭복귀"
  | "복사시도"
  | "붙여넣기시도"
  | "우클릭차단"
  | "화면공유중단"
  | "카메라중단"
  | "다중모니터감지"
  | "위반한도초과"
  | "시간초과자동제출"
  | "제출";

/** 응시 중 발생한 활동/부정행위 신호 1건 */
export interface ExamEvent {
  id: string;
  at: string;
  type: ExamEventType;
  detail?: string;
}

export interface ExamAnswer {
  questionId: string;
  /** 선택형 답 — 보기 인덱스 배열 */
  selected?: number[];
  /** 단답·서술·코딩 답 */
  text?: string;
  /** 자동 채점 점수 (선택형·단답 — 제출 시 계산) */
  autoScore?: number;
  /** 수동 채점 점수 (서술·코딩 — HR이 입력) */
  manualScore?: number;
}

export type ExamSessionStatus =
  | "발급" // 링크 발급, 미응시
  | "진행중"
  | "제출" // 응시 완료, 채점 대기
  | "채점완료"
  | "만료" // 기한 내 미응시
  | "중단"; // HR이 취소 (링크 즉시 무효화)

/**
 * 응시 세션 = 지원서 × 시험 세트. 지원자는 /exam/[token] 개인 링크로
 * 로그인 없이 응시한다. 녹화 원본은 스토어 밖(IndexedDB/Storage)에 두고
 * 여기엔 메타·이벤트·답안만 남긴다.
 */
/**
 * 응시 시점에 고정된 시험 스냅샷 — 배정 후 세트를 수정·삭제해도
 * 이 세션의 문항·배점·정책·합격선은 바뀌지 않는다(채점 무결성).
 */
export interface ExamSnapshot {
  title: string;
  durationMin: number;
  shuffle: boolean;
  proctor: ExamProctorPolicy;
  passingScore?: number;
  questions: ExamQuestion[];
}

export interface ExamSession {
  id: string;
  applicationId: string;
  templateId: string;
  /**
   * 배정 시점 시험 스냅샷. 존재하면 응시·채점이 이걸 기준으로 하고,
   * 없으면(구 세션) 현재 templateId의 세트를 참조(하위 호환).
   */
  snapshot?: ExamSnapshot;
  /** 응시 링크 토큰 — 세션 취소(중단) 시 즉시 무효화 */
  token: string;
  status: ExamSessionStatus;
  /** 재응시 회차 — 1이 최초 응시. 없으면 1로 간주(구 세션 호환) */
  attempt?: number;
  /** 재응시일 때 직전 세션 id — 회차 이력 추적 */
  retakeOfId?: string;
  assignedAt: string;
  /** 응시 마감 기한 (이후 입장 불가) */
  expiresAt: string;
  startedAt?: string;
  submittedAt?: string;
  answers: ExamAnswer[];
  /** 응시 이벤트 로그 (프록터링 신호 포함, 상한 500) */
  events: ExamEvent[];
  /** 무결성 점수 0~100 (100 = 신호 없음) — 제출 시 이벤트에서 계산 */
  integrityScore?: number;
  /** 녹화 메타 — 실데이터는 응시 브라우저 IndexedDB(+Supabase Storage) */
  recording?: {
    camChunks: number;
    screenChunks: number;
    snapshots: number;
    idPhoto?: boolean;
    /** Supabase Storage 업로드 여부 (데모 모드는 false) */
    uploaded?: boolean;
  };
  totalScore?: number;
  maxScore?: number;
  gradedBy?: string;
  gradedAt?: string;
  note?: string;
}

// ── 인재풀 ───────────────────────────────────────────────────────

export interface TalentEntry {
  id: string;
  name: string;
  role: string;
  tags: string[];
  addedAt: string;
  /** 개인정보 보관 만료일 */
  expiresAt: string;
  source: string;
  note: string;
  /** 과거 지원 이력 */
  lastApplied?: string;
}

// ── 멤버 / 권한 / 설정 ───────────────────────────────────────────

/**
 * 관리자/실무진/열람 = HR 콘솔 운영진.
 * 면접관 = 콘솔 접근 없이 포털만 쓰는 현업 (800명 조직 기준 100명+ 규모).
 */
export type MemberRole = "관리자" | "실무진" | "열람" | "면접관";

export interface HrMember {
  id: string;
  name: string;
  email: string;
  team: string;
  role: MemberRole;
  /**
   * 면접관 포털(/interviewer/[token]) 개인 고정 링크 토큰.
   * 로그인 없이 본인 면접·평가·알림에 접근한다. 유출 시 재발급(교체)한다.
   */
  portalToken: string;
  /** false = 비활성(퇴사 등) — 면접관 선택·포털 접근 차단, 이력은 보존 */
  active?: boolean;
}

// ── 면접관 알림 ──────────────────────────────────────────────────

export type NoticeKind = "일정조율" | "면접확정" | "면접취소" | "평가요청";

/**
 * 면접관에게 가는 통지 1건. 스토어에 쌓이면 포털 알림함에 표시되고,
 * 포털이 열려 있는 브라우저에는 데스크톱 알림(Notification API)이 뜬다.
 * 메일은 sender(발송 추상화)를 거친다 — SES 연동 전에는 목업 기록.
 */
export interface InterviewerNotice {
  id: string;
  memberId: string;
  at: string;
  kind: NoticeKind;
  title: string;
  body: string;
  applicationId?: string;
  interviewId?: string;
  read: boolean;
  /** 메일이 실발송이었는지 (false = 목업 기록) */
  mailedLive: boolean;
}

/** 워크스페이스 설정 — 지원자 공개 정책이 /my 페이지와 연동된다 */
export interface HrSettings {
  /** 지원자 마이페이지에 현재 단계 공개 */
  showStageToCandidate: boolean;
  /** 지원자 마이페이지에 전형 타임라인 공개 */
  showTimelineToCandidate: boolean;
  /** 단계 변경 시 지원자에게 자동 알림(목업) */
  notifyOnStageChange: boolean;
  /** 개인정보 보관 기간(년) */
  retentionYears: number;
  /** 워크스페이스 발신·수신 이메일 주소 (지원자와 대화) */
  workspaceEmail?: string;
  /** 실제 메일 수신 연동 여부. 운영 전환 시 true — 이 값이 곧 "설정 한 가지". */
  mailInboundConnected?: boolean;
}

// ── 감사 로그 (위험 액션 기록·되돌리기) ─────────────────────────

export type AuditAction =
  | "stage_changed"
  | "bulk_stage_changed"
  | "rejected"
  | "hired"
  | "message_sent"
  | "message_scheduled"
  | "message_canceled"
  | "duplicate_merged"
  | "talent_added"
  | "talent_deleted"
  | "interview_proposed"
  | "interview_confirmed"
  | "interview_canceled"
  | "reschedule_requested"
  | "evaluation_added"
  | "settings_changed"
  | "file_downloaded"
  | "exam_assigned"
  | "exam_submitted"
  | "exam_graded"
  | "exam_canceled"
  | "application_withdrawn"
  | "candidate_anonymized"
  | "candidate_registered";

export type AuditTarget =
  | "application"
  | "candidate"
  | "job"
  | "message"
  | "interview"
  | "talent"
  | "settings"
  | "exam";

export interface AuditLog {
  id: string;
  at: string;
  actorId: string;
  action: AuditAction;
  targetType: AuditTarget;
  targetId: string;
  /** 사람이 읽는 설명 (대시보드·활동로그 표시용) */
  summary: string;
  /** 개인정보 접근성 액션 표시 */
  sensitive?: boolean;
  /** 되돌리기 가능 여부 (발송 등은 false) */
  undoable: boolean;
}

// ── 권한 매트릭스 (UI 표시용 — 실인증은 추후) ────────────────────

/** 권한 항목 키 */
export type Capability =
  | "viewAllApplicants"
  | "viewAssignedOnly"
  | "writeEvaluation"
  | "changeStage"
  | "decideHireReject"
  | "sendMessage"
  | "exportExcel"
  | "downloadPii"
  | "changeSettings"
  | "deleteTalent";

// ── 스토어 스냅샷 (localStorage 직렬화 단위) ─────────────────────

export interface HrState {
  version: number;
  stages: PipelineStage[];
  jobs: HrJob[];
  candidates: Candidate[];
  applications: HrApplication[];
  interviews: Interview[];
  /** 조율 중인 면접 일정 제안 */
  proposals: InterviewProposal[];
  /** 필기시험 세트 */
  examTemplates: ExamTemplate[];
  /** 필기시험 응시 세션 */
  examSessions: ExamSession[];
  /** 면접관 통지함 (최신순) */
  notices: InterviewerNotice[];
  talent: TalentEntry[];
  members: HrMember[];
  templates: MessageTemplate[];
  settings: HrSettings;
  /** 중복 감지에서 "무시" 처리한 그룹 키 */
  dismissedDupes: string[];
  /** 위험 액션 감사 로그 (최신순) */
  auditLog: AuditLog[];
}

// ── 역할 → 권한 매핑 (표시용 상수) ──────────────────────────────

export const ROLE_CAPABILITIES: Record<MemberRole, Capability[]> = {
  관리자: [
    "viewAllApplicants", "writeEvaluation", "changeStage", "decideHireReject",
    "sendMessage", "exportExcel", "downloadPii", "changeSettings", "deleteTalent",
  ],
  실무진: [
    "viewAllApplicants", "writeEvaluation", "changeStage", "decideHireReject",
    "sendMessage", "exportExcel",
  ],
  열람: ["viewAllApplicants"],
  면접관: ["viewAssignedOnly", "writeEvaluation"],
};

export const CAPABILITY_LABELS: Record<Capability, string> = {
  viewAllApplicants: "지원자 전체 열람",
  viewAssignedOnly: "배정 지원자만 열람",
  writeEvaluation: "평가 작성",
  changeStage: "단계 변경",
  decideHireReject: "합불 처리",
  sendMessage: "메시지 발송",
  exportExcel: "엑셀 다운로드",
  downloadPii: "개인정보 다운로드",
  changeSettings: "설정 변경",
  deleteTalent: "인재풀 파기",
};
