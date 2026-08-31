-- ════════════════════════════════════════════════════════════════
--  아르코에듀 HR 콘솔 — Supabase 초기 스키마
--
--  설계: "문서형 하이브리드" — 엔티티별 테이블(행 = 엔티티 1개),
--  본문은 jsonb(data)로 TS 타입(src/lib/hr/types.ts)과 1:1 대응.
--  프론트 스토어와의 diff 동기화·Realtime에 최적화된 1차 스키마이며,
--  질의 요구가 늘면 jsonb → 정규 컬럼으로 단계적 승격한다.
-- ════════════════════════════════════════════════════════════════

-- 엔티티 테이블 공통 형태
create table if not exists hr_stages (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_jobs (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_candidates (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_applications (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_interviews (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_proposals (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_talent (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_members (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_templates (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 워크스페이스 설정 (단일 행)
create table if not exists hr_settings (
  id int primary key default 1 check (id = 1),
  settings jsonb not null,
  dismissed_dupes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 자주 쓰는 조회 경로 인덱스 (jsonb)
create index if not exists idx_applications_stage on hr_applications ((data->>'stageId'));
create index if not exists idx_applications_job on hr_applications ((data->>'jobId'));
create index if not exists idx_applications_candidate on hr_applications ((data->>'candidateId'));
create index if not exists idx_interviews_date on hr_interviews ((data->>'date'));

-- ── RLS ──────────────────────────────────────────────────────────
-- ⚠ 데모 정책: authenticated = 전체 권한(인사팀), anon = 읽기 +
--   지원자/면접관 셀프서비스에 필요한 최소 쓰기(제안 확정, 평가 제출).
--   운영 전환 시 지원자 인증 도입과 함께 반드시 세분화할 것.

do $$
declare t text;
begin
  foreach t in array array[
    'hr_stages','hr_jobs','hr_candidates','hr_applications','hr_interviews',
    'hr_proposals','hr_talent','hr_members','hr_templates','hr_settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "hr_full_access" on %I for all to authenticated using (true) with check (true)', t);
    execute format(
      'create policy "anon_read" on %I for select to anon using (true)', t);
  end loop;
end $$;

-- 지원자(/my)·면접관 링크(/eval)의 셀프서비스 쓰기 (데모 범위)
create policy "anon_confirm_proposal" on hr_proposals
  for update to anon using (true) with check (true);
create policy "anon_write_application" on hr_applications
  for update to anon using (true) with check (true);
create policy "anon_write_interview" on hr_interviews
  for all to anon using (true) with check (true);

-- ── Realtime ─────────────────────────────────────────────────────
alter publication supabase_realtime add table
  hr_stages, hr_jobs, hr_candidates, hr_applications, hr_interviews,
  hr_proposals, hr_talent, hr_members, hr_templates, hr_settings;
