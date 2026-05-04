-- =====================================================================
-- OCR 통계 누락 데이터 백필 + RLS INSERT/UPDATE 정책 추가
-- 작성일: 2026-05-04
-- 관련 문서: doc/결재/보안점검.md
--
-- 문제: ocr_logs/ocr_usage_stats 테이블에 SELECT(admin) 정책만 있고
--       INSERT/UPDATE 정책이 없어서, 일반 사용자 세션 클라이언트에서
--       INSERT가 RLS에 의해 모두 차단됨. 그 결과 1/16 이후 312건의
--       OCR 통계가 기록되지 않고 누락됨.
--       → admin 페이지의 OCR 사용량 집계가 부정확
--
-- 해결: (1) 본인 user_id에 한해 INSERT/UPDATE/SELECT 가능한 RLS 정책 추가
--       (2) transcriptions 기반으로 ocr_logs 백필 (312건)
--       (3) ocr_usage_stats를 transcriptions 기반으로 재계산 (upsert)
--
-- 추가 코드 변경: app/actions/ai/ocr.ts의 recordOcrSuccess / recordOcrFailure는
-- service_role 클라이언트로 변경하여 RLS와 무관하게 항상 통계가 기록되도록 함.
-- =====================================================================

-- 1. RLS INSERT/UPDATE 정책 추가 (본인 user_id에 한해 허용)
drop policy if exists "ocr_logs_insert_own" on public.ocr_logs;
create policy "ocr_logs_insert_own"
  on public.ocr_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ocr_logs_select_own" on public.ocr_logs;
create policy "ocr_logs_select_own"
  on public.ocr_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "ocr_usage_stats_insert_own" on public.ocr_usage_stats;
create policy "ocr_usage_stats_insert_own"
  on public.ocr_usage_stats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ocr_usage_stats_update_own" on public.ocr_usage_stats;
create policy "ocr_usage_stats_update_own"
  on public.ocr_usage_stats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ocr_usage_stats_select_own" on public.ocr_usage_stats;
create policy "ocr_usage_stats_select_own"
  on public.ocr_usage_stats
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 2. 누락된 transcriptions 데이터를 ocr_logs로 백필 (enum 캐스팅 필수)
insert into public.ocr_logs (user_id, note_id, status, created_at)
select
  n.user_id,
  t.note_id,
  (case t.status when 'completed' then 'success' when 'failed' then 'failed' end)::ocr_log_status as status,
  t.created_at
from public.transcriptions t
join public.notes n on n.id = t.note_id
where t.status in ('completed','failed')
  and not exists (
    select 1 from public.ocr_logs ol where ol.note_id = t.note_id
  );

-- 3. ocr_usage_stats를 transcriptions 기반으로 재계산 (user_id별 합계, upsert)
insert into public.ocr_usage_stats (user_id, success_count, failure_count, last_processed_at, created_at, updated_at)
select
  n.user_id,
  count(*) filter (where t.status = 'completed')::integer as success_count,
  count(*) filter (where t.status = 'failed')::integer as failure_count,
  max(t.created_at) as last_processed_at,
  now() as created_at,
  now() as updated_at
from public.transcriptions t
join public.notes n on n.id = t.note_id
where t.status in ('completed','failed')
group by n.user_id
on conflict (user_id) do update set
  success_count = excluded.success_count,
  failure_count = excluded.failure_count,
  last_processed_at = excluded.last_processed_at,
  updated_at = now();
