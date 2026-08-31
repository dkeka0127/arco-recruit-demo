-- ════════════════════════════════════════════════════════════════
--  감사 로그 테이블 — 위험 액션 기록(단계변경·합불·발송·병합·파기 등).
--  0001과 동일한 jsonb 하이브리드 형태. 적용 후 재시드 불필요
--  (앱이 기록을 채운다). 미적용 시 감사 로그는 세션 로컬로만 유지된다.
-- ════════════════════════════════════════════════════════════════

create table if not exists hr_audit (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_audit_at on hr_audit ((data->>'at'));

alter table hr_audit enable row level security;

-- 데모 정책(0001과 동일 기조). 운영 전환 시 0002 방식으로 축소.
create policy "hr_full_access" on hr_audit
  for all to authenticated using (true) with check (true);
create policy "anon_read" on hr_audit
  for select to anon using (true);

alter publication supabase_realtime add table hr_audit;
