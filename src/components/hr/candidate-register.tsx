"use client";

// ════════════════════════════════════════════════════════════════
//  지원자 직접 등록 — 헤드헌터 추천·이메일 지원 등 폼 외 유입을
//  HR이 콘솔에서 바로 접수한다. (ingestApplication direct 모드 재사용)
// ════════════════════════════════════════════════════════════════

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE, DUR } from "@/lib/motion";
import {
  useHrState,
  hrActions,
  CURRENT_MEMBER_ID,
} from "@/lib/hr/store";
import { ai } from "@/lib/hr/ai";
import { toast } from "@/components/hr/feedback";
import type { AiInsight, Candidate } from "@/lib/hr/types";

/** 유입 경로 프리셋 — 자유 입력 + datalist 제안 */
const SOURCE_PRESETS = [
  "헤드헌터 추천",
  "사내 추천",
  "이메일 지원",
  "채용행사",
  "링크드인",
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  jobId: "",
  source: SOURCE_PRESETS[0],
  tags: "",
  note: "",
  sendConfirmation: false,
};

export function RegisterCandidateButton() {
  const s = useHrState();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  // 게시중 공고 우선, 이후 나머지 — 마감 공고에도 등록은 가능(헤드헌터 지연 접수 등)
  const jobs = [...s.jobs].sort(
    (a, b) => (a.status === "게시중" ? 0 : 1) - (b.status === "게시중" ? 0 : 1),
  );

  function openDrawer() {
    setForm({ ...EMPTY_FORM, jobId: jobs[0]?.id ?? "" });
    setError("");
    setOpen(true);
  }

  async function submit() {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) return setError("이름을 입력하세요.");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setError("올바른 이메일을 입력하세요.");
    if (!form.jobId) return setError("접수할 공고를 선택하세요.");

    setBusy(true);
    const candidate: Omit<Candidate, "id"> = {
      name,
      email,
      phone: form.phone.trim(),
      source: form.source.trim() || "직접 등록",
      tags: [
        ...new Set(
          form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      ].slice(0, 6),
      educations: [],
      experiences: [],
      coverLetter: "",
      files: [],
    };

    const job = s.jobs.find((j) => j.id === form.jobId);
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
      jobId: form.jobId,
      ai: insight,
      direct: {
        actorId: CURRENT_MEMBER_ID,
        sendConfirmation: form.sendConfirmation,
      },
    });
    setBusy(false);

    if (res.duplicate) {
      toast.show("이미 같은 공고에 접수된 지원자입니다 — 기존 지원서로 이동합니다.");
      setOpen(false);
      router.push(`/hr/applicants/${res.applicationId}`);
      return;
    }
    if (form.note.trim()) {
      hrActions.addComment(res.applicationId, `[등록 메모] ${form.note.trim()}`);
    }
    toast.show(`${name} 님이 등록되었습니다.`);
    setOpen(false);
    router.push(`/hr/applicants/${res.applicationId}`);
  }

  const field =
    "h-11 rounded-xl border border-line bg-pure px-4 text-sm focus:border-accent focus:outline-none";
  const labelCls = "flex flex-col gap-1.5";
  const labelTitle = "text-[0.8rem] font-bold text-ink";

  return (
    <>
      <button
        onClick={openDrawer}
        className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink-700"
        title="폼 외 유입(헤드헌터 추천·이메일 지원 등) 지원자를 직접 등록"
      >
        <UserPlus className="size-4" /> 지원자 등록
      </button>

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
                  <p className="kicker text-accent-ink">Direct Registration</p>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight">
                    지원자 직접 등록
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
                <p className="rounded-lg border border-dashed border-line-strong bg-pure/60 px-3.5 py-2.5 text-[0.72rem] leading-relaxed text-muted">
                  헤드헌터 추천·이메일 지원·채용행사 등 지원 폼을 거치지 않은
                  후보를 파이프라인 첫 단계로 접수합니다. 등록 즉시 AI
                  스크리닝이 실행되며, 이력서 등 상세 정보는 등록 후 지원자
                  상세에서 보완할 수 있습니다.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <label className={labelCls}>
                    <span className={labelTitle}>이름</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="후보자 이름"
                      className={field}
                    />
                  </label>
                  <label className={labelCls}>
                    <span className={labelTitle}>연락처</span>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="010-0000-0000"
                      className={field}
                    />
                  </label>
                </div>

                <label className={labelCls}>
                  <span className={labelTitle}>이메일</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="candidate@example.com"
                    className={field}
                  />
                  <span className="text-[0.68rem] text-muted-ink">
                    이메일 기준으로 기존 후보와 자동 통합됩니다. 같은 공고에
                    이미 접수돼 있으면 기존 지원서로 안내합니다.
                  </span>
                </label>

                <label className={labelCls}>
                  <span className={labelTitle}>접수 공고</span>
                  <select
                    value={form.jobId}
                    onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                    className={field}
                  >
                    {jobs.length === 0 && <option value="">공고 없음</option>}
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                        {j.status !== "게시중" ? ` (${j.status})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className={labelCls}>
                    <span className={labelTitle}>유입 경로</span>
                    <input
                      list="register-source-presets"
                      value={form.source}
                      onChange={(e) =>
                        setForm({ ...form, source: e.target.value })
                      }
                      placeholder="유입 경로 입력"
                      className={field}
                    />
                    <datalist id="register-source-presets">
                      {SOURCE_PRESETS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </label>
                  <label className={labelCls}>
                    <span className={labelTitle}>
                      태그{" "}
                      <span className="font-normal text-muted">(쉼표 구분)</span>
                    </span>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      placeholder="백엔드, 5년차"
                      className={field}
                    />
                  </label>
                </div>

                <label className={labelCls}>
                  <span className={labelTitle}>
                    등록 메모{" "}
                    <span className="font-normal text-muted">
                      (선택 — 팀 코멘트로 남습니다)
                    </span>
                  </span>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={3}
                    placeholder="추천인·경위 등 팀이 알아야 할 배경"
                    className="rounded-xl border border-line bg-pure p-3.5 text-sm leading-relaxed focus:border-accent focus:outline-none"
                  />
                </label>

                <label className="flex items-start gap-2.5 rounded-xl border border-line bg-pure px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.sendConfirmation}
                    onChange={(e) =>
                      setForm({ ...form, sendConfirmation: e.target.checked })
                    }
                    className="mt-0.5 size-4 accent-ink"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[0.82rem] font-semibold text-ink">
                      접수 확인 메일 발송
                    </span>
                    <span className="text-[0.7rem] leading-relaxed text-muted">
                      후보 본인이 지원 사실을 모르는 경우(헤드헌터 추천 등)를
                      고려해 기본은 발송하지 않습니다.
                    </span>
                  </span>
                </label>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.78rem] font-semibold text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <footer className="flex items-center gap-2.5 border-t border-line p-6">
                <span className="flex items-center gap-1 text-[0.68rem] text-muted-ink">
                  <Sparkles className="size-3.5 text-accent-ink" />
                  등록 시 AI 스크리닝 자동 실행
                </span>
                <button
                  onClick={submit}
                  disabled={busy}
                  className={cn(
                    "ml-auto h-11 rounded-full bg-ink px-8 text-sm font-semibold text-paper transition-colors hover:bg-ink-700",
                    busy && "cursor-wait opacity-60",
                  )}
                >
                  {busy ? "등록 중…" : "등록하기"}
                </button>
              </footer>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
