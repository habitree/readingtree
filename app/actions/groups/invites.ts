"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncGroupBooksToMember } from "./books";
import { checkGroupAccess } from "./_shared";

/**
 * 초대 토큰 생성
 */
export async function createInviteToken(
  groupId: string,
  options?: { maxUses?: number; expiresInDays?: number }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("로그인이 필요합니다.");

  // 리더/모더레이터 확인
  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!member || !["leader", "moderator"].includes(member.role)) {
    throw new Error("초대 링크를 생성할 권한이 없습니다.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (options?.expiresInDays ?? 7));

  const { data: token, error } = await supabase
    .from("group_invite_tokens")
    .insert({
      group_id: groupId,
      created_by: user.id,
      max_uses: options?.maxUses ?? null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !token) {
    throw new Error("초대 링크 생성에 실패했습니다.");
  }

  revalidatePath(`/groups/${groupId}/settings`);
  return token;
}

/**
 * 토큰으로 그룹 정보 조회 (공개 접근)
 */
export async function getGroupByInviteToken(token: string) {
  const supabase = await createServerSupabaseClient();

  const { data: inviteToken, error } = await supabase
    .from("group_invite_tokens")
    .select("*, groups(id, name, description, is_public, join_type, max_members)")
    .eq("token", token)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !inviteToken) {
    return null;
  }

  // 사용 횟수 체크
  if (inviteToken.max_uses && inviteToken.use_count >= inviteToken.max_uses) {
    return null;
  }

  // 멤버 수 조회
  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", inviteToken.group_id)
    .eq("status", "approved");

  return {
    token: inviteToken,
    group: (inviteToken as any).groups,
    memberCount: count ?? 0,
  };
}

/**
 * 토큰으로 그룹 가입
 */
export async function joinByToken(token: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("로그인이 필요합니다.");

  // 토큰 유효성 확인
  const { data: inviteToken, error: tokenError } = await supabase
    .from("group_invite_tokens")
    .select("id, group_id, max_uses, use_count")
    .eq("token", token)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (tokenError || !inviteToken) {
    throw new Error("유효하지 않거나 만료된 초대 링크입니다.");
  }

  if (inviteToken.max_uses && inviteToken.use_count >= inviteToken.max_uses) {
    throw new Error("초대 링크의 사용 횟수가 초과되었습니다.");
  }

  // 이미 멤버인지 확인
  const { data: existing } = await supabase
    .from("group_members")
    .select("id, status")
    .eq("group_id", inviteToken.group_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "approved") {
      return { success: true, groupId: inviteToken.group_id, alreadyMember: true };
    }
    // pending 상태면 approved로 변경
    await supabase
      .from("group_members")
      .update({ status: "approved" })
      .eq("id", existing.id);
  } else {
    // 토큰 초대는 자동 승인
    const { error: joinError } = await supabase
      .from("group_members")
      .insert({
        group_id: inviteToken.group_id,
        user_id: user.id,
        role: "member",
        status: "approved",
      });

    if (joinError) {
      throw new Error("그룹 가입에 실패했습니다.");
    }
  }

  // use_count 증가
  await supabase
    .from("group_invite_tokens")
    .update({ use_count: inviteToken.use_count + 1 })
    .eq("id", inviteToken.id);

  // 모임서재 동기화 (새로 가입 또는 pending→approved)
  if (!existing || existing.status !== "approved") {
    try {
      await syncGroupBooksToMember(inviteToken.group_id, user.id);
    } catch (err) {
      // best-effort: 동기화 실패해도 가입은 성공
    }
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${inviteToken.group_id}`);
  revalidatePath("/bookshelves");

  return { success: true, groupId: inviteToken.group_id, alreadyMember: false };
}

/**
 * 초대 토큰 비활성화 (리더/부리더만 가능)
 */
export async function revokeInviteToken(tokenId: string) {
  const supabase = await createServerSupabaseClient();

  // 토큰의 그룹 정보 조회
  const { data: token } = await supabase
    .from("group_invite_tokens")
    .select("group_id")
    .eq("id", tokenId)
    .single();

  if (!token) {
    throw new Error("토큰을 찾을 수 없습니다.");
  }

  // 리더/부리더 권한 확인
  await checkGroupAccess(supabase, token.group_id, "moderator");

  const { error } = await supabase
    .from("group_invite_tokens")
    .update({ is_active: false })
    .eq("id", tokenId);

  if (error) {
    throw new Error("초대 링크 비활성화에 실패했습니다.");
  }

  revalidatePath(`/groups/${token.group_id}/settings`);
  return { success: true };
}

/**
 * 그룹의 활성 초대 토큰 목록 조회 (리더/부리더만 가능)
 */
export async function getInviteTokens(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 리더/부리더 권한 확인
  await checkGroupAccess(supabase, groupId, "moderator");

  const { data: tokens, error } = await supabase
    .from("group_invite_tokens")
    .select("*")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return tokens || [];
}
