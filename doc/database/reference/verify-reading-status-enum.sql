-- ============================================
-- reading_status ENUM 값 확인 쿼리
-- ============================================
-- 이 쿼리를 실행하여 현재 데이터베이스에 
-- reading_status ENUM에 어떤 값들이 있는지 확인할 수 있습니다.
-- ============================================

-- reading_status ENUM의 모든 값 조회
SELECT 
    enumlabel AS status_value,
    enumsortorder AS sort_order
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'reading_status'
ORDER BY enumsortorder;

-- 예상 결과:
-- status_value | sort_order
-- -------------|-----------
-- reading      | 1
-- completed    | 2
-- paused       | 3
-- not_started  | 4  (없으면 마이그레이션 필요)
-- rereading    | 5  (없으면 마이그레이션 필요)

-- ============================================
-- 마이그레이션이 필요한 경우:
-- doc/database/migration-202512311523__reading_status__add_not_started_rereading.sql
-- 파일을 Supabase SQL Editor에서 실행하세요.
-- ============================================

