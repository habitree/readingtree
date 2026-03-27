"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MemberStatus } from "./_shared";
import { checkFeatureAccess } from "../subscription";

/**
 * 모임 참여 신청
 * 공개 모임은 자동 승인, 비공개 모임은 리더 승인 필요
 */
export async function joinGroup(groupId: string, joinMessage?: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 참여 한도 체크
  const access = await checkFeatureAccess("groups_join", user);
  if (!access.allowed) {
    throw new Error(
      `모임 참여 한도(${access.limit}개)에 도달했습니다.`
    );
  }

  // 모임 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("join_type")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 완전 비공개 모임은 직접 가입 불가 (초대 토큰으로만 가입 가능)
  if (group.join_type === "private") {
    throw new Error("이 모임은 초대를 통해서만 가입할 수 있습니다.");
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

  // open: 자동 승인, approval: 대기
  const status: MemberStatus = group.join_type === "open" ? "approved" : "pending";

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
    status,
    ...(joinMessage?.trim() ? { join_message: joinMessage.trim() } : {}),
  });

  if (memberError) {
    throw new Error(`참여 신청 실패: ${memberError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { success: true, autoApproved: group.join_type === "open" };
}

/**
 * 모임 참여 승인
 * 리더 또는 부리더만 승인 가능
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

  // 권한 확인 (리더 또는 부리더)
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isModerator = myMembership?.role === "moderator";

  if (!isLeader && !isModerator) {
    throw new Error("멤버 승인 권한이 없습니다.");
  }

  // 멤버 승인 (pending 상태인 경우에만)
  const { error: updateError } = await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "pending");

  if (updateError) {
    throw new Error(`승인 실패: ${updateError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 참여 거부
 * 리더 또는 부리더만 거부 가능
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

  // 권한 확인 (리더 또는 부리더)
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isModerator = myMembership?.role === "moderator";

  if (!isLeader && !isModerator) {
    throw new Error("멤버 거부 권한이 없습니다.");
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
      joined_at,
      join_message,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`대기 멤버 조회 실패: ${error.message}`);
  }

  return pendingMembers || [];
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

  // 부리더(moderator) 최대 2명 제한
  if (newRole === "moderator") {
    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("role", "moderator")
      .eq("status", "approved");

    if ((count ?? 0) >= 2) {
      throw new Error("부리더는 최대 2명까지 지정할 수 있습니다.");
    }
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
