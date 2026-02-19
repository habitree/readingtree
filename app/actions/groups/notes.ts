"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateGroupActivityStats } from "./_shared";

/**
 * 모임 내 기록 공유
 */
export async function shareNoteToGroup(noteId: string, groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 기록 소유자 확인
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("user_id")
    .eq("id", noteId)
    .single();

  if (noteError || !note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  if (note.user_id !== user.id) {
    throw new Error("본인의 기록만 공유할 수 있습니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 기록을 공유할 수 있습니다.");
  }

  // 기록 공유 (upsert로 race condition 방지)
  // UNIQUE 제약조건이 있으므로 onConflict 사용
  const { data: shareResult, error: shareError } = await supabase
    .from("group_notes")
    .upsert(
      { group_id: groupId, note_id: noteId },
      { onConflict: "group_id,note_id", ignoreDuplicates: true }
    )
    .select("id")
    .single();

  // 이미 존재하는 경우 (upsert가 아무것도 반환하지 않음)
  if (!shareResult && !shareError) {
    throw new Error("이미 공유된 기록입니다.");
  }

  if (shareError) {
    // 23505: unique_violation - 이미 공유된 경우
    if (shareError.code === "23505") {
      throw new Error("이미 공유된 기록입니다.");
    }
    throw new Error(`공유 실패: ${shareError.message}`);
  }

  // 활동 통계 업데이트
  await updateGroupActivityStats(supabase, groupId, user.id, 1);

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 책별 공유 기록 조회
 * 특정 책에 대해 모임에 공유된 기록들을 조회
 */
export async function getGroupBookNotes(
  groupId: string,
  bookId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: "quote" | "photo" | "memo" | "transcription";
  }
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id, role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id, is_public")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;
  const isPublic = group.is_public;

  // 접근 권한 확인
  if (!isLeader && !isMember && !isPublic) {
    throw new Error("모임 멤버만 공유 기록을 조회할 수 있습니다.");
  }

  // 공유 기록 조회
  let query = supabase
    .from("group_notes")
    .select(
      `
      *,
      notes!inner (
        id,
        user_id,
        book_id,
        title,
        type,
        content,
        image_url,
        page_number,
        tags,
        created_at,
        users (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq("group_id", groupId)
    .eq("notes.book_id", bookId)
    .order("shared_at", { ascending: false });

  if (options?.type) {
    query = query.eq("notes.type", options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data: sharedNotes, error } = await query;

  if (error) {
    throw new Error(`공유 기록 조회 실패: ${error.message}`);
  }

  return sharedNotes || [];
}

/**
 * 책별 기록 수 조회
 * 모임의 각 지정도서별 공유된 기록 수를 조회
 */
export async function getGroupBookNoteCounts(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id, is_public")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;
  const isPublic = group.is_public;

  if (!isLeader && !isMember && !isPublic) {
    throw new Error("모임 멤버만 조회할 수 있습니다.");
  }

  // 지정도서 목록 조회
  const { data: groupBooks } = await supabase
    .from("group_books")
    .select("book_id")
    .eq("group_id", groupId);

  if (!groupBooks || groupBooks.length === 0) {
    return {};
  }

  const bookIds = groupBooks.map((gb) => gb.book_id);

  // 공유된 기록 조회
  const { data: sharedNotes } = await supabase
    .from("group_notes")
    .select(
      `
      note_id,
      notes!inner (
        book_id
      )
    `
    )
    .eq("group_id", groupId);

  // 책별로 기록 수 집계
  const counts: Record<string, number> = {};
  bookIds.forEach((bookId) => {
    counts[bookId] = 0;
  });

  (sharedNotes || []).forEach((sn: any) => {
    const bookId = sn.notes?.book_id;
    if (bookId && bookIds.includes(bookId)) {
      counts[bookId] = (counts[bookId] || 0) + 1;
    }
  });

  return counts;
}

/**
 * 공유 가능한 내 기록 조회
 * 특정 책에 대해 아직 그룹에 공유하지 않은 내 기록 조회
 */
export async function getShareableNotes(groupId: string, bookId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 기록을 공유할 수 있습니다.");
  }

  // 이미 공유된 기록 ID 조회
  const { data: sharedNotes } = await supabase
    .from("group_notes")
    .select("note_id")
    .eq("group_id", groupId);

  const sharedNoteIds = (sharedNotes || []).map((sn) => sn.note_id);

  // 내 기록 중 아직 공유하지 않은 것들 조회
  let query = supabase
    .from("notes")
    .select(
      `
      id,
      title,
      type,
      content,
      image_url,
      page_number,
      tags,
      created_at
    `
    )
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (sharedNoteIds.length > 0) {
    query = query.not("id", "in", `(${sharedNoteIds.join(",")})`);
  }

  const { data: notes, error } = await query;

  if (error) {
    throw new Error(`기록 조회 실패: ${error.message}`);
  }

  return notes || [];
}

/**
 * 기록 일괄 공유
 * 여러 기록을 한 번에 그룹에 공유
 */
export async function shareNotesToGroup(noteIds: string[], groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 기록을 공유할 수 있습니다.");
  }

  // 기록 소유자 확인
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("id, user_id")
    .in("id", noteIds);

  if (notesError) {
    throw new Error(`기록 조회 실패: ${notesError.message}`);
  }

  // 모든 기록이 본인 소유인지 확인
  const invalidNotes = (notes || []).filter((n) => n.user_id !== user.id);
  if (invalidNotes.length > 0) {
    throw new Error("본인의 기록만 공유할 수 있습니다.");
  }

  // 기록 공유 (upsert로 race condition 방지, 중복 무시)
  const insertData = noteIds.map((noteId) => ({
    group_id: groupId,
    note_id: noteId,
  }));

  const { data: shareResults, error: shareError } = await supabase
    .from("group_notes")
    .upsert(insertData, { onConflict: "group_id,note_id", ignoreDuplicates: true })
    .select("id, note_id");

  if (shareError) {
    throw new Error(`공유 실패: ${shareError.message}`);
  }

  // 실제로 새로 공유된 기록 수 (이미 있던 건 제외됨)
  const sharedCount = shareResults?.length || 0;

  // 활동 통계 업데이트 (새로 공유된 기록 수만큼 증가)
  if (sharedCount > 0) {
    await updateGroupActivityStats(supabase, groupId, user.id, sharedCount);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true, sharedCount };
}

/**
 * 기록 공유 해제
 */
export async function unshareNoteFromGroup(noteId: string, groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 기록 소유자 확인
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("user_id")
    .eq("id", noteId)
    .single();

  if (noteError || !note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  if (note.user_id !== user.id) {
    throw new Error("본인의 기록만 공유 해제할 수 있습니다.");
  }

  // 공유 해제
  const { error: unshareError } = await supabase
    .from("group_notes")
    .delete()
    .eq("group_id", groupId)
    .eq("note_id", noteId);

  if (unshareError) {
    throw new Error(`공유 해제 실패: ${unshareError.message}`);
  }

  // 활동 통계 업데이트 (기록 수 감소)
  await updateGroupActivityStats(supabase, groupId, user.id, -1);

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
