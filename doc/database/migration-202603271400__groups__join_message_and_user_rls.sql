-- =====================================================
-- Migration: 가입 신청 메시지 + 사용자 프로필 RLS 확장
-- Date: 2026-03-27
-- =====================================================

-- 1. group_members에 join_message 컬럼 추가
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS join_message text;

-- 2. users RLS: 같은 모임 멤버 + 리더가 pending 멤버 프로필 조회 가능
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile or group member profiles" ON users;
DROP POLICY IF EXISTS "Users can view own or group member profiles" ON users;

CREATE POLICY "Users can view own or group member profiles"
    ON users FOR SELECT
    USING (
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1 FROM group_members gm1
            WHERE gm1.user_id = users.id
            AND gm1.status = 'approved'
            AND EXISTS (
                SELECT 1 FROM group_members gm2
                WHERE gm2.group_id = gm1.group_id
                AND gm2.user_id = auth.uid()
                AND gm2.status = 'approved'
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM group_members gm_pending
            WHERE gm_pending.user_id = users.id
            AND gm_pending.status = 'pending'
            AND EXISTS (
                SELECT 1 FROM groups g
                WHERE g.id = gm_pending.group_id
                AND (
                    g.leader_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM group_members gm_mod
                        WHERE gm_mod.group_id = g.id
                        AND gm_mod.user_id = auth.uid()
                        AND gm_mod.role = 'moderator'
                        AND gm_mod.status = 'approved'
                    )
                )
            )
        )
    );
