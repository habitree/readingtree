"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizeSearchQuery } from "@/lib/utils/validation";

export type MemberRole = "leader" | "moderator" | "member";
export type MemberStatus = "pending" | "approved" | "rejected";

/**
 * 모임 생성
 * 생성자는 자동으로 리더가 됨
 */
export async function createGroup(data: {
  name: string;
  description?: string;
  isPublic: boolean;
}) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 생성 (RLS 재귀 방지를 위해 select 제거)
  const { data: insertResult, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: data.name,
      description: data.description || null,
      leader_id: user.id,
      is_public: data.isPublic,
    })
    .select("id")
    .single();

  if (groupError || !insertResult) {
    throw new Error(`모임 생성 실패: ${groupError?.message || "알 수 없는 오류"}`);
  }

  const groupId = insertResult.id;

  // 생성자를 리더로 자동 추가
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "leader",
    status: "approved",
  });

  if (memberError) {
    // 모임은 생성되었지만 멤버 추가 실패 시 모임 삭제
    await supabase.from("groups").delete().eq("id", groupId);
    throw new Error(`멤버 추가 실패: ${memberError.message}`);
  }

  revalidatePath("/groups");
  return { success: true, groupId };
}

/**
 * 모임 참여 신청
 * 공개 모임은 자동 승인, 비공개 모임은 리더 승인 필요
 */
export async function joinGroup(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("is_public")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 이미 멤버인지 확인
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    if (existingMember.status === "approved") {
      throw new Error("이미 모임 멤버입니다.");
    }
    if (existingMember.status === "pending") {
      throw new Error("이미 참여 신청이 대기 중입니다.");
    }
  }

  // 공개 모임은 자동 승인, 비공개 모임은 대기
  const status: MemberStatus = group.is_public ? "approved" : "pending";

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
    status,
  });

  if (memberError) {
    throw new Error(`참여 신청 실패: ${memberError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { success: true, autoApproved: group.is_public };
}

/**
 * 모임 참여 승인
 * 리더만 승인 가능
 */
export async function approveMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 멤버를 승인할 수 있습니다.");
  }

  // 멤버 승인
  const { error: updateError } = await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`승인 실패: ${updateError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 참여 거부
 * 리더만 거부 가능
 */
export async function rejectMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 멤버를 거부할 수 있습니다.");
  }

  // 멤버 거부 (삭제)
  const { error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(`거부 실패: ${deleteError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 목록 조회
 * @param isPublic 공개 모임만 조회 (선택)
 */
export async function getGroups(isPublic?: boolean) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 먼저 사용자가 멤버인 그룹 ID 목록 조회 (RLS 재귀 방지)
  const { data: memberships, error: membersError } = await supabase
    .from("group_members")
    .select("group_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버십 조회 실패: ${membersError.message}`);
  }

  // 멤버인 그룹 ID 목록 추출
  const groupIds = (memberships || []).map((m) => m.group_id);

  // 그룹이 없으면 빈 배열 반환
  if (groupIds.length === 0) {
    return [];
  }

  // 그룹 정보 조회 (RLS 재귀 방지를 위해 group_members 조인 제거)
  // group_members는 별도로 조회하여 병합
  let query = supabase
    .from("groups")
    .select("*")
    .in("id", groupIds);

  if (isPublic !== undefined) {
    query = query.eq("is_public", isPublic);
  }

  const { data: groupsData, error } = await query;

  if (error) {
    throw new Error(`모임 목록 조회 실패: ${error.message}`);
  }

  // group_members 정보 별도 조회 (RLS 재귀 방지)
  const groupIdsArray = (groupsData || []).map((g) => g.id);
  let groupMembersData: any[] = [];
  
  if (groupIdsArray.length > 0) {
    const { data: membersData } = await supabase
      .from("group_members")
      .select("group_id, user_id, role, status")
      .in("group_id", groupIdsArray);
    
    groupMembersData = membersData || [];
  }

  // 조회된 그룹에 사용자의 멤버십 정보 추가
  const groupsWithMembership = (groupsData || []).map((group) => {
    const membership = memberships?.find((m) => m.group_id === group.id);
    const allMembers = groupMembersData.filter((m) => m.group_id === group.id);
    
    return {
      ...group,
      group_members: allMembers.filter((m) => m.user_id === user.id),
    };
  });

  return groupsWithMembership;
}

/**
 * 공개 모임 목록 조회 (검색용)
 */
export async function getPublicGroups(searchQuery?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("groups")
    .select(
      `
      *,
      users!groups_leader_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    // 검색어 이스케이프 처리 (SQL Injection 방지)
    const sanitizedQuery = sanitizeSearchQuery(searchQuery);
    if (sanitizedQuery) {
      query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`공개 모임 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 모임 상세 조회
 */
export async function getGroupDetail(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 먼저 사용자가 멤버인지 확인 (RLS 재귀 방지)
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  // 모임 정보 조회
  // RLS 정책: 공개 그룹(is_public = TRUE) 또는 리더(leader_id = auth.uid())만 조회 가능
  // 멤버인 경우: 공개 그룹이 아니고 리더도 아니면 조회 불가
  // → 멤버인 경우 그룹 조회를 위해 별도 처리 필요
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select(
      `
      *,
      users!groups_leader_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("id", groupId)
    .single();

  // RLS 정책으로 인해 조회 실패 처리
  if (groupError || !group) {
    // 멤버인 경우에도 RLS 정책으로 인해 조회 실패할 수 있음
    // (공개 그룹이 아니고 리더도 아닌 경우)
    if (membership) {
      // 멤버인데 조회 실패: RLS 정책 문제
      // 이 경우 멤버인 그룹 ID 목록을 통해 간접 조회 시도
      // 하지만 이미 membership이 있으므로 그룹이 존재함을 알 수 있음
      // 따라서 에러 메시지만 개선
      console.error("멤버인데 그룹 조회 실패:", {
        groupId,
        userId: user.id,
        membership,
        error: groupError,
      });
      throw new Error("모임을 찾을 수 없습니다. 모임이 비공개이거나 접근 권한이 없습니다.");
    }
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 조회 성공한 경우, 접근 권한 확인
  // 멤버가 아닌 경우, 공개 그룹이거나 리더인 경우만 접근 가능
  if (!membership && !group.is_public && group.leader_id !== user.id) {
    throw new Error("모임을 찾을 수 없습니다. 모임이 비공개이거나 접근 권한이 없습니다.");
  }

  // 멤버 목록 조회
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      *,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버 목록 조회 실패: ${membersError.message}`);
  }

  // 현재 사용자의 멤버십 확인
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  // 공유된 기록 목록 조회
  const { data: sharedNotes, error: notesError } = await supabase
    .from("group_notes")
    .select(
      `
      *,
      notes (
        *,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      )
    `
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false })
    .limit(20);

  if (notesError) {
    console.error("공유 기록 조회 오류:", notesError);
  }

  // 지정도서 목록 조회 (간단한 버전)
  const { data: groupBooks } = await supabase
    .from("group_books")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(10);

  // 공유된 서재 목록 조회 (간단한 버전)
  const { data: sharedBooks } = await supabase
    .from("group_shared_books")
    .select(
      `
      *,
      user_books (
        id,
        status,
        books (
          id,
          title,
          author,
          cover_image_url
        ),
        users (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false })
    .limit(10);

  return {
    group,
    members: members || [],
    myMembership: myMembership || null,
    sharedNotes: sharedNotes || [],
    groupBooks: groupBooks || [],
    sharedBooks: sharedBooks || [],
    isLeader: group.leader_id === user.id,
  };
}

/**
 * 구성원 진행 상황 조회
 */
export async function getMemberProgress(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 진행 상황을 조회할 수 있습니다.");
  }

  // 승인된 멤버 목록 조회
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버 목록 조회 실패: ${membersError.message}`);
  }

  // 각 멤버의 진행 상황 조회
  const progress = await Promise.all(
    (members || []).map(async (member) => {
      const userId = member.user_id;

      // 완독한 책 수
      const { count: completedBooks } = await supabase
        .from("user_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");

      // 작성한 기록 수
      const { count: notesCount } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // 최근 활동 일자
      const { data: recentNote } = await supabase
        .from("notes")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        user: member.users || null, // users가 null일 수 있음
        completedBooks: completedBooks || 0,
        notesCount: notesCount || 0,
        lastActivity: recentNote?.created_at || null,
      };
    })
  );

  return progress;
}

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

  // 이미 공유된 기록인지 확인
  const { data: existing } = await supabase
    .from("group_notes")
    .select("id")
    .eq("group_id", groupId)
    .eq("note_id", noteId)
    .single();

  if (existing) {
    throw new Error("이미 공유된 기록입니다.");
  }

  // 기록 공유
  const { error: shareError } = await supabase.from("group_notes").insert({
    group_id: groupId,
    note_id: noteId,
  });

  if (shareError) {
    throw new Error(`공유 실패: ${shareError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임에 지정도서 추가 (리더만 가능)
 */
export async function addGroupBook(
  groupId: string,
  bookId: string,
  targetCompletedAt?: string
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

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 지정도서를 추가할 수 있습니다.");
  }

  // 책 존재 확인
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    throw new Error("책을 찾을 수 없습니다.");
  }

  // 이미 추가된 지정도서인지 확인
  const { data: existing, error: existingError } = await supabase
    .from("group_books")
    .select("id")
    .eq("group_id", groupId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(`중복 체크 실패: ${existingError.message}`);
  }

  if (existing) {
    throw new Error("이미 추가된 지정도서입니다.");
  }

  // 지정도서 추가
  const { error: insertError } = await supabase.from("group_books").insert({
    group_id: groupId,
    book_id: bookId,
    target_completed_at: targetCompletedAt || null,
  });

  if (insertError) {
    throw new Error(`지정도서 추가 실패: ${insertError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 지정도서 목록 조회
 */
export async function getGroupBooks(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id, role")
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

  // 접근 권한 확인 (리더, 멤버, 또는 공개 그룹)
  if (!isLeader && !isMember && !isPublic) {
    throw new Error("모임 멤버만 지정도서를 조회할 수 있습니다.");
  }

  // 지정도서 목록 조회
  const { data: groupBooks, error: groupBooksError } = await supabase
    .from("group_books")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        publisher,
        cover_image_url,
        published_date
      )
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (groupBooksError) {
    throw new Error(`지정도서 조회 실패: ${groupBooksError.message}`);
  }

  return groupBooks || [];
}

/**
 * 모임 지정도서 목록 조회 (사용자의 개인 서재 연결 정보 포함)
 */
export async function getGroupBooksWithUserStatus(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 지정도서 목록 조회
  const groupBooks = await getGroupBooks(groupId);

  // 사용자가 이미 등록한 책 확인
  const bookIds = groupBooks.map((gb: any) => gb.book_id);
  let userBooks: any[] = [];

  if (bookIds.length > 0) {
    const { data: userBooksData } = await supabase
      .from("user_books")
      .select("book_id, status, started_at, reading_reason")
      .eq("user_id", user.id)
      .in("book_id", bookIds);

    userBooks = userBooksData || [];
  }

  // 지정도서에 사용자 상태 추가
  const groupBooksWithStatus = groupBooks.map((gb: any) => {
    const userBook = userBooks.find((ub) => ub.book_id === gb.book_id);
    return {
      ...gb,
      isInMyLibrary: !!userBook,
      myStatus: userBook?.status || null,
      myStartedAt: userBook?.started_at || null,
      myReadingReason: userBook?.reading_reason || null,
    };
  });

  return groupBooksWithStatus;
}

/**
 * 지정도서를 내 서재에 추가
 */
export async function addGroupBookToMyLibrary(
  groupId: string,
  bookId: string,
  status: "reading" | "completed" | "paused" | "not_started" | "rereading" = "reading"
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

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 지정도서를 추가할 수 있습니다.");
  }

  // 지정도서인지 확인
  const { data: groupBook } = await supabase
    .from("group_books")
    .select("id")
    .eq("group_id", groupId)
    .eq("book_id", bookId)
    .single();

  if (!groupBook) {
    throw new Error("지정도서가 아닙니다.");
  }

  // 이미 등록된 책인지 확인
  const { data: existing } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existing) {
    throw new Error("이미 내 서재에 등록된 책입니다.");
  }

  // 메인 서재 찾기
  const { data: mainBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_main", true)
    .maybeSingle();

  if (!mainBookshelf) {
    throw new Error("메인 서재를 찾을 수 없습니다. 서재를 먼저 생성해주세요.");
  }

  // 내 서재에 추가
  const { error } = await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: bookId,
    bookshelf_id: mainBookshelf.id,
    status: status,
    started_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`서재 추가 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/books");
  return { success: true };
}

/**
 * 지정도서 삭제 (리더만 가능)
 */
export async function removeGroupBook(groupId: string, bookId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 지정도서를 삭제할 수 있습니다.");
  }

  // 지정도서 삭제
  const { error: deleteError } = await supabase
    .from("group_books")
    .delete()
    .eq("group_id", groupId)
    .eq("book_id", bookId);

  if (deleteError) {
    throw new Error(`지정도서 삭제 실패: ${deleteError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 개인 서재를 모임에 공유
 */
export async function shareUserBookToGroup(groupId: string, userBookId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
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
    throw new Error("모임 멤버만 서재를 공유할 수 있습니다.");
  }

  // 서재 소유자 확인
  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("user_id")
    .eq("id", userBookId)
    .single();

  if (userBookError || !userBook) {
    throw new Error("서재를 찾을 수 없습니다.");
  }

  if (userBook.user_id !== user.id) {
    throw new Error("본인의 서재만 공유할 수 있습니다.");
  }

  // 이미 공유된 서재인지 확인
  const { data: existing } = await supabase
    .from("group_shared_books")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_book_id", userBookId)
    .maybeSingle();

  if (existing) {
    throw new Error("이미 공유된 서재입니다.");
  }

  // 서재 공유
  const { error: shareError } = await supabase
    .from("group_shared_books")
    .insert({
      group_id: groupId,
      user_book_id: userBookId,
    });

  if (shareError) {
    throw new Error(`서재 공유 실패: ${shareError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임에 공유된 개인 서재 목록 조회
 */
export async function getSharedBooks(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
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

  // 접근 권한 확인 (리더, 멤버, 또는 공개 그룹)
  if (!isLeader && !isMember && !isPublic) {
    throw new Error("모임 멤버만 공유 서재를 조회할 수 있습니다.");
  }

  // 공유된 서재 목록 조회
  const { data: sharedBooks, error: sharedBooksError } = await supabase
    .from("group_shared_books")
    .select(
      `
      *,
      user_books (
        id,
        status,
        started_at,
        reading_reason,
        books (
          id,
          title,
          author,
          publisher,
          cover_image_url,
          published_date
        ),
        users (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false });

  if (sharedBooksError) {
    throw new Error(`공유 서재 조회 실패: ${sharedBooksError.message}`);
  }

  return sharedBooks || [];
}

/**
 * 공유된 서재 공유 해제
 */
export async function unshareUserBookFromGroup(
  groupId: string,
  userBookId: string
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

  // 서재 소유자 확인
  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("user_id")
    .eq("id", userBookId)
    .single();

  if (userBookError || !userBook) {
    throw new Error("서재를 찾을 수 없습니다.");
  }

  if (userBook.user_id !== user.id) {
    throw new Error("본인의 서재만 공유 해제할 수 있습니다.");
  }

  // 공유 해제
  const { error: unshareError } = await supabase
    .from("group_shared_books")
    .delete()
    .eq("group_id", groupId)
    .eq("user_book_id", userBookId);

  if (unshareError) {
    throw new Error(`공유 해제 실패: ${unshareError.message}`);
  }

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

  // 이미 공유된 기록 확인
  const { data: existingShares } = await supabase
    .from("group_notes")
    .select("note_id")
    .eq("group_id", groupId)
    .in("note_id", noteIds);

  const alreadySharedIds = (existingShares || []).map((es) => es.note_id);
  const newNoteIds = noteIds.filter((id) => !alreadySharedIds.includes(id));

  if (newNoteIds.length === 0) {
    return { success: true, sharedCount: 0 };
  }

  // 기록 공유
  const { error: shareError } = await supabase.from("group_notes").insert(
    newNoteIds.map((noteId) => ({
      group_id: groupId,
      note_id: noteId,
    }))
  );

  if (shareError) {
    throw new Error(`공유 실패: ${shareError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true, sharedCount: newNoteIds.length };
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

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 대기 중인 멤버 목록 조회
 * 리더 또는 부리더만 조회 가능
 */
export async function getPendingMembers(groupId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 권한 확인 (리더 또는 부리더)
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  const isLeader = group?.leader_id === user.id;
  const isModerator = myMembership?.role === "moderator";

  if (!isLeader && !isModerator) {
    throw new Error("멤버 관리 권한이 없습니다.");
  }

  // 대기 중인 멤버 조회
  const { data: pendingMembers, error } = await supabase
    .from("group_members")
    .select(
      `
      id,
      user_id,
      group_id,
      created_at,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`대기 멤버 조회 실패: ${error.message}`);
  }

  return pendingMembers || [];
}

/**
 * 멤버 내보내기 (강퇴)
 * 리더 또는 부리더만 가능
 */
export async function removeMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 자기 자신은 내보낼 수 없음
  if (user.id === userId) {
    throw new Error("자기 자신은 내보낼 수 없습니다. 모임 나가기를 이용해주세요.");
  }

  // 권한 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 리더는 내보낼 수 없음
  if (group.leader_id === userId) {
    throw new Error("리더는 내보낼 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;

  // 부리더인 경우
  if (!isLeader) {
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .single();

    if (myMembership?.role !== "moderator") {
      throw new Error("멤버 내보내기 권한이 없습니다.");
    }

    // 부리더는 일반 멤버만 내보낼 수 있음
    const { data: targetMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single();

    if (targetMembership?.role === "moderator") {
      throw new Error("부리더는 다른 부리더를 내보낼 수 없습니다.");
    }
  }

  // 멤버 삭제
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`멤버 내보내기 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 나가기
 * 리더는 나갈 수 없음 (리더 위임 필요)
 */
export async function leaveGroup(groupId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id === user.id) {
    throw new Error("리더는 모임을 나갈 수 없습니다. 리더를 다른 멤버에게 위임해주세요.");
  }

  // 멤버십 삭제
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`모임 나가기 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { success: true };
}

/**
 * 리더 위임
 * 현재 리더만 가능
 */
export async function transferLeadership(groupId: string, newLeaderId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 현재 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 리더를 위임할 수 있습니다.");
  }

  // 새 리더가 멤버인지 확인
  const { data: newLeaderMembership } = await supabase
    .from("group_members")
    .select("id, role")
    .eq("group_id", groupId)
    .eq("user_id", newLeaderId)
    .eq("status", "approved")
    .single();

  if (!newLeaderMembership) {
    throw new Error("새 리더는 승인된 멤버여야 합니다.");
  }

  // 트랜잭션: 그룹 리더 변경 + 멤버 역할 변경
  const { error: groupError } = await supabase
    .from("groups")
    .update({ leader_id: newLeaderId })
    .eq("id", groupId);

  if (groupError) {
    throw new Error(`리더 위임 실패: ${groupError.message}`);
  }

  // 새 리더 역할을 leader로 변경
  await supabase
    .from("group_members")
    .update({ role: "leader" })
    .eq("group_id", groupId)
    .eq("user_id", newLeaderId);

  // 이전 리더를 member로 변경
  await supabase
    .from("group_members")
    .update({ role: "member" })
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 멤버 역할 변경
 * 리더만 가능
 */
export async function updateMemberRole(
  groupId: string,
  userId: string,
  newRole: "moderator" | "member"
) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 멤버 역할을 변경할 수 있습니다.");
  }

  // 리더의 역할은 변경 불가
  if (group.leader_id === userId) {
    throw new Error("리더의 역할은 변경할 수 없습니다.");
  }

  // 역할 변경
  const { error } = await supabase
    .from("group_members")
    .update({ role: newRole })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "approved");

  if (error) {
    throw new Error(`역할 변경 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 멤버십 통계 조회
 */
export async function getGroupMembershipStats(groupId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버 목록 조회
  const { data: members, error } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId);

  if (error) {
    throw new Error(`멤버십 통계 조회 실패: ${error.message}`);
  }

  const stats = {
    total: members?.length || 0,
    approved: members?.filter((m) => m.status === "approved").length || 0,
    pending: members?.filter((m) => m.status === "pending").length || 0,
    leaders: members?.filter((m) => m.role === "leader" && m.status === "approved").length || 0,
    moderators: members?.filter((m) => m.role === "moderator" && m.status === "approved").length || 0,
  };

  return stats;
}

/**
 * 모임 삭제
 * 리더만 가능
 */
export async function deleteGroup(groupId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 모임을 삭제할 수 있습니다.");
  }

  // 관련 데이터 삭제 (CASCADE 되지 않는 경우)
  await supabase.from("group_notes").delete().eq("group_id", groupId);
  await supabase.from("group_books").delete().eq("group_id", groupId);
  await supabase.from("group_shared_books").delete().eq("group_id", groupId);
  await supabase.from("group_members").delete().eq("group_id", groupId);

  // 모임 삭제
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    throw new Error(`모임 삭제 실패: ${error.message}`);
  }

  revalidatePath("/groups");
  return { success: true };
}

/**
 * 멤버 일괄 승인
 */
export async function approveAllPendingMembers(groupId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 권한 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;

  if (!isLeader) {
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .single();

    if (myMembership?.role !== "moderator") {
      throw new Error("멤버 관리 권한이 없습니다.");
    }
  }

  // 모든 대기 멤버 승인
  const { data, error } = await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("group_id", groupId)
    .eq("status", "pending")
    .select();

  if (error) {
    throw new Error(`일괄 승인 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true, count: data?.length || 0 };
}

/**
 * 멤버별 활동 현황 조회
 */
export async function getMemberActivities(groupId: string) {
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
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;

  if (!isLeader && !isMember) {
    throw new Error("모임 멤버만 조회할 수 있습니다.");
  }

  // 지정도서 목록 조회
  const { data: groupBooks } = await supabase
    .from("group_books")
    .select("book_id")
    .eq("group_id", groupId);

  const bookIds = (groupBooks || []).map((gb) => gb.book_id);

  // 멤버 목록 조회
  const { data: members } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      role,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  // 공유된 기록 조회
  const { data: sharedNotes } = await supabase
    .from("group_notes")
    .select(
      `
      note_id,
      shared_at,
      notes!inner (
        user_id,
        book_id,
        type
      )
    `
    )
    .eq("group_id", groupId);

  // 멤버별 활동 집계
  const activities = (members || []).map((member: any) => {
    const memberNotes = (sharedNotes || []).filter(
      (sn: any) => sn.notes?.user_id === member.user_id
    );

    const groupBookNotes = memberNotes.filter((sn: any) =>
      bookIds.includes(sn.notes?.book_id)
    );

    const lastShared = memberNotes.length > 0
      ? memberNotes.reduce((latest: any, sn: any) =>
          !latest || new Date(sn.shared_at) > new Date(latest.shared_at) ? sn : latest
        , null)
      : null;

    return {
      user: member.users,
      role: member.role,
      totalSharedNotes: memberNotes.length,
      groupBookNotes: groupBookNotes.length,
      lastSharedAt: lastShared?.shared_at || null,
      noteTypes: {
        quote: memberNotes.filter((sn: any) => sn.notes?.type === "quote").length,
        memo: memberNotes.filter((sn: any) => sn.notes?.type === "memo").length,
        photo: memberNotes.filter((sn: any) => sn.notes?.type === "photo").length,
        transcription: memberNotes.filter((sn: any) => sn.notes?.type === "transcription").length,
      },
    };
  });

  return activities;
}

