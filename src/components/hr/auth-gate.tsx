"use client";

// ════════════════════════════════════════════════════════════════
//  HR 콘솔 인증 게이트 — Supabase 설정 시에만 로그인을 요구한다.
//  로컬 데모 모드(env 미설정)에서는 그대로 통과.
// ════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ShieldCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import { getSupabase, supabaseEnabled } from "@/lib/hr/supabase";
import { hrSnapshot, memberByEmail, setCurrentMember } from "@/lib/hr/store";

function HrLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
    }
    setBusy(false);
  }

  return (
    <main className="mesh-ink grain relative flex min-h-screen items-center justify-center px-4">
      <div className="grain-overlay" />
      <div className="relative w-full max-w-sm">
        <p className="kicker flex items-center gap-2 text-accent">
          <ShieldCheck className="size-4" /> ARCO Talent OS
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          HR 콘솔 로그인
        </h1>
        <p className="mt-2 text-sm text-white/60">
          인사팀 계정으로 로그인하세요. 접근 권한은 관리자가 부여합니다.
        </p>

        <form
          onSubmit={signIn}
          className="mt-8 flex flex-col gap-3 rounded-card bg-white/5 p-6 backdrop-blur"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] font-semibold text-white/70">
              이메일
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
              placeholder="name@arco.example"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] font-semibold text-white/70">
              비밀번호
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-sm text-white focus:border-accent focus:outline-none"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-white/10 px-3.5 py-2.5 text-[0.8rem] text-accent">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-[0.95rem] font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-accent-deep hover:text-white disabled:opacity-60"
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            로그인
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[0.62rem] text-white/40">
          Supabase Auth · 세션은 이 브라우저에 안전하게 저장됩니다
        </p>
      </div>
    </main>
  );
}

export function HrAuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | "loading">(
    supabaseEnabled ? "loading" : null,
  );
  /** 로그인 이메일 → 멤버 매핑 결과: null=진행 전, "ok"=매핑됨, "unmapped"=멤버 없음 */
  const [mapped, setMapped] = useState<null | "ok" | "unmapped">(null);
  const email = session && session !== "loading" ? session.user.email ?? "" : "";

  useEffect(() => {
    if (!supabaseEnabled) return;
    const sb = getSupabase();
    if (!sb) return;
    void sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 로그인 이메일 → 작업자(멤버) 매핑. 원격 멤버가 하이드레이트되기 전일 수
  // 있어 잠깐 재시도한다. 매핑되면 이후 모든 액션이 실제 로그인 사용자 명의로 기록.
  useEffect(() => {
    if (!supabaseEnabled || !email) return;
    let tries = 0;
    let alive = true;
    const attempt = () => {
      if (!alive) return;
      const m = memberByEmail(hrSnapshot(), email);
      if (m) {
        setCurrentMember(m.id);
        setMapped("ok");
      } else if (tries++ < 20) {
        setTimeout(attempt, 300); // 원격 멤버 하이드레이트 대기
      } else {
        setMapped("unmapped");
      }
    };
    attempt();
    return () => {
      alive = false;
    };
  }, [email]);

  // 로컬 데모 모드 — 게이트 없음 (CURRENT_MEMBER_ID = 데모 관리자 유지)
  if (!supabaseEnabled) return <>{children}</>;

  if (session === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-dim">
        <LoaderCircle className="size-6 animate-spin text-accent-deep" />
      </main>
    );
  }

  if (!session) return <HrLogin />;

  // 로그인은 됐지만 이 이메일에 매칭되는 멤버가 없음 — 잘못된 계정 접근 차단
  if (mapped === "unmapped") {
    return (
      <main className="mesh-ink grain relative flex min-h-screen items-center justify-center px-4">
        <div className="grain-overlay" />
        <div className="relative w-full max-w-sm text-center">
          <TriangleAlert className="mx-auto size-8 text-accent" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            등록되지 않은 계정입니다
          </h1>
          <p className="mt-2 text-sm text-white/60">
            <b className="text-white/80">{email}</b> 계정은 멤버로 등록되어 있지
            않습니다. 관리자에게 멤버 등록을 요청한 뒤 다시 로그인해 주세요.
          </p>
          <button
            onClick={() => void getSupabase()?.auth.signOut()}
            className="mt-6 rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
          >
            로그아웃
          </button>
        </div>
      </main>
    );
  }

  // 세션은 있으나 매핑이 아직 안 끝남 — 짧은 로딩
  if (mapped === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-dim">
        <LoaderCircle className="size-6 animate-spin text-accent-deep" />
      </main>
    );
  }

  return <>{children}</>;
}
