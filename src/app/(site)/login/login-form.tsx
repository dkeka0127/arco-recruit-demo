"use client";

// ════════════════════════════════════════════════════════════════
//  로그인 — 아이디/비밀번호 실인증 (데모: localStorage 계정,
//  운영 슬롯: Supabase Auth). 아이디 저장·returnTo 지원.
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/apply/form-fields";
import { AuthShell, AuthFootLinks } from "@/components/apply/auth-shell";
import { applicantAuth, useApplicantSession } from "@/lib/applicant-auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/my";
  const session = useApplicantSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 저장된 아이디 복원 — 클라이언트 전용 값이라 mount 후 비동기 주입
  // (SSR 하이드레이션 불일치·effect 동기 setState 규칙 회피)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const saved = applicantAuth.rememberedUsername();
      if (saved) {
        setUsername((v) => v || saved);
        setRemember(true);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  async function submit() {
    setError("");
    if (!username.trim()) return setError("아이디를 입력해 주세요.");
    if (!password) return setError("비밀번호를 입력해 주세요.");
    setBusy(true);
    const r = await applicantAuth.signIn(username, password, remember);
    setBusy(false);
    if (!r.ok) return setError(r.error ?? "로그인에 실패했습니다.");
    router.push(returnTo);
  }

  return (
    <AuthShell
      kicker="Member Login"
      title="로그인"
      desc="로그인 및 지원서 작성은 회원가입 후 가능합니다."
      aside={
        <ul className="space-y-2 text-sm text-paper/70">
          <li>· 진행중인 채용 분야 중 하나에만 지원이 가능합니다.</li>
          <li>· 최종제출 후에는 지원서를 확인/수정할 수 없습니다.</li>
        </ul>
      }
    >
      {session ? (
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            이미 로그인되어 있습니다
          </h2>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-signal/30 bg-signal/8 p-5">
            <CircleCheck className="size-5 shrink-0 text-signal" />
            <p className="text-sm text-ink">
              <b>{session.name}</b> 님 ({session.username})
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              variant="accent"
              size="lg"
              className="flex-1"
              onClick={() => router.push("/my")}
            >
              지원현황 보기
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => applicantAuth.signOut()}
            >
              로그아웃
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            아르코채용 로그인
          </h2>
          <p className="mt-2 text-sm text-muted">
            아이디와 비밀번호를 입력해주세요.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Field label="아이디" required>
              <div className="relative">
                <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
                <TextInput
                  autoComplete="username"
                  placeholder="아이디"
                  className="pl-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </Field>
            <Field label="비밀번호" required>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
                <TextInput
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  className="pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 accent-[var(--color-accent)]"
              />
              아이디 저장
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="w-full"
              disabled={busy}
            >
              {busy ? "로그인 중…" : "로그인 ▶"}
            </Button>
          </form>
        </>
      )}

      <AuthFootLinks
        links={[
          { label: "회원가입하기", href: "/signup" },
          { label: "아이디&비밀번호 찾기", href: "/find-account" },
        ]}
      />
    </AuthShell>
  );
}
