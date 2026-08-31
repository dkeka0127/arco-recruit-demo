"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Lock,
  User,
  KeyRound,
  ChevronDown,
  ArrowRight,
  FileEdit,
  CircleCheck,
} from "lucide-react";
import { JOB_POSTINGS } from "@/lib/data/jobs";
import { BrandScene } from "@/components/visuals/brand-scene";
import { Button } from "@/components/ui/button";
import { applicantAuth, useApplicantSession } from "@/lib/applicant-auth";

type BrandVariant = "people" | "share" | "content" | "global" | "growth" | "campus";

/**
 * 입사지원 로그인 게이트 — "지원 시작" 기능 카드.
 *
 * 기존의 큰 다크 빈 박스를 제거하고, 실제 기능을 담은 2분할 카드로 재구성한다.
 *   · 우측: 컴팩트 다크 로그인 폼(목적이 분명한 작은 다크 면적)
 *   · 좌측: "지원을 시작하려면 로그인하세요" 안내 + 회원가입/계정찾기/데모 작성 액션
 * loginLabels 원문(아이디/비밀번호/로그인 ▶/회원가입하기/아이디&비밀번호 찾기 등)을 1:1 보존.
 * loginLabels[0] === "지원공고" 인 경우 상단에 지원공고 선택 드롭다운 노출.
 */
export function LoginGate({
  labels,
  initialJobId,
  jobId,
  onJobChange,
  heading = "지원을 시작하려면 로그인하세요",
  intro,
  brand = "people",
  onDemo,
  demoLabel = "데모 지원서 작성",
  extra,
}: {
  labels: string[];
  initialJobId?: string;
  /** 제어형 지원공고 값 (미지정 시 비제어) */
  jobId?: string;
  onJobChange?: (id: string) => void;
  /** 좌측 패널 제목 */
  heading?: string;
  /** 좌측 패널 보조 설명 (페이지 성격별 차별화) */
  intro?: ReactNode;
  /** 좌측 비주얼 모티프 */
  brand?: BrandVariant;
  /** 데모 지원서 진입 (없으면 버튼 미노출) */
  onDemo?: () => void;
  demoLabel?: string;
  /** 좌측 액션 영역 하단 추가 콘텐츠 */
  extra?: ReactNode;
}) {
  // "지원공고" 라벨이 맨 앞에 있으면 드롭다운 제공
  const hasJobSelect = labels[0] === "지원공고";
  const baseLabels = hasJobSelect ? labels.slice(1) : labels;

  const session = useApplicantSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    if (!username.trim() || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    const r = await applicantAuth.signIn(username, password, false);
    if (!r.ok) setError(r.error ?? "로그인에 실패했습니다.");
  }

  const idLabel = baseLabels[0] ?? "아이디";
  const pwLabel = baseLabels[1] ?? "비밀번호";
  const loginLabel = baseLabels[2] ?? "로그인 ▶";
  const noticeLabel = baseLabels[3];
  const findIntroLabel = baseLabels[4];
  const signupLabel = baseLabels[5] ?? "회원가입하기";
  const findLabel = baseLabels[6] ?? "아이디&비밀번호 찾기";

  const selectValue = jobId ?? initialJobId ?? "";

  return (
    <div className="surface-card overflow-hidden rounded-card shadow-lift">
      <div className="lg:grid lg:grid-cols-[1.05fr_1fr]">
        {/* ── 좌측: 안내 + 보조 액션 (라이트) ─────────────── */}
        <div className="relative flex flex-col justify-between gap-8 border-b border-line bg-sky-veil p-7 sm:p-9 lg:border-b-0 lg:border-r">
          <div>
            <span className="kicker text-accent-ink">Start your application</span>
            <h3 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink">
              {heading}
            </h3>
            {intro && (
              <div className="mt-4 text-[0.95rem] leading-relaxed text-muted">
                {intro}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* 데모 작성 — 로그인 없이 흐름 체험 */}
            {onDemo && (
              <button
                type="button"
                onClick={onDemo}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft/50 px-5 py-4 text-left transition-colors hover:border-accent/60 hover:bg-accent-soft"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
                    <FileEdit className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[0.95rem] font-semibold text-ink">
                      {demoLabel}
                    </span>
                    <span className="block text-xs text-muted">
                      로그인 없이 작성 흐름을 체험합니다
                    </span>
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {/* 회원가입 / 계정찾기 */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/signup"
                className="group flex flex-col gap-1 rounded-xl border border-line bg-pure px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-paper-dim/60"
              >
                <span className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-ink">
                  <KeyRound className="size-4 text-accent-ink" />
                  {signupLabel}
                </span>
                <span className="text-xs text-muted">처음이신가요?</span>
              </Link>
              <Link
                href="/find-account"
                className="group flex flex-col gap-1 rounded-xl border border-line bg-pure px-4 py-3.5 transition-colors hover:border-accent/40 hover:bg-paper-dim/60"
              >
                <span className="text-[0.9rem] font-semibold text-ink">
                  {findLabel}
                </span>
                <span className="text-xs text-muted">
                  {findIntroLabel ?? "아이디&비밀번호를 잊으셨나요?"}
                </span>
              </Link>
            </div>

            {extra}
          </div>
        </div>

        {/* ── 우측: 컴팩트 로그인 폼 (다크, 목적이 분명한 작은 면적) ── */}
        <div className="relative overflow-hidden bg-ink text-paper">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <BrandScene variant={brand} tone="dark" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/85 to-ink" />
          <div className="grain-overlay relative p-7 sm:p-9">
            <span className="kicker text-accent">Member Login</span>

            {/* 로그인 상태 — 바로 작성 시작 */}
            {session ? (
              <div className="mt-6">
                <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                  <CircleCheck className="size-5 shrink-0 text-accent" />
                  <p className="text-[0.95rem] text-paper">
                    <b>{session.name}</b> 님, 로그인되어 있습니다
                  </p>
                </div>
                {onDemo && (
                  <Button
                    type="button"
                    variant="accent"
                    size="lg"
                    className="mt-4 w-full"
                    onClick={onDemo}
                  >
                    지원서 작성 시작
                  </Button>
                )}
                <div className="mt-4 flex items-center justify-between text-sm text-paper/60">
                  <Link href="/my" className="hover:text-paper">
                    지원현황 보기
                  </Link>
                  <button
                    type="button"
                    onClick={() => applicantAuth.signOut()}
                    className="hover:text-paper"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-paper/75">
              {noticeLabel ?? "로그인 및 지원서 작성은 회원가입 후 가능합니다."}
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void signIn();
              }}
            >
              {/* ── 지원공고 선택 ───────────────────────────── */}
              {hasJobSelect && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-paper/70">
                    지원공고
                  </span>
                  <div className="relative">
                    <select
                      value={selectValue}
                      onChange={(e) => onJobChange?.(e.target.value)}
                      disabled={!onJobChange}
                      className="h-12 w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 pr-10 text-paper outline-none transition-colors focus:border-accent disabled:opacity-70"
                    >
                      <option value="" className="text-ink">
                        지원하실 공고를 선택하세요
                      </option>
                      {JOB_POSTINGS.filter((j) => j.status === "지원하기").map(
                        (job) => (
                          <option key={job.id} value={job.id} className="text-ink">
                            {job.title}
                          </option>
                        ),
                      )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-paper/50" />
                  </div>
                </label>
              )}

              {/* ── 아이디 ──────────────────────────────────── */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-paper/70">
                  {idLabel}
                </span>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paper/40" />
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder={idLabel}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-11 pr-4 text-paper placeholder:text-paper/30 outline-none transition-colors focus:border-accent"
                  />
                </div>
              </label>

              {/* ── 비밀번호 ────────────────────────────────── */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-paper/70">
                  {pwLabel}
                </span>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-paper/40" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder={pwLabel}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-11 pr-4 text-paper placeholder:text-paper/30 outline-none transition-colors focus:border-accent"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-accent">
                  {error}
                </p>
              )}

              <Button type="submit" variant="accent" size="lg" className="w-full">
                {loginLabel}
              </Button>
            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
