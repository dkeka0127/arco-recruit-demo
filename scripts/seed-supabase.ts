// ════════════════════════════════════════════════════════════════
//  Supabase 시드 스크립트 — 목업 시드(HrState)를 DB에 주입하고
//  HR 콘솔 로그인 계정을 만든다. (서비스 롤 키 필요, 서버에서만 실행)
//
//  사용법:
//    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:supabase
//  또는 .env.local에 두 값을 넣고 npm run seed:supabase
// ════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createSeedState } from "../src/lib/hr/seed";

// .env.local 간이 로딩 (dotenv 의존성 없이)
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const url =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "❌ SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL)과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.",
  );
  process.exit(1);
}

const sb = createClient(url, serviceKey);

const COLLECTIONS = [
  ["hr_stages", "stages"],
  ["hr_jobs", "jobs"],
  ["hr_candidates", "candidates"],
  ["hr_applications", "applications"],
  ["hr_interviews", "interviews"],
  ["hr_proposals", "proposals"],
  ["hr_exam_templates", "examTemplates"], // 마이그레이션 0005 필요
  ["hr_exam_sessions", "examSessions"], // 마이그레이션 0005 필요
  ["hr_notices", "notices"], // 마이그레이션 0004 필요
  ["hr_talent", "talent"],
  ["hr_members", "members"],
  ["hr_templates", "templates"],
] as const;

/** 데모 HR 계정 — 운영 전환 시 반드시 교체 */
const HR_ACCOUNT = {
  email: "suhyun.kim@arco.example",
  password: "arco-hr-2026!",
};

async function main() {
  const state = createSeedState();

  for (const [table, field] of COLLECTIONS) {
    const rows = (state[field] as { id: string }[]).map((x) => ({
      id: x.id,
      data: x,
      updated_at: new Date().toISOString(),
    }));

    const del = await sb.from(table).delete().neq("id", "__none__");
    if (del.error) {
      // 아직 없는 테이블(미적용 마이그레이션)은 건너뛴다
      if (/does not exist|schema cache/i.test(del.error.message)) {
        console.warn(`⚠ ${table} 없음 — supabase/migrations 최신분 적용 후 재시드하세요`);
        continue;
      }
      throw new Error(`${table} 비우기 실패: ${del.error.message}`);
    }

    const ins = await sb.from(table).insert(rows);
    if (ins.error) throw new Error(`${table} 시드 실패: ${ins.error.message}`);
    console.log(`✓ ${table} — ${rows.length}건`);
  }

  const settings = await sb.from("hr_settings").upsert({
    id: 1,
    settings: state.settings,
    dismissed_dupes: state.dismissedDupes,
    updated_at: new Date().toISOString(),
  });
  if (settings.error)
    throw new Error(`hr_settings 시드 실패: ${settings.error.message}`);
  console.log("✓ hr_settings");

  // HR 로그인 계정 생성 (이미 있으면 통과)
  const { error: userErr } = await sb.auth.admin.createUser({
    email: HR_ACCOUNT.email,
    password: HR_ACCOUNT.password,
    email_confirm: true,
    // RLS 강화(0002) 시 인사팀 식별용 — hr_full_access를 role='hr'로 좁힐 때 사용
    app_metadata: { role: "hr" },
  });
  if (userErr) {
    if (/already/i.test(userErr.message)) {
      console.log(`✓ HR 계정 이미 존재 — ${HR_ACCOUNT.email}`);
    } else {
      throw new Error(`HR 계정 생성 실패: ${userErr.message}`);
    }
  } else {
    console.log(
      `✓ HR 계정 생성 — ${HR_ACCOUNT.email} / ${HR_ACCOUNT.password} (첫 로그인 후 변경 권장)`,
    );
  }

  console.log("\n🎉 시드 완료. .env.local에 NEXT_PUBLIC_* 값을 넣고 dev 서버를 재시작하세요.");
}

main().catch((e) => {
  console.error("❌", e.message ?? e);
  process.exit(1);
});
