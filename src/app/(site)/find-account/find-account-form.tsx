"use client";

// ════════════════════════════════════════════════════════════════
//  아이디·비밀번호 찾기 — 본인인증(공용 위젯) 후 처리. 레거시 FAQ 절차
//  보존: 아이디 찾기 = 인증 후 마스킹 아이디 표시, 비밀번호 = 인적사항
//  확인 후 새 비밀번호로 변경.
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/apply/form-fields";
import { AuthShell, AuthFootLinks } from "@/components/apply/auth-shell";
import {
  IdentityVerifyBox,
  type VerifiedIdentity,
} from "@/components/apply/identity-verify-box";
import { applicantAuth, validPassword } from "@/lib/applicant-auth";
import { cn } from "@/lib/utils";

const TABS = ["아이디 찾기", "비밀번호 찾기"] as const;

export function FindAccountForm() {
  const [tab, setTab] = useState(0);
  const [identity, setIdentity] = useState<VerifiedIdentity | null>(null);
  // 아이디 찾기 결과: undefined=미실행, null=없음, string=마스킹 아이디
  const [foundId, setFoundId] = useState<string | null | undefined>(undefined);
  // 비밀번호 찾기
  const [username, setUsername] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwDone, setPwDone] = useState(false);
  const [error, setError] = useState("");

  function switchTab(i: number) {
    setTab(i);
    setIdentity(null);
    setFoundId(undefined);
    setPwDone(false);
    setError("");
  }

  async function resetPw() {
    setError("");
    if (!identity) return;
    if (!username.trim()) return setError("아이디를 입력해 주세요.");
    if (!validPassword(newPw))
      return setError("비밀번호는 영문·숫자를 포함한 8~20자입니다.");
    if (newPw !== newPw2) return setError("비밀번호 확인이 일치하지 않습니다.");
    const r = await applicantAuth.resetPassword(username, identity.ci, newPw);
    if (!r.ok) return setError(r.error ?? "재설정에 실패했습니다.");
    setPwDone(true);
  }

  return (
    <AuthShell
      kicker="Find Account"
      title="아이디·비밀번호 찾기"
      desc="가입 시 입력하신 정보로 본인인증 후 아이디 또는 비밀번호를 찾으실 수 있습니다."
      aside={
        <ul className="space-y-2 text-sm text-paper/70">
          <li>· 본인인증 후 가입된 아이디를 확인할 수 있습니다.</li>
          <li>· 비밀번호는 본인인증 후 새 비밀번호로 변경합니다.</li>
        </ul>
      }
    >
      {/* ── 탭 ───────────────────────────────────────────── */}
      <div className="inline-flex rounded-full border border-line bg-pure p-1">
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => switchTab(i)}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium tracking-tight transition-colors",
              i === tab ? "bg-ink text-paper" : "text-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {/* ── 아이디 찾기 ─────────────────────────────────── */}
        {tab === 0 &&
          (foundId === undefined ? (
            <>
              <IdentityVerifyBox
                compact
                onVerified={(v) => {
                  setIdentity(v);
                  void applicantAuth.findUsername(v.ci).then(setFoundId);
                }}
              />
              <p className="text-xs text-muted">
                가입 시 본인인증한 정보(이름·생년월일·휴대폰)와 일치해야
                합니다.
              </p>
            </>
          ) : foundId ? (
            <div className="rounded-xl border border-signal/30 bg-signal/8 p-6 text-center">
              <CircleCheck className="mx-auto size-8 text-signal" />
              <p className="mt-3 text-sm text-muted">회원님의 아이디는</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-ink">
                {foundId}
              </p>
              <p className="mt-1 text-xs text-muted-ink">
                입니다. (보안을 위해 일부는 * 처리됩니다)
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/login">
                  <Button variant="accent">로그인하기</Button>
                </Link>
                <Button variant="outline" onClick={() => switchTab(1)}>
                  비밀번호 찾기
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-paper-dim/50 p-6 text-center">
              <p className="text-sm font-semibold text-ink">
                인증 정보와 일치하는 계정을 찾지 못했습니다.
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                가입 시 본인인증한 이름·생년월일·휴대폰 번호가 맞는지 확인해
                주세요. 처음이시라면 회원가입을 진행해 주세요.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/signup">
                  <Button variant="accent">회원가입하기</Button>
                </Link>
                <Button variant="outline" onClick={() => switchTab(0)}>
                  다시 시도
                </Button>
              </div>
            </div>
          ))}

        {/* ── 비밀번호 찾기(재설정) ───────────────────────── */}
        {tab === 1 &&
          (pwDone ? (
            <div className="rounded-xl border border-signal/30 bg-signal/8 p-6 text-center">
              <CircleCheck className="mx-auto size-8 text-signal" />
              <p className="mt-3 text-sm font-semibold text-ink">
                비밀번호가 변경되었습니다.
              </p>
              <p className="mt-1 text-xs text-muted">
                새 비밀번호로 로그인해 주세요.
              </p>
              <div className="mt-5">
                <Link href="/login">
                  <Button variant="accent">로그인하기</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Field label="아이디" required>
                <TextInput
                  placeholder="가입 아이디"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>

              {!identity ? (
                <IdentityVerifyBox compact onVerified={setIdentity} />
              ) : (
                <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <KeyRound className="size-4 text-accent-ink" />
                    새 비밀번호 설정
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="새 비밀번호" required hint="영문·숫자 포함 8~20자">
                      <TextInput
                        type="password"
                        autoComplete="new-password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                      />
                    </Field>
                    <Field
                      label="새 비밀번호 확인"
                      required
                      error={
                        newPw2 && newPw !== newPw2
                          ? "비밀번호가 일치하지 않습니다."
                          : undefined
                      }
                    >
                      <TextInput
                        type="password"
                        autoComplete="new-password"
                        value={newPw2}
                        onChange={(e) => setNewPw2(e.target.value)}
                        error={Boolean(newPw2 && newPw !== newPw2)}
                      />
                    </Field>
                  </div>
                  <Button
                    type="button"
                    variant="accent"
                    size="lg"
                    className="mt-4 w-full"
                    onClick={() => void resetPw()}
                  >
                    비밀번호 변경
                  </Button>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}
            </>
          ))}
      </div>

      <AuthFootLinks
        links={[
          { label: "로그인", href: "/login" },
          { label: "회원가입하기", href: "/signup" },
        ]}
      />
    </AuthShell>
  );
}
