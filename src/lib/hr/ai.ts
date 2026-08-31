// ════════════════════════════════════════════════════════════════
//  AI 추상화 레이어 (AiProvider)
//
//  ATS의 AI 기능을 한 인터페이스 뒤에 모은다. 지금은 MockAiProvider가
//  결정적 목업을 반환하고, 추후 ClaudeAiProvider(서버 라우트 → Claude API)로
//  교체하면 UI/스토어는 그대로 둔 채 실제 AI로 승격된다.
//
//  설계 원칙:
//  - 모든 메서드는 async — Mock도 실제도 동일 시그니처(await 자연스러움)
//  - AI 산출물은 반드시 근거(reasons)와 함께 → 설명가능성/공정성(§규제)
//  - 최종 채용 결정은 사람이 — AI는 "보조 신호"로만 표기(UI에서 목업 명시)
// ════════════════════════════════════════════════════════════════

import type {
  Candidate,
  HrJob,
  TalentEntry,
  AiInsight,
  ExamQuestion,
  ExamQuestionType,
} from "./types";

// ── AI 산출물 타입 ───────────────────────────────────────────────

/** 이력서 파싱 결과 (파일/원문 → 구조화) */
export interface ParsedResume {
  years: number;
  skills: string[];
  highlights: string[];
  /** 추출 신뢰도 0~1 (사람 검수 유도) */
  confidence: number;
}

/** 공고 대비 서류 스크리닝 결과 */
export interface ScreeningResult extends AiInsight {
  /** 공고 요구사항별 충족 여부 근거 */
  criteria: { requirement: string; met: boolean; evidence: string }[];
}

/** 인재풀 랭킹 항목 */
export interface TalentRanking {
  talentId: string;
  score: number;
  reasons: string[];
}

/** 자기소개서 AI 작성/표절 의심 신호 */
export interface AuthenticitySignal {
  /** 0~100, 높을수록 AI 생성/표절 의심 */
  aiLikelihood: number;
  verdict: "낮음" | "보통" | "높음";
  notes: string[];
}

/** 면접 기록 요약 */
export interface InterviewDigest {
  summary: string;
  strengths: string[];
  concerns: string[];
  suggestedQuestions: string[];
}

export interface AiProvider {
  /** 실제 AI 백엔드가 연결되어 있는가 (UI 뱃지/문구 분기용) */
  readonly live: boolean;

  parseResume(candidate: Candidate): Promise<ParsedResume>;
  screenApplication(
    candidate: Candidate,
    job: HrJob,
  ): Promise<ScreeningResult>;
  rankTalent(job: HrJob, pool: TalentEntry[]): Promise<TalentRanking[]>;
  detectAuthenticity(coverLetter: string): Promise<AuthenticitySignal>;
  summarizeInterview(notes: string): Promise<InterviewDigest>;
  /** 공고 초안 자동 생성 (직무명·부서 → JD 문단) */
  generateJobDraft(input: {
    title: string;
    department: string;
    track: string;
  }): Promise<string>;
  /** 지원자 메시지 초안 (템플릿 톤 유지) */
  draftMessage(input: {
    kind: string;
    candidateName: string;
    jobTitle: string;
  }): Promise<string>;
  /**
   * 필기시험 문항 초안 생성 — 직군·주제를 넣으면 문항 스캐폴드를 만든다.
   * 목업은 구조가 잡힌 초안(내용 검토 필수)을, 실AI 연동 시 실제 문항을 생성.
   */
  generateExamQuestions(input: {
    role: string; // 직군 (예: 개발, 영어연구)
    topic: string; // 출제 주제 (예: 자료구조, 영문법)
    type: ExamQuestionType | "혼합";
    count: number;
  }): Promise<ExamQuestion[]>;
}

// ── 결정적 목업 구현 ─────────────────────────────────────────────

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function yearsFromExperiences(c: Candidate): number {
  // "2021.04 ~ 재직중" 같은 문자열에서 대략 연차 추정 (목업)
  return c.experiences.reduce((sum, e) => {
    const m = e.period.match(/(\d{4})/g);
    if (!m) return sum + 1;
    const start = Number(m[0]);
    const end = /재직|현재|present/i.test(e.period)
      ? 2026
      : Number(m[1] ?? m[0]);
    return sum + Math.max(1, end - start);
  }, 0);
}

class MockAiProvider implements AiProvider {
  readonly live = false;

  async parseResume(c: Candidate): Promise<ParsedResume> {
    return {
      years: yearsFromExperiences(c),
      skills: c.tags,
      highlights: c.experiences.slice(0, 2).map((e) => `${e.company} · ${e.role}`),
      confidence: 0.72,
    };
  }

  async screenApplication(
    c: Candidate,
    job: HrJob,
  ): Promise<ScreeningResult> {
    const jobText = `${job.title} ${job.department} ${job.track}`.toLowerCase();
    const hits = c.tags.filter((t) => jobText.includes(t.toLowerCase()));
    const base = 55 + hits.length * 12 + (hash(c.id + job.id) % 16);
    const score = Math.min(97, base);
    return {
      matchScore: score,
      summary: `${c.name}님은 ${c.tags.slice(0, 3).join("·")} 역량을 보유. 공고와 태그 ${hits.length}건 일치 (목업 스크리닝).`,
      strengths: hits.length
        ? hits.map((h) => `${h} 역량이 공고와 부합`)
        : ["기본 직무 요건 충족 추정"],
      concerns:
        hits.length < 2 ? ["공고 핵심 요건과의 정합성 추가 확인 필요"] : [],
      criteria: c.tags.slice(0, 3).map((t) => ({
        requirement: t,
        met: jobText.includes(t.toLowerCase()),
        evidence: jobText.includes(t.toLowerCase())
          ? "공고 본문에 관련 키워드 존재"
          : "공고에서 직접 언급 안 됨",
      })),
    };
  }

  async rankTalent(job: HrJob, pool: TalentEntry[]): Promise<TalentRanking[]> {
    const jobText = `${job.title} ${job.department} ${job.track}`.toLowerCase();
    return pool
      .map((t) => {
        const reasons: string[] = [];
        let overlap = 0;
        for (const tag of t.tags) {
          if (jobText.includes(tag.toLowerCase())) {
            overlap++;
            reasons.push(`태그 "${tag}" 일치`);
          }
        }
        if (t.lastApplied === job.title) {
          overlap++;
          reasons.push("동일 공고 지원 이력");
        }
        if (!reasons.length) reasons.push("일반 프로필 기반 추천");
        return {
          talentId: t.id,
          score: Math.min(97, 48 + overlap * 14 + (hash(t.id + job.id) % 18)),
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async detectAuthenticity(coverLetter: string): Promise<AuthenticitySignal> {
    // 목업 휴리스틱: 상투어/길이 기반 (실서비스에서 LLM 판별로 교체)
    const cliches = ["열정", "최선", "귀사", "성장", "기여하고 싶습니다"];
    const hits = cliches.filter((w) => coverLetter.includes(w)).length;
    const likelihood = Math.min(95, 20 + hits * 12);
    return {
      aiLikelihood: likelihood,
      verdict: likelihood > 65 ? "높음" : likelihood > 40 ? "보통" : "낮음",
      notes: [
        `상투 표현 ${hits}건 감지 (목업 휴리스틱)`,
        "실서비스에서는 LLM 문체 분석·유사도 검색으로 대체",
      ],
    };
  }

  async summarizeInterview(notes: string): Promise<InterviewDigest> {
    const trimmed = notes.trim();
    return {
      summary: trimmed
        ? `${trimmed.slice(0, 60)}… (목업 요약)`
        : "면접 기록이 없습니다.",
      strengths: ["커뮤니케이션 양호 (목업)"],
      concerns: ["기술 깊이 추가 검증 권장 (목업)"],
      suggestedQuestions: [
        "가장 어려웠던 문제와 해결 과정은?",
        "우리 조직에서 이루고 싶은 것은?",
      ],
    };
  }

  async generateJobDraft(input: {
    title: string;
    department: string;
    track: string;
  }): Promise<string> {
    return [
      `[${input.department}] ${input.title}`,
      "",
      "■ 담당 업무",
      "- (AI 초안) 직무 핵심 업무를 여기에 기술",
      "",
      "■ 자격 요건",
      `- ${input.track} 채용, 관련 경험 보유`,
      "",
      "■ 우대 사항",
      "- 교육 도메인 이해, 데이터 기반 문제 해결",
      "",
      "※ 목업 초안입니다. 실서비스에서는 Claude API가 회사 톤·기존 공고를 학습해 생성합니다.",
    ].join("\n");
  }

  async draftMessage(input: {
    kind: string;
    candidateName: string;
    jobTitle: string;
  }): Promise<string> {
    return `${input.candidateName}님, [${input.jobTitle}] ${input.kind} 관련 안내드립니다. (AI 초안 — 목업)`;
  }

  async generateExamQuestions(input: {
    role: string;
    topic: string;
    type: ExamQuestionType | "혼합";
    count: number;
  }): Promise<ExamQuestion[]> {
    // 목업: 출제자가 바로 다듬을 수 있는 "구조 잡힌 초안"을 만든다.
    // 실AI 연동 시 role·topic 기반 실제 문항으로 대체된다.
    const aspects = [
      "핵심 개념",
      "실무 적용 사례",
      "자주 발생하는 실수",
      "성능·효율 관점",
      "협업 시 고려사항",
      "최신 동향",
      "기본 원리",
      "예외 상황 처리",
    ];
    const mixed: ExamQuestionType[] = ["단일선택", "단일선택", "다중선택", "단답", "서술"];
    const seed = hash(`${input.role}|${input.topic}`);
    const out: ExamQuestion[] = [];
    for (let i = 0; i < Math.max(1, Math.min(10, input.count)); i++) {
      const type =
        input.type === "혼합" ? mixed[i % mixed.length] : input.type;
      const aspect = aspects[(seed + i) % aspects.length];
      const id = `q-ai-${Math.random().toString(36).slice(2, 8)}`;
      const base = { id, type, points: type === "서술" || type === "코딩" ? 10 : 5 };
      if (type === "단일선택" || type === "다중선택") {
        out.push({
          ...base,
          prompt: `[${input.role}] ${input.topic} — ${aspect}에 대한 설명으로 옳은 것${type === "다중선택" ? "을 모두" : "은"}? (AI 초안 — 보기·정답을 실제 내용으로 수정하세요)`,
          options: [
            `${input.topic}의 ${aspect}에 대한 올바른 설명 (→ 정답 보기로 수정)`,
            "그럴듯하지만 틀린 설명 1 (→ 오답 보기로 수정)",
            "그럴듯하지만 틀린 설명 2 (→ 오답 보기로 수정)",
            "명백히 틀린 설명 (→ 오답 보기로 수정)",
          ],
          answerKey: type === "다중선택" ? [0, 1] : [0],
        });
      } else if (type === "단답") {
        out.push({
          ...base,
          prompt: `[${input.role}] ${input.topic}에서 ${aspect}을(를) 가리키는 용어는? (AI 초안 — 질문·허용 답안을 수정하세요)`,
          answerKey: ["정답용어"],
        });
      } else if (type === "코딩") {
        out.push({
          ...base,
          prompt: `[${input.role}] ${input.topic} 관련 구현 문제 — ${aspect}을(를) 고려해 함수를 작성하세요. (AI 초안 — 요구사항·예시 입출력을 구체화하세요)`,
          starterCode: `function solve(input) {\n  // TODO: ${input.topic}\n}`,
        });
      } else {
        out.push({
          ...base,
          prompt: `[${input.role}] ${input.topic}의 ${aspect}에 대해 본인의 경험을 근거로 서술하세요. (AI 초안 — 평가 포인트를 지문에 명시하면 채점이 쉬워집니다. 500자 내외)`,
        });
      }
    }
    return out;
  }
}

// ── 싱글턴 ───────────────────────────────────────────────────────
// 추후: env(ANTHROPIC 연동)나 서버 라우트 준비 시 ClaudeAiProvider로 교체.

export const ai: AiProvider = new MockAiProvider();
