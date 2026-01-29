-- ============================================
-- 마이그레이션: feature_requests - 기능 요청 게시판 테이블 생성
-- 날짜: 2026-01-29 15:00
-- ============================================
--
-- 변경 사항:
-- 1. feature_requests 테이블 생성 (기능 요청)
-- 2. feature_request_votes 테이블 생성 (투표)
-- 3. feature_request_comments 테이블 생성 (댓글)
-- 4. RLS 정책 설정
-- 5. 트리거 및 함수 생성
--
-- 영향받는 테이블:
-- - feature_requests
-- - feature_request_votes
-- - feature_request_comments
-- ============================================

-- ============================================
-- 1. ENUM 타입 생성
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feature_request_status') THEN
        CREATE TYPE feature_request_status AS ENUM (
            'requested',      -- 요청됨
            'under_review',   -- 검토중
            'planned',        -- 계획됨
            'in_progress',    -- 개발중
            'completed',      -- 완료
            'declined'        -- 거절됨
        );
    END IF;
END
$$;

-- ============================================
-- 2. feature_requests 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status feature_request_status DEFAULT 'requested',
    vote_count INTEGER DEFAULT 0,
    admin_response TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_vote_count ON feature_requests(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_is_pinned ON feature_requests(is_pinned) WHERE is_pinned = TRUE;

-- RLS 활성화
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능 (공개)
DROP POLICY IF EXISTS "select_all" ON feature_requests;
CREATE POLICY "select_all" ON feature_requests FOR SELECT
    USING (TRUE);

-- RLS 정책: 로그인한 사용자만 생성 가능
DROP POLICY IF EXISTS "insert_authenticated" ON feature_requests;
CREATE POLICY "insert_authenticated" ON feature_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인만 수정 가능 (또는 관리자)
DROP POLICY IF EXISTS "update_own_or_admin" ON feature_requests;
CREATE POLICY "update_own_or_admin" ON feature_requests FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- RLS 정책: 본인만 삭제 가능 (또는 관리자)
DROP POLICY IF EXISTS "delete_own_or_admin" ON feature_requests;
CREATE POLICY "delete_own_or_admin" ON feature_requests FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- 3. feature_request_votes 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS feature_request_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feature_request_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_feature_request_id ON feature_request_votes(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_user_id ON feature_request_votes(user_id);

-- RLS 활성화
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "select_all" ON feature_request_votes;
CREATE POLICY "select_all" ON feature_request_votes FOR SELECT
    USING (TRUE);

-- RLS 정책: 로그인한 사용자만 생성 가능
DROP POLICY IF EXISTS "insert_authenticated" ON feature_request_votes;
CREATE POLICY "insert_authenticated" ON feature_request_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인 투표만 삭제 가능
DROP POLICY IF EXISTS "delete_own" ON feature_request_votes;
CREATE POLICY "delete_own" ON feature_request_votes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 4. feature_request_comments 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS feature_request_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_admin_comment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_feature_request_id ON feature_request_comments(feature_request_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_user_id ON feature_request_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_comments_created_at ON feature_request_comments(created_at);

-- RLS 활성화
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "select_all" ON feature_request_comments;
CREATE POLICY "select_all" ON feature_request_comments FOR SELECT
    USING (TRUE);

-- RLS 정책: 로그인한 사용자만 생성 가능
DROP POLICY IF EXISTS "insert_authenticated" ON feature_request_comments;
CREATE POLICY "insert_authenticated" ON feature_request_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인만 수정 가능
DROP POLICY IF EXISTS "update_own" ON feature_request_comments;
CREATE POLICY "update_own" ON feature_request_comments FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS 정책: 본인 또는 관리자만 삭제 가능
DROP POLICY IF EXISTS "delete_own_or_admin" ON feature_request_comments;
CREATE POLICY "delete_own_or_admin" ON feature_request_comments FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ============================================
-- 5. 투표 수 업데이트 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_feature_request_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE feature_requests
        SET vote_count = vote_count + 1
        WHERE id = NEW.feature_request_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE feature_requests
        SET vote_count = vote_count - 1
        WHERE id = OLD.feature_request_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_vote_count ON feature_request_votes;
CREATE TRIGGER trigger_update_vote_count
    AFTER INSERT OR DELETE ON feature_request_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_request_vote_count();

-- ============================================
-- 6. updated_at 자동 업데이트 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_feature_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feature_requests_updated_at ON feature_requests;
CREATE TRIGGER trigger_feature_requests_updated_at
    BEFORE UPDATE ON feature_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_request_updated_at();

DROP TRIGGER IF EXISTS trigger_feature_request_comments_updated_at ON feature_request_comments;
CREATE TRIGGER trigger_feature_request_comments_updated_at
    BEFORE UPDATE ON feature_request_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_request_updated_at();

-- ============================================
-- 7. 댓글 수 조회 함수 (옵션)
-- ============================================
CREATE OR REPLACE FUNCTION get_feature_request_comment_count(p_feature_request_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM feature_request_comments
        WHERE feature_request_id = p_feature_request_id
    );
END;
$$ LANGUAGE plpgsql STABLE;
