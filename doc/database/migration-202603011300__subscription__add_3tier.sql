-- ============================================================
-- 3단계 구독 티어 마이그레이션
-- free(무료) / reader(독서가, ₩3,900) / reader_master(독서마스터, ₩6,900)
-- ============================================================
-- Idempotent: 재실행 시 안전하게 동작

BEGIN;

-- 1. 무료 티어 features JSONB 업데이트 (새 필드 추가)
UPDATE subscription_tiers
SET
  features = jsonb_build_object(
    'ai_chat_daily', 3,
    'ocr_daily', 3,
    'ai_report_monthly', 0,
    'groups_create', 2,
    'notes_monthly', 30,
    'bookshelf_max', 3,
    'groups_join', 1,
    'advanced_stats', false,
    'data_export', false
  ),
  price_monthly = 0,
  display_name = '무료'
WHERE name = 'free';

-- 2. reader 티어 INSERT (중복 시 무시)
INSERT INTO subscription_tiers (name, display_name, price_monthly, features)
VALUES (
  'reader',
  '독서가',
  3900,
  jsonb_build_object(
    'ai_chat_daily', 15,
    'ocr_daily', 15,
    'ai_report_monthly', 3,
    'groups_create', -1,
    'notes_monthly', -1,
    'bookshelf_max', -1,
    'groups_join', 3,
    'advanced_stats', true,
    'data_export', 'csv'
  )
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;

-- 3. premium → reader_master 변환
-- 기존 premium 티어가 있으면 name/display_name/price 변경
-- FK 관계는 UUID 기반이므로 기존 구독자 자동 마이그레이션됨
UPDATE subscription_tiers
SET
  name = 'reader_master',
  display_name = '독서마스터',
  price_monthly = 6900,
  features = jsonb_build_object(
    'ai_chat_daily', -1,
    'ocr_daily', -1,
    'ai_report_monthly', -1,
    'groups_create', -1,
    'notes_monthly', -1,
    'bookshelf_max', -1,
    'groups_join', -1,
    'advanced_stats', true,
    'data_export', 'csv_pdf'
  )
WHERE name = 'premium';

-- 만약 premium이 없고 reader_master도 없으면 새로 생성
INSERT INTO subscription_tiers (name, display_name, price_monthly, features)
SELECT
  'reader_master',
  '독서마스터',
  6900,
  jsonb_build_object(
    'ai_chat_daily', -1,
    'ocr_daily', -1,
    'ai_report_monthly', -1,
    'groups_create', -1,
    'notes_monthly', -1,
    'bookshelf_max', -1,
    'groups_join', -1,
    'advanced_stats', true,
    'data_export', 'csv_pdf'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_tiers WHERE name = 'reader_master'
);

COMMIT;
