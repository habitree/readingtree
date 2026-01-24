-- ============================================
-- 마이그레이션: 신규 사용자 메인 서재 자동 생성
-- 파일명: migration-202601241930__users__add_main_bookshelf_trigger.sql
-- 설명: handle_new_user() 함수에 메인 서재 자동 생성 로직 추가
-- 날짜: 2026-01-24
-- ============================================

-- 1. handle_new_user() 함수 수정 (메인 서재 생성 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- 1. users 테이블에 프로필 생성
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '사용자'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 2. 메인 서재 자동 생성
  INSERT INTO public.bookshelves (user_id, name, is_main, "order", is_public)
  VALUES (NEW.id, '내 서재', TRUE, 0, FALSE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 기존 사용자 중 메인 서재가 없는 사용자에게 메인 서재 생성
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT u.id
    FROM public.users u
    LEFT JOIN public.bookshelves b ON u.id = b.user_id AND b.is_main = TRUE
    WHERE b.id IS NULL
  LOOP
    INSERT INTO public.bookshelves (user_id, name, is_main, "order", is_public)
    VALUES (user_record.id, '내 서재', TRUE, 0, FALSE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created main bookshelf for user: %', user_record.id;
  END LOOP;
END $$;

-- 3. 검증 쿼리 (수동 실행용)
-- SELECT
--   u.id as user_id,
--   u.email,
--   b.id as main_bookshelf_id,
--   b.name as bookshelf_name
-- FROM public.users u
-- LEFT JOIN public.bookshelves b ON u.id = b.user_id AND b.is_main = TRUE
-- ORDER BY u.created_at DESC;
