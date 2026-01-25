-- =============================================
-- 마이그레이션: user_book_relations 테이블 생성
-- 버전: 202601251200
-- 설명: 사용자의 책들 간 관련 도서 관계를 관리하는 테이블
-- =============================================

-- 테이블 생성 (존재하지 않는 경우에만)
CREATE TABLE IF NOT EXISTS user_book_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    target_user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 자기 자신과의 연결 방지
    CONSTRAINT different_books CHECK (source_user_book_id != target_user_book_id),
    -- 동일한 연결 중복 방지
    UNIQUE(user_id, source_user_book_id, target_user_book_id)
);

-- 인덱스 생성 (존재하지 않는 경우에만)
CREATE INDEX IF NOT EXISTS idx_user_book_relations_user_id ON user_book_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_relations_source ON user_book_relations(source_user_book_id);
CREATE INDEX IF NOT EXISTS idx_user_book_relations_target ON user_book_relations(target_user_book_id);

-- RLS 활성화
ALTER TABLE user_book_relations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (idempotent)
DROP POLICY IF EXISTS "user_book_relations_select_own" ON user_book_relations;
DROP POLICY IF EXISTS "user_book_relations_insert_own" ON user_book_relations;
DROP POLICY IF EXISTS "user_book_relations_update_own" ON user_book_relations;
DROP POLICY IF EXISTS "user_book_relations_delete_own" ON user_book_relations;

-- SELECT 정책: 자신의 관계만 조회 가능
CREATE POLICY "user_book_relations_select_own" ON user_book_relations
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT 정책: 자신의 관계만 생성 가능
CREATE POLICY "user_book_relations_insert_own" ON user_book_relations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE 정책: 자신의 관계만 수정 가능
CREATE POLICY "user_book_relations_update_own" ON user_book_relations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- DELETE 정책: 자신의 관계만 삭제 가능
CREATE POLICY "user_book_relations_delete_own" ON user_book_relations
    FOR DELETE
    USING (auth.uid() = user_id);

-- 코멘트 추가
COMMENT ON TABLE user_book_relations IS '사용자의 책들 간 관련 도서 관계 테이블';
COMMENT ON COLUMN user_book_relations.id IS '기본 키';
COMMENT ON COLUMN user_book_relations.user_id IS '사용자 ID (auth.users 참조)';
COMMENT ON COLUMN user_book_relations.source_user_book_id IS '출발 책 ID (user_books 참조)';
COMMENT ON COLUMN user_book_relations.target_user_book_id IS '도착 책 ID (user_books 참조)';
COMMENT ON COLUMN user_book_relations.created_at IS '생성 시간';
