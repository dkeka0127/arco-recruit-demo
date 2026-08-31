"use client";

// ════════════════════════════════════════════════════════════════
//  엑셀(CSV) 대량 지원자 등록 — 채용행사 명단·헤드헌터 추천 리스트 등
//  스프레드시트로 받은 후보를 한 번에 접수한다.
//  흐름: 양식 다운로드 → 채워서 업로드 → 행별 검증 미리보기 → 일괄 등록.
// ════════════════════════════════════════════════════════════════

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileSpreadsheet, X, Download, Upload, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE, DUR } from "@/lib/motion";
import { useHrState, hrActions, CURRENT_MEMBER_ID } from "@/lib/hr/store";
import { ai } from "@/lib/hr/ai";
import { toast } from "@/components/hr/feedback";
import type { AiInsight, Candidate, HrJob, HrState } from "@/lib/hr/types";

const TEMPLATE_HEADER = ["이름", "이메일", "전화", "유입경로", "태그(;구분)", "공고(제목 또는 ID)"];
const TEMPLATE_EXAMPLE = [
  "김하나",
  "hana.kim@example.com",
  "010-1234-5678",
  "채용행사",
  "백엔드;3년차",
  "데이터 분석가",
];

/** CSV 파서 — 따옴표·쉼표·개행(CRLF) 처리, BOM 제거 */
function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function downloadTemplate() {
  const csv = [TEMPLATE_HEADER, TEMPLATE_EXAMPLE]
    .map((r) => r.map((v) => `"${v}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "지원자_대량등록_양식.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/** 공고 매칭 — ID 정확 일치 우선, 다음 제목 부분 일치(유일할 때만) */
function matchJob(s: HrState, ref: string): HrJob | undefined {
  const needle = ref.trim();
  if (!needle) return undefined;
  const byId = s.jobs.find((j) => j.id === needle);
  if (byId) return byId;
  const byTitle = s.jobs.filter((j) =>
    j.title.toLowerCase().includes(needle.toLowerCase()),
  );
  return byTitle.length === 1 ? byTitle[0] : undefined;
}

interface ParsedRow {
  line: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  jobRef: string;
  job?: HrJob;
  /** 오류 사유 — 있으면 등록 제외 */
  error?: string;
  /** 같은 이메일×공고가 이미 접수됨 (등록 시 기존 지원서 재사용) */
  dupHint?: boolean;
}

function validateRows(s: HrState, raw: string[][], fallbackJobId: string): ParsedRow[] {
  // 첫 행이 양식 헤더면 건너뛴다
  const body =
    raw[0]?.[0]?.trim() === TEMPLATE_HEADER[0] ? raw.slice(1) : raw;
  const seen = new Set<string>();
  return body.map((cols, i) => {
    const [name = "", email = "", phone = "", source = "", tags = "", jobRef = ""] =
      cols.map((c) => c.trim());
    const job = matchJob(s, jobRef) ?? s.jobs.find((j) => j.id === fallbackJobId);
    const row: ParsedRow = {
      line: i + 2, // 헤더 포함 엑셀 행 번호
      name,
      email,
      phone,
      source: source || "엑셀 등록",
      tags: [...new Set(tags.split(";").map((t) => t.trim()).filter(Boolean))].slice(0, 6),
      jobRef,
      job,
    };
    if (!name) row.error = "이름 누락";
    else if (!/^\S+@\S+\.\S+$/.test(email)) row.error = "이메일 형식 오류";
    else if (!job) row.error = jobRef ? `공고 매칭 실패: "${jobRef}"` : "공고 미지정";
    else if (seen.has(`${email.toLowerCase()}|${job.id}`)) row.error = "파일 내 중복";
    if (!row.error && job) {
      seen.add(`${email.toLowerCase()}|${job.id}`);
      const cand = s.candidates.find(
        (c) => c.email.trim().toLowerCase() === email.toLowerCase(),
      );
      if (
        cand &&
        s.applications.some((a) => a.candidateId === cand.id && a.jobId === job.id)
      )
        row.dupHint = true;
    }
    return row;
  });
}

export function ImportCandidatesButton() {
  const s = useHrState();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [fallbackJobId, setFallbackJobId] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openJobs = [...s.jobs].sort(
    (a, b) => (a.status === "게시중" ? 0 : 1) - (b.status === "게시중" ? 0 : 1),
  );

  const valid = (rows ?? []).filter((r) => !r.error);
  const errors = (rows ?? []).filter((r) => r.error);

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) {
      toast.show("빈 파일입니다. 양식을 확인해 주세요.");
      return;
    }
    setFileName(file.name);
    setRows(validateRows(s, parsed, fallbackJobId));
  }

  async function submit() {
    if (valid.length === 0) return;
    setBusy(true);
    let created = 0;
    let dups = 0;
    for (const r of valid) {
      const candidate: Omit<Candidate, "id"> = {
        name: r.name,
        email: r.email,
        phone: r.phone,
        source: r.source,
        tags: r.tags,
        educations: [],
        experiences: [],
        coverLetter: "",
        files: [],
      };
      const job = r.job!;
      const sc = await ai.screenApplication({ ...candidate, id: "pending" }, job);
      const insight: AiInsight = {
        matchScore: sc.matchScore,
        summary: sc.summary,
        strengths: sc.strengths,
        concerns: sc.concerns,
      };
      const res = hrActions.ingestApplication({
        candidate,
        jobId: job.id,
        ai: insight,
        direct: { actorId: CURRENT_MEMBER_ID, sendConfirmation: false, audit: false },
      });
      if (res.duplicate) dups++;
      else created++;
    }
    hrActions.auditBulkRegistration(created, errors.length + dups, fileName);
    setBusy(false);
    toast.show(
      `${created}명이 등록되었습니다${dups > 0 ? ` (기존 접수 ${dups}건 제외)` : ""}.`,
    );
    setOpen(false);
    setRows(null);
    setFileName("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-pure px-4 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
        title="CSV 파일로 지원자를 일괄 등록 (양식 제공)"
      >
        <FileSpreadsheet className="size-4" /> 엑셀 업로드
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
              className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-paper shadow-pop"
            >
              <header className="flex items-center justify-between border-b border-line px-6 py-5">
                <div>
                  <p className="kicker text-accent-ink">Bulk Import</p>
                  <h3 className="mt-1 text-xl font-extrabold tracking-tight">
                    엑셀 대량 등록
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
                {/* 1단계 — 양식 */}
                <div className="rounded-xl border border-line bg-pure p-4">
                  <p className="text-[0.82rem] font-bold text-ink">1. 양식 내려받기</p>
                  <p className="mt-1 text-[0.72rem] leading-relaxed text-muted">
                    아직 준비된 파일이 없다면 양식(CSV)을 받아 채워주세요.
                    엑셀에서 편집한 뒤 <b>CSV(쉼표로 구분)</b>로 저장하면 됩니다.
                    태그는 세미콜론(;)으로 구분, 공고는 제목 일부(유일 매칭) 또는
                    공고 ID를 적습니다.
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="mt-2.5 flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.75rem] font-bold text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    <Download className="size-3.5" /> 양식 다운로드 (.csv)
                  </button>
                </div>

                {/* 2단계 — 업로드 */}
                <div className="rounded-xl border border-line bg-pure p-4">
                  <p className="text-[0.82rem] font-bold text-ink">2. 파일 업로드</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onFile(f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.78rem] font-bold text-paper transition-colors hover:bg-ink-700"
                    >
                      <Upload className="size-3.5" /> CSV 선택
                    </button>
                    {fileName && (
                      <span className="font-mono text-[0.72rem] text-muted">{fileName}</span>
                    )}
                    <label className="ml-auto flex items-center gap-2 text-[0.72rem] font-semibold text-muted">
                      공고 미지정 행 기본 공고
                      <select
                        value={fallbackJobId}
                        onChange={(e) => {
                          setFallbackJobId(e.target.value);
                          // 이미 올린 파일이 있으면 새 기본 공고로 재검증
                          setRows((cur) => cur && validateRows(s, [TEMPLATE_HEADER, ...cur.map((r) => [r.name, r.email, r.phone, r.source, r.tags.join(";"), r.jobRef])], e.target.value));
                        }}
                        className="max-w-52 rounded-full border border-line bg-pure px-3 py-1.5 text-[0.72rem] outline-none focus:border-accent"
                      >
                        <option value="">없음 (행마다 지정)</option>
                        {openJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title}
                            {j.status !== "게시중" ? ` (${j.status})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* 3단계 — 미리보기 */}
                {rows && (
                  <div className="rounded-xl border border-line bg-pure">
                    <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                      <p className="text-[0.82rem] font-bold text-ink">3. 검증 결과</p>
                      <span className="flex items-center gap-1 rounded-full bg-signal/12 px-2.5 py-0.5 text-[0.68rem] font-bold text-signal">
                        <CircleCheck className="size-3" /> 등록 가능 {valid.length}
                      </span>
                      {errors.length > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-red-600">
                          <TriangleAlert className="size-3" /> 제외 {errors.length}
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-[0.75rem]">
                        <thead className="sticky top-0 bg-paper-dim text-left text-[0.68rem] text-muted">
                          <tr>
                            <th className="px-4 py-2 font-semibold">행</th>
                            <th className="px-2 py-2 font-semibold">이름</th>
                            <th className="px-2 py-2 font-semibold">이메일</th>
                            <th className="px-2 py-2 font-semibold">공고</th>
                            <th className="px-2 py-2 font-semibold">상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {rows.map((r) => (
                            <tr key={r.line} className={cn(r.error && "bg-red-50/40")}>
                              <td className="px-4 py-2 font-mono text-muted-ink">{r.line}</td>
                              <td className="px-2 py-2 font-semibold text-ink">{r.name || "—"}</td>
                              <td className="px-2 py-2 text-muted">{r.email || "—"}</td>
                              <td className="max-w-44 truncate px-2 py-2 text-muted">
                                {r.job?.title ?? "—"}
                              </td>
                              <td className="px-2 py-2">
                                {r.error ? (
                                  <span className="font-semibold text-red-600">{r.error}</span>
                                ) : r.dupHint ? (
                                  <span className="font-semibold text-amber-700">기존 접수 있음</span>
                                ) : (
                                  <span className="font-semibold text-signal">등록 예정</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="rounded-lg border border-dashed border-line-strong bg-pure/60 px-3.5 py-2.5 text-[0.7rem] leading-relaxed text-muted">
                  등록되는 후보는 파이프라인 첫 단계로 접수되고 AI 스크리닝이
                  실행됩니다. 접수 확인 메일은 발송하지 않으며(본인이 지원
                  사실을 모르는 명단 배려), 감사 로그에는 요약 1건으로
                  기록됩니다. 이메일 기준으로 기존 후보와 자동 통합됩니다.
                </p>
              </div>

              <footer className="flex items-center gap-2.5 border-t border-line p-6">
                {rows && errors.length > 0 && (
                  <span className="text-[0.7rem] text-muted">
                    오류 {errors.length}건은 제외하고 등록합니다
                  </span>
                )}
                <button
                  onClick={() => void submit()}
                  disabled={busy || valid.length === 0}
                  className={cn(
                    "ml-auto h-11 rounded-full bg-ink px-8 text-sm font-semibold text-paper transition-colors hover:bg-ink-700",
                    (busy || valid.length === 0) && "cursor-not-allowed opacity-50",
                  )}
                >
                  {busy ? "등록 중…" : `${valid.length}명 등록하기`}
                </button>
              </footer>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
