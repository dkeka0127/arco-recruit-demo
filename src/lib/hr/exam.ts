// ════════════════════════════════════════════════════════════════
//  필기시험 도메인 헬퍼 — 채점·무결성 계산 (순수 함수, 서버/클라 공용)
//  프로그래머스식 온라인 시험의 사내 구현: 자동 채점(선택·단답)과
//  프록터링 이벤트 → 무결성 점수 환산을 여기서 담당한다.
// ════════════════════════════════════════════════════════════════

import type {
  ExamAnswer,
  ExamEvent,
  ExamEventType,
  ExamProctorPolicy,
  ExamQuestion,
  ExamSession,
  ExamSnapshot,
  ExamTemplate,
} from "./types";

/**
 * 채점·응시 계산의 입력 — 문항·시간·정책만 필요하므로 시험 세트(ExamTemplate)와
 * 세션 스냅샷(ExamSnapshot) 양쪽 다 받는 구조 타입.
 */
export type ExamSpec = Pick<
  ExamTemplate,
  "title" | "durationMin" | "shuffle" | "proctor" | "passingScore" | "questions"
>;

/** 시험 세트 → 배정 시점 스냅샷 (깊은 복사로 이후 수정과 분리) */
export function buildSnapshot(t: ExamTemplate): ExamSnapshot {
  return {
    title: t.title,
    durationMin: t.durationMin,
    shuffle: t.shuffle,
    proctor: { ...t.proctor },
    passingScore: t.passingScore,
    questions: t.questions.map((q) => ({
      ...q,
      options: q.options ? [...q.options] : undefined,
      answerKey: Array.isArray(q.answerKey)
        ? ([...q.answerKey] as number[] | string[])
        : q.answerKey,
    })),
  };
}

export const DEFAULT_PROCTOR_POLICY: ExamProctorPolicy = {
  camera: true,
  screen: true,
  fullscreen: true,
  blockCopyPaste: true,
  maxViolations: 5,
};

// ── 채점 ─────────────────────────────────────────────────────────

/** 단답 정규화 — 대소문자·공백·구두점 차이를 무시하고 비교 */
function normalizeShort(v: string): string {
  return v.trim().toLowerCase().replace(/[\s.,;:'"()]+/g, "");
}

/** 자동 채점 — 선택형·단답만. 서술·코딩은 undefined(수동 채점 대상). */
export function autoGradeAnswer(
  q: ExamQuestion,
  a: ExamAnswer | undefined,
): number | undefined {
  if (q.type === "서술" || q.type === "코딩") return undefined;
  if (!a) return 0;
  if (q.type === "단답") {
    const keys = (q.answerKey as string[] | undefined) ?? [];
    const given = normalizeShort(a.text ?? "");
    return given && keys.some((k) => normalizeShort(k) === given) ? q.points : 0;
  }
  // 단일선택·다중선택 — 정답 집합 완전 일치
  const keys = new Set(((q.answerKey as number[] | undefined) ?? []).map(Number));
  const given = new Set((a.selected ?? []).map(Number));
  if (keys.size === 0) return 0;
  const match =
    keys.size === given.size && [...keys].every((k) => given.has(k));
  return match ? q.points : 0;
}

export function maxScoreOf(t: ExamSpec): number {
  return t.questions.reduce((sum, q) => sum + q.points, 0);
}

export interface ExamScoreSummary {
  auto: number;
  manual: number;
  total: number;
  max: number;
  /** 수동 채점이 아직 필요한 문항 수 */
  pendingManual: number;
}

export function scoreSummary(
  t: ExamSpec,
  answers: ExamAnswer[],
): ExamScoreSummary {
  let auto = 0;
  let manual = 0;
  let pendingManual = 0;
  for (const q of t.questions) {
    const a = answers.find((x) => x.questionId === q.id);
    if (q.type === "서술" || q.type === "코딩") {
      if (typeof a?.manualScore === "number") manual += a.manualScore;
      else pendingManual++;
    } else {
      auto += a?.autoScore ?? autoGradeAnswer(q, a) ?? 0;
    }
  }
  return { auto, manual, total: auto + manual, max: maxScoreOf(t), pendingManual };
}

// ── 무결성 (부정행위 신호 → 점수) ────────────────────────────────

/** 이벤트 유형별 감점 — 한 번의 이탈이 곧 부정은 아니므로 누적·상한 관리 */
const PENALTY: Partial<Record<ExamEventType, { per: number; cap: number }>> = {
  탭이탈: { per: 8, cap: 32 },
  전체화면이탈: { per: 10, cap: 40 },
  복사시도: { per: 4, cap: 16 },
  붙여넣기시도: { per: 6, cap: 24 },
  우클릭차단: { per: 2, cap: 8 },
  화면공유중단: { per: 20, cap: 40 },
  카메라중단: { per: 20, cap: 40 },
  다중모니터감지: { per: 15, cap: 15 },
  위반한도초과: { per: 30, cap: 30 },
};

export interface IntegrityReport {
  score: number; // 0~100, 100 = 신호 없음
  flags: { label: string; count: number; deducted: number }[];
}

export function computeIntegrity(events: ExamEvent[]): IntegrityReport {
  const counts = new Map<ExamEventType, number>();
  for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  let deduction = 0;
  const flags: IntegrityReport["flags"] = [];
  for (const [type, count] of counts) {
    const rule = PENALTY[type];
    if (!rule) continue;
    const d = Math.min(rule.per * count, rule.cap);
    deduction += d;
    flags.push({ label: type, count, deducted: d });
  }
  flags.sort((a, b) => b.deducted - a.deducted);
  return { score: Math.max(0, 100 - deduction), flags };
}

export function integrityTone(score: number): "signal" | "accent" | "danger" {
  if (score >= 90) return "signal";
  if (score >= 70) return "accent";
  return "danger";
}

// ── 세션 상태 헬퍼 ──────────────────────────────────────────────

/** 응시 종료 예정 시각 (진행중 세션) */
export function examEndsAt(session: ExamSession, t: ExamSpec): number {
  if (!session.startedAt) return 0;
  return new Date(session.startedAt).getTime() + t.durationMin * 60_000;
}

export function isExamExpired(session: ExamSession): boolean {
  return (
    session.status === "발급" &&
    new Date(session.expiresAt).getTime() < Date.now()
  );
}

/** 응시자별 문항 순서 — shuffle이면 세션 id 기반 결정론적 셔플(새로고침에도 유지) */
export function orderedQuestions(
  t: ExamSpec,
  sessionId: string,
): ExamQuestion[] {
  if (!t.shuffle) return t.questions;
  let h = 0;
  for (let i = 0; i < sessionId.length; i++)
    h = (h * 31 + sessionId.charCodeAt(i)) | 0;
  const arr = [...t.questions];
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const QUESTION_TYPE_LABEL: Record<ExamQuestion["type"], string> = {
  단일선택: "객관식(단일)",
  다중선택: "객관식(복수)",
  단답: "단답형",
  서술: "서술형",
  코딩: "코딩형",
};
