"use server";

/**
 * AI 리포트 설정 관리 서버 액션
 *
 * 관리자가 AI 독서 리포트 생성 설정을 관리합니다.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "../auth";
import type {
  AIReportSettings,
  ReportSettingsFormData,
  AIProvider,
} from "@/types/ai";
import { DEFAULT_REPORT_SETTINGS } from "@/types/ai";

// 관리자 권한 확인 헬퍼
async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

/** DB Row → AIReportSettings 변환 */
function transformRow(row: Record<string, unknown>): AIReportSettings {
  return {
    id: row.id as string,
    provider: row.provider as AIProvider,
    modelId: row.model_id as string,
    systemPrompt: row.system_prompt as string,
    temperature: Number(row.temperature),
    maxOutputTokens: Number(row.max_output_tokens),
  };
}

/**
 * 리포트 AI 설정 조회 (관리자)
 */
export async function getReportSettings(): Promise<AIReportSettings | null> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("ai_report_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("리포트 설정 조회 실패:", error);
    return null;
  }

  return transformRow(data);
}

/**
 * 리포트 AI 설정 업데이트 (관리자)
 */
export async function updateReportSettings(
  formData: ReportSettingsFormData
): Promise<AIReportSettings> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  // 기존 설정 확인
  const { data: existing } = await supabase
    .from("ai_report_settings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const dbData = {
    provider: formData.provider,
    model_id: formData.modelId,
    system_prompt: formData.systemPrompt,
    temperature: formData.temperature,
    max_output_tokens: formData.maxOutputTokens,
  };

  if (existing) {
    // 업데이트
    const { data, error } = await supabase
      .from("ai_report_settings")
      .update(dbData)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(`리포트 설정 업데이트 실패: ${error.message}`);
    return transformRow(data);
  } else {
    // 생성
    const { data, error } = await supabase
      .from("ai_report_settings")
      .insert({ ...dbData, user_id: user.id })
      .select("*")
      .single();

    if (error) throw new Error(`리포트 설정 생성 실패: ${error.message}`);
    return transformRow(data);
  }
}

/**
 * 리포트 생성용 설정 조회 (일반 사용자도 호출 가능)
 * 관리자가 설정한 값을 가져오고, 없으면 기본값 반환
 */
export async function getReportSettingsForGeneration(): Promise<Omit<AIReportSettings, "id">> {
  const supabase = await createServerSupabaseClient();

  // 관리자 설정이 있으면 그것을 사용 (첫 번째 레코드)
  const { data, error } = await supabase
    .from("ai_report_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return DEFAULT_REPORT_SETTINGS;
  }

  return {
    provider: data.provider as AIProvider,
    modelId: data.model_id as string,
    systemPrompt: data.system_prompt as string,
    temperature: Number(data.temperature),
    maxOutputTokens: Number(data.max_output_tokens),
  };
}
