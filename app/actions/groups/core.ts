"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sanitizeSearchQuery } from "@/lib/utils/validation";

/**
 * 모임 생성
 * 생성자는 자동으로 리더가 됨
 */
export async function createGroup(data: {
  name: string;
  description?: string;
  isPublic?: boolean; // deprecated — use joinType
  joinType?: "open" | "approval" | "private";
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

  // joinType 결정 (joinType 우선, 없으면 isPublic에서 변환)
  const joinType = data.joinType ?? (data.isPublic ? "open" : "approval");

  // 모임 생성 (RLS 재귀 방지를 위해 select 제거)
  const { data: insertResult, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: data.name,
      description: data.description || null,
      leader_id: user.id,
      join_type: joinType,
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
  // approved + pending + rejected 모두 포함하여 "내 모임"에 상태 표시
  const { data: memberships, error: membersError } = await supabase
    .from("group_members")
    .select("group_id, role, status")
    .eq("user_id", user.id)
    .in("status", ["approved", "pending", "rejected"]);

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
    // 하위 호환: isPublic=true → open/approval, isPublic=false → private
    if (isPublic) {
      query = query.in("join_type", ["open", "approval"]);
    } else {
      query = query.eq("join_type", "private");
    }
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

  // 인증 여부 확인 — 비로그인이면 Admin Client로 RLS 우회
  const { data: { user } } = await supabase.auth.getUser();
  const client = user ? supabase : createAdminSupabaseClient();

  let query = client
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
    .in("join_type", ["open", "approval"])
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
  } = await supabase.auth.getUser();

  // 게스트: 공개 모임만 제한된 정보로 반환
  if (!user) {
    const adminSupabase = createAdminSupabaseClient();
    const { data: group, error: groupError } = await adminSupabase
      .from("groups")
      .select(`
        *,
        users!groups_leader_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      throw new Error("모임을 찾을 수 없습니다.");
    }

    // 비공개 모임은 게스트에게 노출하지 않음
    if (group.join_type === "private") {
      throw new Error("비공개 모임입니다. 로그인 후 이용해주세요.");
    }

    // 공개 모임: 멤버 수 + 지정도서만 표시
    const [membersResult, groupBooksResult] = await Promise.all([
      adminSupabase
        .from("group_members")
        .select(`
          *,
          users (id, name, avatar_url)
        `)
        .eq("group_id", groupId)
        .eq("status", "approved"),
      adminSupabase
        .from("group_books")
        .select(`
          *,
          books (id, title, author, cover_image_url)
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    return {
      group,
      members: membersResult.data || [],
      myMembership: null,
      sharedNotes: [],
      groupBooks: groupBooksResult.data || [],
      sharedBooks: [],
      isLeader: false,
      isGuestPreview: true,
    };
  }

  // Phase 1: 병렬로 membership, group, pendingMembership 조회
  const [membershipResult, groupResult, pendingMembershipResult] = await Promise.all([
    // 멤버십 확인 (RLS 재귀 방지)
    supabase
      .from("group_members")
      .select("group_id, role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "approved")
      .single(),
    // 모임 정보 조회
    supabase
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
      .single(),
    // 대기/거부 멤버십 확인 (pending 또는 rejected 상태)
    supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .in("status", ["pending", "rejected"])
      .single(),
  ]);

  const membership = membershipResult.data;
  const group = groupResult.data;
  const groupError = groupResult.error;
  const pendingMembership = pendingMembershipResult.data;

  // RLS 정책으로 인해 조회 실패 처리
  if (groupError || !group) {
    if (membership) {
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

  // 비공개 모임 + 비멤버인 경우: 제한된 정보만 반환 (링크 접근 허용)
  const isNonMemberPrivateGroup = !membership && group.join_type === "private" && group.leader_id !== user.id;

  if (isNonMemberPrivateGroup) {
    // 비멤버가 비공개 모임에 링크로 접근한 경우
    // 제한된 정보만 반환 (참여 신청 UI를 보여주기 위함)
    return {
      group,
      members: [], // 멤버 목록 비공개
      myMembership: pendingMembership || null, // 대기 중인 경우 표시
      sharedNotes: [], // 공유 기록 비공개
      groupBooks: [], // 지정도서 비공개
      sharedBooks: [], // 공유 서재 비공개
      isLeader: false,
      isPrivatePreview: true, // 비공개 모임 미리보기 플래그
    };
  }

  // Phase 2: 병렬로 members, myMembership, sharedNotes, groupBooks, sharedBooks 조회
  const [membersResult, myMembershipResult, sharedNotesResult, groupBooksResult, sharedBooksResult] = await Promise.all([
    // 멤버 목록 조회
    supabase
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
      .eq("status", "approved"),
    // 현재 사용자의 멤버십 확인
    supabase
      .from("group_members")
      .select("role, status")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single(),
    // 공유된 기록 목록 조회 (책 정보 + 작성자 정보 포함)
    supabase
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
      .limit(50),
    // 지정도서 목록 조회 (전체 — 지정도서 상세 페이지 매칭에 사용)
    supabase
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
      .order("created_at", { ascending: false }),
    // 공유된 서재 목록 조회
    supabase
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
      .limit(10),
  ]);

  if (membersResult.error) {
    throw new Error(`멤버 목록 조회 실패: ${membersResult.error.message}`);
  }

  if (sharedNotesResult.error) {
    console.error("공유 기록 조회 오류:", sharedNotesResult.error);
  }

  return {
    group,
    members: membersResult.data || [],
    myMembership: myMembershipResult.data || null,
    sharedNotes: sharedNotesResult.data || [],
    groupBooks: groupBooksResult.data || [],
    sharedBooks: sharedBooksResult.data || [],
    isLeader: group.leader_id === user.id,
  };
}

/**
 * 모임 정보 수정
 * 리더만 가능
 */
export async function updateGroup(
  groupId: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean; // deprecated — use joinType
    joinType?: "open" | "approval" | "private";
    content?: string | null;
    links?: { title: string; url: string }[] | null;
  }
): Promise<{ success: boolean }> {
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
    throw new Error("리더만 모임 정보를 수정할 수 있습니다.");
  }

  // 업데이트할 데이터 준비
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    if (!data.name.trim()) {
      throw new Error("모임 이름은 필수입니다.");
    }
    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }

  if (data.joinType !== undefined) {
    updateData.join_type = data.joinType;
  } else if (data.isPublic !== undefined) {
    // 하위 호환: isPublic → join_type 변환
    updateData.join_type = data.isPublic ? "open" : "approval";
  }

  if (data.content !== undefined) {
    updateData.content = data.content?.trim() || null;
  }

  if (data.links !== undefined) {
    updateData.links = data.links || [];
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("수정할 내용이 없습니다.");
  }

  const { error } = await supabase
    .from("groups")
    .update(updateData)
    .eq("id", groupId);

  if (error) {
    throw new Error(`모임 수정 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/settings`);
  revalidatePath("/groups");
  return { success: true };
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

  // 원자적 그룹 삭제 (RPC: 리더 검증 + CASCADE 삭제를 단일 트랜잭션에서 처리)
  const { data: result, error } = await supabase.rpc("delete_group_atomic", {
    p_group_id: groupId,
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(`모임 삭제 실패: ${error.message}`);
  }

  if (!result?.success) {
    const errorMsg = result?.error === "Not authorized"
      ? "리더만 모임을 삭제할 수 있습니다."
      : result?.error === "Group not found"
        ? "모임을 찾을 수 없습니다."
        : `모임 삭제 실패: ${result?.error}`;
    throw new Error(errorMsg);
  }

  revalidatePath("/groups");
  return { success: true };
}

/**
 * 모임 상세 조회 (설정 페이지용)
 * 리더만 가능
 */
export async function getGroupForSettings(groupId: string) {
  const supabase = await createServerSupabaseClient();

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
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 리더인지 확인
  if (group.leader_id !== user.id) {
    throw new Error("리더만 모임 설정에 접근할 수 있습니다.");
  }

  return group;
}
