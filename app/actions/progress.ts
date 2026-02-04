"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isValidUUID, sanitizeErrorMessage } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import type { ReadingLog, CreateReadingLogInput } from "@/types/progress";

/**
 * 진행 로그 생성
 * @param data 진행 로그 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function createProgressLog(
  data: CreateReadingLogInput,
  user?: User | null
): Promise<{ success: boolean; logId: string }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // UUID 검증
  if (!isValidUUID(data.user_book_id)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 페이지 번호 검증
  if (data.page_number < 0) {
    throw new Error("페이지 번호는 0 이상이어야 합니다.");
  }

  // 메모 길이 검증
  if (data.memo && data.memo.length > 500) {
    throw new Error("메모는 500자 이하여야 합니다.");
  }

  // 책 소유 확인
  const { data: userBook, error: bookCheckError } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", data.user_book_id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (bookCheckError && bookCheckError.code !== "PGRST116") {
    throw new Error("책 소유 확인에 실패했습니다.");
  }

  if (!userBook) {
    throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
  }

  // 진행 로그 생성
  const { data: log, error } = await supabase
    .from("reading_logs")
    .insert({
      user_id: currentUser.id,
      user_book_id: data.user_book_id,
      page_number: data.page_number,
      memo: data.memo?.trim() || null,
      is_public: data.is_public ?? true,
    })
    .select()
    .single();

  if (error || !log) {
    throw new Error(sanitizeErrorMessage(error || new Error("진행 로그 생성에 실패했습니다.")));
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath(`/books/${data.user_book_id}`);
  revalidatePath("/");

  return { success: true, logId: log.id };
}

/**
 * 진행 로그 목록 조회
 * @param userBookId 사용자 책 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getProgressLogs(
  userBookId: string,
  user?: User | null
): Promise<ReadingLog[]> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // UUID 검증
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 진행 로그 조회
  const { data, error } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("user_book_id", userBookId)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return data || [];
}

/**
 * 진행 로그 삭제
 * @param logId 진행 로그 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteProgressLog(
  logId: string,
  user?: User | null
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // UUID 검증
  if (!isValidUUID(logId)) {
    throw new Error("유효하지 않은 로그 ID입니다.");
  }

  // 로그 소유 확인 및 삭제
  const { data: log, error: checkError } = await supabase
    .from("reading_logs")
    .select("id, user_book_id")
    .eq("id", logId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("진행 로그 조회에 실패했습니다.");
  }

  if (!log) {
    throw new Error("권한이 없습니다. 해당 진행 로그를 삭제할 권한이 없습니다.");
  }

  // 진행 로그 삭제
  const { error } = await supabase
    .from("reading_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath(`/books/${log.user_book_id}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 진행 로그 수정
 * @param logId 진행 로그 ID
 * @param memo 수정할 메모
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateProgressLog(
  logId: string,
  memo: string | null,
  user?: User | null
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // UUID 검증
  if (!isValidUUID(logId)) {
    throw new Error("유효하지 않은 로그 ID입니다.");
  }

  // 메모 길이 검증
  if (memo && memo.length > 500) {
    throw new Error("메모는 500자 이하여야 합니다.");
  }

  // 로그 소유 확인
  const { data: log, error: checkError } = await supabase
    .from("reading_logs")
    .select("id, user_book_id")
    .eq("id", logId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("진행 로그 조회에 실패했습니다.");
  }

  if (!log) {
    throw new Error("권한이 없습니다. 해당 진행 로그를 수정할 권한이 없습니다.");
  }

  // 진행 로그 수정
  const { error } = await supabase
    .from("reading_logs")
    .update({ memo: memo?.trim() || null })
    .eq("id", logId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath(`/books/${log.user_book_id}`);
  revalidatePath("/");

  return { success: true };
}
