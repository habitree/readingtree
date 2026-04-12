"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkGroupAccess } from "./_shared";

/**
 * 지정도서 서재 생성 (리더만)
 */
export async function createGroupBookBundle(
  groupId: string,
  name: string,
  description?: string
) {
  const supabase = await createServerSupabaseClient();
  await checkGroupAccess(supabase, groupId, "leader");

  // 현재 최대 sort_order 조회
  const { data: maxRow } = await supabase
    .from("group_book_bundles")
    .select("sort_order")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data: bundle, error } = await supabase
    .from("group_book_bundles")
    .insert({
      group_id: groupId,
      name,
      description: description || null,
      sort_order: nextOrder,
    })
    .select("id, name, description, sort_order")
    .single();

  if (error) {
    throw new Error(`서재 생성 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return bundle;
}

/**
 * 지정도서 서재 수정 (리더만)
 */
export async function updateGroupBookBundle(
  bundleId: string,
  data: {
    name?: string;
    description?: string | null;
    sortOrder?: number;
  }
) {
  const supabase = await createServerSupabaseClient();

  // 번들 소속 그룹 확인
  const { data: bundle, error: bundleError } = await supabase
    .from("group_book_bundles")
    .select("group_id")
    .eq("id", bundleId)
    .single();

  if (bundleError || !bundle) {
    throw new Error("서재을 찾을 수 없습니다.");
  }

  await checkGroupAccess(supabase, bundle.group_id, "leader");

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;

  const { error } = await supabase
    .from("group_book_bundles")
    .update(updateData)
    .eq("id", bundleId);

  if (error) {
    throw new Error(`서재 수정 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${bundle.group_id}`);
  return { success: true };
}

/**
 * 지정도서 서재 삭제 (리더만)
 * 서재만 삭제 — 소속 책들은 bundle_id = NULL로 변경 (DB ON DELETE SET NULL)
 */
export async function deleteGroupBookBundle(bundleId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: bundle, error: bundleError } = await supabase
    .from("group_book_bundles")
    .select("group_id")
    .eq("id", bundleId)
    .single();

  if (bundleError || !bundle) {
    throw new Error("서재을 찾을 수 없습니다.");
  }

  await checkGroupAccess(supabase, bundle.group_id, "leader");

  const { error } = await supabase
    .from("group_book_bundles")
    .delete()
    .eq("id", bundleId);

  if (error) {
    throw new Error(`서재 삭제 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${bundle.group_id}`);
  return { success: true };
}

/**
 * 모임의 서재 목록 조회 (멤버/공개)
 */
export async function getGroupBookBundles(groupId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: bundles, error } = await supabase
    .from("group_book_bundles")
    .select("id, group_id, name, description, sort_order, created_at")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`서재 조회 실패: ${error.message}`);
  }

  return bundles || [];
}
