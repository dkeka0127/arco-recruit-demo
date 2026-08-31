"use client";

// ════════════════════════════════════════════════════════════════
//  감사 로그 패널 — 검색·분류·담당자 필터 + CSV 내보내기.
//  개인정보 접근 추적(sensitive)과 규정 대응(내보내기)이 목적.
// ════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { ScrollText, Lock, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState, memberName } from "@/lib/hr/store";
import { Panel, EmptyState, fmtDateTime } from "@/components/hr/ui";
import { toast } from "@/components/hr/feedback";
import type { AuditAction, AuditLog, HrState } from "@/lib/hr/types";

const PAGE = 30;

/** 액션 한글 라벨 (행 뱃지·CSV 공용) */
const ACTION_LABEL: Record<AuditAction, string> = {
  stage_changed: "단계 이동",
  bulk_stage_changed: "일괄 단계 이동",
  rejected: "불합격 처리",
  hired: "합격 처리",
  message_sent: "메시지 발송",
  message_scheduled: "발송 예약",
  message_canceled: "예약 취소",
  duplicate_merged: "중복 병합",
  talent_added: "인재풀 등록",
  talent_deleted: "인재풀 삭제",
  interview_proposed: "면접 제안",
  interview_confirmed: "면접 확정",
  interview_canceled: "면접 취소",
  reschedule_requested: "일정 변경 요청",
  evaluation_added: "평가 등록",
  settings_changed: "설정 변경",
  file_downloaded: "파일 다운로드",
  exam_assigned: "시험 배정",
  exam_submitted: "시험 제출",
  exam_graded: "시험 채점",
  exam_canceled: "시험 취소",
  application_withdrawn: "지원 철회",
  candidate_anonymized: "개인정보 파기",
  candidate_registered: "지원자 직접 등록",
};

/** 분류 칩 — 액션을 업무 영역으로 묶는다 */
const GROUPS: { key: string; label: string; actions: AuditAction[] }[] = [
  {
    key: "stage",
    label: "단계·합불",
    actions: ["stage_changed", "bulk_stage_changed", "rejected", "hired"],
  },
  {
    key: "message",
    label: "발송",
    actions: ["message_sent", "message_scheduled", "message_canceled"],
  },
  {
    key: "interview",
    label: "면접·평가",
    actions: [
      "interview_proposed",
      "interview_confirmed",
      "interview_canceled",
      "reschedule_requested",
      "evaluation_added",
    ],
  },
  {
    key: "exam",
    label: "필기시험",
    actions: ["exam_assigned", "exam_submitted", "exam_graded", "exam_canceled"],
  },
  {
    key: "privacy",
    label: "개인정보",
    actions: [
      "candidate_registered",
      "candidate_anonymized",
      "application_withdrawn",
      "duplicate_merged",
      "file_downloaded",
    ],
  },
  {
    key: "etc",
    label: "기타",
    actions: ["talent_added", "talent_deleted", "settings_changed"],
  },
];

function exportAuditCsv(logs: AuditLog[], s: HrState) {
  const header = ["시각", "담당자", "액션", "대상 유형", "대상 ID", "내용", "개인정보 관련"];
  const rows = logs.map((l) => [
    fmtDateTime(l.at),
    memberName(s, l.actorId),
    ACTION_LABEL[l.action] ?? l.action,
    l.targetType,
    l.targetId,
    l.summary,
    l.sensitive ? "Y" : "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  // BOM — 한글 엑셀 호환
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `감사로그_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditLogPanel() {
  const s = useHrState();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [actorId, setActorId] = useState("all");
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  // 로그에 실제 등장하는 담당자만 선택지로
  const actors = useMemo(() => {
    const ids = [...new Set(s.auditLog.map((l) => l.actorId))];
    return ids.map((id) => ({ id, name: memberName(s, id) }));
  }, [s]);

  const filtered = useMemo(() => {
    const groupActions =
      group === "all"
        ? null
        : new Set(GROUPS.find((g) => g.key === group)?.actions ?? []);
    const needle = q.trim().toLowerCase();
    return s.auditLog.filter((l) => {
      if (groupActions && !groupActions.has(l.action)) return false;
      if (actorId !== "all" && l.actorId !== actorId) return false;
      if (sensitiveOnly && !l.sensitive) return false;
      if (needle) {
        const hay =
          `${l.summary} ${ACTION_LABEL[l.action] ?? l.action} ${memberName(s, l.actorId)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [s, q, group, actorId, sensitiveOnly]);

  const visible = filtered.slice(0, limit);

  return (
    <Panel
      title={
        <span className="flex items-center gap-1.5">
          <ScrollText className="size-4 text-accent-ink" /> 감사 로그
        </span>
      }
      action={
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.68rem] text-muted-ink">
            {filtered.length === s.auditLog.length
              ? `전체 ${s.auditLog.length}건`
              : `${filtered.length}/${s.auditLog.length}건`}
          </span>
          <button
            onClick={() => {
              if (filtered.length === 0) return;
              exportAuditCsv(filtered, s);
              toast.show(`감사 로그 ${filtered.length}건을 내보냈습니다.`);
            }}
            title="현재 필터 기준으로 CSV 다운로드"
            className="flex items-center gap-1 rounded-full border border-line bg-pure px-3 py-1.5 text-[0.7rem] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <Download className="size-3" /> 내보내기
          </button>
        </div>
      }
      bodyClassName="p-0"
    >
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-ink" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="내용·담당자 검색"
            className="w-44 rounded-full border border-line bg-pure py-1.5 pl-8 pr-3 text-[0.75rem] outline-none transition-colors focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ key: "all", label: "전체" }, ...GROUPS].map((g) => (
            <button
              key={g.key}
              onClick={() => {
                setGroup(g.key);
                setLimit(PAGE);
              }}
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition-colors",
                group === g.key
                  ? "bg-ink text-paper"
                  : "bg-paper-dim text-muted hover:text-ink",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        {actors.length > 1 && (
          <select
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setLimit(PAGE);
            }}
            className="rounded-full border border-line bg-pure px-3 py-1.5 text-[0.72rem] outline-none focus:border-accent"
          >
            <option value="all">담당자 전체</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => {
            setSensitiveOnly((v) => !v);
            setLimit(PAGE);
          }}
          title="개인정보 열람·수정·파기 등 민감 액션만"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition-colors",
            sensitiveOnly
              ? "border-ink bg-ink text-paper"
              : "border-line text-muted hover:text-ink",
          )}
        >
          <Lock className="size-3" /> 개인정보만
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          text={
            s.auditLog.length === 0
              ? "아직 기록된 감사 로그가 없습니다. 단계 이동·발송·병합 등 위험 액션이 여기에 남습니다."
              : "조건에 맞는 로그가 없습니다. 검색어나 필터를 조정해 보세요."
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {visible.map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 px-5 py-2.5 text-sm"
              >
                {log.sensitive && (
                  <Lock className="size-3.5 shrink-0 text-ink" aria-label="개인정보 관련" />
                )}
                <span className="shrink-0 rounded-full bg-paper-dim px-2 py-0.5 text-[0.62rem] font-bold text-muted">
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink">
                  {log.summary}
                </span>
                {log.undoable && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[0.6rem] font-bold text-accent-ink">
                    되돌림 가능
                  </span>
                )}
                <span className="shrink-0 font-mono text-[0.62rem] text-muted-ink">
                  {memberName(s, log.actorId)} · {fmtDateTime(log.at)}
                </span>
              </li>
            ))}
          </ul>
          {filtered.length > limit && (
            <div className="border-t border-line px-5 py-3 text-center">
              <button
                onClick={() => setLimit((n) => n + PAGE)}
                className="rounded-full border border-line px-4 py-1.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-ink hover:text-ink"
              >
                더 보기 ({filtered.length - limit}건 남음)
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
