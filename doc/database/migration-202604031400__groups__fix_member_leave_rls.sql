-- ============================================
-- 마이그레이션: group_members DELETE RLS 정책 수정
-- 날짜: 2026-04-03
-- 설명: 멤버 자체 탈퇴(leaveGroup) 허용
-- ============================================
--
-- 문제: 기존 정책은 리더만 group_members DELETE 가능
--       → 일반 멤버가 leaveGroup() 호출 시 RLS 차단
--
-- 수정: auth.uid() = user_id 조건 추가 (본인 탈퇴 허용)
--       리더 자체 탈퇴는 애플리케이션 레벨에서 차단 (members.ts)
-- ============================================

DROP POLICY IF EXISTS "Leaders can remove members" ON group_members;
DROP POLICY IF EXISTS "Leaders or self can remove members" ON group_members;

CREATE POLICY "Leaders or self can remove members"
    ON group_members FOR DELETE
    USING (
        auth.uid() = user_id
        OR
        auth.uid() IN (
            SELECT leader_id FROM groups WHERE id = group_members.group_id
        )
    );
