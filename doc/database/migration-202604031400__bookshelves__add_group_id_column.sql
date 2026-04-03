-- ============================================
-- bookshelves 테이블에 group_id 컬럼 추가
-- 모임서재 ↔ 내서재 자동 동기화 지원
-- ============================================

-- group_id 컬럼 추가 (nullable, 모임 삭제 시 NULL로 전환)
ALTER TABLE bookshelves ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookshelves_group_id ON bookshelves(group_id);

-- 같은 사용자가 같은 모임에 서재를 중복 생성 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookshelves_user_group
ON bookshelves(user_id, group_id) WHERE group_id IS NOT NULL;
