-- ════════════════════════════════════════════════════════════════
--  0005 — 필기시험 (웹 프록터링)
--
--  hr_exam_templates: 시험 세트(문항·정책). HR만 쓰기.
--  hr_exam_sessions : 응시 세션(답안·이벤트·무결성). 지원자가
--    /exam/[token] 셀프서비스(anon)로 시작·저장·제출하므로 anon 쓰기를
--    허용한다 — 데모 정책이며, 0002 RLS 강화 시 토큰 검증 함수로 세분화.
--
--  녹화 원본은 Storage 버킷 `exam-media`에 올라간다(선택):
--    supabase 대시보드에서 private 버킷 `exam-media` 생성 필요.
-- ════════════════════════════════════════════════════════════════

create table if not exists hr_exam_templates (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists hr_exam_sessions (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_sessions_app on hr_exam_sessions ((data->>'applicationId'));
create index if not exists idx_exam_sessions_token on hr_exam_sessions ((data->>'token'));
create index if not exists idx_exam_sessions_status on hr_exam_sessions ((data->>'status'));

alter table hr_exam_templates enable row level security;
alter table hr_exam_sessions enable row level security;

create policy "hr_full_access" on hr_exam_templates
  for all to authenticated using (true) with check (true);
-- 응시 화면이 문항을 읽어야 하므로 anon 읽기 허용
create policy "anon_read" on hr_exam_templates
  for select to anon using (true);

create policy "hr_full_access" on hr_exam_sessions
  for all to authenticated using (true) with check (true);
create policy "anon_read" on hr_exam_sessions
  for select to anon using (true);
-- 지원자 셀프서비스: 응시 시작·답안 저장·이벤트 기록·제출 (anon)
create policy "anon_write_session" on hr_exam_sessions
  for all to anon using (true) with check (true);

alter publication supabase_realtime add table hr_exam_templates;
alter publication supabase_realtime add table hr_exam_sessions;
