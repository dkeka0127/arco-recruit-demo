-- ════════════════════════════════════════════════════════════════
--  0004 — 면접관 포털 알림함 (hr_notices)
--
--  면접 일정 조율/확정/취소/평가요청 시 면접관별 통지를 쌓는다.
--  포털(/interviewer/[token])이 이 컬렉션을 구독해 알림함·데스크톱
--  알림을 띄운다. 형태는 다른 엔티티와 동일한 jsonb 하이브리드.
--
--  ⚠ 알림 생성 주체에 지원자 셀프서비스(/my의 일정 확정, anon)가
--    포함되므로 anon 쓰기를 허용한다 — 데모 정책이며, 0002 RLS 강화
--    적용 시 다른 셀프서비스 정책과 함께 세분화할 것.
-- ════════════════════════════════════════════════════════════════

create table if not exists hr_notices (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_notices_member on hr_notices ((data->>'memberId'));

alter table hr_notices enable row level security;

create policy "hr_full_access" on hr_notices
  for all to authenticated using (true) with check (true);
create policy "anon_read" on hr_notices
  for select to anon using (true);
-- 지원자의 일정 확정(anon)이 확정 알림을 생성하고,
-- 면접관 포털(anon)이 읽음 처리를 한다.
create policy "anon_write_notice" on hr_notices
  for all to anon using (true) with check (true);

alter publication supabase_realtime add table hr_notices;
