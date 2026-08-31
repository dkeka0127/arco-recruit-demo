"use client";

// ════════════════════════════════════════════════════════════════
//  필기시험 관리 — 시험 라이브러리 + 문항 빌더 + 응시 현황 보드.
//  · 라이브러리: 직군/분류 태그로 모아두고 검색·복제해 재사용
//  · 빌더: 5유형 문항, 이미지 첨부, 순서 이동, AI 초안, 미리보기
//  배정은 지원자 상세(일괄은 지원자 보드)에서, 채점은 /hr/exams/[id]에서.
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  FileCheck,
  Plus,
  Clock,
  ShieldCheck,
  Link2,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Ban,
  Camera,
  Monitor,
  Maximize2,
  ClipboardX,
  Copy,
  Search,
  Eye,
  Sparkles,
  ImagePlus,
  X,
  Tag,
  TriangleAlert,
  BellRing,
  CalendarPlus,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useHrState,
  hrActions,
  applicantNo,
  examCategories,
  examTemplateUsage,
} from "@/lib/hr/store";
import type {
  ExamQuestion,
  ExamQuestionType,
  ExamSession,
  ExamTemplate,
} from "@/lib/hr/types";
import {
  DEFAULT_PROCTOR_POLICY,
  QUESTION_TYPE_LABEL,
  integrityTone,
  maxScoreOf,
  scoreSummary,
} from "@/lib/hr/exam";
import { ai } from "@/lib/hr/ai";
import { confirmAction, toast } from "@/components/hr/feedback";
import {
  Panel,
  StatCard,
  EmptyState,
  Avatar,
  fmtDate,
  fmtDateTime,
  dDay,
} from "@/components/hr/ui";

// 렌더 순수성 규칙 밖 (모듈 스코프) — 기한 연장 date input의 최소값
const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDaysStr = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const STATUS_TONE: Record<ExamSession["status"], string> = {
  발급: "bg-accent-soft text-accent-ink",
  진행중: "bg-amber-100 text-amber-700",
  제출: "bg-accent text-ink",
  채점완료: "bg-signal/12 text-signal",
  만료: "bg-ink/8 text-muted",
  중단: "bg-ink/8 text-muted",
};

export function IntegrityBadge({ score }: { score?: number }) {
  if (typeof score !== "number") return <span className="text-muted-ink">—</span>;
  const tone = integrityTone(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.7rem] font-bold",
        tone === "signal" && "bg-signal/12 text-signal",
        tone === "accent" && "bg-amber-100 text-amber-700",
        tone === "danger" && "bg-red-50 text-red-600",
      )}
      title="무결성 점수 — 응시 중 이탈·차단 신호를 감점한 값 (100 = 신호 없음)"
    >
      <ShieldCheck className="size-3" /> {score}
    </span>
  );
}

/** 직군/분류 태그 뱃지 (미분류 처리 포함) */
export function CategoryBadge({ category }: { category?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold",
        category ? "bg-ink text-paper" : "bg-paper-dim text-muted-ink",
      )}
    >
      <Tag className="size-2.5" /> {category ?? "미분류"}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════
//  메인 화면
// ══════════════════════════════════════════════════════════════════

export function HrExams() {
  const s = useHrState();
  const [editing, setEditing] = useState<ExamTemplate | "new" | null>(null);
  const [statusFilter, setStatusFilter] = useState<"전체" | ExamSession["status"]>("전체");
  const [catFilter, setCatFilter] = useState<string>("전체");
  const [query, setQuery] = useState("");
  /** 기한 연장 인라인 편집 대상 세션 */
  const [extending, setExtending] = useState<{ id: string; date: string } | null>(null);
  /** 재응시 배정 인라인 편집 대상 세션 (종결 세션 → 새 회차 발급) */
  const [retaking, setRetaking] = useState<{ id: string; date: string } | null>(null);
  const builderRef = useRef<HTMLDivElement>(null);

  const categories = examCategories(s);

  // 라이브러리 필터: 직군 칩 + 검색(제목·설명·태그)
  const templates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return s.examTemplates.filter((t) => {
      if (catFilter !== "전체" && (t.category ?? "미분류") !== catFilter) return false;
      if (!q) return true;
      return `${t.title} ${t.description} ${t.category ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [s.examTemplates, catFilter, query]);

  const [sortByScore, setSortByScore] = useState(false);
  const sessions = [...s.examSessions].sort((a, b) => {
    if (sortByScore) {
      // 점수순 (확정 점수 우선, 없으면 자동 채점분) — 커트라인 검토용
      const scoreOf = (x: ExamSession) => {
        if (typeof x.totalScore === "number") return x.totalScore;
        const t = s.examTemplates.find((tt) => tt.id === x.templateId);
        return x.status === "제출" && t ? scoreSummary(t, x.answers).auto : -1;
      };
      return scoreOf(b) - scoreOf(a);
    }
    return b.assignedAt.localeCompare(a.assignedAt);
  });
  const filtered =
    statusFilter === "전체"
      ? sessions
      : sessions.filter((x) => x.status === statusFilter);

  const count = (st: ExamSession["status"]) =>
    sessions.filter((x) => x.status === st).length;

  function openBuilder(target: ExamTemplate | "new") {
    setEditing(target);
    // 빌더가 아래에 열리므로 스크롤로 시선 이동
    setTimeout(() => builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function duplicate(t: ExamTemplate) {
    const id = hrActions.duplicateExamTemplate(t.id);
    if (!id) return;
    // 복제 직후 바로 편집 모드로 — "가져와서 수정" 동선을 한 번에
    const copy = { ...t, id, title: `${t.title} (복사본)` };
    openBuilder(copy);
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/exam/${token}`;
    void navigator.clipboard.writeText(url);
    toast.show("응시 링크를 복사했습니다.");
  }

  async function cancelSession(ex: ExamSession) {
    const ok = await confirmAction({
      title: "응시 링크를 취소할까요?",
      lines: ["지원자가 받은 링크가 즉시 무효화됩니다. 재응시하려면 다시 배정해야 합니다."],
      confirmLabel: "취소(무효화)",
      danger: true,
    });
    if (ok) hrActions.cancelExamSession(ex.id);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="응시 대기" value={count("발급")} sub="링크 발급, 미응시" icon={<Link2 className="size-4" />} />
        <StatCard label="진행 중" value={count("진행중")} sub="지금 응시하는 지원자" icon={<Clock className="size-4" />} />
        <StatCard label="채점 필요" value={count("제출")} sub="제출 완료, 채점 대기" icon={<FileCheck className="size-4" />} />
        <StatCard label="시험 세트" value={s.examTemplates.length} sub={`분류 ${categories.length}개 · 라이브러리`} icon={<Tag className="size-4" />} />
      </div>

      {/* 시험 라이브러리 */}
      <Panel
        title={`시험 라이브러리 (${templates.length})`}
        action={
          <button
            onClick={() => openBuilder("new")}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.78rem] font-bold text-paper transition-colors hover:bg-ink-800"
          >
            <Plus className="size-3.5" /> 새 시험 만들기
          </button>
        }
        bodyClassName="flex flex-col gap-3 p-4"
      >
        {/* 검색 + 직군 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-ink" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="시험 제목·설명·분류 검색"
              className="w-56 rounded-full border border-line bg-pure py-2 pl-9 pr-4 text-[0.8rem] outline-none transition-colors focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {["전체", ...categories, ...(s.examTemplates.some((t) => !t.category) ? ["미분류"] : [])].map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.72rem] font-semibold transition-colors",
                  catFilter === c ? "bg-ink text-paper" : "bg-paper-dim text-muted hover:text-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {templates.map((t) => {
          const usage = examTemplateUsage(s, t.id);
          return (
            <div
              key={t.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-pure p-4 transition-colors hover:border-line-strong"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={t.category} />
                  <p className="font-bold tracking-tight text-ink">{t.title}</p>
                </div>
                <p className="mt-1 line-clamp-1 text-[0.78rem] text-muted">
                  {t.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.68rem] font-semibold text-muted">
                  <span className="rounded-full bg-paper-dim px-2 py-0.5">
                    {t.questions.length}문항 · {maxScoreOf(t)}점 · {t.durationMin}분
                  </span>
                  {usage > 0 && (
                    <span className="rounded-full bg-paper-dim px-2 py-0.5">
                      {usage}회 사용
                    </span>
                  )}
                  {t.proctor.camera && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent-ink"><Camera className="size-3" /> 캠</span>
                  )}
                  {t.proctor.screen && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent-ink"><Monitor className="size-3" /> 화면</span>
                  )}
                  {t.proctor.fullscreen && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent-ink"><Maximize2 className="size-3" /> 전체화면</span>
                  )}
                  {t.proctor.blockCopyPaste && (
                    <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent-ink"><ClipboardX className="size-3" /> 복붙 차단</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => duplicate(t)}
                  title="이 시험을 복제해 새 시험 만들기"
                  className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                >
                  <Copy className="size-3" /> 복제
                </button>
                <button
                  onClick={() => openBuilder(t)}
                  className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  <Pencil className="size-3" /> 편집
                </button>
                <button
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: `'${t.title}'을(를) 삭제할까요?`,
                      lines: ["응시 이력이 있으면 삭제할 수 없습니다."],
                      confirmLabel: "삭제",
                      danger: true,
                    });
                    if (ok && !hrActions.removeExamTemplate(t.id))
                      toast.show("응시 이력이 있는 세트는 삭제할 수 없습니다.");
                  }}
                  className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-red-300 hover:text-red-500"
                >
                  <Trash2 className="size-3" /> 삭제
                </button>
              </div>
            </div>
          );
        })}
        {templates.length === 0 && (
          <EmptyState
            text={
              s.examTemplates.length === 0
                ? "시험 세트가 없습니다. 새 시험을 만들어 문항을 등록하세요."
                : "검색·필터 조건에 맞는 시험이 없습니다."
            }
          />
        )}
      </Panel>

      {/* 세트 빌더 */}
      {editing && (
        <div ref={builderRef}>
          <TemplateBuilder
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            existingCategories={categories}
            onClose={() => setEditing(null)}
          />
        </div>
      )}

      {/* 응시 현황 */}
      <Panel
        title="응시 현황"
        action={
          <div className="flex items-center gap-1">
            {(["전체", "발급", "진행중", "제출", "채점완료", "만료", "중단"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-[0.7rem] font-semibold transition-colors",
                  statusFilter === f
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-paper-dim",
                )}
              >
                {f}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-line" />
            <button
              onClick={() => setSortByScore((v) => !v)}
              title="점수순 정렬 — 커트라인 위·아래를 한눈에"
              className={cn(
                "rounded-full px-3 py-1 text-[0.7rem] font-semibold transition-colors",
                sortByScore ? "bg-accent text-ink" : "text-muted hover:bg-paper-dim",
              )}
            >
              점수순
            </button>
          </div>
        }
        bodyClassName="p-0"
      >
        {filtered.length === 0 ? (
          <EmptyState text="응시 세션이 없습니다. 지원자 상세 또는 지원자 보드(일괄)에서 시험을 배정하세요." />
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((ex) => {
              const app = s.applications.find((a) => a.id === ex.applicationId);
              const cand = s.candidates.find((c) => c.id === app?.candidateId);
              const t = s.examTemplates.find((x) => x.id === ex.templateId);
              const gradable = ex.status === "제출" || ex.status === "채점완료";
              const d = dDay(ex.expiresAt.slice(0, 10));
              const extendable =
                ex.status === "발급" || ex.status === "진행중" || ex.status === "만료";
              const retakable =
                ex.status === "채점완료" || ex.status === "만료" || ex.status === "중단";
              return (
                <div key={ex.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={cand?.name ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[0.88rem] font-bold tracking-tight text-ink">
                        {cand?.name}
                        <span className="font-mono text-[0.65rem] font-medium text-muted-ink">
                          {app ? applicantNo(s, app.id) : ""}
                        </span>
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[0.72rem] text-muted">
                        {t?.title} · {s.jobs.find((j) => j.id === app?.jobId)?.title}
                      </p>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[0.7rem] font-bold", STATUS_TONE[ex.status])}>
                      {ex.status}
                    </span>
                    {(ex.attempt ?? 1) > 1 && (
                      <span
                        title="재응시 회차"
                        className="rounded-full border border-accent bg-accent-soft px-2 py-0.5 font-mono text-[0.65rem] font-bold text-accent-ink"
                      >
                        {ex.attempt}차
                      </span>
                    )}
                    <IntegrityBadge score={ex.integrityScore} />
                    <span
                      className={cn(
                        "w-16 text-right font-mono text-[0.8rem] font-semibold",
                        // 합격선 설정 시 확정 점수를 커트라인 위/아래 색으로
                        typeof ex.totalScore === "number" && t?.passingScore != null
                          ? ex.totalScore >= t.passingScore
                            ? "text-signal"
                            : "text-red-500"
                          : "text-ink",
                      )}
                      title={
                        t?.passingScore != null
                          ? `합격선 ${t.passingScore}점`
                          : undefined
                      }
                    >
                      {typeof ex.totalScore === "number"
                        ? `${ex.totalScore}/${ex.maxScore}`
                        : ex.status === "제출" && t
                          ? `${scoreSummary(t, ex.answers).auto}+α`
                          : "—"}
                    </span>
                    <span className="hidden w-32 items-center justify-end gap-1.5 text-right text-[0.7rem] text-muted-ink lg:flex">
                      {ex.submittedAt ? (
                        fmtDateTime(ex.submittedAt)
                      ) : (
                        <>
                          기한 {fmtDate(ex.expiresAt)}
                          {ex.status === "발급" && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 font-mono text-[0.62rem] font-bold",
                                d <= 1
                                  ? "bg-red-50 text-red-600"
                                  : d <= 3
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-paper-dim text-muted",
                              )}
                            >
                              D{d > 0 ? `-${d}` : "-DAY"}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ex.status === "발급" && (
                        <button
                          onClick={() => {
                            hrActions.remindExamSession(ex.id);
                            toast.show(`${cand?.name} 님에게 응시 리마인드를 발송했습니다.`);
                          }}
                          title="미응시 리마인드 발송"
                          className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent-ink"
                        >
                          <BellRing className="size-3.5" />
                        </button>
                      )}
                      {extendable && (
                        <button
                          onClick={() =>
                            setExtending((cur) =>
                              cur?.id === ex.id
                                ? null
                                : { id: ex.id, date: ex.expiresAt.slice(0, 10) },
                            )
                          }
                          title="응시 기한 연장 (같은 링크 유지)"
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full border transition-colors",
                            extending?.id === ex.id
                              ? "border-accent bg-accent-soft text-accent-ink"
                              : "border-line text-muted hover:border-accent hover:text-accent-ink",
                          )}
                        >
                          <CalendarPlus className="size-3.5" />
                        </button>
                      )}
                      {(ex.status === "발급" || ex.status === "진행중") && (
                        <>
                          <button
                            onClick={() => copyLink(ex.token)}
                            title="응시 링크 복사"
                            className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
                          >
                            <Link2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => void cancelSession(ex)}
                            title="링크 취소(무효화)"
                            className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-red-300 hover:text-red-500"
                          >
                            <Ban className="size-3.5" />
                          </button>
                        </>
                      )}
                      {retakable && (
                        <button
                          onClick={() =>
                            setRetaking((cur) =>
                              cur?.id === ex.id
                                ? null
                                : { id: ex.id, date: plusDaysStr(7) },
                            )
                          }
                          title="재응시 배정 (새 링크·새 회차 발급)"
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors",
                            retaking?.id === ex.id
                              ? "border-accent bg-accent-soft text-accent-ink"
                              : "border-line text-muted hover:border-accent hover:text-accent-ink",
                          )}
                        >
                          <RotateCcw className="size-3" /> 재응시
                        </button>
                      )}
                      {gradable && (
                        <Link
                          href={`/hr/exams/${ex.id}`}
                          className="flex items-center gap-1 rounded-full bg-ink px-3.5 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
                        >
                          {ex.status === "제출" ? "채점" : "리포트"}
                          <ChevronRight className="size-3" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* 재응시 배정 인라인 편집 */}
                  {retaking?.id === ex.id && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft/40 px-3.5 py-2.5">
                      <span className="text-[0.72rem] font-bold text-accent-ink">
                        재응시 기한
                      </span>
                      <input
                        type="date"
                        value={retaking.date}
                        min={todayStr()}
                        onChange={(e) =>
                          setRetaking({ id: ex.id, date: e.target.value })
                        }
                        className="rounded-lg border border-line bg-pure px-2.5 py-1.5 text-[0.78rem] outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => {
                          const r = hrActions.retakeExam(
                            ex.id,
                            `${retaking.date}T23:59:00+09:00`,
                          );
                          if (r)
                            toast.show(
                              r.duplicate
                                ? "이미 진행 중인 회차가 있어 새로 발급하지 않았습니다."
                                : `${cand?.name} 님에게 재응시 링크를 발급하고 안내를 발송했습니다.`,
                            );
                          setRetaking(null);
                        }}
                        className="rounded-full bg-ink px-4 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
                      >
                        재응시 발급
                      </button>
                      <button
                        onClick={() => setRetaking(null)}
                        className="text-[0.72rem] font-semibold text-muted hover:text-ink"
                      >
                        취소
                      </button>
                      <span className="text-[0.65rem] text-muted-ink">
                        새 링크·새 회차로 발급되며 이전 회차 기록은 그대로
                        남습니다. 세트를 수정했다면 최신 문항 기준으로
                        응시합니다.
                      </span>
                    </div>
                  )}

                  {/* 기한 연장 인라인 편집 */}
                  {extending?.id === ex.id && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft/40 px-3.5 py-2.5">
                      <span className="text-[0.72rem] font-bold text-accent-ink">
                        새 응시 기한
                      </span>
                      <input
                        type="date"
                        value={extending.date}
                        min={todayStr()}
                        onChange={(e) =>
                          setExtending({ id: ex.id, date: e.target.value })
                        }
                        className="rounded-lg border border-line bg-pure px-2.5 py-1.5 text-[0.78rem] outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => {
                          hrActions.extendExamDeadline(
                            ex.id,
                            `${extending.date}T23:59:00+09:00`,
                          );
                          toast.show(
                            `기한을 ${extending.date}까지 연장했습니다${ex.status === "만료" ? " (만료 복구 — 기존 링크 다시 사용 가능)" : ""}. 지원자에게 안내가 발송됩니다.`,
                          );
                          setExtending(null);
                        }}
                        className="rounded-full bg-ink px-4 py-1.5 text-[0.72rem] font-bold text-paper transition-colors hover:bg-ink-800"
                      >
                        연장
                      </button>
                      <button
                        onClick={() => setExtending(null)}
                        className="text-[0.72rem] font-semibold text-muted hover:text-ink"
                      >
                        취소
                      </button>
                      <span className="text-[0.65rem] text-muted-ink">
                        취소·재발급 없이 기존 링크가 그대로 유지됩니다
                        {ex.status === "만료" && " (만료 세션은 발급 상태로 복구)"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  시험 세트 빌더
// ══════════════════════════════════════════════════════════════════

interface QuestionDraft {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  imageUrl: string; // 압축된 data URL ("" = 없음)
  options: string; // 줄바꿈 구분
  answerKey: string; // 선택형: "1,3" (1-base) / 단답: "distinct, DISTINCT"
  points: number;
  starterCode: string;
}

function toDraft(q: ExamQuestion): QuestionDraft {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    imageUrl: q.imageUrl ?? "",
    options: (q.options ?? []).join("\n"),
    answerKey:
      q.type === "단답"
        ? ((q.answerKey as string[]) ?? []).join(", ")
        : ((q.answerKey as number[]) ?? []).map((n) => n + 1).join(", "),
    points: q.points,
    starterCode: q.starterCode ?? "",
  };
}

function fromDraft(d: QuestionDraft): ExamQuestion {
  const base: ExamQuestion = {
    id: d.id,
    type: d.type,
    prompt: d.prompt.trim(),
    points: Math.max(1, Number(d.points) || 1),
  };
  if (d.imageUrl) base.imageUrl = d.imageUrl;
  if (d.type === "단일선택" || d.type === "다중선택") {
    base.options = d.options.split("\n").map((x) => x.trim()).filter(Boolean);
    base.answerKey = d.answerKey
      .split(",")
      .map((x) => Number(x.trim()) - 1)
      .filter((n) => Number.isInteger(n) && n >= 0);
  } else if (d.type === "단답") {
    base.answerKey = d.answerKey.split(",").map((x) => x.trim()).filter(Boolean);
  } else if (d.type === "코딩" && d.starterCode.trim()) {
    base.starterCode = d.starterCode;
  }
  return base;
}

const newDraft = (): QuestionDraft => ({
  id: `q-${Math.random().toString(36).slice(2, 8)}`,
  type: "단일선택",
  prompt: "",
  imageUrl: "",
  options: "",
  answerKey: "",
  points: 5,
  starterCode: "",
});

/** 문항별 저장 전 검증 — 에러 문구 목록 (빈 배열 = 통과) */
function validateDraft(d: QuestionDraft): string[] {
  const errs: string[] = [];
  if (!d.prompt.trim()) errs.push("문항 내용을 입력하세요.");
  if (d.type === "단일선택" || d.type === "다중선택") {
    const opts = d.options.split("\n").map((x) => x.trim()).filter(Boolean);
    if (opts.length < 2) errs.push("보기를 2개 이상 입력하세요 (한 줄에 하나).");
    const keys = d.answerKey
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isInteger(n) && n >= 1);
    if (keys.length === 0) errs.push("정답 보기 번호를 입력하세요 (예: 1 또는 1,3).");
    else if (keys.some((n) => n > opts.length))
      errs.push(`정답 번호가 보기 개수(${opts.length}개)를 벗어났습니다.`);
    if (d.type === "단일선택" && keys.length > 1)
      errs.push("객관식(단일)은 정답이 1개여야 합니다. 복수 정답이면 유형을 '객관식(복수)'로 바꾸세요.");
  }
  if (d.type === "단답" && !d.answerKey.trim())
    errs.push("허용 답안을 입력하세요 (쉼표로 여러 개 가능).");
  return errs;
}

/** 이미지 → 리사이즈·압축 data URL (최대폭 1200px, JPEG). 300KB 초과 시 품질 하향 */
async function compressImage(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let url = canvas.toDataURL("image/jpeg", 0.8);
    if (url.length > 300_000) url = canvas.toDataURL("image/jpeg", 0.55);
    return url.length > 450_000 ? null : url;
  } catch {
    return null;
  }
}

function TemplateBuilder({
  initial,
  existingCategories,
  onClose,
}: {
  initial: ExamTemplate | null;
  existingCategories: string[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationMin, setDurationMin] = useState(initial?.durationMin ?? 60);
  const [passingScore, setPassingScore] = useState<string>(
    initial?.passingScore != null ? String(initial.passingScore) : "",
  );
  const [shuffle, setShuffle] = useState(initial?.shuffle ?? false);
  const [proctor, setProctor] = useState(initial?.proctor ?? DEFAULT_PROCTOR_POLICY);
  const [drafts, setDrafts] = useState<QuestionDraft[]>(
    initial ? initial.questions.map(toDraft) : [newDraft()],
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [preview, setPreview] = useState(false);
  // AI 초안
  const [aiOpen, setAiOpen] = useState(false);
  const [aiRole, setAiRole] = useState(initial?.category ?? "");
  const [aiTopic, setAiTopic] = useState("");
  const [aiType, setAiType] = useState<ExamQuestionType | "혼합">("혼합");
  const [aiCount, setAiCount] = useState(3);
  const [aiBusy, setAiBusy] = useState(false);

  const totalPoints = drafts.reduce((sum, d) => sum + (Number(d.points) || 0), 0);

  function patchDraft(i: number, patch: Partial<QuestionDraft>) {
    setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
    // 입력을 고치는 즉시 해당 문항의 에러 표시를 지운다 (재검증은 저장 시)
    const id = drafts[i]?.id;
    if (id && errors[id]) setErrors((e) => ({ ...e, [id]: [] }));
  }

  function moveDraft(i: number, dir: -1 | 1) {
    setDrafts((ds) => {
      const j = i + dir;
      if (j < 0 || j >= ds.length) return ds;
      const next = [...ds];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function duplicateDraft(i: number) {
    setDrafts((ds) => {
      const copy = { ...ds[i], id: `q-${Math.random().toString(36).slice(2, 8)}` };
      return [...ds.slice(0, i + 1), copy, ...ds.slice(i + 1)];
    });
  }

  async function attachImage(i: number, file: File | undefined) {
    if (!file) return;
    const url = await compressImage(file);
    if (!url) {
      toast.show("이미지를 처리하지 못했습니다. 5MB 이하 이미지로 다시 시도하세요.");
      return;
    }
    patchDraft(i, { imageUrl: url });
  }

  async function generateAi() {
    if (!aiTopic.trim()) return toast.show("출제 주제를 입력하세요. (예: 자료구조, 영문법)");
    setAiBusy(true);
    try {
      const qs = await ai.generateExamQuestions({
        role: aiRole.trim() || category.trim() || "공통",
        topic: aiTopic.trim(),
        type: aiType,
        count: aiCount,
      });
      setDrafts((ds) => [...ds.filter((d) => d.prompt.trim() || ds.length > 1 ? true : false), ...qs.map(toDraft)]);
      toast.show(`문항 초안 ${qs.length}개를 추가했습니다 — 내용·정답을 검토·수정하세요.`);
    } finally {
      setAiBusy(false);
    }
  }

  function save() {
    if (!title.trim()) return toast.show("시험 제목을 입력하세요.");
    const nonEmpty = drafts.filter(
      (d) => d.prompt.trim() || d.options.trim() || d.answerKey.trim(),
    );
    if (nonEmpty.length === 0) return toast.show("문항을 1개 이상 작성하세요.");

    // 문항별 검증 — 실패 문항에 인라인 에러 표시
    const errMap: Record<string, string[]> = {};
    for (const d of nonEmpty) {
      const errs = validateDraft(d);
      if (errs.length > 0) errMap[d.id] = errs;
    }
    if (Object.keys(errMap).length > 0) {
      setErrors(errMap);
      toast.show(`${Object.keys(errMap).length}개 문항에 보완할 항목이 있습니다 — 빨간 표시를 확인하세요.`);
      return;
    }

    const questions = nonEmpty.map(fromDraft);
    const total = questions.reduce((sum, q) => sum + q.points, 0);
    const pass = passingScore.trim() === "" ? undefined : Math.max(0, Number(passingScore) || 0);
    if (pass !== undefined && pass > total)
      return toast.show(`합격선(${pass}점)이 총점(${total}점)보다 높습니다 — 값을 확인하세요.`);
    const payload = {
      title: title.trim(),
      category: category.trim() || undefined,
      description: description.trim(),
      durationMin: Math.max(5, Number(durationMin) || 60),
      shuffle,
      proctor,
      passingScore: pass,
      questions,
    };
    if (initial) hrActions.updateExamTemplate(initial.id, payload);
    else hrActions.addExamTemplate(payload);
    toast.show(`시험 세트를 ${initial ? "수정" : "등록"}했습니다.`);
    onClose();
  }

  return (
    <Panel
      title={initial ? `시험 편집 — ${initial.title}` : "새 시험 만들기"}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(true)}
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[0.78rem] font-bold text-muted transition-colors hover:border-accent hover:text-accent-ink"
          >
            <Eye className="size-3.5" /> 지원자 화면 미리보기
          </button>
          <button onClick={onClose} className="text-[0.78rem] font-semibold text-muted hover:text-ink">
            닫기
          </button>
        </div>
      }
      bodyClassName="flex flex-col gap-5 p-5"
    >
      {/* 기본 정보 */}
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="시험 제목 (예: 영어 연구원 필기시험 2026 상반기)"
          className="rounded-xl border border-line bg-pure px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="relative">
          <Tag className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-ink" />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="exam-category-list"
            placeholder="직군/분류 태그 (예: 개발, 영어연구, 공통 인적성)"
            className="w-full rounded-xl border border-line bg-pure py-2.5 pl-9 pr-4 text-sm outline-none focus:border-accent"
          />
          <datalist id="exam-category-list">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <p className="-mt-3 text-[0.68rem] text-muted-ink">
        같은 태그의 시험이 라이브러리에 모입니다 — 다음에 같은 직군을 채용할 때 복제해서 재사용하세요.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[0.8rem] font-semibold text-muted">
          시험 시간
          <input
            type="number"
            value={durationMin}
            min={5}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            className="w-20 rounded-xl border border-line bg-pure px-3 py-2 text-sm outline-none focus:border-accent"
          />
          분
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[0.8rem] font-semibold text-muted">
          <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="size-3.5 accent-[var(--color-accent)]" />
          응시자별 문항 순서 섞기
        </label>
        <label className="flex items-center gap-2 text-[0.8rem] font-semibold text-muted">
          합격선
          <input
            type="number"
            min={0}
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            placeholder="없음"
            className="w-20 rounded-xl border border-line bg-pure px-3 py-2 text-sm outline-none focus:border-accent"
          />
          점
        </label>
        <span className="ml-auto rounded-full bg-paper-dim px-3 py-1.5 font-mono text-[0.75rem] font-bold text-ink">
          {drafts.length}문항 · 총 {totalPoints}점
          {passingScore !== "" && (
            <span className="ml-1.5 text-accent-ink">/ 합격선 {passingScore}점</span>
          )}
        </span>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="시험 설명 — 어떤 공고/직군용인지 메모 (지원자에게 노출되지 않음)"
        rows={2}
        className="rounded-xl border border-line bg-pure px-4 py-2.5 text-sm outline-none focus:border-accent"
      />

      {/* 프록터링 정책 */}
      <div className="rounded-xl bg-paper-dim p-4">
        <p className="text-[0.72rem] font-bold text-muted">부정행위 방지 정책</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[0.8rem] font-semibold text-ink">
          {(
            [
              ["camera", "캠·마이크 녹화"],
              ["screen", "전체 화면 녹화"],
              ["fullscreen", "전체화면 강제"],
              ["blockCopyPaste", "복붙·우클릭 차단"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={proctor[key]}
                onChange={(e) => setProctor((p) => ({ ...p, [key]: e.target.checked }))}
                className="size-3.5 accent-[var(--color-accent)]"
              />
              {label}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-muted">
            경고 한도
            <input
              type="number"
              min={1}
              value={proctor.maxViolations}
              onChange={(e) => setProctor((p) => ({ ...p, maxViolations: Math.max(1, Number(e.target.value) || 5) }))}
              className="w-14 rounded-lg border border-line bg-pure px-2 py-1 text-sm outline-none focus:border-accent"
            />
            회
          </label>
        </div>
      </div>

      {/* AI 문항 초안 */}
      <div className="rounded-xl border border-dashed border-accent/50 bg-accent-soft/30 p-4">
        <button
          onClick={() => setAiOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <Sparkles className="size-4 text-accent-ink" />
          <span className="text-[0.85rem] font-bold text-accent-ink">AI 문항 초안 생성</span>
          <span className="text-[0.7rem] text-muted">
            직군·주제를 넣으면 문항 뼈대를 만들어 드립니다{ai.live ? "" : " (목업 — Claude 연동 시 실제 생성)"}
          </span>
          <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", aiOpen && "rotate-180")} />
        </button>
        {aiOpen && (
          <div className="mt-3 flex flex-wrap items-end gap-2.5">
            <label className="flex flex-col gap-1 text-[0.7rem] font-semibold text-muted">
              직군
              <input
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
                placeholder={category || "예: 개발"}
                className="w-32 rounded-lg border border-line bg-pure px-3 py-2 text-[0.8rem] outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-[0.7rem] font-semibold text-muted">
              출제 주제 *
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="예: 자료구조, 영문법, 마케팅 지표"
                className="w-52 rounded-lg border border-line bg-pure px-3 py-2 text-[0.8rem] outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-[0.7rem] font-semibold text-muted">
              유형
              <select
                value={aiType}
                onChange={(e) => setAiType(e.target.value as ExamQuestionType | "혼합")}
                className="rounded-lg border border-line bg-pure px-2.5 py-2 text-[0.8rem] outline-none focus:border-accent"
              >
                <option value="혼합">혼합</option>
                {(Object.keys(QUESTION_TYPE_LABEL) as ExamQuestionType[]).map((t) => (
                  <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[0.7rem] font-semibold text-muted">
              개수
              <input
                type="number"
                min={1}
                max={10}
                value={aiCount}
                onChange={(e) => setAiCount(Math.max(1, Math.min(10, Number(e.target.value) || 3)))}
                className="w-16 rounded-lg border border-line bg-pure px-2.5 py-2 text-[0.8rem] outline-none focus:border-accent"
              />
            </label>
            <button
              onClick={() => void generateAi()}
              disabled={aiBusy}
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-[0.78rem] font-bold text-ink transition-colors hover:bg-accent-deep hover:text-white disabled:opacity-50"
            >
              <Sparkles className="size-3.5" /> {aiBusy ? "생성 중…" : "초안 생성"}
            </button>
          </div>
        )}
      </div>

      {/* 문항 편집 */}
      <div className="flex flex-col gap-4">
        {drafts.map((d, i) => {
          const errs = errors[d.id] ?? [];
          return (
            <div
              key={d.id}
              className={cn(
                "rounded-xl border bg-pure p-4 transition-colors",
                errs.length > 0 ? "border-red-400" : "border-line",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[0.65rem] font-bold text-paper">
                  Q{i + 1}
                </span>
                <select
                  value={d.type}
                  onChange={(e) => patchDraft(i, { type: e.target.value as ExamQuestionType })}
                  className="rounded-lg border border-line bg-pure px-2.5 py-1.5 text-[0.78rem] font-semibold outline-none focus:border-accent"
                >
                  {(Object.keys(QUESTION_TYPE_LABEL) as ExamQuestionType[]).map((t) => (
                    <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[0.78rem] font-semibold text-muted">
                  배점
                  <input
                    type="number"
                    min={1}
                    value={d.points}
                    onChange={(e) => patchDraft(i, { points: Number(e.target.value) })}
                    className="w-14 rounded-lg border border-line bg-pure px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                </label>
                {/* 이미지 첨부 */}
                <label
                  title="문항 이미지 첨부 (도표·그래프)"
                  className="flex cursor-pointer items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.7rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
                >
                  <ImagePlus className="size-3" /> 이미지
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void attachImage(i, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="ml-auto flex items-center gap-0.5">
                  <button
                    onClick={() => moveDraft(i, -1)}
                    disabled={i === 0}
                    title="위로 이동"
                    className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-dim hover:text-ink disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => moveDraft(i, 1)}
                    disabled={i === drafts.length - 1}
                    title="아래로 이동"
                    className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-dim hover:text-ink disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    onClick={() => duplicateDraft(i)}
                    title="문항 복제"
                    className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-dim hover:text-ink"
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDrafts((ds) => ds.filter((_, j) => j !== i))}
                    title="문항 삭제"
                    className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {errs.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-1 rounded-lg bg-red-50 px-3 py-2">
                  {errs.map((e, k) => (
                    <p key={k} className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-red-600">
                      <TriangleAlert className="size-3 shrink-0" /> {e}
                    </p>
                  ))}
                </div>
              )}

              <textarea
                value={d.prompt}
                onChange={(e) => patchDraft(i, { prompt: e.target.value })}
                placeholder="문항 내용"
                rows={2}
                className="mt-3 w-full rounded-xl border border-line bg-pure px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />

              {d.imageUrl && (
                <div className="relative mt-2 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.imageUrl}
                    alt={`Q${i + 1} 이미지`}
                    className="max-h-48 rounded-lg border border-line"
                  />
                  <button
                    onClick={() => patchDraft(i, { imageUrl: "" })}
                    title="이미지 제거"
                    className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-paper shadow-lift transition-colors hover:bg-red-500"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              {(d.type === "단일선택" || d.type === "다중선택") && (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <textarea
                    value={d.options}
                    onChange={(e) => patchDraft(i, { options: e.target.value })}
                    placeholder={"보기 (한 줄에 하나)\n예)\n무상태성\n캐시 가능"}
                    rows={4}
                    className="rounded-xl border border-line bg-pure px-3.5 py-2.5 text-[0.82rem] outline-none focus:border-accent"
                  />
                  <div>
                    <input
                      value={d.answerKey}
                      onChange={(e) => patchDraft(i, { answerKey: e.target.value })}
                      placeholder="정답 보기 번호 (예: 1,3)"
                      className="w-full rounded-xl border border-line bg-pure px-3.5 py-2.5 text-[0.82rem] outline-none focus:border-accent"
                    />
                    <p className="mt-1.5 text-[0.68rem] text-muted-ink">
                      자동 채점 — 선택 집합이 정답과 완전히 일치해야 득점합니다.
                    </p>
                  </div>
                </div>
              )}
              {d.type === "단답" && (
                <input
                  value={d.answerKey}
                  onChange={(e) => patchDraft(i, { answerKey: e.target.value })}
                  placeholder="허용 답안 (쉼표 구분 — 대소문자·공백 무시 비교)"
                  className="mt-2 w-full rounded-xl border border-line bg-pure px-3.5 py-2.5 text-[0.82rem] outline-none focus:border-accent"
                />
              )}
              {d.type === "코딩" && (
                <textarea
                  value={d.starterCode}
                  onChange={(e) => patchDraft(i, { starterCode: e.target.value })}
                  placeholder="시작 코드 (선택)"
                  rows={3}
                  spellCheck={false}
                  className="mt-2 w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 font-mono text-[0.78rem] text-paper outline-none focus:border-accent"
                />
              )}
              {(d.type === "서술" || d.type === "코딩") && (
                <p className="mt-1.5 text-[0.68rem] text-muted-ink">
                  수동 채점 문항 — 제출 후 채점 화면에서 점수를 입력합니다.
                </p>
              )}
            </div>
          );
        })}
        <button
          onClick={() => setDrafts((ds) => [...ds, newDraft()])}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-3 text-[0.82rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent-ink"
        >
          <Plus className="size-4" /> 문항 추가
        </button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto text-[0.72rem] text-muted-ink">
          저장 전 <b className="text-ink">미리보기</b>로 지원자에게 보이는 화면을 확인하세요.
        </span>
        <button onClick={onClose} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink">
          취소
        </button>
        <button
          onClick={save}
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-ink-800"
        >
          {initial ? "수정 저장" : "시험 등록"}
        </button>
      </div>

      {preview && (
        <PreviewModal
          title={title || "제목 없는 시험"}
          category={category}
          durationMin={durationMin}
          questions={drafts
            .filter((d) => d.prompt.trim())
            .map(fromDraft)}
          onClose={() => setPreview(false)}
        />
      )}
    </Panel>
  );
}

// ══════════════════════════════════════════════════════════════════
//  지원자 화면 미리보기 — 응시 화면과 같은 문법으로 렌더링
// ══════════════════════════════════════════════════════════════════

function PreviewModal({
  title,
  category,
  durationMin,
  questions,
  onClose,
}: {
  title: string;
  category: string;
  durationMin: number;
  questions: ExamQuestion[];
  onClose: () => void;
}) {
  const [showAnswers, setShowAnswers] = useState(false);
  const total = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 p-4 sm:p-8" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-card bg-paper shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 응시 화면 헤더 재현 */}
        <header className="flex items-center gap-3 rounded-t-card bg-ink px-5 py-3.5 text-paper">
          <span className="flex items-center gap-2 font-mono text-[0.7rem] font-semibold tracking-widest text-accent">
            <Eye className="size-4" /> 미리보기
          </span>
          <span className="text-[0.85rem] font-semibold tracking-tight">{title}</span>
          {category && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-bold">{category}</span>
          )}
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-mono text-[0.75rem] font-bold">
            <Clock className="size-3.5" /> {durationMin}:00
          </span>
          <button
            onClick={onClose}
            aria-label="미리보기 닫기"
            className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex items-center gap-3 border-b border-line px-5 py-2.5">
          <span className="text-[0.72rem] font-semibold text-muted">
            {questions.length}문항 · 총 {total}점 — 지원자에게 이렇게 보입니다
          </span>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[0.72rem] font-bold text-accent-ink">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={(e) => setShowAnswers(e.target.checked)}
              className="size-3.5 accent-[var(--color-accent)]"
            />
            정답 표시 (출제자 검수용)
          </label>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {questions.length === 0 && (
            <EmptyState text="작성된 문항이 없습니다. 문항 내용을 입력하면 여기에 표시됩니다." />
          )}
          {questions.map((q, i) => (
            <div key={q.id} className="surface-card rounded-card p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-ink px-2.5 py-1 font-mono text-[0.65rem] font-bold text-paper">
                  Q{i + 1}
                </span>
                <span className="rounded-full bg-paper-dim px-2 py-0.5 text-[0.65rem] font-semibold text-muted">
                  {QUESTION_TYPE_LABEL[q.type]}
                </span>
                <span className="text-[0.7rem] font-semibold text-muted-ink">{q.points}점</span>
              </div>
              <p className="mt-3.5 whitespace-pre-wrap text-[0.92rem] font-semibold leading-relaxed text-ink">
                {q.prompt}
              </p>
              {q.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.imageUrl} alt={`Q${i + 1} 이미지`} className="mt-3 max-h-72 rounded-xl border border-line" />
              )}
              <div className="mt-4">
                {(q.type === "단일선택" || q.type === "다중선택") && (
                  <div className="flex flex-col gap-2">
                    {(q.options ?? []).map((opt, k) => {
                      const isKey = ((q.answerKey as number[]) ?? []).includes(k);
                      return (
                        <div
                          key={k}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-[0.85rem]",
                            showAnswers && isKey
                              ? "border-signal bg-signal/12 font-semibold text-signal"
                              : "border-line bg-pure text-ink",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center border text-[0.62rem] font-bold",
                              q.type === "단일선택" ? "rounded-full" : "rounded-md",
                              showAnswers && isKey
                                ? "border-signal bg-signal text-white"
                                : "border-line-strong text-muted-ink",
                            )}
                          >
                            {String.fromCharCode(65 + k)}
                          </span>
                          {opt}
                          {showAnswers && isKey && (
                            <span className="ml-auto text-[0.65rem] font-bold">정답</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === "단답" && (
                  <div>
                    <div className="rounded-xl border border-line bg-pure px-4 py-2.5 text-[0.85rem] text-muted-ink">
                      답을 입력하세요
                    </div>
                    {showAnswers && (
                      <p className="mt-1.5 text-[0.72rem] font-semibold text-signal">
                        허용 답안: {((q.answerKey as string[]) ?? []).join(", ")}
                      </p>
                    )}
                  </div>
                )}
                {q.type === "서술" && (
                  <div className="h-24 rounded-xl border border-line bg-pure px-4 py-2.5 text-[0.85rem] text-muted-ink">
                    답안을 작성하세요
                  </div>
                )}
                {q.type === "코딩" && (
                  <pre className="whitespace-pre-wrap rounded-xl bg-ink px-4 py-3 font-mono text-[0.78rem] text-paper">
                    {q.starterCode || "// 코드를 작성하세요"}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
