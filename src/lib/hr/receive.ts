"use client";

// ════════════════════════════════════════════════════════════════
//  지원서 접수 오케스트레이터 — 지원자 사이트 폼 제출을 HR 스토어에
//  실제로 꽂는다. (기존 MockProvider.submitApplication 대체)
//
//  흐름: 폼 payload → 후보 프로필 변환 → 공고 확보(HR에 없으면
//  사이트 공고에서 백필) → AI 스크리닝(목업, Bedrock 교체 슬롯) →
//  store.ingestApplication → 접수 결과 반환.
//
//  이 브라우저에서 제출한 후보 id는 localStorage에 기억해 /my
//  지원현황이 데모 계정("me")과 함께 보여준다.
// ════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react";
import type { ApplicationPayload, ApplicationResult } from "@/lib/types";
import { JOB_POSTINGS } from "@/lib/data/jobs";
import type { AiInsight, Candidate, HrJob } from "./types";
import { hrActions, hrSnapshot, applicantNo } from "./store";
import { ai } from "./ai";

const MY_IDS_KEY = "talent-os:my-candidate-ids";

function loadMyCandidateIds(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(MY_IDS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function rememberMyCandidateId(id: string) {
  try {
    const ids = loadMyCandidateIds();
    if (!ids.includes(id)) {
      window.localStorage.setItem(MY_IDS_KEY, JSON.stringify([...ids, id]));
    }
  } catch {
    // 기억 실패는 접수에 영향 없음 (/my 노출만 제한)
  }
}

// /my에서 구독 — storage 이벤트로 다른 탭 제출도 반영
const noopUnsub = () => {};
function subscribeStorage(cb: () => void) {
  if (typeof window === "undefined") return noopUnsub;
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
const getIdsRaw = () =>
  typeof window === "undefined"
    ? "[]"
    : (window.localStorage.getItem(MY_IDS_KEY) ?? "[]");
const getServerIdsRaw = () => "[]";

/** 이 브라우저에서 제출한 후보 id 목록 (SSR 안전) */
export function useMyCandidateIds(): string[] {
  const raw = useSyncExternalStore(subscribeStorage, getIdsRaw, getServerIdsRaw);
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** 경력 직무·전공에서 스크리닝용 태그 추출 (목업 AI 매칭 입력) */
function deriveTags(payload: ApplicationPayload): string[] {
  return [
    ...new Set(
      [
        ...payload.experiences.map((e) => e.role.trim()),
        ...payload.educations.map((e) => e.major.trim()),
      ].filter(Boolean),
    ),
  ].slice(0, 6);
}

/** HR 콘솔에 공고가 없을 때 사이트 공고 데이터로 최소 등록분 생성 */
function backfillJobFromSite(jobId: string): HrJob | undefined {
  const p = JOB_POSTINGS.find((j) => j.id === jobId);
  if (!p) return undefined;
  const employment =
    p.format === "신입,경력" ? "신입/경력" : (p.format as HrJob["employment"]);
  return {
    id: p.id,
    title: `[${p.categoryLabel}] ${p.title}`,
    department: p.categoryLabel,
    track: "일반직",
    employment,
    status: "게시중",
    openedAt: new Date().toISOString().slice(0, 10),
    closesAt: null,
    channels: ["아르코 채용사이트"],
    headcount: 1,
    managerId: "m-suhyun",
  };
}

export interface SubmitOutcome extends ApplicationResult {
  /** 같은 공고에 이미 접수된 지원이 있어 새로 만들지 않았음 */
  duplicate: boolean;
}

/** 지원서 제출 → HR 스토어 접수. 접수번호(수험번호 형식)를 돌려준다. */
export async function submitApplicationToHr(
  payload: ApplicationPayload,
): Promise<SubmitOutcome> {
  const candidate: Omit<Candidate, "id"> = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    birth: payload.birth,
    source: "아르코 채용사이트",
    tags: deriveTags(payload),
    educations: payload.educations,
    experiences: payload.experiences.map((e) => ({ ...e, desc: e.desc ?? "" })),
    coverLetter: payload.coverLetter,
    portfolioUrl: payload.portfolioUrl,
    files: payload.files.map((f) => ({ name: f.name, size: fmtSize(f.size) })),
  };

  const s = hrSnapshot();
  const backfillJob = s.jobs.some((j) => j.id === payload.jobId)
    ? undefined
    : backfillJobFromSite(payload.jobId);
  const job = s.jobs.find((j) => j.id === payload.jobId) ?? backfillJob;

  // AI 스크리닝 — 목업 provider. Bedrock 연동 시 이 한 줄이 실분석이 된다.
  let insight: AiInsight;
  if (job) {
    const r = await ai.screenApplication({ ...candidate, id: "pending" }, job);
    insight = {
      matchScore: r.matchScore,
      summary: r.summary,
      strengths: r.strengths,
      concerns: r.concerns,
    };
  } else {
    insight = {
      matchScore: 60,
      summary: "공고 정보를 찾지 못해 기본 점수로 접수되었습니다.",
      strengths: [],
      concerns: ["공고 매칭 실패 — 수동 확인 필요"],
    };
  }

  const res = hrActions.ingestApplication({
    candidate,
    jobId: payload.jobId,
    ai: insight,
    backfillJob,
  });
  rememberMyCandidateId(res.candidateId);

  return {
    // 접수번호는 HR 콘솔 수험번호와 동일 체계 (ARC-공고번호-일련)
    applicationId: `ARC-${applicantNo(hrSnapshot(), res.applicationId)}`,
    status: "submitted",
    submittedAt: new Date().toISOString(),
    duplicate: res.duplicate,
  };
}
