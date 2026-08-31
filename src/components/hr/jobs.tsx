"use client";

// ════════════════════════════════════════════════════════════════
//  공고 관리 — 목록/상태 전환 + 새 공고 작성 드로어
// ════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Users, Globe, Pencil, AlertTriangle, LayoutTemplate, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHrState, hrActions, memberName, applicantCount } from "@/lib/hr/store";
import type { HrJob, HrJobStatus } from "@/lib/hr/types";
import {
  JOB_TEMPLATES,
  PROCESS_TEMPLATES,
  TEMPLATE_GROUPS,
  processSteps,
  type JobTemplate,
} from "@/lib/hr/job-templates";
import { EmptyState, fmtDate } from "@/components/hr/ui";
import { EASE, DUR } from "@/lib/motion";

const STATUS_ORDER: HrJobStatus[] = ["게시중", "게시예정", "임시저장", "마감"];

function StatusPill({
  status,
  onChange,
}: {
  status: HrJobStatus;
  onChange: (st: HrJobStatus) => void;
}) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as HrJobStatus)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "h-8 cursor-pointer rounded-full border px-3 text-[0.75rem] font-bold tracking-tight focus:outline-none",
        status === "게시중" && "border-signal/30 bg-signal/10 text-signal",
        status === "마감" && "border-line bg-paper-dim text-muted",
        status === "임시저장" && "border-line-strong bg-pure text-muted",
        status === "게시예정" && "border-accent bg-accent-soft text-accent-ink",
      )}
    >
      {STATUS_ORDER.map((st) => (
        <option key={st}>{st}</option>
      ))}
    </select>
  );
}

function JdTextarea({
  label,
  hint,
  value,
  placeholder,
  rows = 3,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8rem] font-bold text-ink">
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted">· {hint}</span>}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-xl border border-line bg-pure p-3.5 text-sm leading-relaxed focus:border-accent focus:outline-none"
      />
    </label>
  );
}

const EMPTY_FORM = {
  title: "",
  department: "개발본부",
  track: "일반직" as HrJob["track"],
  employment: "경력" as HrJob["employment"],
  headcount: 1,
  closesAt: "",
  channels: ["아르코 채용사이트"],
  // JD 본문 (list 필드는 줄바꿈 = 항목 1개)
  description: "",
  responsibilities: "",
  qualifications: "",
  preferred: "",
  process: "서류 전형\n1차 면접\n2차 면접\n최종 합격",
  workType: "정규직",
  location: "서울 어딘가구 아르코에듀 본사",
  salary: "",
};

const WORKSITE = "아르코 채용사이트";
const EXTERNAL_CHANNELS = ["사람인", "잡코리아", "원티드", "링크드인"];
const DEPARTMENTS = ["개발본부", "마케팅본부", "콘텐츠연구소", "출판사업본부", "경영지원본부", "학원사업본부"];

/** 줄바꿈 텍스트 ↔ 배열 */
const linesToArr = (s: string) =>
  s.split("\n").map((x) => x.trim()).filter(Boolean);
const arrToLines = (a?: string[]) => (a ?? []).join("\n");

export function HrJobs() {
  const s = useHrState();
  const [filter, setFilter] = useState<"전체" | HrJobStatus>("전체");
  const [open, setOpen] = useState(false);
  /** 편집 중 공고 id (null = 새 공고 작성) */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const jobs = useMemo(
    () =>
      s.jobs.filter((j) => filter === "전체" || j.status === filter),
    [s, filter],
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(job: HrJob) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      department: job.department,
      track: job.track,
      employment: job.employment,
      headcount: job.headcount,
      closesAt: job.closesAt ?? "",
      channels: job.channels,
      description: job.description ?? "",
      responsibilities: arrToLines(job.responsibilities),
      qualifications: arrToLines(job.qualifications),
      preferred: arrToLines(job.preferred),
      process: arrToLines(job.process) || EMPTY_FORM.process,
      workType: job.workType ?? "정규직",
      location: job.location ?? "",
      salary: job.salary ?? "",
    });
    setOpen(true);
  }

  /** 직군 템플릿 적용 — JD·부서·프로세스 프리필 (제목·마감일은 유지) */
  function applyTemplate(t: JobTemplate) {
    setForm((prev) => ({
      ...prev,
      department: t.department,
      track: t.track,
      employment: t.employment,
      description: t.description,
      responsibilities: t.responsibilities.join("\n"),
      qualifications: t.qualifications.join("\n"),
      preferred: t.preferred.join("\n"),
      process: processSteps(t.processId).join("\n"),
      workType: t.workType,
      location: t.location,
    }));
  }

  function submit(publish: boolean) {
    if (!form.title.trim()) {
      alert("공고 제목을 입력하세요.");
      return;
    }
    const jd = {
      description: form.description.trim(),
      responsibilities: linesToArr(form.responsibilities),
      qualifications: linesToArr(form.qualifications),
      preferred: linesToArr(form.preferred),
      process: linesToArr(form.process),
      workType: form.workType.trim(),
      location: form.location.trim(),
      salary: form.salary.trim(),
    };
    // 자사 채용사이트는 항상 포함(자동 게시)
    const channels = [WORKSITE, ...form.channels.filter((c) => c !== WORKSITE)];
    if (editingId) {
      // 수정 — 상태는 건드리지 않고(별도 상태 토글 존재), 내용만 갱신
      hrActions.updateJob(editingId, {
        title: form.title.trim(),
        department: form.department,
        track: form.track,
        employment: form.employment,
        closesAt: form.closesAt || null,
        channels,
        headcount: form.headcount,
        ...jd,
      });
    } else {
      hrActions.addJob({
        title: form.title.trim(),
        department: form.department,
        track: form.track,
        employment: form.employment,
        status: publish ? "게시중" : "임시저장",
        openedAt: new Date().toISOString().slice(0, 10),
        closesAt: form.closesAt || null,
        channels,
        headcount: form.headcount,
        managerId: "m-suhyun",
        ...jd,
      });
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {(["전체", ...STATUS_ORDER] as const).map((st) => {
          const count =
            st === "전체"
              ? s.jobs.length
              : s.jobs.filter((j) => j.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-4 text-[0.82rem] font-semibold transition-colors",
                filter === st
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-pure text-muted hover:text-ink",
              )}
            >
              {st}
              <span
                className={cn(
                  "font-mono text-[0.68rem]",
                  filter === st ? "text-accent" : "text-muted-ink",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        <button
          onClick={openCreate}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper transition-all hover:-translate-y-0.5 hover:bg-ink-700"
        >
          <Plus className="size-4 text-accent" /> 새 공고
        </button>
      </div>

      {/* list */}
      <div className="flex flex-col gap-3">
        {jobs.length === 0 && (
          <EmptyState text="해당 상태의 공고가 없습니다." />
        )}
        {jobs.map((job) => {
          const count = applicantCount(s, job.id);
          return (
            <div
              key={job.id}
              className="surface-card group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card p-5 shadow-lift transition-transform duration-300 hover:-translate-y-0.5"
            >
              <button
                onClick={() => openEdit(job)}
                className="group/edit min-w-0 flex-1 basis-64 text-left"
                title="공고 수정"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-muted">
                    {job.track}
                  </span>
                  <span className="rounded-md bg-paper-dim px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-muted">
                    {job.employment}
                  </span>
                  <span className="text-[0.72rem] text-muted-ink">
                    {job.department} · 담당 {memberName(s, job.managerId)}
                  </span>
                </div>
                <h3 className="mt-1.5 flex items-center gap-1.5 truncate text-[1.02rem] font-bold tracking-tight text-ink">
                  {job.title}
                  <Pencil className="size-3.5 shrink-0 text-muted-ink opacity-0 transition-opacity group-hover/edit:opacity-100" />
                  {(job.responsibilities?.length ?? 0) === 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-ink/8 px-2 py-0.5 text-[0.62rem] font-bold text-ink">
                      <AlertTriangle className="size-3" /> JD 미작성
                    </span>
                  )}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-muted">
                  <span className="font-mono">
                    {fmtDate(job.openedAt)} ~{" "}
                    {job.closesAt ? fmtDate(job.closesAt) : "채용 시까지"}
                  </span>
                </p>
                {/* 채널 게시 상태 */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Globe className="size-3 text-muted-ink" />
                  {job.channels.map((ch) => {
                    const isWorksite = ch === WORKSITE;
                    const published = isWorksite && job.status === "게시중";
                    return (
                      <span
                        key={ch}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.62rem] font-semibold",
                          published
                            ? "bg-signal/12 text-signal"
                            : isWorksite
                              ? "bg-paper-dim text-muted"
                              : "border border-dashed border-line-strong text-muted-ink",
                        )}
                        title={
                          isWorksite
                            ? published
                              ? "자사 사이트 게시됨"
                              : "게시 시 자동 노출"
                            : "외부 채널 — 연동 대기"
                        }
                      >
                        {ch}
                        {published ? " · 게시됨" : isWorksite ? "" : " · 연동 대기"}
                      </span>
                    );
                  })}
                </div>
              </button>

              <Link
                href={`/hr/applicants?job=${job.id}`}
                className="flex items-center gap-2 rounded-xl border border-line bg-pure px-4 py-2.5 transition-colors hover:border-accent"
              >
                <Users className="size-4 text-accent-ink" />
                <span className="font-mono text-lg font-semibold text-ink">
                  {count}
                </span>
                <span className="text-xs text-muted">
                  지원자 / {job.headcount}명 채용
                </span>
              </Link>

              <StatusPill
                status={job.status}
                onChange={(st) => hrActions.setJobStatus(job.id, st)}
              />
            </div>
          );
        })}
      </div>

      {/* drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-paper shadow-pop"
            >
              <header className="flex items-center justify-between border-b border-line px-6 py-5">
                <div>
                  <p className="kicker text-accent-ink">
                    {editingId ? "Edit Job Posting" : "New Job Posting"}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight">
                    {editingId ? "공고 수정" : "새 공고 만들기"}
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="flex size-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </header>

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
                {/* 직군 템플릿 — 새 공고 작성 시 빠른 시작 */}
                {!editingId && (
                  <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-4">
                    <p className="flex items-center gap-1.5 text-[0.8rem] font-bold text-ink">
                      <LayoutTemplate className="size-4 text-accent-ink" />
                      직군 템플릿으로 시작
                    </p>
                    <p className="mt-1 text-[0.72rem] text-muted">
                      사업부·직군을 고르면 담당업무·자격·전형절차가 자동으로
                      채워집니다. 이후 자유롭게 수정하세요.
                    </p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {TEMPLATE_GROUPS.map((g) => (
                        <div key={g}>
                          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-ink">
                            {g}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {JOB_TEMPLATES.filter((t) => t.group === g).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => applyTemplate(t)}
                                className="rounded-full border border-line bg-pure px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-ink"
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.8rem] font-bold text-ink">
                    공고 제목
                  </span>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="[개발] 데이터 분석가 채용"
                    className="h-11 rounded-xl border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">
                      부서
                    </span>
                    <select
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      className="h-11 rounded-xl border border-line bg-pure px-3.5 text-sm focus:border-accent focus:outline-none"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">
                      채용 유형
                    </span>
                    <select
                      value={form.track}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          track: e.target.value as HrJob["track"],
                        })
                      }
                      className="h-11 rounded-xl border border-line bg-pure px-3.5 text-sm focus:border-accent focus:outline-none"
                    >
                      {["일반직", "전문강사", "영어연구원", "인턴"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">
                      경력 구분
                    </span>
                    <select
                      value={form.employment}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          employment: e.target.value as HrJob["employment"],
                        })
                      }
                      className="h-11 rounded-xl border border-line bg-pure px-3.5 text-sm focus:border-accent focus:outline-none"
                    >
                      {["신입", "경력", "신입/경력", "인턴"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">
                      채용 인원
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={form.headcount}
                      onChange={(e) =>
                        setForm({ ...form, headcount: +e.target.value || 1 })
                      }
                      className="h-11 rounded-xl border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.8rem] font-bold text-ink">
                    마감일{" "}
                    <span className="font-normal text-muted">
                      (비우면 채용 시까지)
                    </span>
                  </span>
                  <input
                    type="date"
                    value={form.closesAt}
                    onChange={(e) =>
                      setForm({ ...form, closesAt: e.target.value })
                    }
                    className="h-11 rounded-xl border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none"
                  />
                </label>

                {/* ── JD 본문 ── */}
                <div className="border-t border-line pt-5">
                  <p className="kicker text-accent-ink">공고 내용 (JD)</p>
                  <p className="mt-1 text-[0.72rem] text-muted">
                    지원자 채용사이트에 노출될 실제 공고 내용입니다.
                  </p>
                </div>

                <JdTextarea
                  label="직무 개요"
                  rows={2}
                  value={form.description}
                  placeholder="이 포지션을 한두 문장으로 소개하세요."
                  onChange={(v) => setForm({ ...form, description: v })}
                />
                <JdTextarea
                  label="담당 업무"
                  hint="한 줄에 하나씩"
                  value={form.responsibilities}
                  placeholder={"React 기반 프론트엔드 개발\nLLM 기능 설계·구현"}
                  onChange={(v) => setForm({ ...form, responsibilities: v })}
                />
                <JdTextarea
                  label="자격 요건"
                  hint="한 줄에 하나씩"
                  value={form.qualifications}
                  placeholder={"웹 개발 경력 3년 이상\nREST API 설계 경험"}
                  onChange={(v) => setForm({ ...form, qualifications: v })}
                />
                <JdTextarea
                  label="우대 사항"
                  hint="한 줄에 하나씩"
                  value={form.preferred}
                  placeholder={"AI 서비스 개발 경험\n교육 도메인 이해"}
                  onChange={(v) => setForm({ ...form, preferred: v })}
                />
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-[0.8rem] font-bold text-ink">
                    <Route className="size-3.5 text-accent-ink" /> 면접 전형 프로세스
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PROCESS_TEMPLATES.map((p) => {
                      const active = form.process.trim() === p.steps.join("\n");
                      return (
                        <button
                          key={p.id}
                          type="button"
                          title={p.hint}
                          onClick={() =>
                            setForm({ ...form, process: p.steps.join("\n") })
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[0.75rem] font-semibold transition-colors",
                            active
                              ? "border-ink bg-ink text-paper"
                              : "border-line bg-pure text-muted hover:border-accent hover:text-accent-ink",
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[0.68rem] text-muted-ink">
                    프리셋을 고르면 아래 단계가 채워집니다. 직접 수정도 가능합니다.
                  </p>
                  <textarea
                    value={form.process}
                    onChange={(e) => setForm({ ...form, process: e.target.value })}
                    rows={5}
                    className="rounded-xl border border-line bg-pure p-3.5 text-sm leading-relaxed focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">근무 형태</span>
                    <input
                      value={form.workType}
                      onChange={(e) => setForm({ ...form, workType: e.target.value })}
                      className="h-11 rounded-xl border border-line bg-pure px-3.5 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">근무지</span>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="h-11 rounded-xl border border-line bg-pure px-3.5 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-bold text-ink">
                      급여 <span className="font-normal text-muted">(선택)</span>
                    </span>
                    <input
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      placeholder="협의"
                      className="h-11 rounded-xl border border-line bg-pure px-3.5 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>

                {/* ── 게시 채널 (정직 표시) ── */}
                <div className="flex flex-col gap-2 border-t border-line pt-5">
                  <span className="text-[0.8rem] font-bold text-ink">게시 채널</span>
                  {/* 자사 — 항상 자동 게시 */}
                  <div className="flex items-center justify-between rounded-xl border border-signal/30 bg-signal/8 px-4 py-2.5">
                    <span className="text-[0.82rem] font-semibold text-ink">
                      {WORKSITE}
                    </span>
                    <span className="rounded-full bg-signal/15 px-2.5 py-1 text-[0.68rem] font-bold text-signal">
                      게시 시 자동 노출
                    </span>
                  </div>
                  {/* 외부 — 연동 대기 */}
                  <div className="flex flex-wrap gap-2">
                    {EXTERNAL_CHANNELS.map((ch) => {
                      const on = form.channels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              channels: on
                                ? form.channels.filter((c) => c !== ch)
                                : [...form.channels, ch],
                            })
                          }
                          className={cn(
                            "rounded-full border px-3.5 py-2 text-[0.78rem] font-semibold transition-colors",
                            on
                              ? "border-accent bg-accent-soft text-accent-ink"
                              : "border-line bg-pure text-muted hover:text-ink",
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                  <p className="rounded-lg border border-dashed border-line-strong bg-pure/60 px-3.5 py-2.5 text-[0.72rem] leading-relaxed text-muted">
                    외부 채널은 선택 시 <b>연동 대기</b>로 표시됩니다. 실제
                    자동 배포는 각 플랫폼 API 연동 후 활성화됩니다. 자사
                    채용사이트는 게시 즉시 노출됩니다.
                  </p>
                </div>
              </div>

              <footer className="flex gap-2.5 border-t border-line p-6">
                {editingId ? (
                  <button
                    onClick={() => submit(true)}
                    className="h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper transition-colors hover:bg-ink-700"
                  >
                    변경사항 저장
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => submit(false)}
                      className="h-11 flex-1 rounded-full border border-line-strong bg-pure text-sm font-semibold text-ink transition-colors hover:border-ink"
                    >
                      임시저장
                    </button>
                    <button
                      onClick={() => submit(true)}
                      className="h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper transition-colors hover:bg-ink-700"
                    >
                      게시하기
                    </button>
                  </>
                )}
              </footer>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
