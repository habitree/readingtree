"use server";

import { invalidateOgConfigCache } from "@/lib/og/settings";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./_shared";
import type { OgSettings, OgSettingsFormData } from "@/types/og-settings";
import { isValidHexColor, OG_SETTINGS_DEFAULTS } from "@/types/og-settings";
import { getCurrentUser } from "@/app/actions/auth";

/** 활성 OG 설정 조회 (관리자 UI용) */
export async function getActiveOgSettings(): Promise<OgSettings | null> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("og_settings")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`OG 설정 조회 실패: ${error.message}`);
  return data;
}

/** OG 설정 업데이트 (upsert) */
export async function updateOgSettings(
  formData: OgSettingsFormData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  // 색상 유효성 검증
  const colorFields = [
    "color_background",
    "color_forest",
    "color_forest_light",
    "color_forest_lighter",
    "color_text_primary",
    "color_text_secondary",
    "color_text_muted",
    "color_card_background",
    "color_border",
    "color_earth",
    "color_earth_light",
  ] as const;

  for (const field of colorFields) {
    const value = formData[field];
    if (!isValidHexColor(value)) {
      return { success: false, error: `잘못된 색상 형식: ${field} = ${value}` };
    }
  }

  // 텍스트 필드 검증
  if (!formData.brand_name.trim()) {
    return { success: false, error: "브랜드 이름은 필수입니다." };
  }

  const user = await getCurrentUser();
  const supabase = createAdminSupabaseClient();

  // 기존 활성 설정 확인
  const { data: existing } = await supabase
    .from("og_settings")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const payload = {
    ...formData,
    is_active: true,
    updated_by: user?.id ?? null,
  };

  if (existing) {
    const { error } = await supabase
      .from("og_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { success: false, error: `설정 업데이트 실패: ${error.message}` };
  } else {
    const { error } = await supabase.from("og_settings").insert(payload);
    if (error) return { success: false, error: `설정 생성 실패: ${error.message}` };
  }

  invalidateOgConfigCache();
  return { success: true };
}

/** 브랜드 아이콘 업로드 */
export async function uploadOgBrandIcon(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("icon") as File | null;
  if (!file) return { success: false, error: "파일이 없습니다." };

  // 검증
  const maxSize = 512 * 1024; // 512KB
  if (file.size > maxSize) {
    return { success: false, error: "파일 크기는 512KB 이하여야 합니다." };
  }

  const allowedTypes = ["image/png", "image/svg+xml", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "PNG, SVG, JPEG, WebP 형식만 지원합니다." };
  }

  const ext = file.name.split(".").pop() || "png";
  const fileName = `brand-icon.${ext}`;
  const filePath = `og-assets/${fileName}`;

  const supabase = createAdminSupabaseClient();

  // 기존 파일 삭제 후 업로드
  await supabase.storage.from("images").remove([filePath]);

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: `업로드 실패: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // DB에 URL 저장
  const { data: existing } = await supabase
    .from("og_settings")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("og_settings")
      .update({ brand_icon_url: publicUrl })
      .eq("id", existing.id);
  }

  invalidateOgConfigCache();
  return { success: true, url: publicUrl };
}

/** 브랜드 아이콘 삭제 */
export async function deleteOgBrandIcon(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

  // Storage에서 삭제
  const { data: files } = await supabase.storage.from("images").list("og-assets");
  if (files && files.length > 0) {
    const paths = files.map((f) => `og-assets/${f.name}`);
    await supabase.storage.from("images").remove(paths);
  }

  // DB에서 URL 제거
  const { data: existing } = await supabase
    .from("og_settings")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("og_settings")
      .update({ brand_icon_url: null })
      .eq("id", existing.id);
  }

  invalidateOgConfigCache();
  return { success: true };
}

/** 모든 OG 설정 기본값으로 초기화 */
export async function resetOgSettings(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const user = await getCurrentUser();
  const supabase = createAdminSupabaseClient();

  const { data: existing } = await supabase
    .from("og_settings")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const payload = {
    ...OG_SETTINGS_DEFAULTS,
    brand_icon_url: null,
    is_active: true,
    updated_by: user?.id ?? null,
  };

  if (existing) {
    const { error } = await supabase
      .from("og_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("og_settings").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  invalidateOgConfigCache();
  return { success: true };
}
