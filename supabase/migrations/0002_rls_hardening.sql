-- ════════════════════════════════════════════════════════════════
--  RLS 강화 — 데모 정책(anon 전체 허용) 제거, 운영 지향 정책으로 교체.
--
--  전제(운영 모델):
--   - 인사팀(authenticated) = 전체 접근 (기존 유지)
--   - 지원자 = 자신의 지원서/제안만 (candidate 인증 도입 시)
--   - 면접관 링크(/eval) = 서명 토큰 검증 (Edge Function 경유, anon 직접쓰기 제거)
--
--  ⚠ 이 마이그레이션을 적용하면 anon(비로그인) 클라이언트의 광범위한
--    읽기/쓰기가 막힌다. 지원자 /my·면접관 /eval의 실데이터 동작은
--    아래 "지원자 인증 도입" 이후 켜야 한다. 데모만 계속하려면 0002를
--    적용하지 말 것. (docs/supabase-setup.md 참고)
-- ════════════════════════════════════════════════════════════════

-- 1) 데모용 광범위 정책 제거
do $$
declare t text;
begin
  foreach t in array array[
    'hr_stages','hr_jobs','hr_candidates','hr_applications','hr_interviews',
    'hr_proposals','hr_talent','hr_members','hr_templates','hr_settings'
  ] loop
    execute format('drop policy if exists "anon_read" on %I', t);
  end loop;
end $$;

drop policy if exists "anon_confirm_proposal" on hr_proposals;
drop policy if exists "anon_write_application" on hr_applications;
drop policy if exists "anon_write_interview" on hr_interviews;

-- 2) 지원자 공개용 최소 읽기 (공고·단계·설정만 anon 읽기 허용)
--    지원자 사이트가 공개 공고를 보여주기 위한 최소 표면.
create policy "anon_read_public_jobs" on hr_jobs
  for select to anon using ((data->>'status') = '게시중');
create policy "anon_read_stages" on hr_stages
  for select to anon using (true);
create policy "anon_read_settings" on hr_settings
  for select to anon using (true);

-- 3) 지원자 본인 데이터 (candidate 인증 도입 시 활성)
--    가정: 지원자 로그인 시 JWT에 candidate_id 클레임을 넣거나,
--    hr_candidates.data->>'authUserId' = auth.uid() 매핑을 둔다.
--    아래는 authUserId 매핑 방식 예시.
create policy "candidate_reads_own_applications" on hr_applications
  for select to authenticated using (
    exists (
      select 1 from hr_candidates c
      where c.id = (hr_applications.data->>'candidateId')
        and (c.data->>'authUserId') = auth.uid()::text
    )
    -- 인사팀(전체 접근)은 아래 hr_full_access 정책으로 이미 통과
  );
create policy "candidate_reads_own_proposals" on hr_proposals
  for select to authenticated using (
    exists (
      select 1 from hr_applications a
      join hr_candidates c on c.id = (a.data->>'candidateId')
      where a.id = (hr_proposals.data->>'applicationId')
        and (c.data->>'authUserId') = auth.uid()::text
    )
  );
-- 지원자가 자신의 제안 시간을 선택(확정)하는 업데이트
create policy "candidate_confirms_own_proposal" on hr_proposals
  for update to authenticated using (
    exists (
      select 1 from hr_applications a
      join hr_candidates c on c.id = (a.data->>'candidateId')
      where a.id = (hr_proposals.data->>'applicationId')
        and (c.data->>'authUserId') = auth.uid()::text
    )
  );

-- 주의: 기존 "hr_full_access"(authenticated 전체 허용) 정책이 남아 있으면
-- 위 지원자 정책과 함께 인사팀도 authenticated로 전부 통과한다.
-- 지원자와 인사팀을 같은 authenticated 풀에서 구분하려면 role 클레임
-- (app_metadata.role='hr' vs 'candidate')로 hr_full_access를 아래처럼 좁혀야 한다:
--
--   drop policy "hr_full_access" on <table>;
--   create policy "hr_full_access" on <table> for all to authenticated
--     using ( (auth.jwt()->'app_metadata'->>'role') = 'hr' )
--     with check ( (auth.jwt()->'app_metadata'->>'role') = 'hr' );
--
-- 시드 스크립트에서 HR 계정 생성 시 app_metadata.role='hr'를 부여하면 된다.
