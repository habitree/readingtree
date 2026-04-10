-- Fix: group_notes SELECT RLS policy was missing approved members
-- Only leaders and public groups could view shared notes.
-- Regular approved members of private groups were blocked from:
--   1. Viewing shared notes (getGroupBookNotes)
--   2. Checking already-shared notes (getShareableNotes)
--   3. Getting share results after upsert (shareNotesToGroup)

DROP POLICY IF EXISTS "Members can view shared notes" ON group_notes;

CREATE POLICY "Members can view shared notes" ON group_notes
FOR SELECT USING (
  -- 그룹 리더
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_notes.group_id
    AND groups.leader_id = auth.uid()
  )
  OR
  -- 승인된 멤버
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_notes.group_id
    AND group_members.user_id = auth.uid()
    AND group_members.status = 'approved'
  )
  OR
  -- 공개 그룹
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_notes.group_id
    AND groups.is_public = true
  )
);
