"use client";

// ════════════════════════════════════════════════════════════════
//  휴대폰 본인인증 위젯 — 회원가입·아이디/비밀번호 찾기 공용.
//  이름·생년월일·휴대폰 → 인증번호 발송 → 확인 → onVerified(ci, 정보).
//  데모 모드는 발송된 인증번호를 화면에 함께 보여준다 (identity-verify.ts).
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { ShieldCheck, CheckCircle2, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/apply/form-fields";
import {
  identityVerifier,
  identityVerifyLive,
  type VerifySession,
} from "@/lib/identity-verify";

export interface VerifiedIdentity {
  ci: string;
  name: string;
  birth: string;
  phone: string;
}

export function IdentityVerifyBox({
  onVerified,
  compact,
}: {
  onVerified: (v: VerifiedIdentity) => void;
  /** 계정찾기 등 좁은 화면용 — 안내문 축약 */
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [session, setSession] = useState<VerifySession | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function send() {
    setError("");
    const r = identityVerifier.request({ name, birth, phone });
    if (!r.ok || !r.session) {
      setError(r.error ?? "인증 요청에 실패했습니다.");
      return;
    }
    setSession(r.session);
    setCode("");
  }

  async function confirm() {
    if (!session) return;
    setError("");
    const r = await identityVerifier.confirm(session.requestId, code);
    if (!r.ok || !r.ci) {
      setError(r.error ?? "인증에 실패했습니다.");
      return;
    }
    setDone(true);
    onVerified({ ci: r.ci, name: name.trim(), birth, phone: phone.trim() });
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-signal/30 bg-signal/8 p-5">
        <CheckCircle2 className="size-5 shrink-0 text-signal" />
        <div>
          <p className="text-sm font-semibold text-ink">본인인증 완료</p>
          <p className="mt-0.5 text-xs text-muted">
            {name} · {phone}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!compact && (
        <p className="flex items-start gap-2 rounded-xl bg-paper-dim/60 p-4 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-ink" />
          본인 명의 휴대폰으로 인증합니다. 인증된 이름·생년월일은 회원정보에
          사용되며 수정할 수 없습니다.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="이름" required>
          <TextInput
            placeholder="홍길동"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!session}
          />
        </Field>
        <Field label="생년월일" required>
          <TextInput
            type="date"
            autoComplete="bday"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            disabled={!!session}
          />
        </Field>
      </div>

      <Field label="휴대폰 번호" required hint={session ? undefined : "본인 명의 휴대폰 번호 (숫자만 입력 가능)"}>
        <div className="flex gap-2.5">
          <TextInput
            placeholder="01012345678"
            autoComplete="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!!session}
          />
          <Button
            type="button"
            variant="outline"
            className="h-12 shrink-0 px-5"
            onClick={send}
          >
            {session ? "재발송" : "인증번호 발송"}
          </Button>
        </div>
      </Field>

      {session && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <MessageSquareMore className="size-4 text-accent-ink" />
            인증번호를 입력해 주세요
          </p>
          {!identityVerifyLive && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              데모 환경이라 문자 대신 여기 표시합니다 — 인증번호:{" "}
              <b className="font-mono text-sm tracking-widest text-accent-ink">
                {session.demoCode}
              </b>
            </p>
          )}
          <div className="mt-3 flex gap-2.5">
            <TextInput
              placeholder="인증번호 6자리"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono tracking-widest"
            />
            <Button
              type="button"
              variant="accent"
              className="h-12 shrink-0 px-6"
              onClick={() => void confirm()}
            >
              확인
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
