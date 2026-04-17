"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification } from "@/app/actions/notifications";

/**
 * 댓글 추가
 */
export async function addComment(
  groupNoteId: string,
  content: string,
  parentId?: string
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  if (!content.trim() || content.length > 1000) {
    throw new Error("댓글은 1~1000자 사이여야 합니다.");
  }

  // group_note 존재 및 멤버십 확인
  const { data: groupNote } = await supabase
    .from("group_notes")
    .select("group_id, shared_by, note_id")
    .eq("id", groupNoteId)
    .single();

  if (!groupNote) {
    throw new Error("공유 기록을 찾을 수 없습니다.");
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupNote.group_id)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupNote.group_id)
    .single();

  if (!membership && group?.leader_id !== user.id) {
    throw new Error("모임 멤버만 댓글을 작성할 수 있습니다.");
  }

  // 대댓글인 경우 parent 존재 확인
  if (parentId) {
    const { data: parent } = await supabase
      .from("group_note_comments")
      .select("id, parent_id")
      .eq("id", parentId)
      .single();

    if (!parent) {
      throw new Error("원 댓글을 찾을 수 없습니다.");
    }
    // 2depth 방지: parent가 이미 대댓글이면 거부
    if (parent.parent_id) {
      throw new Error("대댓글에는 답글을 달 수 없습니다.");
    }
  }

  const { data: comment, error: insertError } = await supabase
    .from("group_note_comments")
    .insert({
      group_note_id: groupNoteId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    })
    .select(`
      id,
      content,
      parent_id,
      created_at,
      updated_at,
      users (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (insertError) {
    throw new Error(`댓글 작성 실패: ${insertError.message}`);
  }

  // 공유 기록 작성자에게 알림 (본인 댓글은 제외)
  if (groupNote.shared_by && groupNote.shared_by !== user.id) {
    const commenterName =
      (comment.users as { name?: string } | null)?.name ?? "누군가";
    const preview = content.trim().slice(0, 60);
    await createNotification(groupNote.shared_by, "note_comment", {
      title: `${commenterName}님이 내 기록에 댓글을 남겼어요`,
      body: preview,
      actionUrl: `/groups/${groupNote.group_id}`,
      referenceId: groupNoteId,
      referenceType: "group_note",
      metadata: { commenter_id: user.id, parent_id: parentId ?? null },
    }).catch(() => null);
  }

  revalidatePath(`/groups/${groupNote.group_id}`);
  return comment;
}

/**
 * 댓글 목록 조회
 */
export async function getComments(groupNoteId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: comments, error } = await supabase
    .from("group_note_comments")
    .select(`
      id,
      content,
      parent_id,
      user_id,
      created_at,
      updated_at,
      users (
        id,
        name,
        avatar_url
      )
    `)
    .eq("group_note_id", groupNoteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`댓글 조회 실패: ${error.message}`);
  }

  // 트리 구조로 변환 (1depth만)
  type CommentRow = NonNullable<typeof comments>[number];
  const rootComments: CommentRow[] = [];
  const repliesMap = new Map<string, CommentRow[]>();

  for (const comment of comments || []) {
    if (comment.parent_id) {
      const replies = repliesMap.get(comment.parent_id) || [];
      replies.push(comment);
      repliesMap.set(comment.parent_id, replies);
    } else {
      rootComments.push(comment);
    }
  }

  return rootComments.map((c) => ({
    ...c,
    replies: repliesMap.get(c.id) || [],
  }));
}

/**
 * 댓글 수정 (본인만 가능)
 */
export async function updateComment(commentId: string, content: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  if (!content.trim() || content.length > 1000) {
    throw new Error("댓글은 1~1000자 사이여야 합니다.");
  }

  // 댓글 소유자 및 그룹 정보 확인
  const { data: comment } = await supabase
    .from("group_note_comments")
    .select("user_id, group_note_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  if (comment.user_id !== user.id) {
    throw new Error("본인 댓글만 수정할 수 있습니다.");
  }

  const { error: updateError } = await supabase
    .from("group_note_comments")
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`댓글 수정 실패: ${updateError.message}`);
  }

  // revalidate를 위해 group_id 조회
  const { data: groupNote } = await supabase
    .from("group_notes")
    .select("group_id")
    .eq("id", comment.group_note_id)
    .single();

  if (groupNote) {
    revalidatePath(`/groups/${groupNote.group_id}`);
  }

  return { success: true };
}

/**
 * 댓글 삭제 (본인 또는 모임 리더만 가능)
 */
export async function deleteComment(commentId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 댓글 소유자 및 그룹 정보 확인
  const { data: comment } = await supabase
    .from("group_note_comments")
    .select("user_id, group_note_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    throw new Error("댓글을 찾을 수 없습니다.");
  }

  // 본인이 아닌 경우 리더 확인
  if (comment.user_id !== user.id) {
    const { data: groupNote } = await supabase
      .from("group_notes")
      .select("group_id")
      .eq("id", comment.group_note_id)
      .single();

    if (!groupNote) {
      throw new Error("공유 기록을 찾을 수 없습니다.");
    }

    const { data: group } = await supabase
      .from("groups")
      .select("leader_id")
      .eq("id", groupNote.group_id)
      .single();

    if (group?.leader_id !== user.id) {
      throw new Error("본인 댓글 또는 리더만 삭제할 수 있습니다.");
    }
  }

  const { error: deleteError } = await supabase
    .from("group_note_comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    throw new Error(`댓글 삭제 실패: ${deleteError.message}`);
  }

  // revalidate를 위해 group_id 조회
  const { data: groupNote } = await supabase
    .from("group_notes")
    .select("group_id")
    .eq("id", comment.group_note_id)
    .single();

  if (groupNote) {
    revalidatePath(`/groups/${groupNote.group_id}`);
  }

  return { success: true };
}

/**
 * 여러 공유 기록의 댓글 수 일괄 조회
 */
export async function getCommentCounts(groupNoteIds: string[]) {
  if (groupNoteIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: comments, error } = await supabase
    .from("group_note_comments")
    .select("group_note_id")
    .in("group_note_id", groupNoteIds);

  if (error) {
    throw new Error(`댓글 수 조회 실패: ${error.message}`);
  }

  const counts: Record<string, number> = {};
  for (const id of groupNoteIds) {
    counts[id] = 0;
  }
  for (const comment of comments || []) {
    counts[comment.group_note_id] = (counts[comment.group_note_id] || 0) + 1;
  }

  return counts;
}
