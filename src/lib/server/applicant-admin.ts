// ════════════════════════════════════════════════════════════════
//  지원자 계정 서버 헬퍼 — service role 키는 서버에서만 사용한다.
//  계정은 Supabase Auth(user_metadata.role === "applicant")에 저장:
//  별도 테이블 없이 시작(psql 권한 불요). 지원자 수가 수천 명 규모로
//  커지면 listUsers 스캔 대신 applicant_accounts 테이블로 이관.
// ════════════════════════════════════════════════════════════════

import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 서버 라우트 활성 조건 — 미설정이면 데모 모드(클라이언트가 호출 안 함) */
export const applicantAdminReady = Boolean(url && anonKey && serviceKey);

export function adminClient(): SupabaseClient {
  return createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** 비밀번호 검증용 익명 클라이언트 (서버에서 로그인 대행 — 이메일 미노출) */
export function anonServerClient(): SupabaseClient {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface ApplicantMeta {
  role: "applicant";
  username: string;
  name: string;
  birth: string;
  phone: string;
  ci: string;
}

export function isApplicant(u: User): boolean {
  return u.user_metadata?.role === "applicant";
}

/**
 * 지원자 검색 — auth 사용자 전체를 페이지 스캔.
 * (user_metadata는 admin API로 질의 불가 — 규모 커지면 테이블 이관)
 */
export async function findApplicant(
  admin: SupabaseClient,
  pred: (meta: ApplicantMeta, user: User) => boolean,
): Promise<User | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const hit = data.users.find(
      (u) => isApplicant(u) && pred(u.user_metadata as ApplicantMeta, u),
    );
    if (hit) return hit;
    if (data.users.length < 1000) break;
  }
  return null;
}

/** 아이디 형식: 영문 시작, 영문/숫자 6~20자 (클라이언트와 동일 규칙) */
export const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9]{5,19}$/;
/** 비밀번호: 8~20자, 영문+숫자 포함 */
export const PASSWORD_RE = /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/;

export function jsonError(message: string, status = 400): Response {
  return Response.json({ ok: false, error: message }, { status });
}
