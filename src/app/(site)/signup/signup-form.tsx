"use client";

// ════════════════════════════════════════════════════════════════
//  회원가입 — 레거시(remLogin.php act=join1/join2) 절차 보존:
//  ① 약관 동의 → ② 휴대폰 본인인증 → ③ 회원정보 입력 → 완료(자동 로그인).
//  데모 모드 완동작(localStorage 계정) — 운영 전환은 lib/applicant-auth.ts
//  의 액션 몸통만 Supabase Auth로 교체.
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/apply/form-fields";
import { AuthShell, AuthFootLinks } from "@/components/apply/auth-shell";
import {
  IdentityVerifyBox,
  type VerifiedIdentity,
} from "@/components/apply/identity-verify-box";
import { applicantAuth, validUsername, validPassword } from "@/lib/applicant-auth";

const STEPS = ["약관 동의", "본인인증", "정보 입력"] as const;

/** 레거시 개인정보처리방침 제2조 표 1 — 회원가입 수집·이용 동의 원문 요약 */
const PRIVACY_ROWS = [
  {
    stage: "회원 가입",
    purpose:
      "1) 회원 가입 의사 확인, 본인 확인, 서비스 제공 시 이용자 식별 등 회원 관리, 서비스 부정 이용자 식별, 차단 / 2) 채용절차 진행상황 안내, 입사 안내, 채용정보 전달, 1:1 문의 응대",
    items: "(필수) 아이디, 성명, 생년월일, 휴대폰 번호, 이메일주소, 비밀번호",
    retention: "법령이 정하는 경우를 제외하고는 회원 탈퇴시까지 보유합니다.",
  },
  {
    stage: "본인인증서비스",
    purpose:
      "회원 가입 시 본인인증, 아이디찾기, 비밀번호찾기, 휴면상태 해제 시 본인 확인을 위한 본인인증절차 진행",
    items:
      "(필수) ID, 이름, 생년월일, 이메일주소 또는 휴대전화번호, 아이핀인증시 아이핀, CI, DI",
    retention: "법령이 정하는 경우를 제외하고는 회원 탈퇴시까지 보유합니다.",
  },
];

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                done && "bg-signal text-white",
                active && "bg-ink text-paper",
                !done && !active && "bg-paper-dim text-muted-ink",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                active ? "text-ink" : "text-muted-ink",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-line-strong" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/my";

  const [step, setStep] = useState(0);
  // 1단계 — 약관
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  // 2단계 — 본인인증 결과
  const [identity, setIdentity] = useState<VerifiedIdentity | null>(null);
  // 3단계 — 계정 정보
  const [username, setUsername] = useState("");
  const [usernameChecked, setUsernameChecked] = useState<null | boolean>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const agreeAll = agreeTerms && agreePrivacy;

  async function checkUsername() {
    if (!validUsername(username)) {
      setUsernameChecked(null);
      setError("아이디는 영문으로 시작하는 영문/숫자 6~20자입니다.");
      return;
    }
    setError("");
    setUsernameChecked(await applicantAuth.usernameAvailable(username));
  }

  async function submit() {
    setError("");
    if (!identity) return;
    if (usernameChecked !== true)
      return setError("아이디 중복 확인을 해주세요.");
    if (!validPassword(pw))
      return setError("비밀번호는 영문·숫자를 포함한 8~20자입니다.");
    if (pw !== pw2) return setError("비밀번호 확인이 일치하지 않습니다.");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setError("올바른 이메일을 입력해 주세요.");

    setBusy(true);
    const r = await applicantAuth.signUp({
      username,
      password: pw,
      name: identity.name,
      birth: identity.birth,
      phone: identity.phone,
      email,
      ci: identity.ci,
    });
    setBusy(false);
    if (!r.ok) return setError(r.error ?? "가입에 실패했습니다.");
    router.push(returnTo);
  }

  return (
    <AuthShell
      kicker="Join"
      title="회원가입"
      desc="아르코에듀 인재채용 회원으로 가입하시면 온라인 입사지원서를 작성하실 수 있습니다."
      aside={
        <div className="rounded-xl border border-white/15 bg-white/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent">
            <ShieldCheck className="size-4" /> 본인인증 안내
          </p>
          <p className="mt-2 text-sm leading-relaxed text-paper/70">
            정확한 채용 진행을 위해 휴대폰 본인인증이 필요합니다. 인증된
            정보는 입사지원서의 기본정보로 활용됩니다.
          </p>
        </div>
      }
    >
      <Stepper current={step} />

      {/* ── 1단계: 약관 동의 ─────────────────────────────── */}
      {step === 0 && (
        <div className="mt-8 space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            약관 동의
          </h2>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-pure p-4">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 size-5 accent-[var(--color-accent)]"
            />
            <span className="text-sm leading-relaxed text-ink">
              <b>이용약관 동의</b>{" "}
              <span className="text-accent-ink">(필수)</span>
              <span className="mt-1 block text-xs text-muted">
                아르코에듀 인재채용 웹사이트 서비스 이용에 관한 기본
                약관에 동의합니다.
              </span>
            </span>
          </label>

          <div className="rounded-xl border border-line bg-pure p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5 size-5 accent-[var(--color-accent)]"
              />
              <span className="text-sm leading-relaxed text-ink">
                <b>개인정보 수집·이용 동의</b>{" "}
                <span className="text-accent-ink">(필수)</span>
              </span>
            </label>
            <div className="mt-3 max-h-44 space-y-3 overflow-y-auto rounded-lg bg-paper-dim/60 p-4 text-xs leading-relaxed text-muted">
              {PRIVACY_ROWS.map((r) => (
                <div key={r.stage}>
                  <p className="font-bold text-ink">{r.stage}</p>
                  <p className="mt-0.5">목적: {r.purpose}</p>
                  <p className="mt-0.5">수집항목: {r.items}</p>
                  <p className="mt-0.5">보유기간: {r.retention}</p>
                </div>
              ))}
              <p>
                * 이용자는 동의를 거부할 권리가 있으나, 동의를 거부하시는 경우
                회원가입이 제한됩니다.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent-soft/40 p-4">
            <input
              type="checkbox"
              checked={agreeAll}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                setAgreePrivacy(e.target.checked);
              }}
              className="mt-0.5 size-5 accent-[var(--color-accent)]"
            />
            <span className="text-sm font-semibold text-ink">
              전체 약관에 모두 동의합니다.
            </span>
          </label>

          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!agreeAll}
            onClick={() => setStep(1)}
          >
            동의하고 다음 단계로
          </Button>
        </div>
      )}

      {/* ── 2단계: 본인인증 ──────────────────────────────── */}
      {step === 1 && (
        <div className="mt-8 space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            휴대폰 본인인증
          </h2>
          <IdentityVerifyBox
            onVerified={(v) => {
              setIdentity(v);
            }}
          />
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!identity}
            onClick={() => setStep(2)}
          >
            다음 단계로
          </Button>
        </div>
      )}

      {/* ── 3단계: 회원정보 입력 ─────────────────────────── */}
      {step === 2 && identity && (
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            회원정보 입력
          </h2>

          <div className="flex items-center gap-3 rounded-xl border border-signal/30 bg-signal/8 px-4 py-3">
            <CheckCircle2 className="size-4 shrink-0 text-signal" />
            <p className="text-sm text-ink">
              <b>{identity.name}</b> · {identity.birth} · {identity.phone}
              <span className="ml-2 text-xs text-muted">
                본인인증 완료 — 인증된 정보는 수정할 수 없습니다
              </span>
            </p>
          </div>

          <Field
            label="아이디"
            required
            hint="영문으로 시작하는 영문/숫자 6~20자"
            error={
              usernameChecked === false ? "이미 사용 중인 아이디입니다." : undefined
            }
          >
            <div className="flex gap-2.5">
              <TextInput
                placeholder="아이디"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameChecked(null);
                }}
                error={usernameChecked === false}
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 px-5"
                onClick={() => void checkUsername()}
              >
                중복 확인
              </Button>
            </div>
            {usernameChecked === true && (
              <p className="mt-1.5 text-xs font-medium text-signal">
                사용 가능한 아이디입니다.
              </p>
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="비밀번호" required hint="영문·숫자 포함 8~20자">
              <TextInput
                type="password"
                placeholder="비밀번호"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </Field>
            <Field
              label="비밀번호 확인"
              required
              error={
                pw2 && pw !== pw2 ? "비밀번호가 일치하지 않습니다." : undefined
              }
            >
              <TextInput
                type="password"
                placeholder="비밀번호 확인"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                error={Boolean(pw2 && pw !== pw2)}
              />
            </Field>
          </div>

          <Field
            label="이메일"
            required
            hint="채용절차 진행상황 안내를 받을 이메일입니다."
          >
            <TextInput
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

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
            {busy ? "가입 처리 중…" : "가입 완료"}
          </Button>
        </form>
      )}

      <AuthFootLinks
        links={[
          { label: "이미 회원이신가요? 로그인", href: "/login" },
          { label: "아이디&비밀번호 찾기", href: "/find-account" },
        ]}
      />
    </AuthShell>
  );
}
