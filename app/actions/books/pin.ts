"use server";

/**
 * user_books 핀(즐겨찾기) 토글.
 *
 * 사용처:
 *   - 메인 대시보드 "이어읽기" 카드 우상단 별 아이콘
 *   - /books 서재 카드 우상단 별 아이콘
 *
 * 정렬 효과:
 *   getContinueReadingBooks 가 핀된 행을 pinned_at DESC 로 최상단 정렬.
 *
 * RLS:
 *   user_books 의 표준 UPDATE 정책(auth.uid() = user_id)으로 권한 자동 검증.
 *   추가로 owner 명시 검증을 둬서 사전 차단.
 *
 * 마이그레이션: doc/database/migration-202605061200__user_books__add_pin_columns.sql
 */

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { isValidUUID, sanitizeErrorMessage } from "@/lib/utils/validation";

interface ToggleResult {
  success: true;
  isPinned: boolean;
  pinnedAt: string | null;
}

/**
 * user_books.is_pinned 토글.
 *  - 현재 false → true + pinned_at = NOW()
 *  - 현재 true → false + pinned_at = NULL
 *
 * @param userBookId user_books.id
 * @param user 선택적 — 미지정 시 세션에서 조회
 */
export async function toggleUserBookPin(
  userBookId: string,
  user?: User | null,
): Promise<ToggleResult> {
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  const currentUser = user ?? (await getCurrentUser());
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();

  // 현재 핀 상태 확인 + 소유 검증
  const { data: existing, error: fetchError } = await supabase
    .from("user_books")
    .select("id, is_pinned")
    .eq("id", userBookId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(sanitizeErrorMessage(fetchError));
  }
  if (!existing) {
    throw new Error("권한이 없거나 책을 찾을 수 없습니다.");
  }

  const nextPinned = !(existing as { is_pinned?: boolean }).is_pinned;
  const nextPinnedAt = nextPinned ? new Date().toISOString() : null;

  // 핀 ON 시 홈 숨김도 함께 해제(사용자 의도 우선) — 핀했는데 안 보이면 혼란.
  const updatePayload: Record<string, unknown> = {
    is_pinned: nextPinned,
    pinned_at: nextPinnedAt,
  };
  if (nextPinned) {
    updatePayload.hidden_from_home = false;
  }

  const { error: updateError } = await supabase
    .from("user_books")
    .update(updatePayload)
    .eq("id", userBookId)
    .eq("user_id", currentUser.id);

  if (updateError) {
    throw new Error(sanitizeErrorMessage(updateError));
  }

  revalidatePath("/");
  revalidatePath("/books");

  return { success: true, isPinned: nextPinned, pinnedAt: nextPinnedAt };
}

interface SetHiddenResult {
  success: true;
  hiddenFromHome: boolean;
}

/**
 * user_books.hidden_from_home 설정.
 *  - hidden=true → 홈 이어읽기에서 카드 숨김
 *  - hidden=false → 홈 이어읽기에 다시 노출
 *
 * 핀(is_pinned=TRUE)된 책은 정렬 단계에서 hidden 무관 노출되므로,
 * 사용자가 명시적으로 핀을 해제하기 전까지는 항상 보임.
 */
export async function setUserBookHomeHidden(
  userBookId: string,
  hidden: boolean,
  user?: User | null,
): Promise<SetHiddenResult> {
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  const currentUser = user ?? (await getCurrentUser());
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();

  // 소유 검증
  const { data: existing, error: fetchError } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(sanitizeErrorMessage(fetchError));
  }
  if (!existing) {
    throw new Error("권한이 없거나 책을 찾을 수 없습니다.");
  }

  const { error: updateError } = await supabase
    .from("user_books")
    .update({ hidden_from_home: hidden })
    .eq("id", userBookId)
    .eq("user_id", currentUser.id);

  if (updateError) {
    throw new Error(sanitizeErrorMessage(updateError));
  }

  revalidatePath("/");

  return { success: true, hiddenFromHome: hidden };
}
