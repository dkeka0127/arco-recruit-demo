"use client";

// ════════════════════════════════════════════════════════════════
//  지원자 회원 인증 — 데모 완동작 + 운영 슬롯.
//
//  레거시(remLogin.php) 회원 체계 보존: 아이디 로그인, 가입 수집 항목
//  (아이디·성명·생년월일·휴대폰·이메일·비밀번호), 절차(약관 동의 →
//  휴대폰 본인인증 → 회원정보 입력).
//
//  이중 모드 (HR 스토어와 동일 원칙):
//  · 데모(env 없음): 계정 localStorage 저장(비밀번호 SHA-256 해시)
//  · 운영(Supabase env): Supabase Auth 세션 + /api/applicant/* 서버
//    라우트(service role — 아이디→이메일 매핑·중복확인·비번 재설정).
//    계정은 user_metadata.role="applicant"로 HR 멤버와 구분된다.
//  세션은 useSyncExternalStore로 전 컴포넌트 실시간 반영.
// ════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react";
import { getSupabase, supabaseEnabled } from "@/lib/hr/supabase";
import type { User } from "@supabase/supabase-js";

export interface ApplicantAccount {
  id: string;
  /** 로그인 아이디 (레거시 보존 — 영문/숫자 6~20자) */
  username: string;
  name: string;
  /** YYYY-MM-DD */
  birth: string;
  phone: string;
  email: string;
  /** SHA-256 hex — 데모 저장용. 운영은 Supabase Auth가 관리 */
  pwHash: string;
  /** 본인인증 연계정보(데모: 이름+생년월일+휴대폰 해시) */
  ci: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "talent-os:applicant-accounts";
const SESSION_KEY = "talent-os:applicant-session";
const REMEMBER_KEY = "talent-os:remember-username";

// ── 저장소 ───────────────────────────────────────────────────────

function loadAccounts(): ApplicantAccount[] {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAccounts(list: ApplicantAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

// ── 세션 (구독형) ────────────────────────────────────────────────

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

// ── 원격(Supabase Auth) 세션 캐시 — 지원자(role=applicant)만 인정 ──

let remoteAccount: ApplicantAccount | null = null;
let remoteInitDone = false;

function mapAuthUser(u: User | null | undefined): ApplicantAccount | null {
  const m = u?.user_metadata;
  if (!u || m?.role !== "applicant") return null;
  return {
    id: u.id,
    username: m.username ?? "",
    name: m.name ?? "",
    birth: m.birth ?? "",
    phone: m.phone ?? "",
    email: u.email ?? "",
    pwHash: "", // 원격 모드에선 Supabase Auth가 관리
    ci: m.ci ?? "",
    createdAt: u.created_at,
  };
}

function ensureRemoteInit() {
  if (!supabaseEnabled || remoteInitDone) return;
  const sb = getSupabase();
  if (!sb) return;
  remoteInitDone = true;
  sb.auth.onAuthStateChange((_event, session) => {
    remoteAccount = mapAuthUser(session?.user);
    emit();
  });
  void sb.auth.getSession().then(({ data }) => {
    remoteAccount = mapAuthUser(data.session?.user);
    emit();
  });
}

function subscribe(cb: () => void) {
  ensureRemoteInit();
  listeners.add(cb);
  // 다른 탭 로그인/로그아웃도 반영 (데모 모드)
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}

// getSnapshot은 참조 안정이어야 한다 — 원격은 캐시 객체, 데모는 세션 id 문자열
const getSnapshot = (): ApplicantAccount | string | null =>
  supabaseEnabled
    ? remoteAccount
    : typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(SESSION_KEY) ?? "");
const getServerSnapshot = (): ApplicantAccount | string | null =>
  supabaseEnabled ? null : "";

/** 현재 로그인한 지원자 계정 (없으면 null). SSR 안전 */
export function useApplicantSession(): ApplicantAccount | null {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (supabaseEnabled) return snap as ApplicantAccount | null;
  const id = snap as string;
  if (!id) return null;
  return loadAccounts().find((a) => a.id === id) ?? null;
}

/** 훅 밖에서 세션 조회 (액션·이벤트 핸들러용) */
export function currentApplicant(): ApplicantAccount | null {
  if (typeof window === "undefined") return null;
  if (supabaseEnabled) {
    ensureRemoteInit();
    return remoteAccount;
  }
  const id = window.localStorage.getItem(SESSION_KEY);
  return id ? (loadAccounts().find((a) => a.id === id) ?? null) : null;
}

/** 서버 라우트 호출 공통 — {ok, ...} 응답 규약 */
async function api<T extends { ok: boolean; error?: string }>(
  path: string,
  body: unknown,
): Promise<T> {
  try {
    const res = await fetch(`/api/applicant/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return { ok: false, error: "서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요." } as T;
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const uid = () =>
  `apl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** 아이디 형식: 영문 시작, 영문/숫자 6~20자 (레거시 규칙) */
export function validUsername(u: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9]{5,19}$/.test(u);
}

/** 비밀번호 규칙: 8~20자, 영문+숫자 포함 */
export function validPassword(p: string): boolean {
  return /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/.test(p);
}

/** 아이디 마스킹 — 앞 3자 노출 (아이디 찾기 결과 표시용) */
export function maskUsername(u: string): string {
  return u.slice(0, 3) + "*".repeat(Math.max(1, u.length - 3));
}

// ── 액션 ─────────────────────────────────────────────────────────

export const applicantAuth = {
  /** 아이디 사용 가능 여부 (중복 확인 버튼) */
  async usernameAvailable(username: string): Promise<boolean> {
    if (supabaseEnabled) {
      const r = await api<{ ok: boolean; available?: boolean }>(
        "check-username",
        { username },
      );
      return r.ok ? (r.available ?? false) : false;
    }
    return !loadAccounts().some(
      (a) => a.username.toLowerCase() === username.toLowerCase(),
    );
  },

  /** 가입 — 본인인증(ci)을 마친 뒤 호출된다. 성공 시 즉시 로그인 */
  async signUp(input: {
    username: string;
    password: string;
    name: string;
    birth: string;
    phone: string;
    email: string;
    ci: string;
  }): Promise<{ ok: boolean; error?: string }> {
    if (supabaseEnabled) {
      const r = await api<{ ok: boolean; error?: string }>("signup", input);
      if (!r.ok) return r;
      const sb = getSupabase();
      const { error } = await sb!.auth.signInWithPassword({
        email: input.email.trim(),
        password: input.password,
      });
      if (error)
        return { ok: false, error: "가입은 완료됐지만 자동 로그인에 실패했습니다. 로그인해 주세요." };
      return { ok: true };
    }
    const accounts = loadAccounts();
    if (!validUsername(input.username))
      return { ok: false, error: "아이디는 영문으로 시작하는 영문/숫자 6~20자입니다." };
    if (!validPassword(input.password))
      return { ok: false, error: "비밀번호는 영문·숫자를 포함한 8~20자입니다." };
    if (
      accounts.some(
        (a) => a.username.toLowerCase() === input.username.toLowerCase(),
      )
    )
      return { ok: false, error: "이미 사용 중인 아이디입니다." };
    if (
      accounts.some(
        (a) => a.email.toLowerCase() === input.email.trim().toLowerCase(),
      )
    )
      return { ok: false, error: "이미 가입된 이메일입니다. 아이디 찾기를 이용해 주세요." };
    if (accounts.some((a) => a.ci === input.ci))
      return { ok: false, error: "이미 본인인증으로 가입된 계정이 있습니다. 아이디 찾기를 이용해 주세요." };

    const account: ApplicantAccount = {
      id: uid(),
      username: input.username,
      name: input.name,
      birth: input.birth,
      phone: input.phone,
      email: input.email.trim(),
      pwHash: await sha256(input.password),
      ci: input.ci,
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...accounts, account]);
    // 가입 즉시 로그인
    window.localStorage.setItem(SESSION_KEY, account.id);
    emit();
    return { ok: true };
  },

  async signIn(
    username: string,
    password: string,
    rememberId: boolean,
  ): Promise<{ ok: boolean; error?: string }> {
    if (rememberId)
      window.localStorage.setItem(REMEMBER_KEY, username.trim());
    else window.localStorage.removeItem(REMEMBER_KEY);

    if (supabaseEnabled) {
      const r = await api<{
        ok: boolean;
        error?: string;
        session?: { access_token: string; refresh_token: string };
      }>("login", { username, password });
      if (!r.ok || !r.session)
        return { ok: false, error: r.error ?? "로그인에 실패했습니다." };
      const sb = getSupabase();
      const { error } = await sb!.auth.setSession(r.session);
      if (error) return { ok: false, error: "세션 설정에 실패했습니다." };
      return { ok: true };
    }

    const account = loadAccounts().find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase(),
    );
    if (!account)
      return { ok: false, error: "존재하지 않는 아이디입니다." };
    if (account.pwHash !== (await sha256(password)))
      return { ok: false, error: "비밀번호가 일치하지 않습니다." };
    window.localStorage.setItem(SESSION_KEY, account.id);
    emit();
    return { ok: true };
  },

  signOut() {
    if (supabaseEnabled) {
      void getSupabase()?.auth.signOut(); // onAuthStateChange가 emit
      return;
    }
    window.localStorage.removeItem(SESSION_KEY);
    emit();
  },

  /** 저장된 아이디 (로그인 폼 "아이디 저장") */
  rememberedUsername(): string {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(REMEMBER_KEY) ?? "";
  },

  /** 아이디 찾기 — 본인인증(ci) 일치 계정의 마스킹된 아이디 */
  async findUsername(ci: string): Promise<string | null> {
    if (supabaseEnabled) {
      const r = await api<{ ok: boolean; username?: string | null }>(
        "find-id",
        { ci },
      );
      return r.ok ? (r.username ?? null) : null;
    }
    const account = loadAccounts().find((a) => a.ci === ci);
    return account ? maskUsername(account.username) : null;
  },

  /** 비밀번호 재설정 — 아이디+본인인증(ci) 일치 시 새 비밀번호로 교체 */
  async resetPassword(
    username: string,
    ci: string,
    newPassword: string,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!validPassword(newPassword))
      return { ok: false, error: "비밀번호는 영문·숫자를 포함한 8~20자입니다." };
    if (supabaseEnabled) {
      return api<{ ok: boolean; error?: string }>("reset-password", {
        username,
        ci,
        newPassword,
      });
    }
    const accounts = loadAccounts();
    const idx = accounts.findIndex(
      (a) =>
        a.username.toLowerCase() === username.trim().toLowerCase() &&
        a.ci === ci,
    );
    if (idx < 0)
      return { ok: false, error: "아이디와 본인인증 정보가 일치하는 계정이 없습니다." };
    accounts[idx] = { ...accounts[idx], pwHash: await sha256(newPassword) };
    saveAccounts(accounts);
    emit();
    return { ok: true };
  },
};
