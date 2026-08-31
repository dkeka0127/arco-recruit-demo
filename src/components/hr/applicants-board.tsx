"use client";

// ════════════════════════════════════════════════════════════════
//  지원자 파이프라인 — 칸반(드래그 앤 드롭) + 리스트 뷰
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Search,
  Star,
  LayoutGrid,
  List,
  GripVertical,
  Inbox,
  Download,
  UserX,
  X,
  TriangleAlert,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  findDuplicateGroups,
  applicantNo,
} from "@/lib/hr/store";
import { confirmAction, toast } from "@/components/hr/feedback";
import { RegisterCandidateButton } from "@/components/hr/candidate-register";
import { ImportCandidatesButton } from "@/components/hr/candidate-import";
import type { HrApplication, HrState } from "@/lib/hr/types";
import {
  StageBadge,
  Stars,
  Avatar,
  EmptyState,
  fmtDate,
  daysAgo,
} from "@/components/hr/ui";

function avgRating(app: HrApplication): number {
  const all = app.evaluations.flatMap((ev) => ev.scores.map((sc) => sc.score));
  if (all.length === 0) return 0;
  return all.reduce((a, b) => a + b, 0) / all.length;
}

function shortTitle(title?: string): string {
  return title?.replace(/^\[[^\]]*\]\s*/, "") ?? "";
}

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// 렌더 순수성 규칙 밖 (모듈 스코프) — 일괄 배정 기한 기본값
const plusDaysStr = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

/** 카드/컬럼 표시용 지원서 상태 힌트 */
interface CardHint {
  label: string;
  tone: "accent" | "ink" | "signal" | "warn";
}
function cardHints(s: HrState, app: HrApplication, dupIds: Set<string>): CardHint[] {
  const hints: CardHint[] = [];
  if (app.withdrawnAt) hints.push({ label: "철회", tone: "ink" });
  const cand = s.candidates.find((c) => c.id === app.candidateId);
  if (cand?.anonymizedAt) hints.push({ label: "개인정보 파기", tone: "ink" });
  const ivs = s.interviews.filter((iv) => iv.applicationId === app.id);
  if (ivs.some((iv) => iv.status === "평가대기"))
    hints.push({ label: "평가 대기", tone: "accent" });
  if (s.proposals.some((p) => p.applicationId === app.id && p.status === "대기"))
    hints.push({ label: "일정 조율 중", tone: "accent" });
  if (dupIds.has(app.candidateId))
    hints.push({ label: "중복 의심", tone: "ink" });
  // 미통보: 마지막 단계 이동 후 지원자 공개 단계인데 메시지가 없을 때(근사)
  const stage = s.stages.find((st) => st.id === app.stageId);
  if (
    stage?.visibleToCandidate &&
    stage.kind === "active" &&
    !s.settings.notifyOnStageChange &&
    app.messages.length === 0
  )
    hints.push({ label: "미통보", tone: "warn" });
  if (daysBetween(app.updatedAt) >= 14 && stage?.kind === "active")
    hints.push({ label: `정체 ${daysBetween(app.updatedAt)}일`, tone: "warn" });
  return hints;
}

function useFilteredApps(
  s: HrState,
  { q, jobId, starred }: { q: string; jobId: string; starred: boolean },
) {
  return useMemo(() => {
    return s.applications.filter((a) => {
      if (jobId !== "all" && a.jobId !== jobId) return false;
      if (starred && !a.starred) return false;
      if (q.trim()) {
        const candidate = s.candidates.find((c) => c.id === a.candidateId);
        const job = s.jobs.find((j) => j.id === a.jobId);
        const hit =
          candidate?.name.includes(q) ||
          candidate?.tags.some((t) =>
            t.toLowerCase().includes(q.toLowerCase()),
          ) ||
          job?.title.includes(q) ||
          applicantNo(s, a.id).includes(q.trim());
        if (!hit) return false;
      }
      return true;
    });
  }, [s, q, jobId, starred]);
}

// ── 중복 지원자 감지 배너 ────────────────────────────────────────

function DupBanner() {
  const s = useHrState();
  const groups = findDuplicateGroups(s);
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map((g) => {
        const members = g.candidateIds
          .map((id) => s.candidates.find((c) => c.id === id))
          .filter(Boolean);
        // 통합 기준(primary): 가장 먼저 지원한 레코드
        const sorted = [...g.candidateIds].sort((a, b) => {
          const first = (cid: string) =>
            s.applications
              .filter((ap) => ap.candidateId === cid)
              .map((ap) => ap.appliedAt)
              .sort()[0] ?? "9999";
          return first(a).localeCompare(first(b));
        });
        const primary = s.candidates.find((c) => c.id === sorted[0]);
        const dupIds = sorted.slice(1);
        const appCount = (cid: string) =>
          s.applications.filter((ap) => ap.candidateId === cid).length;

        return (
          <div
            key={g.key}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-accent bg-accent-soft/50 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-[0.85rem] font-bold text-accent-ink">
              <TriangleAlert className="size-4" />
              중복 지원자 감지
            </span>
            <span className="text-[0.82rem] text-ink">
              {members.map((m, i) => (
                <span key={m!.id}>
                  {i > 0 && " · "}
                  <b>{m!.name}</b>
                  <span className="text-muted">
                    ({m!.source}, 지원 {appCount(m!.id)}건)
                  </span>
                </span>
              ))}
              <span className="ml-1.5 text-muted">
                — {g.matchedBy.join("·")} 동일
              </span>
            </span>
            <span className="ml-auto flex gap-2">
              <button
                onClick={async () => {
                  const ok = await confirmAction({
                    title: "중복 지원자를 하나로 통합할까요?",
                    lines: [
                      `최초 지원 레코드(${primary?.name})를 대표로 유지하고, 나머지 레코드의 지원서·태그·파일을 병합합니다.`,
                    ],
                    facts: [
                      { label: "대표(유지)", value: `${primary?.name} · ${primary?.email}` },
                      {
                        label: "병합 대상",
                        value: `${dupIds.length}개 레코드`,
                      },
                      {
                        label: "합쳐질 지원",
                        value: `총 ${g.candidateIds.reduce((n, id) => n + appCount(id), 0)}건`,
                      },
                      { label: "일치 근거", value: g.matchedBy.join("·") },
                    ],
                    confirmLabel: "통합",
                    danger: true,
                  });
                  if (!ok) return;
                  dupIds.forEach((dupId) =>
                    hrActions.mergeCandidates(sorted[0], dupId),
                  );
                }}
                className="rounded-full bg-ink px-4 py-1.5 text-[0.78rem] font-bold text-paper transition-colors hover:bg-ink-700"
              >
                하나로 통합
              </button>
              <button
                onClick={() => hrActions.dismissDupe(g.key)}
                className="rounded-full border border-line-strong bg-pure px-4 py-1.5 text-[0.78rem] font-semibold text-muted transition-colors hover:text-ink"
              >
                동일인 아님 (무시)
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── CSV(엑셀) 내보내기 ───────────────────────────────────────────

function exportCsv(apps: HrApplication[], s: HrState) {
  const header = [
    "수험번호", "이름", "이메일", "전화", "지원 공고", "단계", "AI 매치",
    "평균 평점", "유입 경로", "접수일", "최근 업데이트",
  ];
  const rows = apps.map((a) => {
    const c = s.candidates.find((c) => c.id === a.candidateId);
    const j = s.jobs.find((j) => j.id === a.jobId);
    const st = s.stages.find((st) => st.id === a.stageId);
    const rating = avgRating(a);
    return [
      applicantNo(s, a.id), c?.name ?? "", c?.email ?? "", c?.phone ?? "", j?.title ?? "",
      st?.name ?? "", String(a.ai.matchScore),
      rating ? rating.toFixed(1) : "", c?.source ?? "",
      fmtDate(a.appliedAt), fmtDate(a.updatedAt),
    ];
  });
  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  // BOM — 한글 엑셀 호환
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `지원자목록_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── 칸반 카드 ────────────────────────────────────────────────────

const HINT_TONE: Record<CardHint["tone"], string> = {
  accent: "bg-accent-soft text-accent-ink",
  ink: "bg-ink text-paper",
  signal: "bg-signal/12 text-signal",
  warn: "bg-ink/8 text-ink",
};

function KanbanCard({
  app,
  s,
  dupIds,
  onDragStart,
}: {
  app: HrApplication;
  s: HrState;
  dupIds: Set<string>;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const router = useRouter();
  const candidate = s.candidates.find((c) => c.id === app.candidateId);
  const job = s.jobs.find((j) => j.id === app.jobId);
  const rating = avgRating(app);
  const hints = cardHints(s, app, dupIds);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, app.id)}
      onClick={() => router.push(`/hr/applicants/${app.id}`)}
      className="group cursor-pointer rounded-xl border border-line bg-pure p-3.5 shadow-[0_1px_2px_rgba(10,10,11,0.04)] transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lift active:cursor-grabbing"
    >
      <div className="flex items-start gap-2.5">
        <GripVertical className="mt-1 size-3.5 shrink-0 cursor-grab text-line-strong opacity-0 transition-opacity group-hover:opacity-100" />
        <Avatar name={candidate?.name ?? "?"} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-bold tracking-tight text-ink">
              {candidate?.name}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hrActions.toggleStar(app.id);
              }}
              aria-label="주요 후보 표시"
              className="shrink-0"
            >
              <Star
                className={cn(
                  "size-4 transition-all hover:scale-110",
                  app.starred
                    ? "fill-accent text-accent"
                    : "fill-transparent text-line-strong hover:text-accent",
                )}
              />
            </button>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">
            {shortTitle(job?.title)}
          </p>
        </div>
      </div>
      {hints.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {hints.map((h) => (
            <span
              key={h.label}
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.62rem] font-bold",
                HINT_TONE[h.tone],
              )}
            >
              {h.label}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[0.68rem] font-bold",
              app.ai.matchScore >= 85
                ? "bg-signal/12 text-signal"
                : app.ai.matchScore >= 65
                  ? "bg-accent-soft text-accent-ink"
                  : "bg-paper-dim text-muted",
            )}
            title="AI 매치 스코어"
          >
            AI {app.ai.matchScore}
          </span>
          {rating > 0 && <Stars value={rating} size={12} />}
        </span>
        <span className="font-mono text-[0.65rem] text-muted-ink">
          {daysAgo(app.updatedAt)}
        </span>
      </div>
    </div>
  );
}

// ── 메인 보드 ────────────────────────────────────────────────────

export function ApplicantsBoard() {
  const s = useHrState();
  const params = useSearchParams();
  const initialStage = params.get("stage");

  const [view, setView] = useState<"kanban" | "list">(
    initialStage ? "list" : "kanban",
  );
  const [q, setQ] = useState("");
  const [jobId, setJobId] = useState(params.get("job") ?? "all");
  const [starred, setStarred] = useState(false);
  const [stageFilter, setStageFilter] = useState(initialStage ?? "all");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // 일괄 필기시험 배정 패널
  const [examOpen, setExamOpen] = useState(false);
  const [examTemplateId, setExamTemplateId] = useState("");
  const [examDeadline, setExamDeadline] = useState(() => plusDaysStr(7));

  const apps = useFilteredApps(s, { q, jobId, starred });
  const stages = [...s.stages].sort((a, b) => a.order - b.order);
  const dupIds = useMemo(
    () => new Set(findDuplicateGroups(s).flatMap((g) => g.candidateIds)),
    [s],
  );

  function columnStats(stageApps: HrApplication[]) {
    const active = stageApps.length;
    const avgDays =
      active > 0
        ? Math.round(
            stageApps.reduce((sum, a) => sum + daysBetween(a.updatedAt), 0) /
              active,
          )
        : 0;
    const delayed = stageApps.filter(
      (a) => daysBetween(a.updatedAt) >= 14,
    ).length;
    const pendingEval = stageApps.filter((a) =>
      s.interviews.some(
        (iv) => iv.applicationId === a.id && iv.status === "평가대기",
      ),
    ).length;
    return { avgDays, delayed, pendingEval };
  }

  const listApps = useMemo(() => {
    const filtered =
      stageFilter === "all"
        ? apps
        : apps.filter((a) => a.stageId === stageFilter);
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [apps, stageFilter]);

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const app = s.applications.find((a) => a.id === id);
    if (app && app.stageId !== stageId) {
      hrActions.moveStage(id, stageId);
    }
  }

  const visibleApps = view === "list" ? listApps : apps;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <DupBanner />

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·태그·공고 검색"
            className="h-10 w-56 rounded-full border border-line bg-pure pl-9 pr-4 text-sm tracking-tight placeholder:text-muted-ink focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="h-10 max-w-64 rounded-full border border-line bg-pure px-4 text-sm tracking-tight text-ink focus:border-accent focus:outline-none"
        >
          <option value="all">전체 공고</option>
          {s.jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        {view === "list" && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 rounded-full border border-line bg-pure px-4 text-sm tracking-tight text-ink focus:border-accent focus:outline-none"
          >
            <option value="all">전체 단계</option>
            {stages.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setStarred(!starred)}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
            starred
              ? "border-accent bg-accent-soft text-accent-ink"
              : "border-line bg-pure text-muted hover:text-ink",
          )}
        >
          <Star
            className={cn("size-4", starred && "fill-accent text-accent")}
          />
          주요 후보
        </button>

        <button
          onClick={() => exportCsv(visibleApps, s)}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-full border border-line bg-pure px-4 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
          title="현재 필터 기준으로 엑셀(CSV) 다운로드"
        >
          <Download className="size-4" /> 엑셀
        </button>

        <ImportCandidatesButton />
        <RegisterCandidateButton />

        <div className="flex rounded-full border border-line bg-pure p-1">
          {(
            [
              { key: "kanban", icon: LayoutGrid, label: "칸반" },
              { key: "list", icon: List, label: "리스트" },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => {
                setView(v.key);
                setSelected(new Set());
              }}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[0.8rem] font-semibold transition-colors",
                view === v.key
                  ? "bg-ink text-paper"
                  : "text-muted hover:text-ink",
              )}
            >
              <v.icon className="size-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* bulk action bar */}
      {view === "list" && selected.size > 0 && (
        <div className="sticky top-[72px] z-30 flex flex-wrap items-center gap-3 rounded-card border border-ink bg-ink px-4 py-3 text-paper shadow-pop">
          <span className="text-sm font-bold">
            <span className="font-mono text-accent">{selected.size}</span>명
            선택됨
          </span>
          <span className="h-4 w-px bg-white/20" />
          <select
            value=""
            onChange={async (e) => {
              const stageId = e.target.value;
              if (!stageId) return;
              const st = stages.find((x) => x.id === stageId);
              const ok = await confirmAction({
                title: `${selected.size}명을 일괄 이동할까요?`,
                facts: [
                  { label: "대상", value: `${selected.size}명` },
                  { label: "이동 단계", value: st?.name ?? stageId },
                  {
                    label: "지원자 공개",
                    value: st?.visibleToCandidate ? "공개됨" : "비공개",
                  },
                ],
                confirmLabel: "일괄 이동",
                danger: st?.kind === "rejected",
              });
              if (ok) {
                hrActions.bulkMoveStage([...selected], stageId);
                setSelected(new Set());
              }
            }}
            className="h-9 cursor-pointer rounded-full border border-white/25 bg-transparent px-3.5 text-[0.8rem] font-semibold text-paper focus:outline-none [&>option]:text-ink"
          >
            <option value="">일괄 단계 이동…</option>
            {stages
              .filter((st) => st.kind !== "rejected")
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>
          <button
            onClick={async () => {
              const ok = await confirmAction({
                title: `${selected.size}명을 일괄 불합격 처리할까요?`,
                lines: ["선택한 지원자 전원이 불합격 단계로 이동합니다."],
                facts: [{ label: "대상", value: `${selected.size}명` }],
                confirmLabel: "일괄 불합격",
                danger: true,
              });
              if (!ok) return;
              const reason = prompt("불합격 사유 (선택, 전원 공통):") ?? undefined;
              hrActions.bulkMoveStage(
                [...selected],
                "rejected",
                reason || undefined,
              );
              setSelected(new Set());
            }}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/25 px-4 text-[0.8rem] font-semibold transition-colors hover:bg-white/10"
          >
            <UserX className="size-3.5" /> 일괄 불합격
          </button>
          <button
            onClick={() => {
              setExamOpen((v) => !v);
              if (!examTemplateId) setExamTemplateId(s.examTemplates[0]?.id ?? "");
            }}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full border px-4 text-[0.8rem] font-semibold transition-colors",
              examOpen
                ? "border-accent bg-accent text-ink"
                : "border-white/25 hover:bg-white/10",
            )}
          >
            <FileCheck className="size-3.5" /> 필기시험 배정
          </button>
          <button
            onClick={() =>
              exportCsv(
                listApps.filter((a) => selected.has(a.id)),
                s,
              )
            }
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/25 px-4 text-[0.8rem] font-semibold transition-colors hover:bg-white/10"
          >
            <Download className="size-3.5" /> 선택 항목 엑셀
          </button>
          <button
            onClick={() => setSelected(new Set())}
            aria-label="선택 해제"
            className="ml-auto flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <X className="size-4" />
          </button>

          {/* 일괄 필기시험 배정 — 시험·기한 선택 후 발급 */}
          {examOpen && (
            <div className="flex w-full flex-wrap items-center gap-2.5 border-t border-white/15 pt-3">
              <select
                value={examTemplateId}
                onChange={(e) => setExamTemplateId(e.target.value)}
                className="h-9 cursor-pointer rounded-full border border-white/25 bg-transparent px-3.5 text-[0.8rem] font-semibold text-paper focus:outline-none [&>option]:text-ink"
              >
                {s.examTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.category ? `[${t.category}] ` : ""}{t.title} ({t.durationMin}분)
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[0.75rem] font-semibold text-paper/70">
                응시 기한
                <input
                  type="date"
                  value={examDeadline}
                  onChange={(e) => setExamDeadline(e.target.value)}
                  className="h-9 rounded-full border border-white/25 bg-transparent px-3 text-[0.8rem] font-semibold text-paper focus:outline-none [color-scheme:dark]"
                />
              </label>
              <button
                onClick={async () => {
                  const t = s.examTemplates.find((x) => x.id === examTemplateId);
                  if (!t) return;
                  const ok = await confirmAction({
                    title: `${selected.size}명에게 필기시험을 배정할까요?`,
                    lines: ["각자에게 개인 응시 링크가 발급되고 안내 메일이 발송됩니다.", "이미 같은 시험이 발급된 지원자는 건너뜁니다."],
                    facts: [
                      { label: "시험", value: t.title },
                      { label: "응시 기한", value: examDeadline },
                      { label: "대상", value: `${selected.size}명` },
                    ],
                    confirmLabel: "일괄 배정",
                  });
                  if (!ok) return;
                  const n = hrActions.bulkAssignExam(
                    [...selected],
                    examTemplateId,
                    `${examDeadline}T23:59:00+09:00`,
                  );
                  toast.show(
                    n === selected.size
                      ? `${n}명에게 응시 링크를 발급했습니다.`
                      : `${n}명 발급 완료 (${selected.size - n}명은 이미 발급되어 건너뜀)`,
                  );
                  setExamOpen(false);
                  setSelected(new Set());
                }}
                className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-5 text-[0.8rem] font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white"
              >
                <FileCheck className="size-3.5" /> {selected.size}명에게 발급
              </button>
              <span className="text-[0.7rem] text-paper/50">
                발급 현황·채점은 필기시험 메뉴에서 확인
              </span>
            </div>
          )}
        </div>
      )}

      {/* kanban */}
      {view === "kanban" && (
        <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
          {stages.map((stage) => {
            const columnApps = apps
              .filter((a) => a.stageId === stage.id)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
            const st = columnStats(columnApps);
            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => onDrop(e, stage.id)}
                className={cn(
                  "flex w-[272px] shrink-0 flex-col rounded-card border transition-colors",
                  dragOver === stage.id
                    ? "border-accent bg-accent-soft/40"
                    : "border-line/70 bg-paper/60",
                  stage.kind === "rejected" && "opacity-80",
                )}
              >
                <header className="px-4 pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <StageBadge stage={stage} />
                    <span className="font-mono text-xs text-muted">
                      {columnApps.length}
                    </span>
                  </div>
                  {columnApps.length > 0 && stage.kind === "active" && (
                    <p className="mt-1.5 flex flex-wrap gap-x-2 font-mono text-[0.62rem] text-muted-ink">
                      <span>평균 {st.avgDays}일</span>
                      {st.delayed > 0 && (
                        <span className="text-ink">· 지연 {st.delayed}</span>
                      )}
                      {st.pendingEval > 0 && (
                        <span className="text-accent-ink">
                          · 평가대기 {st.pendingEval}
                        </span>
                      )}
                    </p>
                  )}
                </header>
                <div className="flex min-h-[120px] flex-col gap-2.5 p-3">
                  {columnApps.map((app) => (
                    <KanbanCard
                      key={app.id}
                      app={app}
                      s={s}
                      dupIds={dupIds}
                      onDragStart={onDragStart}
                    />
                  ))}
                  {columnApps.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-strong/60 py-8">
                      <p className="text-xs text-muted-ink">
                        카드를 끌어다 놓으세요
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* list */}
      {view === "list" && (
        <div className="surface-card overflow-hidden rounded-card shadow-lift">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left">
                  <th className="w-12 px-5 py-3">
                    <input
                      type="checkbox"
                      aria-label="전체 선택"
                      checked={
                        listApps.length > 0 && selected.size === listApps.length
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? new Set(listApps.map((a) => a.id))
                            : new Set(),
                        )
                      }
                      className="size-4 cursor-pointer accent-[#52b3d8]"
                    />
                  </th>
                  {["지원자", "지원 공고", "단계", "AI 매치", "평가", "접수일", "업데이트"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {listApps.map((app) => {
                  const candidate = s.candidates.find(
                    (c) => c.id === app.candidateId,
                  );
                  const job = s.jobs.find((j) => j.id === app.jobId);
                  const stage = s.stages.find((st) => st.id === app.stageId);
                  const rating = avgRating(app);
                  return (
                    <tr
                      key={app.id}
                      className={cn(
                        "group border-b border-line/70 transition-colors last:border-0 hover:bg-accent-soft/30",
                        selected.has(app.id) && "bg-accent-soft/40",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          aria-label={`${candidate?.name} 선택`}
                          checked={selected.has(app.id)}
                          onChange={() => toggleSelect(app.id)}
                          className="size-4 cursor-pointer accent-[#52b3d8]"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/hr/applicants/${app.id}`}
                          className="flex items-center gap-2.5"
                        >
                          <Avatar name={candidate?.name ?? "?"} size="sm" />
                          <span>
                            <span className="flex items-center gap-1.5 font-bold tracking-tight text-ink">
                              {candidate?.name}
                              {app.starred && (
                                <Star className="size-3 fill-accent text-accent" />
                              )}
                            </span>
                            <span className="block text-xs text-muted">
                              <span className="font-mono text-muted-ink">
                                {applicantNo(s, app.id)}
                              </span>{" "}
                              · {candidate?.source}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="max-w-56 truncate px-5 py-3.5 text-muted">
                        {shortTitle(job?.title)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StageBadge stage={stage} />
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-ink">
                        {app.ai.matchScore}
                      </td>
                      <td className="px-5 py-3.5">
                        {rating > 0 ? (
                          <Stars value={rating} size={13} />
                        ) : (
                          <span className="text-xs text-muted-ink">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted">
                        {fmtDate(app.appliedAt)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted">
                        {daysAgo(app.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {listApps.length === 0 && (
            <EmptyState
              icon={<Inbox className="size-6" />}
              text="조건에 맞는 지원자가 없습니다."
            />
          )}
        </div>
      )}
    </div>
  );
}
