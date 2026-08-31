"use client";

// ════════════════════════════════════════════════════════════════
//  Supabase 클라이언트 — 환경변수가 있으면 백엔드 모드, 없으면
//  null을 반환해 기존 localStorage 데모 모드로 폴백한다.
// ════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;

/** Supabase 백엔드가 설정되어 있는가 (빌드 타임 env 기준) */
export const supabaseEnabled = Boolean(url && anonKey);

/** 브라우저 싱글턴. 미설정 시 null → 로컬 데모 모드. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!url || !anonKey || typeof window === "undefined") {
    client = null;
    return client;
  }
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
