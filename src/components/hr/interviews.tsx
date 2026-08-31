"use client";

// ════════════════════════════════════════════════════════════════
//  면접 일정 — 주간 캘린더 보드 + 평가 대기 큐
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  ClipboardCheck,
  Link2,
  Hourglass,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState, hrActions, memberName } from "@/lib/hr/store";
import type { Interview, InterviewStatus } from "@/lib/hr/types";
import { Panel, Avatar, EmptyState } from "@/components/hr/ui";

const WEEKDAYS = ["월", "화", "수", "목", "금"];
const STATUSES: InterviewStatus[] = ["예정", "평가대기", "완료", "취소"];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 해당 날짜가 속한 주의 월요일 */
function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function InterviewCard({
  iv,
  compact,
}: {
  iv: Interview;
  compact?: boolean;
}) {
  const s = useHrState();
  const app = s.applications.find((a) => a.id === iv.applicationId);
  const candidate = s.candidates.find((c) => c.id === app?.candidateId);
  const job = s.jobs.find((j) => j.id === app?.jobId);
  const remote = iv.location.includes("화상");

  return (
    <div
      className={cn(
        "rounded-xl border bg-pure p-3 transition-all hover:-translate-y-0.5 hover:shadow-lift",
        iv.status === "평가대기" ? "border-accent" : "border-line",
        iv.status === "취소" && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.72rem] font-semibold text-accent-ink">
          {iv.start}–{iv.end}
        </span>
        <select
          value={iv.status}
          onChange={(e) =>
            hrActions.setInterviewStatus(iv.id, e.target.value as InterviewStatus)
          }
          className={cn(
            "cursor-pointer rounded-full border-0 px-2 py-0.5 text-[0.65rem] font-bold focus:outline-none",
            iv.status === "예정" && "bg-accent-soft text-accent-ink",
            iv.status === "평가대기" && "bg-accent text-ink",
            iv.status === "완료" && "bg-signal/12 text-signal",
            iv.status === "취소" && "bg-paper-dim text-muted",
          )}
        >
          {STATUSES.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </select>
      </div>
      <Link
        href={`/hr/applicants/${iv.applicationId}`}
        className="mt-2 block"
      >
        <p className="font-bold tracking-tight text-ink hover:text-accent-ink">
          {candidate?.name}{" "}
          <span className="ml-1 rounded-full bg-paper-dim px-2 py-0.5 text-[0.62rem] font-bold text-muted">
            {iv.round}
          </span>
        </p>
        {!compact && (
          <p className="mt-0.5 truncate text-[0.72rem] text-muted">
            {job?.title.replace(/^\[[^\]]*\]\s*/, "")}
          </p>
        )}
      </Link>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <span className="flex items-center gap-1 text-[0.68rem] text-muted">
          {remote ? (
            <Video className="size-3 text-accent-ink" />
          ) : (
            <MapPin className="size-3 text-accent-ink" />
          )}
          {remote ? "화상" : iv.location.replace("본관 7층 ", "")}
        </span>
        <span className="flex -space-x-1.5">
          {iv.interviewerIds.map((mid) => (
            <Avatar
              key={mid}
              name={memberName(s, mid)}
              size="sm"
              dark
              className="size-6 text-[0.6rem] ring-2 ring-white"
            />
          ))}
        </span>
      </div>
      {iv.note && (
        <p className="mt-2 rounded-lg bg-paper px-2.5 py-1.5 text-[0.68rem] leading-snug text-muted">
          {iv.note}
        </p>
      )}
      {(iv.status === "예정" || iv.status === "평가대기") && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/eval/${iv.id}`,
            );
            alert(
              "면접관 전용 평가 링크가 복사되었습니다.\n로그인 없이 열리는 평가 화면으로 연결됩니다.",
            );
          }}
          className="mt-2 flex items-center gap-1 text-[0.68rem] font-bold text-accent-ink hover:underline"
        >
          <Link2 className="size-3" /> 면접관 평가 링크 복사
        </button>
      )}
      {/* 면접관 일정 변경 요청 — 수정(상세) 또는 기존 일정 유지 */}
      {iv.rescheduleRequest && iv.status === "예정" && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-100/50 px-2.5 py-2">
          <p className="flex items-center gap-1 text-[0.68rem] font-bold text-amber-700">
            <CalendarClock className="size-3 shrink-0" />
            {memberName(s, iv.rescheduleRequest.by)} · 일정 변경 요청
          </p>
          <p className="mt-1 text-[0.68rem] leading-snug text-amber-700/90">
            “{iv.rescheduleRequest.reason}”
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Link
              href={`/hr/applicants/${iv.applicationId}`}
              className="rounded-full bg-ink px-2.5 py-1 text-[0.62rem] font-bold text-paper transition-colors hover:bg-ink-700"
            >
              일정 수정
            </Link>
            <button
              onClick={() => hrActions.dismissRescheduleRequest(iv.id)}
              title="기존 일정 유지 — 요청한 면접관에게 안내가 발송됩니다"
              className="rounded-full border border-amber-300 px-2.5 py-1 text-[0.62rem] font-bold text-amber-700 transition-colors hover:bg-amber-100"
            >
              기존 일정 유지
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HrInterviews() {
  const s = useHrState();
  const [weekOffset, setWeekOffset] = useState(0);
  const today = toKey(new Date());

  const week = useMemo(() => {
    const monday = mondayOf(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return WEEKDAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const pendingEvals = s.interviews.filter((iv) => iv.status === "평가대기");

  const rangeLabel = `${week[0].getMonth() + 1}.${week[0].getDate()} – ${week[4].getMonth() + 1}.${week[4].getDate()}`;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      {/* 평가 대기 큐 */}
      {pendingEvals.length > 0 && (
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="size-4 text-accent-ink" />
              평가 대기 — 면접은 끝났고 평가가 필요합니다
            </span>
          }
          bodyClassName="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {pendingEvals.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} compact />
          ))}
        </Panel>
      )}

      {/* 조율 중인 일정 제안 */}
      {s.proposals.filter((p) => p.status === "대기").length > 0 && (
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <Hourglass className="size-4 text-accent-ink" />
              조율 중 — 지원자 응답 대기
            </span>
          }
          bodyClassName="flex flex-col gap-2.5 p-4"
        >
          {s.proposals
            .filter((p) => p.status === "대기")
            .map((pr) => {
              const app = s.applications.find(
                (a) => a.id === pr.applicationId,
              );
              const candidate = s.candidates.find(
                (c) => c.id === app?.candidateId,
              );
              return (
                <div
                  key={pr.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-pure px-4 py-3"
                >
                  <Link
                    href={`/hr/applicants/${pr.applicationId}`}
                    className="font-bold tracking-tight text-ink hover:text-accent-ink"
                  >
                    {candidate?.name}
                  </Link>
                  <span className="rounded-full bg-paper-dim px-2.5 py-0.5 text-[0.68rem] font-bold text-muted">
                    {pr.round}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {pr.slots.map((sl, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-accent-soft px-2 py-1 font-mono text-[0.68rem] font-semibold text-accent-ink"
                      >
                        {sl.date.slice(5).replace("-", ".")} {sl.start}
                      </span>
                    ))}
                  </span>
                  <button
                    onClick={() => hrActions.cancelProposal(pr.id)}
                    className="ml-auto text-[0.72rem] font-semibold text-muted hover:text-ink"
                  >
                    제안 취소
                  </button>
                </div>
              );
            })}
        </Panel>
      )}

      {/* week nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">
          주간 면접 보드{" "}
          <span className="serif-italic ml-1 text-accent-ink">
            {rangeLabel}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="h-9 rounded-full border border-line bg-pure px-4 text-[0.8rem] font-semibold text-muted transition-colors hover:text-ink"
            >
              이번 주
            </button>
          )}
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            aria-label="이전 주"
            className="flex size-9 items-center justify-center rounded-full border border-line bg-pure text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            aria-label="다음 주"
            className="flex size-9 items-center justify-center rounded-full border border-line bg-pure text-muted transition-colors hover:text-ink"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* week grid */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {week.map((d, i) => {
          const key = toKey(d);
          const isToday = key === today;
          const dayInterviews = s.interviews
            .filter((iv) => iv.date === key)
            .sort((a, b) => a.start.localeCompare(b.start));
          return (
            <div
              key={key}
              className={cn(
                "flex min-h-[220px] flex-col rounded-card border p-3",
                isToday
                  ? "border-accent bg-accent-soft/30"
                  : "border-line/70 bg-paper/60",
              )}
            >
              <header className="mb-3 flex items-baseline justify-between px-1">
                <span
                  className={cn(
                    "text-sm font-bold",
                    isToday ? "text-accent-ink" : "text-ink",
                  )}
                >
                  {WEEKDAYS[i]}
                  {isToday && (
                    <span className="ml-1.5 rounded-full bg-accent px-2 py-0.5 text-[0.6rem] font-bold text-ink">
                      오늘
                    </span>
                  )}
                </span>
                <span className="font-mono text-[0.7rem] text-muted">
                  {d.getMonth() + 1}.{d.getDate()}
                </span>
              </header>
              <div className="flex flex-1 flex-col gap-2.5">
                {dayInterviews.map((iv) => (
                  <InterviewCard key={iv.id} iv={iv} />
                ))}
                {dayInterviews.length === 0 && (
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-[0.7rem] text-muted-ink">
                      일정 없음
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {s.interviews.length === 0 && (
        <EmptyState text="등록된 면접 일정이 없습니다." />
      )}
    </div>
  );
}
