"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./_shared";
import type {
  CustomApiService,
  CustomApiServiceInput,
} from "@/types/custom-api-service";

/**
 * API 키를 마스킹하여 미리보기 문자열 생성
 * 예: "sk-abc123xyz" → "sk-a...xyz"
 */
function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return key.slice(0, 2) + "..." + key.slice(-2);
  return key.slice(0, 4) + "..." + key.slice(-3);
}

/**
 * 전체 커스텀 API 서비스 조회 (api_key_encrypted 제외)
 */
export async function getCustomApiServices(): Promise<CustomApiService[]> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("custom_api_services")
    .select(
      "id, name, description, endpoint_url, api_key_preview, category, is_active, icon, external_doc_url, features, notes, created_at, updated_at"
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch custom api services:", error);
    return [];
  }

  return data as CustomApiService[];
}

/**
 * 커스텀 API 서비스 생성
 */
export async function createCustomApiService(
  input: CustomApiServiceInput
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("custom_api_services").insert({
    name: input.name,
    description: input.description ?? "",
    endpoint_url: input.endpoint_url ?? "",
    api_key_encrypted: input.api_key ?? "",
    api_key_preview: maskApiKey(input.api_key ?? ""),
    category: input.category ?? "custom",
    is_active: input.is_active ?? true,
    icon: input.icon ?? "plug",
    external_doc_url: input.external_doc_url ?? "",
    features: input.features ?? [],
    notes: input.notes ?? "",
  });

  if (error) {
    console.error("Failed to create custom api service:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 커스텀 API 서비스 수정
 * api_key가 빈 문자열이면 기존 키 유지
 */
export async function updateCustomApiService(
  id: string,
  input: CustomApiServiceInput
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

  const updateData: Record<string, unknown> = {
    name: input.name,
    description: input.description ?? "",
    endpoint_url: input.endpoint_url ?? "",
    category: input.category ?? "custom",
    is_active: input.is_active ?? true,
    icon: input.icon ?? "plug",
    external_doc_url: input.external_doc_url ?? "",
    features: input.features ?? [],
    notes: input.notes ?? "",
  };

  // API 키가 제공된 경우에만 업데이트
  if (input.api_key) {
    updateData.api_key_encrypted = input.api_key;
    updateData.api_key_preview = maskApiKey(input.api_key);
  }

  const { error } = await supabase
    .from("custom_api_services")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Failed to update custom api service:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 커스텀 API 서비스 삭제
 */
export async function deleteCustomApiService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("custom_api_services")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete custom api service:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
