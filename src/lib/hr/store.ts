"use client";

// ════════════════════════════════════════════════════════════════
//  HR 스토어 — localStorage 영속 + useSyncExternalStore 구독.
//  MockProvider 역할: 모든 변경이 즉시 반영되고 새로고침에도 유지된다.
//  지원자 사이트(/my)도 같은 스토어를 읽어 "단계 변경 → 지원자 화면 반영"
//  연동을 데모한다. 추후 이 모듈만 Supabase 클라이언트로 교체하면 된다.
// ════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react";
import type {
  HrState,
  HrSettings,
  HrMember,
  PipelineStage,
  Evaluation,
  HrJob,
  HrJobStatus,
  HrApplication,
  InterviewStatus,
  InterviewerNotice,
  MessageKind,
  MessageChannel,
  TalentEntry,
  ProposalSlot,
  Candidate,
  AiInsight,
  ExamTemplate,
  ExamSession,
  ExamAnswer,
  ExamEventType,
  Interview,
  MessageTemplate,
} from "./types";
import { createSeedState, HR_STATE_VERSION } from "./seed";
import {
  autoGradeAnswer,
  computeIntegrity,
  maxScoreOf,
  buildSnapshot,
  type ExamSpec,
} from "./exam";
import { mail } from "./mail";
import { sender } from "./sender";
import { supabaseEnabled } from "./supabase";
import { fetchRemoteState, pushDiff, subscribeRemote } from "./sync";

const STORAGE_KEY = "talent-os-hr-state";

/** 서버 렌더링용 고정 스냅샷 (참조 동일성 유지 필수) */
const SERVER_SNAPSHOT: HrState = createSeedState();

let state: HrState | null = null;
const listeners = new Set<() => void>();

/** Supabase 백엔드 모드 여부 — initHrSync()가 켠다 */
let remoteMode = false;
let syncStarted = false;

function loadState(): HrState {
  if (state) return state;
  if (!remoteMode) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HrState;
        if (parsed.version === HR_STATE_VERSION) {
          state = parsed;
          return state;
        }
      }
    } catch {
      // 손상된 저장분은 무시하고 시드로 복구
    }
  }
  state = createSeedState();
  return state;
}

function setState(next: HrState) {
  state = next;
  if (!remoteMode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장 실패(용량 등)해도 메모리 상태는 유지
    }
  }
  listeners.forEach((l) => l());
}

/**
 * Supabase 동기화 시작 (앱 부트 시 1회, 미설정이면 no-op).
 * 원격 상태로 하이드레이트하고 Realtime 구독을 건다.
 */
export function initHrSync() {
  if (!supabaseEnabled || syncStarted || typeof window === "undefined") return;
  syncStarted = true;
  remoteMode = true;
  state = null; // localStorage 데모 상태를 버리고 시드 → 원격으로 전환

  void fetchRemoteState().then((remote) => {
    if (remote) {
      state = remote;
      listeners.forEach((l) => l());
    } else {
      // 시드 전이거나 조회 실패 — 로컬 데모 모드로 폴백
      remoteMode = false;
    }
  });

  subscribeRemote(() => {
    void fetchRemoteState().then((remote) => {
      if (remote) {
        state = remote;
        listeners.forEach((l) => l());
      }
    });
  });
}

/** 현재 Supabase 백엔드 모드로 동작 중인가 (UI 뱃지용) */
export function isRemoteMode(): boolean {
  return remoteMode;
}

/**
 * 액션 밖(비 React 코드)에서 현재 상태를 읽어야 할 때 쓰는 읽기 전용
 * 스냅샷. 클라이언트 전용 — 지원서 접수(receive.ts) 같은 오케스트레이션용.
 */
export function hrSnapshot(): HrState {
  return loadState();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): HrState {
  return loadState();
}

function getServerSnapshot(): HrState {
  return SERVER_SNAPSHOT;
}

/** HR 전역 상태 구독 훅. 클라이언트 컴포넌트에서만 사용. */
export function useHrState(): HrState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ── 내부 유틸 ────────────────────────────────────────────────────

const uid = () => `id-${Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();

// ── 되돌리기 스택 + 토스트 콜백 ─────────────────────────────────
// store는 UI를 모르고, 토스트 호스트가 콜백을 등록한다(느슨한 결합).

interface UndoEntry {
  label: string;
  prev: HrState;
}
const undoStack: UndoEntry[] = [];
const UNDO_LIMIT = 20;

type ToastPayload = { message: string; undoable: boolean };
let toastListener: ((t: ToastPayload) => void) | null = null;

/** 토스트 호스트가 등록. 되돌리기 가능 액션 발생 시 호출된다. */
export function registerToast(fn: (t: ToastPayload) => void): () => void {
  toastListener = fn;
  return () => {
    if (toastListener === fn) toastListener = null;
  };
}

interface UpdateOpts {
  /** 지정 시 되돌리기 스택에 push하고 토스트를 띄운다 */
  undo?: string;
}

function update(fn: (s: HrState) => HrState, opts?: UpdateOpts) {
  const prev = loadState();
  const next = fn(prev);
  if (next === prev) return;
  if (opts?.undo) {
    undoStack.push({ label: opts.undo, prev });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  }
  if (remoteMode) pushDiff(prev, next);
  setState(next);
  if (opts?.undo && toastListener) {
    toastListener({ message: opts.undo, undoable: true });
  }
}

/** 감사 로그 1건 추가 (최신순, 상한 300) */
function logAudit(
  s: HrState,
  entry: Omit<import("./types").AuditLog, "id" | "at" | "actorId">,
): HrState {
  const log = {
    id: uid(),
    at: nowIso(),
    actorId: CURRENT_MEMBER_ID,
    ...entry,
  };
  return { ...s, auditLog: [log, ...s.auditLog].slice(0, 300) };
}

function pushActivity(
  s: HrState,
  applicationId: string,
  actor: string,
  text: string,
): HrState {
  return {
    ...s,
    applications: s.applications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            updatedAt: nowIso(),
            activities: [
              ...a.activities,
              { id: uid(), at: nowIso(), actor, text },
            ],
          }
        : a,
    ),
  };
}

/**
 * 면접관 통지 — 알림함(notices)에 쌓고 개인 메일도 발송한다.
 * 메일은 발송 추상화(sender)를 거치므로 SES 연동 전에는 목업 기록,
 * 연동 후에는 코드 변경 없이 실발송으로 전환된다. 데스크톱 알림은
 * 포털이 열린 브라우저가 notices 변화를 감지해 띄운다.
 */
function notifyInterviewers(
  s: HrState,
  memberIds: string[],
  make: (
    member: HrMember,
  ) => Pick<InterviewerNotice, "kind" | "title" | "body" | "applicationId" | "interviewId">,
): HrState {
  const fresh: InterviewerNotice[] = [];
  for (const mid of memberIds) {
    const member = s.members.find((m) => m.id === mid);
    if (!member || member.active === false) continue;
    const n = make(member);
    fresh.push({
      ...n,
      id: uid(),
      at: nowIso(),
      memberId: mid,
      read: false,
      mailedLive: sender.live,
    });
    void sender.send({
      channel: "이메일",
      to: member.email,
      subject: n.title,
      body: `${n.body}\n\n▶ 면접관 포털: /interviewer/${member.portalToken}`,
    });
  }
  if (fresh.length === 0) return s;
  return { ...s, notices: [...fresh, ...s.notices].slice(0, 300) };
}

// ── 액션 ─────────────────────────────────────────────────────────

/**
 * 현재 작업자 memberId. 데모 모드 기본값은 관리자(m-suhyun)이고,
 * Supabase 로그인 시 auth-gate가 로그인 이메일 → 멤버로 매핑해 교체한다.
 * `let` + ESM live binding이라 이 값을 import한 컴포넌트에 즉시 반영된다.
 */
export let CURRENT_MEMBER_ID = "m-suhyun";

/** 로그인 사용자 → 작업자 지정 (auth-gate가 세션 확인 후 호출) */
export function setCurrentMember(memberId: string) {
  CURRENT_MEMBER_ID = memberId;
}

/** 이메일로 멤버 찾기 (대소문자·공백 무시) — 로그인 매핑용 */
export function memberByEmail(s: HrState, email: string): HrMember | undefined {
  const e = email.trim().toLowerCase();
  return s.members.find((m) => m.email.trim().toLowerCase() === e);
}

/** 지원서 id → 지원자 이름 (감사 로그 요약용) */
function candidateNameOfApp(s: HrState, applicationId: string): string {
  const app = s.applications.find((a) => a.id === applicationId);
  return s.candidates.find((c) => c.id === app?.candidateId)?.name ?? applicationId;
}

/** 단계 이동 1건 처리 (단건/일괄 공용) */
function moveOne(
  s: HrState,
  applicationId: string,
  stageId: string,
  reason?: string,
): HrState {
  const stage = s.stages.find((st) => st.id === stageId);
  if (!stage) return s;
  let next: HrState = {
    ...s,
    applications: s.applications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            stageId,
            updatedAt: nowIso(),
            ...(stage.kind === "rejected" && reason
              ? { rejectReason: reason }
              : {}),
          }
        : a,
    ),
  };
  next = pushActivity(
    next,
    applicationId,
    CURRENT_MEMBER_ID,
    `${stage.name} 단계로 이동${reason ? ` — ${reason}` : ""}`,
  );
  if (s.settings.notifyOnStageChange && stage.visibleToCandidate) {
    next = {
      ...next,
      applications: next.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              messages: [
                ...a.messages,
                {
                  id: uid(),
                  at: nowIso(),
                  subject: `[아르코에듀] 전형 단계 안내 — ${stage.candidateLabel ?? stage.name}`,
                  kind: "기타" as MessageKind,
                  status: "발송됨" as const,
                },
              ],
            }
          : a,
      ),
    };
  }
  return next;
}

export const hrActions = {
  /** 지원서를 다른 단계로 이동 */
  moveStage(applicationId: string, stageId: string, reason?: string) {
    const s0 = loadState();
    const stage = s0.stages.find((st) => st.id === stageId);
    const cand = candidateNameOfApp(s0, applicationId);
    const action =
      stage?.kind === "rejected"
        ? "rejected"
        : stage?.kind === "hired"
          ? "hired"
          : "stage_changed";
    update(
      (s) =>
        logAudit(moveOne(s, applicationId, stageId, reason), {
          action,
          targetType: "application",
          targetId: applicationId,
          summary: `${cand} · ${stage?.name ?? stageId} 단계로 이동`,
          undoable: true,
        }),
      { undo: `${cand} 님을 '${stage?.name ?? stageId}' 단계로 이동했습니다.` },
    );
  },

  /** 여러 지원서를 한 번에 같은 단계로 이동 (일괄 합·불) */
  bulkMoveStage(applicationIds: string[], stageId: string, reason?: string) {
    const s0 = loadState();
    const stage = s0.stages.find((st) => st.id === stageId);
    update(
      (s) =>
        logAudit(
          applicationIds.reduce((acc, id) => moveOne(acc, id, stageId, reason), s),
          {
            action: "bulk_stage_changed",
            targetType: "application",
            targetId: applicationIds.join(","),
            summary: `${applicationIds.length}명을 '${stage?.name ?? stageId}' 단계로 일괄 이동`,
            undoable: true,
          },
        ),
      { undo: `${applicationIds.length}명을 '${stage?.name ?? stageId}' 단계로 이동했습니다.` },
    );
  },

  /** 마지막 되돌리기 가능 액션 취소 */
  undoLastAction(): string | null {
    const entry = undoStack.pop();
    if (!entry) return null;
    const cur = loadState();
    if (remoteMode) pushDiff(cur, entry.prev);
    setState(entry.prev);
    return entry.label;
  },

  canUndo(): boolean {
    return undoStack.length > 0;
  },

  toggleStar(applicationId: string) {
    update((s) => ({
      ...s,
      applications: s.applications.map((a) =>
        a.id === applicationId ? { ...a, starred: !a.starred } : a,
      ),
    }));
  },

  /** 코멘트 등록 — authorId 지정 시 그 멤버 명의(면접관 포털용) */
  addComment(applicationId: string, text: string, authorId?: string) {
    update((s) => ({
      ...s,
      applications: s.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              comments: [
                ...a.comments,
                {
                  id: uid(),
                  authorId: authorId ?? CURRENT_MEMBER_ID,
                  at: nowIso(),
                  text,
                },
              ],
            }
          : a,
      ),
    }));
  },

  addEvaluation(
    applicationId: string,
    ev: Omit<Evaluation, "id" | "at" | "evaluatorId">,
  ) {
    update((s) =>
      pushActivity(
        {
          ...s,
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  evaluations: [
                    ...a.evaluations,
                    {
                      ...ev,
                      id: uid(),
                      evaluatorId: CURRENT_MEMBER_ID,
                      at: nowIso(),
                    },
                  ],
                }
              : a,
          ),
        },
        applicationId,
        CURRENT_MEMBER_ID,
        `${ev.round} 평가 등록 (${ev.decision})`,
      ),
    );
    update((s) =>
      logAudit(s, {
        action: "evaluation_added",
        targetType: "application",
        targetId: applicationId,
        summary: `${candidateNameOfApp(s, applicationId)} · ${ev.round} 평가 등록 (${ev.decision})`,
        undoable: false,
      }),
    );
  },

  sendMessage(
    applicationId: string,
    subject: string,
    kind: MessageKind,
    opts?: { channel?: MessageChannel; scheduledAt?: string; body?: string },
  ) {
    const channel = opts?.channel ?? "이메일";
    const scheduled = Boolean(opts?.scheduledAt);
    update((s) =>
      logAudit(
        pushActivity(
          {
            ...s,
            applications: s.applications.map((a) =>
              a.id === applicationId
                ? {
                    ...a,
                    messages: [
                      ...a.messages,
                      {
                        id: uid(),
                        at: nowIso(),
                        subject,
                        kind,
                        status: scheduled ? "예약됨" : "발송됨",
                        channel,
                        ...(opts?.scheduledAt
                          ? { scheduledAt: opts.scheduledAt }
                          : {}),
                        ...(opts?.body ? { body: opts.body } : {}),
                      },
                    ],
                  }
                : a,
            ),
          },
          applicationId,
          CURRENT_MEMBER_ID,
          scheduled
            ? `${channel} 예약 발송 등록 — ${subject}`
            : `${channel} 발송 — ${subject}`,
        ),
        {
          action: scheduled ? "message_scheduled" : "message_sent",
          targetType: "message",
          targetId: applicationId,
          summary: `${candidateNameOfApp(s, applicationId)} · ${channel} ${scheduled ? "예약" : "발송"} — ${subject}`,
          // 즉시 발송은 되돌릴 수 없음 / 예약은 취소 가능
          undoable: false,
        },
      ),
    );
  },

  /** 워크스페이스 이메일 — 지원자에게 발신 (스레드에 추가) */
  sendApplicantEmail(applicationId: string, subject: string, body: string) {
    update((s) => {
      const app = s.applications.find((a) => a.id === applicationId);
      const cand = s.candidates.find((c) => c.id === app?.candidateId);
      const from = s.settings.workspaceEmail ?? "recruit@arco.example";
      const email = {
        id: uid(),
        direction: "발신" as const,
        from,
        to: cand?.email ?? "",
        subject,
        body,
        at: nowIso(),
        read: true,
      };
      // 실 연동 시 발신 (fire-and-forget). 미연동이면 기록만.
      if (mail.live && cand?.email) {
        void mail.sendEmail({ from, to: cand.email, subject, body });
      }
      return logAudit(
        pushActivity(
          {
            ...s,
            applications: s.applications.map((a) =>
              a.id === applicationId
                ? { ...a, emails: [...(a.emails ?? []), email] }
                : a,
            ),
          },
          applicationId,
          CURRENT_MEMBER_ID,
          `이메일 발신 — ${subject}`,
        ),
        {
          action: "message_sent",
          targetType: "message",
          targetId: applicationId,
          summary: `${cand?.name ?? ""} · 이메일 발신 — ${subject}`,
          undoable: false,
        },
      );
    });
  },

  /**
   * 지원자 회신 수신 — 스레드에 추가(미확인 표시).
   * 데모에서는 UI 버튼으로 호출(시뮬레이션), 운영에서는 /api/mail/inbound
   * 웹훅이 동일 형태로 호출한다.
   */
  receiveInboundEmail(
    applicationId: string,
    input: { subject: string; body: string },
  ) {
    update((s) => {
      const app = s.applications.find((a) => a.id === applicationId);
      const cand = s.candidates.find((c) => c.id === app?.candidateId);
      const to = s.settings.workspaceEmail ?? "recruit@arco.example";
      const email = {
        id: uid(),
        direction: "수신" as const,
        from: cand?.email ?? "",
        to,
        subject: input.subject,
        body: input.body,
        at: nowIso(),
        read: false,
      };
      return pushActivity(
        {
          ...s,
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? { ...a, emails: [...(a.emails ?? []), email] }
              : a,
          ),
        },
        applicationId,
        "system",
        `지원자 이메일 회신 수신 — ${input.subject}`,
      );
    });
  },

  /** 스레드의 수신 메일을 확인 처리 */
  markEmailsRead(applicationId: string) {
    update((s) => ({
      ...s,
      applications: s.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              emails: (a.emails ?? []).map((e) =>
                e.direction === "수신" ? { ...e, read: true } : e,
              ),
            }
          : a,
      ),
    }));
  },

  /**
   * 예약 발송 처리 — 예정 시각이 지난 "예약됨" 메시지를 발송 상태로 전환.
   * HR 콘솔이 열려 있는 동안 셸이 주기 호출한다(데모 모드의 스케줄러 대체).
   * 운영(Supabase) 전환 시 서버 크론이 같은 일을 하면 된다.
   * 반환: 이번에 발송 처리된 건수.
   */
  flushScheduledMessages(): number {
    const s0 = loadState();
    const now = nowIso();
    // scheduledAt은 datetime-local(로컬 시간, TZ 없음) — 문자열 비교하면
    // UTC인 nowIso()와 어긋나므로 Date 파싱으로 시각을 비교한다.
    const nowMs = Date.now();
    const due: { appId: string; msgId: string; subject: string }[] = [];
    for (const a of s0.applications) {
      for (const m of a.messages) {
        if (
          m.status === "예약됨" &&
          m.scheduledAt &&
          new Date(m.scheduledAt).getTime() <= nowMs
        ) {
          due.push({ appId: a.id, msgId: m.id, subject: m.subject });
        }
      }
    }
    if (due.length === 0) return 0;

    update((s) => {
      let next: HrState = {
        ...s,
        applications: s.applications.map((a) => {
          const hits = due.filter((d) => d.appId === a.id);
          if (hits.length === 0) return a;
          return {
            ...a,
            messages: a.messages.map((m) =>
              hits.some((d) => d.msgId === m.id)
                ? { ...m, status: "발송됨" as const, at: now }
                : m,
            ),
          };
        }),
      };
      for (const d of due) {
        next = pushActivity(
          next,
          d.appId,
          "system",
          `예약 메시지 발송 — ${d.subject}`,
        );
      }
      return next;
    });
    return due.length;
  },

  /** 예약 발송 취소 */
  cancelScheduledMessage(applicationId: string, messageId: string) {
    update((s) => ({
      ...s,
      applications: s.applications.map((a) =>
        a.id === applicationId
          ? { ...a, messages: a.messages.filter((m) => m.id !== messageId) }
          : a,
      ),
    }));
  },

  /** 중복 후보 레코드 통합 — dup의 지원서를 primary로 재배정하고 레코드 병합 */
  mergeCandidates(primaryId: string, duplicateId: string) {
    update((s) => {
      const primary = s.candidates.find((c) => c.id === primaryId);
      const dup = s.candidates.find((c) => c.id === duplicateId);
      if (!primary || !dup) return s;
      const mergedTags = [...new Set([...primary.tags, ...dup.tags])];
      const mergedFiles = [
        ...primary.files,
        ...dup.files.filter(
          (f) => !primary.files.some((pf) => pf.name === f.name),
        ),
      ];
      let next: HrState = {
        ...s,
        candidates: s.candidates
          .filter((c) => c.id !== duplicateId)
          .map((c) =>
            c.id === primaryId
              ? { ...c, tags: mergedTags, files: mergedFiles }
              : c,
          ),
        applications: s.applications.map((a) =>
          a.candidateId === duplicateId
            ? { ...a, candidateId: primaryId }
            : a,
        ),
      };
      for (const a of next.applications.filter(
        (a) => s.applications.find((o) => o.id === a.id)?.candidateId === duplicateId,
      )) {
        next = pushActivity(
          next,
          a.id,
          CURRENT_MEMBER_ID,
          `중복 레코드 통합 — ${dup.name}(${dup.email})을 기존 지원자로 병합`,
        );
      }
      return logAudit(next, {
        action: "duplicate_merged",
        targetType: "candidate",
        targetId: primaryId,
        summary: `중복 통합 — ${dup.name}(${dup.email})을 ${primary.name}으로 병합`,
        sensitive: true,
        undoable: true,
      });
    }, { undo: `중복 지원자를 통합했습니다.` });
  },

  /** 중복 감지 그룹 무시 처리 */
  dismissDupe(key: string) {
    update((s) => ({
      ...s,
      dismissedDupes: [...new Set([...s.dismissedDupes, key])],
    }));
  },

  /** 면접 일정 제안 발송 — 지원자가 /my에서 시간을 선택하면 자동 확정 */
  proposeInterview(
    applicationId: string,
    input: {
      round: string;
      location: string;
      interviewerIds: string[];
      /** 대표 면접관 — 종합 의견 작성 책임 */
      leadId?: string;
      slots: ProposalSlot[];
    },
  ) {
    update((s) => {
      let next = pushActivity(
        {
          ...s,
          proposals: [
            {
              id: uid(),
              applicationId,
              round: input.round,
              location: input.location,
              interviewerIds: input.interviewerIds,
              leadId: input.leadId ?? input.interviewerIds[0],
              slots: input.slots,
              status: "대기",
              sentAt: nowIso(),
            },
            ...s.proposals,
          ],
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  messages: [
                    ...a.messages,
                    {
                      id: uid(),
                      at: nowIso(),
                      subject: `[아르코에듀] ${input.round} 일정을 선택해 주세요`,
                      kind: "면접안내" as MessageKind,
                      status: "발송됨" as const,
                      channel: "이메일" as MessageChannel,
                    },
                  ],
                }
              : a,
          ),
        },
        applicationId,
        CURRENT_MEMBER_ID,
        `${input.round} 일정 제안 발송 (후보 ${input.slots.length}개, 면접관 ${input.interviewerIds.length}명 통지)`,
      );
      const leadId = input.leadId ?? input.interviewerIds[0];
      next = notifyInterviewers(next, input.interviewerIds, (member) => ({
        kind: "일정조율",
        title: `[${input.round}] 일정 조율 시작 — ${candidateNameOfApp(s, applicationId)}`,
        body: `${member.id === leadId ? "대표 면접관으로 배정되었습니다 — 면접 후 패널 종합 의견 작성을 맡습니다. " : "면접관으로 배정되었습니다. "}지원자에게 시간 후보 ${input.slots.length}개를 제안했으며, 지원자가 선택하는 즉시 확정 알림을 드립니다. 장소: ${input.location}`,
        applicationId,
      }));
      return next;
    });
    update((s) =>
      logAudit(s, {
        action: "interview_proposed",
        targetType: "interview",
        targetId: applicationId,
        summary: `${candidateNameOfApp(s, applicationId)} · ${input.round} 일정 제안 (후보 ${input.slots.length}개)`,
        undoable: false,
      }),
    );
  },

  /** 지원자의 시간 선택 → 면접 자동 생성·확정 (지원자 화면에서 호출) */
  confirmProposal(proposalId: string, slotIndex: number) {
    update((s) => {
      const pr = s.proposals.find((p) => p.id === proposalId);
      const slot = pr?.slots[slotIndex];
      if (!pr || !slot || pr.status !== "대기") return s;
      const interviewId = uid();
      let next: HrState = {
        ...s,
        proposals: s.proposals.map((p) =>
          p.id === proposalId
            ? { ...p, status: "확정", confirmedSlot: slot }
            : p,
        ),
        interviews: [
          ...s.interviews,
          {
            id: interviewId,
            applicationId: pr.applicationId,
            round: pr.round,
            date: slot.date,
            start: slot.start,
            end: slot.end,
            location: pr.location,
            interviewerIds: pr.interviewerIds,
            leadId: pr.leadId ?? pr.interviewerIds[0],
            status: "예정" as InterviewStatus,
            note: "지원자 셀프 선택으로 자동 확정",
          },
        ],
      };
      next = notifyInterviewers(next, pr.interviewerIds, (member) => {
        const others = pr.interviewerIds
          .filter((mid) => mid !== member.id)
          .map((mid) => memberName(s, mid));
        return {
          kind: "면접확정",
          title: `[${pr.round}] 일정 확정 — ${slot.date.slice(5).replace("-", "/")} ${slot.start}`,
          body: `${candidateNameOfApp(s, pr.applicationId)}님이 면접 시간을 선택해 일정이 확정되었습니다. ${slot.date} ${slot.start}–${slot.end}, ${pr.location}${others.length > 0 ? `, 공동 면접관: ${others.join(", ")}` : ""}`,
          applicationId: pr.applicationId,
          interviewId,
        };
      });
      next = pushActivity(
        next,
        pr.applicationId,
        "system",
        `지원자가 ${pr.round} 시간을 선택 — ${slot.date} ${slot.start} 자동 확정, 면접관 ${pr.interviewerIds.length}명 통지 발송`,
      );
      return logAudit(next, {
        action: "interview_confirmed",
        targetType: "interview",
        targetId: pr.applicationId,
        summary: `${candidateNameOfApp(next, pr.applicationId)} · ${pr.round} ${slot.date} ${slot.start} 확정`,
        undoable: false,
      });
    });
  },

  /**
   * 면접 직접 생성 — 전화 등으로 조율이 끝난 일정을 제안 없이 바로 확정.
   * (proposeInterview의 "제안 → 지원자 선택" 경로를 건너뛴다)
   */
  createInterview(
    applicationId: string,
    input: {
      round: string;
      date: string; // YYYY-MM-DD
      start: string; // HH:mm
      end: string;
      location: string;
      meetingUrl?: string;
      interviewerIds: string[];
      leadId?: string;
    },
  ) {
    update((s) => {
      const interviewId = uid();
      let next: HrState = {
        ...s,
        interviews: [
          ...s.interviews,
          {
            id: interviewId,
            applicationId,
            round: input.round,
            date: input.date,
            start: input.start,
            end: input.end,
            location: input.location,
            ...(input.meetingUrl ? { meetingUrl: input.meetingUrl } : {}),
            interviewerIds: input.interviewerIds,
            leadId: input.leadId ?? input.interviewerIds[0],
            status: "예정" as InterviewStatus,
            note: "HR 직접 확정",
          },
        ],
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                messages: [
                  ...a.messages,
                  {
                    id: uid(),
                    at: nowIso(),
                    subject: `[아르코에듀] ${input.round} 일정 안내 — ${input.date} ${input.start}`,
                    kind: "면접안내" as MessageKind,
                    status: "발송됨" as const,
                    channel: "이메일" as MessageChannel,
                  },
                ],
              }
            : a,
        ),
      };
      next = notifyInterviewers(next, input.interviewerIds, (member) => ({
        kind: "면접확정",
        title: `[${input.round}] 일정 확정 — ${input.date.slice(5).replace("-", "/")} ${input.start}`,
        body: `${member.id === (input.leadId ?? input.interviewerIds[0]) ? "대표 면접관으로 배정되었습니다. " : ""}${candidateNameOfApp(s, applicationId)}님 ${input.round}이 확정되었습니다. ${input.date} ${input.start}–${input.end}, ${input.location}`,
        applicationId,
        interviewId,
      }));
      next = pushActivity(
        next,
        applicationId,
        CURRENT_MEMBER_ID,
        `${input.round} 직접 확정 — ${input.date} ${input.start} (면접관 ${input.interviewerIds.length}명 통지)`,
      );
      return logAudit(next, {
        action: "interview_confirmed",
        targetType: "interview",
        targetId: interviewId,
        summary: `${candidateNameOfApp(next, applicationId)} · ${input.round} ${input.date} ${input.start} 직접 확정`,
        undoable: false,
      });
    });
  },

  /**
   * 면접 수정 — 시간·장소·화상 링크·면접관 변경.
   * 취소→재제안 없이 바로 고치고, 관련 면접관 전원에게 변경 통지.
   */
  updateInterview(
    interviewId: string,
    patch: Partial<
      Pick<
        Interview,
        "date" | "start" | "end" | "location" | "meetingUrl" | "interviewerIds" | "leadId" | "round"
      >
    >,
  ) {
    update((s) => {
      const iv = s.interviews.find((x) => x.id === interviewId);
      if (!iv || iv.status === "취소" || iv.status === "완료") return s;
      const merged: Interview = { ...iv, ...patch };
      // 일정이 실제로 바뀌면 미해결 변경 요청은 처리된 것으로 본다
      if (
        merged.rescheduleRequest &&
        (merged.date !== iv.date || merged.start !== iv.start || merged.end !== iv.end)
      ) {
        delete merged.rescheduleRequest;
      }
      // 무엇이 바뀌었는지 사람이 읽는 요약
      const changes: string[] = [];
      if (patch.date && patch.date !== iv.date) changes.push(`날짜 ${iv.date}→${patch.date}`);
      if (patch.start && patch.start !== iv.start) changes.push(`시간 ${iv.start}→${patch.start}`);
      if (patch.location && patch.location !== iv.location) changes.push(`장소 ${patch.location}`);
      if (patch.meetingUrl !== undefined && patch.meetingUrl !== iv.meetingUrl)
        changes.push(patch.meetingUrl ? "화상 링크 등록" : "화상 링크 제거");
      if (
        patch.interviewerIds &&
        JSON.stringify(patch.interviewerIds) !== JSON.stringify(iv.interviewerIds)
      )
        changes.push(`면접관 ${patch.interviewerIds.length}명으로 변경`);
      if (changes.length === 0) return s;

      let next: HrState = {
        ...s,
        interviews: s.interviews.map((x) => (x.id === interviewId ? merged : x)),
      };
      // 변경 통지: 기존+신규 면접관 합집합 (빠진 사람도 취소 안내를 받아야 함)
      const notifyIds = [...new Set([...iv.interviewerIds, ...merged.interviewerIds])];
      next = notifyInterviewers(next, notifyIds, (member) => {
        const removed = !merged.interviewerIds.includes(member.id);
        return {
          kind: removed ? "면접취소" : "면접확정",
          title: removed
            ? `[${merged.round}] 배정 제외 안내`
            : `[${merged.round}] 일정 변경 — ${merged.date.slice(5).replace("-", "/")} ${merged.start}`,
          body: removed
            ? `${candidateNameOfApp(s, iv.applicationId)}님 ${merged.round}의 면접관 배정에서 제외되었습니다.`
            : `일정이 변경되었습니다 (${changes.join(", ")}). ${merged.date} ${merged.start}–${merged.end}, ${merged.location}`,
          applicationId: iv.applicationId,
          interviewId,
        };
      });
      next = pushActivity(
        next,
        iv.applicationId,
        CURRENT_MEMBER_ID,
        `${merged.round} 일정 변경 — ${changes.join(", ")} (면접관 ${notifyIds.length}명 통지)`,
      );
      return logAudit(next, {
        action: "interview_confirmed",
        targetType: "interview",
        targetId: interviewId,
        summary: `${candidateNameOfApp(next, iv.applicationId)} · ${merged.round} 변경 — ${changes.join(", ")}`,
        undoable: true,
      });
    }, { undo: "면접 일정을 변경했습니다." });
  },

  /** 일정 제안 취소 */
  cancelProposal(proposalId: string) {
    update((s) =>
      logAudit(
        {
          ...s,
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? { ...p, status: "취소" } : p,
          ),
        },
        {
          action: "interview_canceled",
          targetType: "interview",
          targetId: proposalId,
          summary: "면접 일정 제안 취소",
          undoable: false,
        },
      ),
    );
  },

  /**
   * 면접관 일정 변경 요청 — 포털에서 "이 시간 안 됩니다". HR이 일정을
   * 수정(updateInterview)하거나 요청을 닫으면 해소된다.
   */
  requestReschedule(interviewId: string, memberId: string, reason: string): boolean {
    const s0 = loadState();
    const iv = s0.interviews.find((x) => x.id === interviewId);
    if (!iv || (iv.status !== "예정" && iv.status !== "평가대기")) return false;
    if (!iv.interviewerIds.includes(memberId)) return false;
    if (iv.rescheduleRequest) return false; // 이미 요청 대기 중
    const who = memberName(s0, memberId);
    update((s) => {
      let next: HrState = {
        ...s,
        interviews: s.interviews.map((x) =>
          x.id === interviewId
            ? { ...x, rescheduleRequest: { by: memberId, reason, at: nowIso() } }
            : x,
        ),
      };
      next = pushActivity(
        next,
        iv.applicationId,
        who,
        `${iv.round} 일정 변경 요청 — "${reason}"`,
      );
      return logAudit(next, {
        action: "reschedule_requested",
        targetType: "interview",
        targetId: interviewId,
        summary: `${candidateNameOfApp(next, iv.applicationId)} · ${iv.round} 일정 변경 요청 (${who})`,
        undoable: false,
      });
    });
    return true;
  },

  /** 일정 변경 요청 닫기 — 일정 유지. 요청한 면접관에게 안내 통지 */
  dismissRescheduleRequest(interviewId: string) {
    update((s) => {
      const iv = s.interviews.find((x) => x.id === interviewId);
      const req = iv?.rescheduleRequest;
      if (!iv || !req) return s;
      let next: HrState = {
        ...s,
        interviews: s.interviews.map((x) =>
          x.id === interviewId
            ? { ...x, rescheduleRequest: undefined }
            : x,
        ),
      };
      next = notifyInterviewers(next, [req.by], () => ({
        kind: "일정조율",
        title: `[${iv.round}] 일정 변경 요청 확인 — 기존 일정 유지`,
        body: `요청하신 일정 변경을 검토했으나 기존 일정(${iv.date} ${iv.start}–${iv.end})으로 진행합니다. 조정이 꼭 필요하면 인사팀에 직접 연락해 주세요.`,
        applicationId: iv.applicationId,
        interviewId,
      }));
      return pushActivity(
        next,
        iv.applicationId,
        CURRENT_MEMBER_ID,
        `${iv.round} 일정 변경 요청 닫음 — 기존 일정 유지 (${memberName(s, req.by)}에게 안내)`,
      );
    });
  },

  addJob(job: Omit<HrJob, "id">) {
    update((s) => ({
      ...s,
      jobs: [{ ...job, id: uid() }, ...s.jobs],
    }));
  },

  setJobStatus(jobId: string, status: HrJobStatus) {
    update((s) => ({
      ...s,
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)),
    }));
  },

  /** 공고 수정 */
  updateJob(jobId: string, patch: Partial<HrJob>) {
    update((s) => {
      const job = s.jobs.find((j) => j.id === jobId);
      return logAudit(
        {
          ...s,
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
        },
        {
          action: "settings_changed",
          targetType: "job",
          targetId: jobId,
          summary: `공고 수정 — ${patch.title ?? job?.title ?? ""}`,
          undoable: true,
        },
      );
    }, { undo: `공고를 수정했습니다.` });
  },

  /** 면접관 전용 링크(/eval/[id])에서 평가 제출 — 로그인 없이 평가 */
  submitEvalViaLink(
    interviewId: string,
    evaluatorId: string,
    ev: Omit<Evaluation, "id" | "at" | "evaluatorId">,
  ) {
    update((s) => {
      const iv = s.interviews.find((x) => x.id === interviewId);
      if (!iv) return s;
      let next: HrState = {
        ...s,
        interviews: s.interviews.map((x) =>
          x.id === interviewId ? { ...x, status: "완료" as InterviewStatus } : x,
        ),
        applications: s.applications.map((a) =>
          a.id === iv.applicationId
            ? {
                ...a,
                evaluations: [
                  ...a.evaluations,
                  { ...ev, id: uid(), evaluatorId, at: nowIso() },
                ],
              }
            : a,
        ),
      };
      next = pushActivity(
        next,
        iv.applicationId,
        evaluatorId,
        `${ev.round} 평가 제출 (면접관 링크, ${ev.decision})`,
      );
      return next;
    });
  },

  setInterviewStatus(interviewId: string, status: InterviewStatus) {
    update((s) => {
      const iv = s.interviews.find((x) => x.id === interviewId);
      if (!iv || iv.status === status) return s;
      let next: HrState = {
        ...s,
        interviews: s.interviews.map((x) =>
          x.id === interviewId ? { ...x, status } : x,
        ),
      };
      const candidate = candidateNameOfApp(s, iv.applicationId);
      if (status === "평가대기") {
        next = notifyInterviewers(next, iv.interviewerIds, () => ({
          kind: "평가요청",
          title: `[${iv.round}] 평가를 남겨주세요 — ${candidate}`,
          body: `${iv.date} ${iv.start} 진행한 ${iv.round}의 평가가 필요합니다. 포털에서 바로 제출할 수 있습니다.`,
          applicationId: iv.applicationId,
          interviewId,
        }));
      } else if (status === "취소") {
        next = notifyInterviewers(next, iv.interviewerIds, () => ({
          kind: "면접취소",
          title: `[${iv.round}] 면접 취소 — ${candidate}`,
          body: `${iv.date} ${iv.start} 예정이던 ${iv.round}이(가) 취소되었습니다.`,
          applicationId: iv.applicationId,
          interviewId,
        }));
      }
      return next;
    });
  },

  /** 멤버 추가 — 포털 토큰 자동 발급. 면접관 풀 등록의 기본 경로. */
  addMember(input: { name: string; email: string; team: string; role: HrMember["role"] }) {
    update((s) => {
      const email = input.email.trim().toLowerCase();
      if (s.members.some((m) => m.email.trim().toLowerCase() === email)) return s;
      const id = uid();
      const member: HrMember = {
        id,
        name: input.name.trim(),
        email: input.email.trim(),
        team: input.team.trim(),
        role: input.role,
        portalToken: `ivp-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`,
      };
      return logAudit(
        { ...s, members: [...s.members, member] },
        {
          action: "settings_changed",
          targetType: "settings",
          targetId: id,
          summary: `멤버 추가 — ${member.name} (${member.team} · ${member.role})`,
          undoable: true,
        },
      );
    }, { undo: `${input.name} 님을 멤버로 추가했습니다.` });
  },

  /** 멤버 정보 수정 (역할·팀 등) */
  updateMember(memberId: string, patch: Partial<Pick<HrMember, "name" | "team" | "role" | "email">>) {
    update((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
    }));
  },

  /** 멤버 비활성화/재활성화 — 퇴사자 처리. 이력은 남고 선택·포털만 차단. */
  setMemberActive(memberId: string, active: boolean) {
    update((s) => {
      const member = s.members.find((m) => m.id === memberId);
      if (!member) return s;
      return logAudit(
        {
          ...s,
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, active } : m,
          ),
        },
        {
          action: "settings_changed",
          targetType: "settings",
          targetId: memberId,
          summary: `멤버 ${active ? "재활성화" : "비활성화"} — ${member.name}`,
          undoable: true,
        },
      );
    }, { undo: `멤버를 ${active ? "재활성화" : "비활성화"}했습니다.` });
  },

  /**
   * 대표 면접관의 패널 종합 의견 제출 — 개별 평가를 취합한 결론.
   * 제출 시 면접은 완료 처리되고 HR 콘솔에 패널 결론으로 표시된다.
   */
  submitPanelSummary(
    interviewId: string,
    byId: string,
    input: { decision: Evaluation["decision"]; text: string },
  ) {
    update((s) => {
      const iv = s.interviews.find((x) => x.id === interviewId);
      if (!iv) return s;
      let next: HrState = {
        ...s,
        interviews: s.interviews.map((x) =>
          x.id === interviewId
            ? {
                ...x,
                status: "완료" as InterviewStatus,
                panelSummary: { ...input, byId, at: nowIso() },
              }
            : x,
        ),
      };
      next = pushActivity(
        next,
        iv.applicationId,
        byId,
        `${iv.round} 패널 종합 의견 제출 (${input.decision})`,
      );
      return logAudit(next, {
        action: "evaluation_added",
        targetType: "interview",
        targetId: interviewId,
        summary: `${candidateNameOfApp(next, iv.applicationId)} · ${iv.round} 패널 결론 — ${input.decision}`,
        undoable: false,
      });
    });
  },

  /** 대표 면접관 → 미제출 배석자에게 평가 리마인드 발송 */
  remindPanel(interviewId: string, targetIds: string[]) {
    update((s) => {
      const iv = s.interviews.find((x) => x.id === interviewId);
      if (!iv || targetIds.length === 0) return s;
      return notifyInterviewers(s, targetIds, () => ({
        kind: "평가요청",
        title: `[${iv.round}] 평가 리마인드 — ${candidateNameOfApp(s, iv.applicationId)}`,
        body: `대표 면접관이 패널 종합 의견을 기다리고 있습니다. ${iv.date} 진행한 ${iv.round}의 평가를 제출해 주세요.`,
        applicationId: iv.applicationId,
        interviewId,
      }));
    });
  },

  /**
   * 면접관 포털 링크 재발급 — 기존 토큰(URL)은 즉시 무효화된다.
   * 링크 유출 시 회수 수단. 감사 로그에 남는다.
   */
  rotatePortalToken(memberId: string) {
    update((s) => {
      const member = s.members.find((m) => m.id === memberId);
      if (!member) return s;
      const slug = memberId.replace(/^m-/, "");
      const token = `ivp-${slug}-${Math.random().toString(36).slice(2, 8)}`;
      return logAudit(
        {
          ...s,
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, portalToken: token } : m,
          ),
        },
        {
          action: "settings_changed",
          targetType: "settings",
          targetId: memberId,
          summary: `면접관 포털 링크 재발급 — ${member.name} (기존 링크 무효화)`,
          undoable: false,
        },
      );
    });
  },

  /** 면접관 포털 — 내 알림 모두 읽음 처리 */
  markNoticesRead(memberId: string) {
    update((s) => {
      if (!s.notices.some((n) => n.memberId === memberId && !n.read)) return s;
      return {
        ...s,
        notices: s.notices.map((n) =>
          n.memberId === memberId ? { ...n, read: true } : n,
        ),
      };
    });
  },

  // ── 메시지 템플릿 CRUD (시드 고정 해제) ────────────────────────

  addTemplate(tpl: Omit<MessageTemplate, "id">): string {
    const id = uid();
    update(
      (s) => ({ ...s, templates: [...s.templates, { ...tpl, id }] }),
      { undo: `템플릿 '${tpl.name}'을(를) 추가했습니다.` },
    );
    return id;
  },

  updateTemplate(templateId: string, patch: Partial<Omit<MessageTemplate, "id">>) {
    update((s) => ({
      ...s,
      templates: s.templates.map((t) =>
        t.id === templateId ? { ...t, ...patch } : t,
      ),
    }));
  },

  removeTemplate(templateId: string) {
    const name = loadState().templates.find((t) => t.id === templateId)?.name ?? "";
    update(
      (s) => ({ ...s, templates: s.templates.filter((t) => t.id !== templateId) }),
      { undo: `템플릿 '${name}'을(를) 삭제했습니다.` },
    );
  },

  // ── 후보 정보 수정 (오타 정정 등) ──────────────────────────────

  updateCandidate(
    candidateId: string,
    patch: Partial<Pick<Candidate, "name" | "email" | "phone" | "tags" | "portfolioUrl">>,
  ) {
    update((s) => {
      const cand = s.candidates.find((c) => c.id === candidateId);
      if (!cand) return s;
      const changed = (Object.keys(patch) as (keyof typeof patch)[])
        .filter((k) => JSON.stringify(patch[k]) !== JSON.stringify(cand[k]))
        .map((k) =>
          ({ name: "이름", email: "이메일", phone: "전화", tags: "태그", portfolioUrl: "포트폴리오" })[k],
        );
      if (changed.length === 0) return s;
      let next: HrState = {
        ...s,
        candidates: s.candidates.map((c) =>
          c.id === candidateId ? { ...c, ...patch } : c,
        ),
      };
      for (const a of next.applications.filter((x) => x.candidateId === candidateId)) {
        next = pushActivity(
          next,
          a.id,
          CURRENT_MEMBER_ID,
          `지원자 정보 수정 — ${changed.join(", ")}`,
        );
      }
      return logAudit(next, {
        action: "settings_changed",
        targetType: "candidate",
        targetId: candidateId,
        summary: `${cand.name} 정보 수정 — ${changed.join(", ")}`,
        sensitive: true,
        undoable: true,
      });
    }, { undo: "지원자 정보를 수정했습니다." });
  },

  // ── 평가·코멘트 수정/삭제 (오제출 정정 — 수정 시각 투명 표시) ───

  updateEvaluation(
    applicationId: string,
    evaluationId: string,
    patch: Partial<Pick<Evaluation, "decision" | "scores" | "comment" | "round">>,
  ) {
    update((s) =>
      pushActivity(
        {
          ...s,
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  evaluations: a.evaluations.map((ev) =>
                    ev.id === evaluationId
                      ? { ...ev, ...patch, editedAt: nowIso() }
                      : ev,
                  ),
                }
              : a,
          ),
        },
        applicationId,
        CURRENT_MEMBER_ID,
        `평가 수정${patch.decision ? ` (판정: ${patch.decision})` : ""}`,
      ),
    );
  },

  removeEvaluation(applicationId: string, evaluationId: string) {
    update((s) => {
      const app = s.applications.find((a) => a.id === applicationId);
      const ev = app?.evaluations.find((e) => e.id === evaluationId);
      if (!ev) return s;
      return logAudit(
        pushActivity(
          {
            ...s,
            applications: s.applications.map((a) =>
              a.id === applicationId
                ? {
                    ...a,
                    evaluations: a.evaluations.filter((e) => e.id !== evaluationId),
                  }
                : a,
            ),
          },
          applicationId,
          CURRENT_MEMBER_ID,
          `평가 삭제 — ${memberName(s, ev.evaluatorId)}의 ${ev.round} (${ev.decision})`,
        ),
        {
          action: "evaluation_added",
          targetType: "application",
          targetId: applicationId,
          summary: `${candidateNameOfApp(s, applicationId)} · ${ev.round} 평가 삭제 (${ev.decision})`,
          undoable: true,
        },
      );
    }, { undo: "평가를 삭제했습니다." });
  },

  updateComment(applicationId: string, commentId: string, text: string) {
    update((s) => ({
      ...s,
      applications: s.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              comments: a.comments.map((c) =>
                c.id === commentId ? { ...c, text, editedAt: nowIso() } : c,
              ),
            }
          : a,
      ),
    }));
  },

  removeComment(applicationId: string, commentId: string) {
    update(
      (s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? { ...a, comments: a.comments.filter((c) => c.id !== commentId) }
            : a,
        ),
      }),
      { undo: "코멘트를 삭제했습니다." },
    );
  },

  updateSettings(patch: Partial<HrSettings>) {
    update((s) =>
      logAudit(
        { ...s, settings: { ...s.settings, ...patch } },
        {
          action: "settings_changed",
          targetType: "settings",
          targetId: "workspace",
          summary: `설정 변경 — ${Object.keys(patch).join(", ")}`,
          undoable: true,
        },
      ),
    { undo: "설정을 변경했습니다." });
  },

  updateStage(stageId: string, patch: Partial<PipelineStage>) {
    update((s) => ({
      ...s,
      stages: s.stages.map((st) =>
        st.id === stageId ? { ...st, ...patch } : st,
      ),
    }));
  },

  /**
   * 진행 단계 추가 — 활성 단계 구간 끝(최종합격/불합격 앞)에 삽입.
   * order는 전체 재부여해 항상 연속·터미널이 마지막을 유지한다.
   */
  addStage(name: string) {
    update(
      (s) => {
        const active = s.stages.filter((st) => st.kind === "active");
        const terminal = s.stages.filter((st) => st.kind !== "active");
        const newStage: PipelineStage = {
          id: uid(),
          name: name.trim() || "새 단계",
          candidateLabel: name.trim() || "새 단계",
          visibleToCandidate: true,
          kind: "active",
          order: 0, // 아래에서 재부여
        };
        const ordered = [...active, newStage, ...terminal].map((st, i) => ({
          ...st,
          order: i,
        }));
        return logAudit(
          { ...s, stages: ordered },
          {
            action: "settings_changed",
            targetType: "settings",
            targetId: newStage.id,
            summary: `채용 단계 추가 — ${newStage.name}`,
            undoable: true,
          },
        );
      },
      { undo: "채용 단계를 추가했습니다." },
    );
  },

  /**
   * 진행 단계 삭제 — 해당 단계에 지원자가 있으면 거부(false).
   * 최종합격/불합격(터미널)과 마지막 남은 활성 단계는 삭제 불가.
   */
  removeStage(stageId: string): { ok: boolean; reason?: string } {
    const s0 = loadState();
    const st = s0.stages.find((x) => x.id === stageId);
    if (!st) return { ok: false, reason: "단계를 찾을 수 없습니다." };
    if (st.kind !== "active")
      return { ok: false, reason: "최종합격·불합격 단계는 삭제할 수 없습니다." };
    if (s0.stages.filter((x) => x.kind === "active").length <= 1)
      return { ok: false, reason: "최소 1개의 진행 단계가 필요합니다." };
    const inUse = s0.applications.filter((a) => a.stageId === stageId).length;
    if (inUse > 0)
      return {
        ok: false,
        reason: `이 단계에 지원자 ${inUse}명이 있습니다. 먼저 다른 단계로 옮겨 주세요.`,
      };
    update(
      (s) =>
        logAudit(
          {
            ...s,
            stages: s.stages
              .filter((x) => x.id !== stageId)
              .map((x, i) => ({ ...x, order: i })),
          },
          {
            action: "settings_changed",
            targetType: "settings",
            targetId: stageId,
            summary: `채용 단계 삭제 — ${st.name}`,
            undoable: true,
          },
        ),
      { undo: `'${st.name}' 단계를 삭제했습니다.` },
    );
    return { ok: true };
  },

  /** 진행 단계 순서 이동 (활성 단계 구간 내에서만 스왑) */
  reorderStage(stageId: string, dir: -1 | 1) {
    update((s) => {
      const active = [...s.stages]
        .filter((st) => st.kind === "active")
        .sort((a, b) => a.order - b.order);
      const i = active.findIndex((st) => st.id === stageId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= active.length) return s;
      [active[i], active[j]] = [active[j], active[i]];
      const terminal = s.stages.filter((st) => st.kind !== "active");
      const ordered = [...active, ...terminal].map((st, k) => ({
        ...st,
        order: k,
      }));
      return { ...s, stages: ordered };
    });
  },

  addTalent(entry: Omit<TalentEntry, "id">) {
    update((s) =>
      logAudit(
        { ...s, talent: [{ ...entry, id: uid() }, ...s.talent] },
        {
          action: "talent_added",
          targetType: "talent",
          targetId: entry.name,
          summary: `인재풀 등록 — ${entry.name} (${entry.role})`,
          undoable: true,
        },
      ),
    { undo: `${entry.name} 님을 인재풀에 등록했습니다.` });
  },

  /**
   * 보관기한 만료 인재 자동 파기 — 콘솔 스케줄러(30초 tick)가 호출.
   * expiresAt이 지난 인재풀 항목을 삭제하고 건별 감사 로그를 남긴다.
   * (개인정보 보호법 보관기한 준수 — 운영 전환 시 서버 크론으로 이관)
   */
  sweepTalentRetention(): number {
    const s0 = loadState();
    const today = nowIso().slice(0, 10);
    const expired = s0.talent.filter((t) => t.expiresAt && t.expiresAt < today);
    if (expired.length === 0) return 0;
    update((s) => {
      let next: HrState = {
        ...s,
        talent: s.talent.filter((t) => !(t.expiresAt && t.expiresAt < today)),
      };
      for (const t of expired) {
        next = logAudit(next, {
          action: "talent_deleted",
          targetType: "talent",
          targetId: t.id,
          summary: `보관기한 만료 자동 파기 — ${t.name} (${t.role}, 기한 ${t.expiresAt})`,
          sensitive: true,
          undoable: false,
        });
      }
      return next;
    });
    return expired.length;
  },

  removeTalent(talentId: string) {
    const name = loadState().talent.find((t) => t.id === talentId)?.name ?? "";
    update((s) =>
      logAudit(
        { ...s, talent: s.talent.filter((t) => t.id !== talentId) },
        {
          action: "talent_deleted",
          targetType: "talent",
          targetId: talentId,
          summary: `인재풀 파기 — ${name}`,
          sensitive: true,
          undoable: true,
        },
      ),
    { undo: `${name} 님을 인재풀에서 파기했습니다.` });
  },

  /**
   * 지원자 사이트에서 제출된 지원서 접수 — 후보 생성/재사용 + 지원서 생성.
   * 같은 이메일 후보는 재사용(프로필은 최신 지원서 내용으로 갱신)하고,
   * 같은 공고에 이미 지원했으면 중복으로 처리해 새로 만들지 않는다.
   * AI 인사이트는 호출 전에 계산해 넘긴다(receive.ts가 오케스트레이션).
   */
  ingestApplication(input: {
    candidate: Omit<Candidate, "id">;
    jobId: string;
    ai: AiInsight;
    /** HR 콘솔에 없는 공고면 함께 등록 (사이트 공고 → 최소 필드) */
    backfillJob?: HrJob;
    /**
     * HR이 콘솔에서 직접 등록한 유입(헤드헌터 추천·이메일 지원 등).
     * 활동 문구가 등록자 기준으로 남고, 접수확인 메일은 선택 발송이며,
     * 개인정보 입력 행위라 감사 로그에 기록된다.
     */
    direct?: {
      actorId: string;
      sendConfirmation: boolean;
      /** 대량 등록 시 false — 건별 대신 요약 1건만 감사 기록 (호출측 책임) */
      audit?: boolean;
    };
  }): { applicationId: string; candidateId: string; duplicate: boolean } {
    const s0 = loadState();
    const email = input.candidate.email.trim().toLowerCase();
    const existing = s0.candidates.find(
      (c) => c.email.trim().toLowerCase() === email,
    );
    const candidateId = existing?.id ?? uid();
    const dup = existing
      ? s0.applications.find(
          (a) => a.candidateId === candidateId && a.jobId === input.jobId,
        )
      : undefined;
    if (dup) {
      return { applicationId: dup.id, candidateId, duplicate: true };
    }

    const applicationId = uid();
    update((s) => {
      const appliedStage =
        [...s.stages]
          .filter((st) => st.kind === "active")
          .sort((a, b) => a.order - b.order)[0]?.id ?? "applied";
      let next: HrState = { ...s };
      if (input.backfillJob && !s.jobs.some((j) => j.id === input.jobId)) {
        next = { ...next, jobs: [input.backfillJob, ...next.jobs] };
      }
      const direct = input.direct;
      const registrar = direct
        ? (s.members.find((m) => m.id === direct.actorId)?.name ?? "HR")
        : null;
      const confirmMsg = {
        id: uid(),
        at: nowIso(),
        subject: "[아르코에듀] 지원서 접수가 완료되었습니다",
        kind: "접수확인" as MessageKind,
        status: "발송됨" as const,
        channel: "이메일" as MessageChannel,
      };
      next = {
        ...next,
        candidates: existing
          ? next.candidates.map((c) =>
              c.id === candidateId
                ? { ...c, ...input.candidate, id: candidateId }
                : c,
            )
          : [...next.candidates, { ...input.candidate, id: candidateId }],
        applications: [
          ...next.applications,
          {
            id: applicationId,
            candidateId,
            jobId: input.jobId,
            stageId: appliedStage,
            appliedAt: nowIso(),
            updatedAt: nowIso(),
            starred: false,
            ai: input.ai,
            activities: [
              {
                id: uid(),
                at: nowIso(),
                actor: registrar ?? "system",
                text: direct
                  ? `지원자 직접 등록 — ${input.candidate.source}`
                  : "지원서 접수 — 아르코 채용사이트",
              },
            ],
            evaluations: [],
            comments: [],
            messages: !direct || direct.sendConfirmation ? [confirmMsg] : [],
          },
        ],
      };
      if (direct && direct.audit !== false) {
        next = logAudit(next, {
          action: "candidate_registered",
          targetType: "candidate",
          targetId: candidateId,
          summary: `지원자 직접 등록 — ${input.candidate.name} (${input.candidate.source})`,
          sensitive: true,
          undoable: false,
        });
      }
      return next;
    });
    return { applicationId, candidateId, duplicate: false };
  },

  /** 엑셀 대량 등록 마감 — 건별 대신 요약 1건으로 감사 기록 */
  auditBulkRegistration(created: number, skipped: number, source: string) {
    if (created === 0) return;
    update((s) =>
      logAudit(s, {
        action: "candidate_registered",
        targetType: "candidate",
        targetId: "bulk",
        summary: `엑셀 대량 등록 — ${created}명 접수 (${source}${skipped > 0 ? `, 제외 ${skipped}건` : ""})`,
        sensitive: true,
        undoable: false,
      }),
    );
  },

  // ── 지원 철회 / 개인정보 파기 (GDPR) ──────────────────────────

  /** 지원 철회 — 지원자 요청 등. 파이프라인에서 빠지지만 기록은 남긴다. */
  withdrawApplication(applicationId: string, reason?: string) {
    update((s) => {
      const app = s.applications.find((a) => a.id === applicationId);
      if (!app || app.withdrawnAt) return s;
      let next: HrState = {
        ...s,
        applications: s.applications.map((a) =>
          a.id === applicationId
            ? { ...a, withdrawnAt: nowIso(), withdrawReason: reason, updatedAt: nowIso() }
            : a,
        ),
      };
      next = pushActivity(
        next,
        applicationId,
        CURRENT_MEMBER_ID,
        `지원 철회 처리${reason ? ` — ${reason}` : ""}`,
      );
      return logAudit(next, {
        action: "application_withdrawn",
        targetType: "application",
        targetId: applicationId,
        summary: `${candidateNameOfApp(next, applicationId)} · 지원 철회${reason ? ` (${reason})` : ""}`,
        undoable: true,
      });
    }, { undo: "지원을 철회 처리했습니다." });
  },

  /** 철회 취소 — 다시 파이프라인으로 되돌린다 */
  reopenApplication(applicationId: string) {
    update((s) => ({
      ...s,
      applications: s.applications.map((a) =>
        a.id === applicationId
          ? { ...a, withdrawnAt: undefined, withdrawReason: undefined, updatedAt: nowIso() }
          : a,
      ),
    }));
  },

  /**
   * 개인정보 파기 (GDPR 삭제권) — 식별 정보를 익명화한다. **되돌릴 수 없음.**
   * 이름·이메일·전화·생년·자소서·포트폴리오·파일·이메일 스레드를 제거하고,
   * 통계·감사용 비식별 흔적(직군 태그·평가 점수·단계 이력)만 남긴다.
   * (하드 삭제 대신 익명화 — 채용 통계·감사 추적성 보존이 실무 표준)
   */
  anonymizeCandidate(candidateId: string) {
    update((s) => {
      const cand = s.candidates.find((c) => c.id === candidateId);
      if (!cand || cand.anonymizedAt) return s;
      const at = nowIso();
      let next: HrState = {
        ...s,
        candidates: s.candidates.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                name: "파기된 지원자",
                email: "",
                phone: "",
                birth: undefined,
                coverLetter: "",
                portfolioUrl: undefined,
                files: [],
                educations: [],
                experiences: [],
                anonymizedAt: at,
              }
            : c,
        ),
        // 이메일 스레드(본문에 개인정보 포함 가능)도 제거
        applications: s.applications.map((a) =>
          a.candidateId === candidateId ? { ...a, emails: [] } : a,
        ),
      };
      for (const a of next.applications.filter((x) => x.candidateId === candidateId)) {
        next = pushActivity(
          next,
          a.id,
          CURRENT_MEMBER_ID,
          "개인정보 파기 완료 (GDPR) — 식별 정보 익명화, 통계·감사 흔적만 보존",
        );
      }
      return logAudit(next, {
        action: "candidate_anonymized",
        targetType: "candidate",
        targetId: candidateId,
        summary: `${cand.name} 개인정보 파기 (익명화)`,
        sensitive: true,
        undoable: false,
      });
    });
  },

  // ── 필기시험 (웹 프록터링) ─────────────────────────────────────

  /** 시험 세트 등록 */
  addExamTemplate(t: Omit<ExamTemplate, "id" | "createdAt">): string {
    const id = uid();
    update((s) => ({
      ...s,
      examTemplates: [{ ...t, id, createdAt: nowIso() }, ...s.examTemplates],
    }));
    return id;
  },

  updateExamTemplate(templateId: string, patch: Partial<ExamTemplate>) {
    update((s) => ({
      ...s,
      examTemplates: s.examTemplates.map((t) =>
        t.id === templateId ? { ...t, ...patch } : t,
      ),
    }));
  },

  /**
   * 시험 세트 복제 — "기존 시험을 가져와 이번 공고용으로 수정"의 시작점.
   * 문항 id도 새로 발급해 원본과 완전히 분리한다.
   */
  duplicateExamTemplate(templateId: string): string | null {
    const s0 = loadState();
    const src = s0.examTemplates.find((t) => t.id === templateId);
    if (!src) return null;
    const id = uid();
    const copy: ExamTemplate = {
      ...src,
      id,
      title: `${src.title} (복사본)`,
      createdAt: nowIso(),
      questions: src.questions.map((q) => ({ ...q, id: uid() })),
    };
    update(
      (s) => ({ ...s, examTemplates: [copy, ...s.examTemplates] }),
      { undo: `'${src.title}'을(를) 복제했습니다.` },
    );
    return id;
  },

  /** 시험 세트 삭제 — 응시 이력이 있으면 삭제하지 않는다(false 반환) */
  removeExamTemplate(templateId: string): boolean {
    const s0 = loadState();
    if (s0.examSessions.some((x) => x.templateId === templateId)) return false;
    update((s) => ({
      ...s,
      examTemplates: s.examTemplates.filter((t) => t.id !== templateId),
    }));
    return true;
  },

  /**
   * 시험 배정 — 응시 세션·개인 링크 발급 + 안내 메시지 발송.
   * 지원자 /my에도 응시 버튼이 즉시 나타난다.
   */
  assignExam(
    applicationId: string,
    templateId: string,
    expiresAt: string,
  ): { sessionId: string; token: string } | null {
    const s0 = loadState();
    const t = s0.examTemplates.find((x) => x.id === templateId);
    if (!t) return null;
    // 같은 지원서×시험의 살아있는 세션이 있으면 재발급하지 않는다
    const dup = s0.examSessions.find(
      (x) =>
        x.applicationId === applicationId &&
        x.templateId === templateId &&
        (x.status === "발급" || x.status === "진행중"),
    );
    if (dup) return { sessionId: dup.id, token: dup.token };

    const sessionId = uid();
    const token = `exm-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;
    const cand = candidateNameOfApp(s0, applicationId);
    update(
      (s) => {
        let next: HrState = {
          ...s,
          examSessions: [
            {
              id: sessionId,
              applicationId,
              templateId,
              snapshot: buildSnapshot(t),
              token,
              status: "발급",
              assignedAt: nowIso(),
              expiresAt,
              answers: [],
              events: [],
            },
            ...s.examSessions,
          ],
          applications: s.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  messages: [
                    ...a.messages,
                    {
                      id: uid(),
                      at: nowIso(),
                      subject: `[아르코에듀] 필기시험 응시 안내 — ${t.title}`,
                      kind: "기타" as MessageKind,
                      status: "발송됨" as const,
                      channel: "이메일" as MessageChannel,
                    },
                  ],
                }
              : a,
          ),
        };
        next = pushActivity(
          next,
          applicationId,
          CURRENT_MEMBER_ID,
          `필기시험 배정 — ${t.title} (기한 ${expiresAt.slice(0, 10)}, 응시 링크 발송)`,
        );
        return logAudit(next, {
          action: "exam_assigned",
          targetType: "exam",
          targetId: sessionId,
          summary: `${cand} · ${t.title} 배정 (기한 ${expiresAt.slice(0, 10)})`,
          undoable: false,
        });
      },
      { undo: `${cand} 님에게 '${t.title}'을 배정했습니다.` },
    );
    return { sessionId, token };
  },

  /**
   * 필기시험 일괄 배정 — 같은 직군 지원자 여러 명에게 한 번에 발급.
   * 살아있는(발급/진행중) 동일 시험 세션이 있는 지원서는 건너뛴다.
   * 반환: 새로 발급된 수 (건너뛴 수 = 대상 수 - 반환값)
   */
  bulkAssignExam(
    applicationIds: string[],
    templateId: string,
    expiresAt: string,
  ): number {
    const s0 = loadState();
    const t = s0.examTemplates.find((x) => x.id === templateId);
    if (!t || applicationIds.length === 0) return 0;
    const targets = applicationIds.filter(
      (appId) =>
        s0.applications.some((a) => a.id === appId) &&
        !s0.examSessions.some(
          (x) =>
            x.applicationId === appId &&
            x.templateId === templateId &&
            (x.status === "발급" || x.status === "진행중"),
        ),
    );
    if (targets.length === 0) return 0;

    update(
      (s) => {
        let next: HrState = { ...s };
        for (const appId of targets) {
          const sessionId = uid();
          const token = `exm-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;
          next = {
            ...next,
            examSessions: [
              {
                id: sessionId,
                applicationId: appId,
                templateId,
                snapshot: buildSnapshot(t),
                token,
                status: "발급",
                assignedAt: nowIso(),
                expiresAt,
                answers: [],
                events: [],
              },
              ...next.examSessions,
            ],
            applications: next.applications.map((a) =>
              a.id === appId
                ? {
                    ...a,
                    messages: [
                      ...a.messages,
                      {
                        id: uid(),
                        at: nowIso(),
                        subject: `[아르코에듀] 필기시험 응시 안내 — ${t.title}`,
                        kind: "기타" as MessageKind,
                        status: "발송됨" as const,
                        channel: "이메일" as MessageChannel,
                      },
                    ],
                  }
                : a,
            ),
          };
          next = pushActivity(
            next,
            appId,
            CURRENT_MEMBER_ID,
            `필기시험 일괄 배정 — ${t.title} (기한 ${expiresAt.slice(0, 10)})`,
          );
        }
        return logAudit(next, {
          action: "exam_assigned",
          targetType: "exam",
          targetId: templateId,
          summary: `${targets.length}명에게 '${t.title}' 일괄 배정 (기한 ${expiresAt.slice(0, 10)})`,
          undoable: true,
        });
      },
      { undo: `${targets.length}명에게 '${t.title}'을 배정했습니다.` },
    );
    return targets.length;
  },

  /** 응시 시작 — 최초면 진행중 전환, 재입장이면 이어하기 이벤트만 */
  startExamSession(sessionId: string) {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      if (!ex || (ex.status !== "발급" && ex.status !== "진행중")) return s;
      const resuming = ex.status === "진행중";
      return {
        ...s,
        examSessions: s.examSessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                status: "진행중" as const,
                startedAt: x.startedAt ?? nowIso(),
                events: [
                  ...x.events,
                  {
                    id: uid(),
                    at: nowIso(),
                    type: (resuming ? "이어하기" : "입장") as ExamEventType,
                  },
                ].slice(-500),
              }
            : x,
        ),
      };
    });
  },

  /** 응시 이벤트 기록 (프록터링 신호) */
  logExamEvent(sessionId: string, type: ExamEventType, detail?: string) {
    update((s) => ({
      ...s,
      examSessions: s.examSessions.map((x) =>
        x.id === sessionId
          ? {
              ...x,
              events: [
                ...x.events,
                { id: uid(), at: nowIso(), type, ...(detail ? { detail } : {}) },
              ].slice(-500),
            }
          : x,
      ),
    }));
  },

  /** 답안 저장 (응시 중 자동 저장) */
  saveExamAnswer(
    sessionId: string,
    answer: Pick<ExamAnswer, "questionId" | "selected" | "text">,
  ) {
    update((s) => ({
      ...s,
      examSessions: s.examSessions.map((x) => {
        if (x.id !== sessionId || x.status !== "진행중") return x;
        const rest = x.answers.filter((a) => a.questionId !== answer.questionId);
        return { ...x, answers: [...rest, answer] };
      }),
    }));
  },

  /** 녹화 메타 갱신 (청크·스냅샷 수 등 — 원본은 IndexedDB/Storage) */
  updateExamRecording(
    sessionId: string,
    patch: Partial<NonNullable<ExamSession["recording"]>>,
  ) {
    update((s) => ({
      ...s,
      examSessions: s.examSessions.map((x) =>
        x.id === sessionId
          ? {
              ...x,
              recording: {
                camChunks: 0,
                screenChunks: 0,
                snapshots: 0,
                ...x.recording,
                ...patch,
              },
            }
          : x,
      ),
    }));
  },

  /**
   * 시험 제출 — 선택형·단답 자동 채점 + 무결성 점수 계산.
   * reason: 직접제출 | 시간초과 | 위반한도 (후자 둘은 이벤트로도 남는다)
   */
  submitExam(sessionId: string, reason: "직접제출" | "시간초과" | "위반한도" = "직접제출") {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      const t = ex && (ex.snapshot ?? s.examTemplates.find((x) => x.id === ex.templateId));
      if (!ex || !t || ex.status !== "진행중") return s;

      const extraEvents =
        reason === "시간초과"
          ? [{ id: uid(), at: nowIso(), type: "시간초과자동제출" as ExamEventType }]
          : reason === "위반한도"
            ? [{ id: uid(), at: nowIso(), type: "위반한도초과" as ExamEventType }]
            : [];
      const events = [
        ...ex.events,
        ...extraEvents,
        { id: uid(), at: nowIso(), type: "제출" as ExamEventType, detail: reason },
      ].slice(-500);

      const answers = ex.answers.map((a) => {
        const q = t.questions.find((x) => x.id === a.questionId);
        const auto = q ? autoGradeAnswer(q, a) : undefined;
        return typeof auto === "number" ? { ...a, autoScore: auto } : a;
      });

      let next: HrState = {
        ...s,
        examSessions: s.examSessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                status: "제출" as const,
                submittedAt: nowIso(),
                answers,
                events,
                integrityScore: computeIntegrity(events).score,
                maxScore: maxScoreOf(t),
              }
            : x,
        ),
        // 제출 확인 자동 안내 — 지원자의 "제출됐나?" 불안 해소
        applications: s.applications.map((a) =>
          a.id === ex.applicationId
            ? {
                ...a,
                messages: [
                  ...a.messages,
                  {
                    id: uid(),
                    at: nowIso(),
                    subject: `[아르코에듀] 필기시험 제출이 확인되었습니다 — ${t.title}`,
                    kind: "기타" as MessageKind,
                    status: "발송됨" as const,
                    channel: "이메일" as MessageChannel,
                  },
                ],
              }
            : a,
        ),
      };
      next = pushActivity(
        next,
        ex.applicationId,
        "system",
        `필기시험 제출 — ${t.title} (${reason}, 무결성 ${computeIntegrity(events).score}점)`,
      );
      return logAudit(next, {
        action: "exam_submitted",
        targetType: "exam",
        targetId: sessionId,
        summary: `${candidateNameOfApp(next, ex.applicationId)} · ${t.title} 제출 (${reason})`,
        undoable: false,
      });
    });
  },

  /** 서술·코딩 수동 채점 저장 + 채점 확정 */
  gradeExam(sessionId: string, manualScores: Record<string, number>) {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      const t = ex && (ex.snapshot ?? s.examTemplates.find((x) => x.id === ex.templateId));
      if (!ex || !t || (ex.status !== "제출" && ex.status !== "채점완료")) return s;

      // 답을 안 낸 수동 채점 문항도 채점 대상이 되도록 빈 답안을 보충한다
      const manualQids = t.questions
        .filter((q) => q.type === "서술" || q.type === "코딩")
        .map((q) => q.id);
      const answers: ExamAnswer[] = [
        ...ex.answers,
        ...manualQids
          .filter((qid) => !ex.answers.some((a) => a.questionId === qid))
          .map((qid) => ({ questionId: qid })),
      ].map((a) =>
        a.questionId in manualScores
          ? { ...a, manualScore: manualScores[a.questionId] }
          : a,
      );

      const total = t.questions.reduce((sum, q) => {
        const a = answers.find((x) => x.questionId === q.id);
        if (q.type === "서술" || q.type === "코딩") return sum + (a?.manualScore ?? 0);
        return sum + (a?.autoScore ?? 0);
      }, 0);

      let next: HrState = {
        ...s,
        examSessions: s.examSessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                answers,
                status: "채점완료" as const,
                totalScore: total,
                maxScore: maxScoreOf(t),
                gradedBy: CURRENT_MEMBER_ID,
                gradedAt: nowIso(),
              }
            : x,
        ),
      };
      next = pushActivity(
        next,
        ex.applicationId,
        CURRENT_MEMBER_ID,
        `필기시험 채점 완료 — ${t.title} (${total}/${maxScoreOf(t)}점)`,
      );
      return logAudit(next, {
        action: "exam_graded",
        targetType: "exam",
        targetId: sessionId,
        summary: `${candidateNameOfApp(next, ex.applicationId)} · ${t.title} 채점 — ${total}/${maxScoreOf(t)}점`,
        undoable: false,
      });
    });
  },

  /**
   * 응시 기한 연장 — 취소·재발급 없이 같은 링크로 기한만 늘린다.
   * 만료된 세션은 발급 상태로 복구되어 기존 링크가 다시 살아난다.
   */
  extendExamDeadline(sessionId: string, newExpiresAt: string) {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      const t = ex && s.examTemplates.find((x) => x.id === ex.templateId);
      if (
        !ex ||
        !t ||
        (ex.status !== "발급" && ex.status !== "진행중" && ex.status !== "만료")
      )
        return s;
      let next: HrState = {
        ...s,
        examSessions: s.examSessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                expiresAt: newExpiresAt,
                status: x.status === "만료" ? ("발급" as const) : x.status,
              }
            : x,
        ),
        applications: s.applications.map((a) =>
          a.id === ex.applicationId
            ? {
                ...a,
                messages: [
                  ...a.messages,
                  {
                    id: uid(),
                    at: nowIso(),
                    subject: `[아르코에듀] 필기시험 응시 기한 연장 안내 — ${newExpiresAt.slice(0, 10)}까지`,
                    kind: "기타" as MessageKind,
                    status: "발송됨" as const,
                    channel: "이메일" as MessageChannel,
                  },
                ],
              }
            : a,
        ),
      };
      next = pushActivity(
        next,
        ex.applicationId,
        CURRENT_MEMBER_ID,
        `필기시험 기한 연장 — ${t.title} (${ex.expiresAt.slice(0, 10)} → ${newExpiresAt.slice(0, 10)}${ex.status === "만료" ? ", 만료 복구" : ""})`,
      );
      return logAudit(next, {
        action: "exam_assigned",
        targetType: "exam",
        targetId: sessionId,
        summary: `${candidateNameOfApp(next, ex.applicationId)} · ${t.title} 기한 연장 → ${newExpiresAt.slice(0, 10)}`,
        undoable: false,
      });
    }, { undo: "응시 기한을 연장했습니다." });
  },

  /** 미응시 리마인드 발송 — 발급 상태(미응시) 세션에만 */
  remindExamSession(sessionId: string) {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      const t = ex && s.examTemplates.find((x) => x.id === ex.templateId);
      if (!ex || !t || ex.status !== "발급") return s;
      let next: HrState = {
        ...s,
        applications: s.applications.map((a) =>
          a.id === ex.applicationId
            ? {
                ...a,
                messages: [
                  ...a.messages,
                  {
                    id: uid(),
                    at: nowIso(),
                    subject: `[아르코에듀] 필기시험 응시 리마인드 — ${ex.expiresAt.slice(0, 10)}까지`,
                    kind: "기타" as MessageKind,
                    status: "발송됨" as const,
                    channel: "이메일" as MessageChannel,
                  },
                ],
              }
            : a,
        ),
      };
      next = pushActivity(
        next,
        ex.applicationId,
        CURRENT_MEMBER_ID,
        `필기시험 응시 리마인드 발송 — ${t.title} (기한 ${ex.expiresAt.slice(0, 10)})`,
      );
      return next;
    });
  },

  /** 응시 세션 취소 — 링크 즉시 무효화 (오발급·기한 변경 시) */
  cancelExamSession(sessionId: string) {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      if (!ex || ex.status === "제출" || ex.status === "채점완료") return s;
      return logAudit(
        {
          ...s,
          examSessions: s.examSessions.map((x) =>
            x.id === sessionId ? { ...x, status: "중단" as const } : x,
          ),
        },
        {
          action: "exam_canceled",
          targetType: "exam",
          targetId: sessionId,
          summary: `${candidateNameOfApp(s, ex.applicationId)} · 필기시험 취소 (링크 무효화)`,
          undoable: false,
        },
      );
    });
  },

  /**
   * 재응시 배정 — 종결된 세션(채점완료·만료·중단)에서 같은 시험을
   * 새 회차로 다시 발급한다. 새 링크·새 스냅샷(세트가 수정됐으면 최신
   * 기준, 삭제됐으면 원 세션 스냅샷)이며 이전 회차 기록은 그대로 남는다.
   */
  retakeExam(
    sessionId: string,
    expiresAt: string,
  ): { sessionId: string; token: string; duplicate?: boolean } | null {
    const s0 = loadState();
    const src = s0.examSessions.find((x) => x.id === sessionId);
    if (
      !src ||
      (src.status !== "채점완료" && src.status !== "만료" && src.status !== "중단")
    ) {
      return null; // 살아있는 세션은 기한 연장으로, 채점 대기는 채점 먼저
    }
    const alive = s0.examSessions.find(
      (x) =>
        x.applicationId === src.applicationId &&
        x.templateId === src.templateId &&
        (x.status === "발급" || x.status === "진행중"),
    );
    if (alive) return { sessionId: alive.id, token: alive.token, duplicate: true };

    const t = s0.examTemplates.find((x) => x.id === src.templateId);
    const snapshot = t ? buildSnapshot(t) : src.snapshot;
    if (!snapshot) return null;
    const title = snapshot.title;
    const attempt = (src.attempt ?? 1) + 1;
    const newId = uid();
    const token = `exm-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;
    const cand = candidateNameOfApp(s0, src.applicationId);
    update(
      (s) => {
        let next: HrState = {
          ...s,
          examSessions: [
            {
              id: newId,
              applicationId: src.applicationId,
              templateId: src.templateId,
              snapshot,
              token,
              status: "발급",
              attempt,
              retakeOfId: src.id,
              assignedAt: nowIso(),
              expiresAt,
              answers: [],
              events: [],
            },
            ...s.examSessions,
          ],
          applications: s.applications.map((a) =>
            a.id === src.applicationId
              ? {
                  ...a,
                  messages: [
                    ...a.messages,
                    {
                      id: uid(),
                      at: nowIso(),
                      subject: `[아르코에듀] 필기시험 재응시 안내 — ${title} (${attempt}차)`,
                      kind: "기타" as MessageKind,
                      status: "발송됨" as const,
                      channel: "이메일" as MessageChannel,
                    },
                  ],
                }
              : a,
          ),
        };
        next = pushActivity(
          next,
          src.applicationId,
          CURRENT_MEMBER_ID,
          `필기시험 재응시 배정 — ${title} (${attempt}차, 기한 ${expiresAt.slice(0, 10)}, 새 링크 발송)`,
        );
        return logAudit(next, {
          action: "exam_assigned",
          targetType: "exam",
          targetId: newId,
          summary: `${cand} · ${title} 재응시(${attempt}차) 배정 (기한 ${expiresAt.slice(0, 10)})`,
          undoable: false,
        });
      },
      { undo: `${cand} 님에게 '${title}' ${attempt}차 재응시를 배정했습니다.` },
    );
    return { sessionId: newId, token };
  },

  /** 기한 경과 세션 만료 처리 (응시 화면·HR 목록이 발견 시 호출) */
  markExamExpired(sessionId: string) {
    update((s) => {
      const ex = s.examSessions.find((x) => x.id === sessionId);
      if (!ex || ex.status !== "발급") return s;
      if (new Date(ex.expiresAt).getTime() >= Date.now()) return s;
      return {
        ...s,
        examSessions: s.examSessions.map((x) =>
          x.id === sessionId ? { ...x, status: "만료" as const } : x,
        ),
      };
    });
  },

  /**
   * 좀비 세션 정리 — HR 콘솔이 주기적으로 호출(데모 스케줄러):
   * ① 발급 상태로 기한이 지난 세션 → 만료
   * ② 진행중인데 제한 시간이 지난(응시자가 브라우저를 닫고 사라진) 세션
   *    → 그때까지의 답안으로 시간초과 자동 제출 (2분 유예 — 정상 응시자 보호)
   * 반환: { expired, autoSubmitted } 건수.
   */
  sweepExamSessions(): { expired: number; autoSubmitted: number } {
    const s0 = loadState();
    const now = Date.now();
    const GRACE_MS = 120_000;
    const expiredIds = s0.examSessions
      .filter(
        (x) => x.status === "발급" && new Date(x.expiresAt).getTime() < now,
      )
      .map((x) => x.id);
    const zombieIds = s0.examSessions
      .filter((x) => {
        if (x.status !== "진행중" || !x.startedAt) return false;
        const spec =
          x.snapshot ?? s0.examTemplates.find((t) => t.id === x.templateId);
        if (!spec) return false;
        const endsAt =
          new Date(x.startedAt).getTime() + spec.durationMin * 60_000;
        return now > endsAt + GRACE_MS;
      })
      .map((x) => x.id);
    for (const id of expiredIds) hrActions.markExamExpired(id);
    for (const id of zombieIds) hrActions.submitExam(id, "시간초과");
    return { expired: expiredIds.length, autoSubmitted: zombieIds.length };
  },

  /**
   * 데모 초기화 — 시드 상태로 되돌린다. **데모(localStorage) 모드 전용.**
   * Supabase 백엔드 모드에서는 실데이터가 시드로 덮여 쓰이는 사고를 막기
   * 위해 거부한다(방어). UI도 원격 모드에선 버튼을 숨긴다.
   */
  resetDemo(): boolean {
    if (remoteMode) {
      console.warn("[hr] resetDemo는 Supabase 백엔드 모드에서 차단됩니다.");
      return false;
    }
    update(() => createSeedState());
    return true;
  },
};

// ── 파생 셀렉터 (컴포넌트 공용) ─────────────────────────────────

export function memberName(s: HrState, memberId: string): string {
  if (memberId === "system") return "시스템";
  return s.members.find((m) => m.id === memberId)?.name ?? memberId;
}

/** 면접관 포털 토큰 → 멤버 (없거나 비활성이면 undefined = 접근 차단) */
export function memberByToken(s: HrState, token: string): HrMember | undefined {
  const m = s.members.find((x) => x.portalToken === token);
  return m && m.active !== false ? m : undefined;
}

/** 응시 링크 토큰 → 세션 (중단된 세션은 링크 무효 = undefined) */
export function examSessionByToken(
  s: HrState,
  token: string,
): ExamSession | undefined {
  const ex = s.examSessions.find((x) => x.token === token);
  return ex && ex.status !== "중단" ? ex : undefined;
}

export function examTemplateOf(
  s: HrState,
  session: ExamSession,
): ExamTemplate | undefined {
  return s.examTemplates.find((t) => t.id === session.templateId);
}

/**
 * 응시·채점의 기준 스펙 — 세션 스냅샷이 있으면 그것을(세트 수정과 무관),
 * 없으면(구 세션) 현재 세트를 반환. 화면·채점은 모두 이걸 써야 한다.
 */
export function examSpecOf(
  s: HrState,
  session: ExamSession,
): ExamSpec | undefined {
  return session.snapshot ?? s.examTemplates.find((t) => t.id === session.templateId);
}

/** 지원서의 응시 세션들 (최신 배정 순) */
export function examSessionsOfApp(s: HrState, applicationId: string): ExamSession[] {
  return s.examSessions
    .filter((x) => x.applicationId === applicationId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

/** 시험 세트 직군/분류 태그 목록 (등록 순 유지, 중복 제거) — 필터·자동완성용 */
export function examCategories(s: HrState): string[] {
  const out: string[] = [];
  for (const t of s.examTemplates) {
    const c = t.category?.trim();
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/**
 * 시험 세트가 이 공고와 관련 있는가 — 자유 입력 태그라 포함 관계로
 * 느슨하게 판단한다 (배정 시 "추천" 정렬용, 강제 아님).
 */
export function examMatchesJob(t: ExamTemplate, job: HrJob | undefined): boolean {
  const c = t.category?.trim();
  if (!c || !job) return false;
  const hay = `${job.title} ${job.department} ${job.track}`.toLowerCase();
  const needle = c.toLowerCase();
  return (
    hay.includes(needle) ||
    needle.split(/[\s/·,]+/).some((w) => w.length >= 2 && hay.includes(w))
  );
}

/** 세트가 사용된 응시 세션 수 (목록의 "N회 사용" 표시용) */
export function examTemplateUsage(s: HrState, templateId: string): number {
  return s.examSessions.filter((x) => x.templateId === templateId).length;
}

/** 면접관으로 선택 가능한 멤버 (활성 + 열람 제외) */
export function selectableInterviewers(s: HrState): HrMember[] {
  return s.members.filter((m) => m.role !== "열람" && m.active !== false);
}

/** 멤버의 미확인 알림 수 */
export function unreadNoticeCount(s: HrState, memberId: string): number {
  return s.notices.filter((n) => n.memberId === memberId && !n.read).length;
}

export function stageOf(s: HrState, stageId: string): PipelineStage | undefined {
  return s.stages.find((st) => st.id === stageId);
}

export function applicantCount(s: HrState, jobId: string): number {
  return s.applications.filter((a) => a.jobId === jobId).length;
}

/** 미확인(수신·안읽음) 지원자 회신이 있는 지원서 */
export function appsWithUnreadEmail(s: HrState): HrApplication[] {
  return s.applications.filter((a) =>
    (a.emails ?? []).some((e) => e.direction === "수신" && !e.read),
  );
}

/**
 * 수험번호(응시번호) — 공고별 6자리 번호 + 접수순 일련번호.
 * 그리팅의 `{공고번호}-{일련번호}` 형식을 따른다(예: 418572-000003).
 * 시드 수정 없이 결정론적으로 계산 → 재현성 보장.
 */
export function applicantNo(s: HrState, appId: string): string {
  const app = s.applications.find((a) => a.id === appId);
  if (!app) return "-";
  // 공고 id → 안정적 6자리 번호
  let h = 0;
  for (let i = 0; i < app.jobId.length; i++) h = (h * 31 + app.jobId.charCodeAt(i)) | 0;
  const jobNo = (Math.abs(h) % 900000) + 100000;
  // 같은 공고 내 접수순 일련번호
  const seq =
    s.applications
      .filter((a) => a.jobId === app.jobId)
      .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt))
      .findIndex((a) => a.id === appId) + 1;
  return `${jobNo}-${String(seq).padStart(6, "0")}`;
}

// ── 중복 지원자 감지 ─────────────────────────────────────────────

export interface DupGroup {
  /** 무시 처리용 안정 키 (정렬된 후보 id 조합) */
  key: string;
  candidateIds: string[];
  /** 어떤 값이 겹쳤는가 */
  matchedBy: ("이메일" | "전화번호")[];
}

/** 동일 이메일/전화번호를 쓰는 후보 레코드 그룹을 찾는다 */
export function findDuplicateGroups(s: HrState): DupGroup[] {
  const byValue = new Map<string, { ids: Set<string>; label: "이메일" | "전화번호" }>();
  for (const c of s.candidates) {
    const email = c.email.trim().toLowerCase();
    const phone = c.phone.replace(/\D/g, "");
    if (email) {
      const e = byValue.get(`e:${email}`) ?? { ids: new Set(), label: "이메일" as const };
      e.ids.add(c.id);
      byValue.set(`e:${email}`, e);
    }
    if (phone) {
      const p = byValue.get(`p:${phone}`) ?? { ids: new Set(), label: "전화번호" as const };
      p.ids.add(c.id);
      byValue.set(`p:${phone}`, p);
    }
  }
  // 같은 멤버 조합은 하나의 그룹으로 합치고, 겹친 근거(이메일/전화)를 모은다
  const groups = new Map<string, DupGroup>();
  for (const { ids, label } of byValue.values()) {
    if (ids.size < 2) continue;
    const sorted = [...ids].sort();
    const key = sorted.join("+");
    const existing = groups.get(key);
    if (existing) {
      if (!existing.matchedBy.includes(label)) existing.matchedBy.push(label);
    } else {
      groups.set(key, { key, candidateIds: sorted, matchedBy: [label] });
    }
  }
  return [...groups.values()].filter(
    (g) => !s.dismissedDupes.includes(g.key),
  );
}
