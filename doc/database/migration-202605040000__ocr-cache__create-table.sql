-- =====================================================================
-- OCR 결과 캐시 테이블 생성
-- 목적: 동일 이미지(SHA-256 hash)에 대한 중복 Cloud Run/Vision API 호출 방지
--       → Vision API 비용 절감 + 재시도 시 응답 속도 개선
-- 작성일: 2026-05-04
-- 관련 문서: doc/결재/보안점검.md (3순위)
-- Idempotent: ✅ (반복 실행 안전)
-- =====================================================================

-- 1. 테이블 생성
create table if not exists public.ocr_cache (
  image_hash text primary key,
  extracted_text text not null,
  created_at timestamptz not null default now(),
  hit_count integer not null default 0
);

comment on table public.ocr_cache is 'OCR 결과 캐시 (이미지 콘텐츠 SHA-256 hash 기반 중복 호출 방지)';
comment on column public.ocr_cache.image_hash is '이미지 바이너리 SHA-256 hash (16진수 문자열)';
comment on column public.ocr_cache.extracted_text is 'Cloud Run OCR + Vision API에서 추출한 텍스트';
comment on column public.ocr_cache.hit_count is '캐시 hit 카운트 (관측·디버깅용)';

-- 2. 인덱스 (오래된 캐시 정리 작업용)
create index if not exists ocr_cache_created_at_idx
  on public.ocr_cache(created_at desc);

-- 3. RLS 활성화
alter table public.ocr_cache enable row level security;

-- 4. RLS 정책: 일반 사용자(authenticated)는 직접 접근 불가
--    (캐시는 Server Action / API Route에서 service_role 키로만 접근)
--    service_role은 RLS를 우회하므로 별도 정책 불필요

drop policy if exists "ocr_cache_no_select_authenticated" on public.ocr_cache;
create policy "ocr_cache_no_select_authenticated"
  on public.ocr_cache
  for select
  to authenticated
  using (false);

drop policy if exists "ocr_cache_no_insert_authenticated" on public.ocr_cache;
create policy "ocr_cache_no_insert_authenticated"
  on public.ocr_cache
  for insert
  to authenticated
  with check (false);

drop policy if exists "ocr_cache_no_update_authenticated" on public.ocr_cache;
create policy "ocr_cache_no_update_authenticated"
  on public.ocr_cache
  for update
  to authenticated
  using (false);

drop policy if exists "ocr_cache_no_delete_authenticated" on public.ocr_cache;
create policy "ocr_cache_no_delete_authenticated"
  on public.ocr_cache
  for delete
  to authenticated
  using (false);

-- 5. hit_count 증가 RPC (관측용)
--    void rpc 호출이라 결과를 사용하지 않음
create or replace function public.increment_ocr_cache_hit(p_image_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ocr_cache
     set hit_count = hit_count + 1
   where image_hash = p_image_hash;
$$;

comment on function public.increment_ocr_cache_hit(text) is
  'OCR 캐시 hit 카운트 증가 (Server Action에서 호출, security definer로 RLS 우회)';

-- 6. (선택) 오래된 캐시 정리 함수 — 예: 90일 초과
--    필요 시 cron으로 호출
create or replace function public.cleanup_old_ocr_cache(p_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.ocr_cache
   where created_at < (now() - make_interval(days => p_days));
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

comment on function public.cleanup_old_ocr_cache(integer) is
  '오래된 OCR 캐시 삭제 (기본 90일 초과). 관리자 작업 또는 cron에서 호출';
