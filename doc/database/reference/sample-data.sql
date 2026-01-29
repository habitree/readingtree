-- ============================================
-- 샘플 데이터 초기화 스크립트
-- ============================================
-- 관리자가 지정한 샘플 데이터를 데이터베이스에 삽입합니다.
-- 게스트 사용자와 신규 사용자에게 표시될 예시 데이터입니다.
-- 
-- 실행 방법:
-- 1. Supabase 대시보드 → SQL Editor
-- 2. 이 파일의 내용을 복사하여 실행
-- 3. 또는 Supabase CLI 사용: supabase db execute -f sample-data.sql
-- ============================================

-- 주의: 이 스크립트는 샘플 데이터를 삽입합니다.
-- 기존 샘플 데이터가 있는 경우 중복될 수 있으므로,
-- 필요시 먼저 기존 샘플 데이터를 삭제하세요:
-- DELETE FROM notes WHERE is_sample = TRUE;
-- DELETE FROM books WHERE is_sample = TRUE;

-- ============================================
-- 1. 샘플 책 데이터 삽입
-- ============================================

-- 샘플 책 1: 데미안
-- 이미지 URL은 NULL로 두고, 애플리케이션에서 네이버 API를 통해 동적으로 가져옴
INSERT INTO books (id, isbn, title, author, publisher, published_date, cover_image_url, is_sample, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '9788937460498',
  '데미안',
  '헤르만 헤세',
  '민음사',
  '2010-01-01',
  NULL, -- 네이버 API를 통해 동적으로 가져옴
  TRUE,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;

-- 샘플 책 2: 노인과 바다
-- 이미지 URL은 NULL로 두고, 애플리케이션에서 네이버 API를 통해 동적으로 가져옴
INSERT INTO books (id, isbn, title, author, publisher, published_date, cover_image_url, is_sample, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '9788937460504',
  '노인과 바다',
  '어니스트 헤밍웨이',
  '민음사',
  '2005-03-15',
  NULL, -- 네이버 API를 통해 동적으로 가져옴
  TRUE,
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '25 days'
)
ON CONFLICT DO NOTHING;

-- 샘플 책 3: 1984
-- 이미지 URL은 NULL로 두고, 애플리케이션에서 네이버 API를 통해 동적으로 가져옴
INSERT INTO books (id, isbn, title, author, publisher, published_date, cover_image_url, is_sample, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '9788937460511',
  '1984',
  '조지 오웰',
  '민음사',
  '2004-05-20',
  NULL, -- 네이버 API를 통해 동적으로 가져옴
  TRUE,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
)
ON CONFLICT DO NOTHING;

-- 샘플 책 4: 해리포터와 마법사의 돌
-- 이미지 URL은 NULL로 두고, 애플리케이션에서 네이버 API를 통해 동적으로 가져옴
INSERT INTO books (id, isbn, title, author, publisher, published_date, cover_image_url, is_sample, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '9788983927635',
  '해리포터와 마법사의 돌',
  'J.K. 롤링',
  '문학수첩',
  '1999-12-01',
  NULL, -- 네이버 API를 통해 동적으로 가져옴
  TRUE,
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
)
ON CONFLICT DO NOTHING;

-- 샘플 책 5: 작은 아씨들
-- 이미지 URL은 NULL로 두고, 애플리케이션에서 네이버 API를 통해 동적으로 가져옴
INSERT INTO books (id, isbn, title, author, publisher, published_date, cover_image_url, is_sample, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '9788937460528',
  '작은 아씨들',
  '루이자 메이 올컷',
  '민음사',
  '2008-07-10',
  NULL, -- 네이버 API를 통해 동적으로 가져옴
  TRUE,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. 샘플 기록 데이터 삽입
-- ============================================
-- 주의: notes 테이블은 user_id와 book_id가 필요합니다.
-- 샘플 기록을 위해 시스템 사용자 ID를 사용하거나,
-- 실제 사용자 중 하나를 샘플 데이터 소유자로 지정해야 합니다.
-- 
-- 여기서는 샘플 기록의 user_id를 NULL로 두지 않고,
-- 실제로 존재하는 사용자 ID를 사용하거나,
-- 샘플 전용 시스템 계정을 생성해야 합니다.
--
-- 옵션 1: 샘플 전용 시스템 계정 생성 (권장)
-- 옵션 2: 관리자 계정의 데이터를 샘플로 표시
--
-- 아래 예시는 옵션 1을 가정합니다.
-- 실제 실행 시에는 샘플 전용 사용자 계정을 먼저 생성하고,
-- 그 사용자의 ID를 사용하세요.

-- 샘플 기록 삽입을 위한 임시 변수 (실제로는 애플리케이션에서 처리)
-- 여기서는 주석으로만 표시하고, 실제 실행 시에는
-- 관리자가 샘플 전용 사용자 계정을 생성한 후 그 ID를 사용해야 합니다.

/*
-- 샘플 전용 사용자 계정 생성 예시:
-- 1. Supabase Auth에서 샘플 전용 이메일 계정 생성 (예: sample@habitree.app)
-- 2. 해당 사용자의 UUID를 확인
-- 3. 아래 쿼리에서 'SAMPLE_USER_ID'를 실제 UUID로 교체

-- 샘플 기록 1: 데미안 인용구
INSERT INTO notes (id, user_id, book_id, type, content, page_number, is_sample, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sample@habitree.app' LIMIT 1),
  (SELECT id FROM books WHERE isbn = '9788937460498' AND is_sample = TRUE LIMIT 1),
  'quote',
  '새로운 길을 찾는 사람은 외로워야 하고, 고독한 시간을 보내야 한다.',
  45,
  TRUE,
  NOW() - INTERVAL '28 days',
  NOW() - INTERVAL '28 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'sample@habitree.app')
  AND EXISTS (SELECT 1 FROM books WHERE isbn = '9788937460498' AND is_sample = TRUE);

-- 샘플 기록 2: 노인과 바다 메모
INSERT INTO notes (id, user_id, book_id, type, content, page_number, is_sample, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sample@habitree.app' LIMIT 1),
  (SELECT id FROM books WHERE isbn = '9788937460504' AND is_sample = TRUE LIMIT 1),
  'memo',
  '인간의 의지와 끈기의 힘에 대해 생각하게 되는 작품. 노인의 고독한 투쟁이 인상적이다.',
  120,
  TRUE,
  NOW() - INTERVAL '23 days',
  NOW() - INTERVAL '23 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'sample@habitree.app')
  AND EXISTS (SELECT 1 FROM books WHERE isbn = '9788937460504' AND is_sample = TRUE);

-- 샘플 기록 3: 1984 인용구
INSERT INTO notes (id, user_id, book_id, type, content, page_number, is_sample, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sample@habitree.app' LIMIT 1),
  (SELECT id FROM books WHERE isbn = '9788937460511' AND is_sample = TRUE LIMIT 1),
  'quote',
  '자유는 자유를 말할 수 없다는 것을 말하는 자유다.',
  67,
  TRUE,
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'sample@habitree.app')
  AND EXISTS (SELECT 1 FROM books WHERE isbn = '9788937460511' AND is_sample = TRUE);

-- 샘플 기록 4: 해리포터 메모
INSERT INTO notes (id, user_id, book_id, type, content, page_number, is_sample, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sample@habitree.app' LIMIT 1),
  (SELECT id FROM books WHERE isbn = '9788983927635' AND is_sample = TRUE LIMIT 1),
  'memo',
  '마법의 세계로 들어가는 첫 걸음. 호그와트의 분위기가 생생하게 그려진다.',
  156,
  TRUE,
  NOW() - INTERVAL '13 days',
  NOW() - INTERVAL '13 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'sample@habitree.app')
  AND EXISTS (SELECT 1 FROM books WHERE isbn = '9788983927635' AND is_sample = TRUE);

-- 샘플 기록 5: 작은 아씨들 인용구
INSERT INTO notes (id, user_id, book_id, type, content, page_number, is_sample, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sample@habitree.app' LIMIT 1),
  (SELECT id FROM books WHERE isbn = '9788937460528' AND is_sample = TRUE LIMIT 1),
  'quote',
  '사랑은 세상에서 가장 아름다운 것이다.',
  89,
  TRUE,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'sample@habitree.app')
  AND EXISTS (SELECT 1 FROM books WHERE isbn = '9788937460528' AND is_sample = TRUE);
*/

-- ============================================
-- 3. 샘플 데이터 확인 쿼리
-- ============================================

-- 샘플 책 개수 확인
-- SELECT COUNT(*) FROM books WHERE is_sample = TRUE;

-- 샘플 기록 개수 확인
-- SELECT COUNT(*) FROM notes WHERE is_sample = TRUE;

-- 샘플 책 목록 확인
-- SELECT id, title, author, is_sample FROM books WHERE is_sample = TRUE ORDER BY created_at DESC;

-- 샘플 기록 목록 확인
-- SELECT id, type, content, is_sample FROM notes WHERE is_sample = TRUE ORDER BY created_at DESC;

-- ============================================
-- 샘플 데이터 초기화 완료
-- ============================================
-- 
-- 다음 단계:
-- 1. 샘플 전용 사용자 계정 생성 (sample@habitree.app 또는 관리자 지정)
-- 2. 위의 주석 처리된 샘플 기록 삽입 쿼리를 실행
-- 3. 샘플 데이터 확인 쿼리로 데이터 확인
-- 4. 애플리케이션에서 게스트 사용자에게 샘플 데이터가 표시되는지 확인
-- ============================================

