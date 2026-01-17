"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * OCR 사용 통계 조회 (관리자 전용)
 * @returns 사용자별 OCR 사용 통계 목록
 */
export async function getOcrUsageStats() {
  const supabase = await createServerSupabaseClient();
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  
  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userProfile || !userProfile.is_admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("ocr_usage_stats")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<Database["public"]["Tables"]["ocr_usage_stats"]["Row"][]>();

  if (error) {
    console.error("[OCR Stats] 통계 조회 오류:", error);
    throw new Error("OCR 사용 통계를 조회할 수 없습니다.");
  }

  return data || [];
}

/**
 * OCR 로그 조회 (관리자 전용)
 * @param limit 조회할 로그 수 (기본값: 100)
 * @returns OCR 처리 로그 목록
 */
export async function getOcrLogs(limit: number = 100) {
  const supabase = await createServerSupabaseClient();
  
  // 관리자 권한 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  
  // 관리자 권한 확인
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userProfile || !userProfile.is_admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("ocr_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Database["public"]["Tables"]["ocr_logs"]["Row"][]>();

  if (error) {
    console.error("[OCR Logs] 로그 조회 오류:", error);
    throw new Error("OCR 로그를 조회할 수 없습니다.");
  }

  return data || [];
}

/**
 * OCR 처리 성공 기록
 * @param userId 사용자 ID
 * @param noteId 기록 ID (선택)
 * @param durationMs 처리 소요 시간 (밀리초, 선택)
 */
export async function recordOcrSuccess(
  userId: string,
  noteId?: string,
  durationMs?: number
) {
  const supabase = await createServerSupabaseClient();

  try {
    // 기존 통계 조회
    const { data: existing } = await supabase
      .from("ocr_usage_stats")
      .select("success_count, failure_count")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // 기존 레코드가 있으면 카운트 증가
      const { error: updateError } = await supabase
        .from("ocr_usage_stats")
        .update({
          success_count: (existing.success_count || 0) + 1,
          last_processed_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[OCR Stats] 통계 업데이트 오류:", updateError);
      }
    } else {
      // 새 레코드 생성
      const { error: insertError } = await supabase
        .from("ocr_usage_stats")
        .insert({
          user_id: userId,
          success_count: 1,
          failure_count: 0,
          last_processed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[OCR Stats] 통계 생성 오류:", insertError);
      }
    }

    // 로그 기록
    const { error: logError } = await supabase
      .from("ocr_logs")
      .insert({
        user_id: userId,
        note_id: noteId || null,
        status: "success",
        processing_duration_ms: durationMs || null,
      });

    if (logError) {
      console.error("[OCR Logs] 로그 기록 오류:", logError);
    }
  } catch (error) {
    console.error("[OCR Stats] 기록 오류:", error);
    // 기록 실패해도 OCR 처리는 계속 진행
  }
}

/**
 * OCR 처리 실패 기록
 * @param userId 사용자 ID
 * @param noteId 기록 ID (선택)
 * @param errorMessage 에러 메시지 (선택)
 * @param durationMs 처리 소요 시간 (밀리초, 선택)
 */
export async function recordOcrFailure(
  userId: string,
  noteId?: string,
  errorMessage?: string,
  durationMs?: number
) {
  const supabase = await createServerSupabaseClient();

  try {
    // 기존 통계 조회
    const { data: existing } = await supabase
      .from("ocr_usage_stats")
      .select("success_count, failure_count")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // 기존 레코드가 있으면 카운트 증가
      const { error: updateError } = await supabase
        .from("ocr_usage_stats")
        .update({
          failure_count: (existing.failure_count || 0) + 1,
          last_processed_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[OCR Stats] 통계 업데이트 오류:", updateError);
      }
    } else {
      // 새 레코드 생성
      const { error: insertError } = await supabase
        .from("ocr_usage_stats")
        .insert({
          user_id: userId,
          success_count: 0,
          failure_count: 1,
          last_processed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[OCR Stats] 통계 생성 오류:", insertError);
      }
    }

    // 로그 기록
    const { error: logError } = await supabase
      .from("ocr_logs")
      .insert({
        user_id: userId,
        note_id: noteId || null,
        status: "failed",
        error_message: errorMessage || null,
        processing_duration_ms: durationMs || null,
      });

    if (logError) {
      console.error("[OCR Logs] 로그 기록 오류:", logError);
    }
  } catch (error) {
    console.error("[OCR Stats] 기록 오류:", error);
    // 기록 실패해도 OCR 처리는 계속 진행
  }
}

