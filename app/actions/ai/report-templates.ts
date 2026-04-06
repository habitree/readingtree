"use server";

/**
 * AI 리포트 템플릿 관리 서버 액션
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "../auth";
import type {
  ReportTemplate,
  ReportTemplateFormData,
  ReportTemplateSectionConfig,
} from "@/types/ai/report-template";

async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) throw new Error("관리자 권한이 필요합니다.");
}

/** DB Row → ReportTemplate 변환 */
function transformRow(row: Record<string, unknown>): ReportTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    slug: row.slug as string,
    tone: row.tone as ReportTemplate["tone"],
    targetLength: row.target_length as ReportTemplate["targetLength"],
    includeStats: row.include_stats as boolean,
    multiReadAware: row.multi_read_aware as boolean,
    isDefault: row.is_default as boolean,
    isSystem: row.is_system as boolean,
    sortOrder: row.sort_order as number,
    sections: row.sections as ReportTemplateSectionConfig[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * 모든 템플릿 조회 (인증된 사용자)
 */
export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("템플릿 조회 실패:", error);
    return [];
  }

  return (data || []).map(transformRow);
}

/**
 * 단일 템플릿 조회
 */
export async function getReportTemplate(
  id: string
): Promise<ReportTemplate | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return transformRow(data);
}

/**
 * 기본 템플릿 조회 (is_default = true)
 */
export async function getDefaultTemplate(): Promise<ReportTemplate | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("is_default", true)
    .limit(1)
    .single();

  if (error || !data) {
    // fallback: standard 템플릿
    const { data: fallback } = await supabase
      .from("report_templates")
      .select("*")
      .eq("slug", "standard")
      .single();

    if (fallback) return transformRow(fallback);
    return null;
  }

  return transformRow(data);
}

/**
 * 템플릿 생성 (관리자)
 */
export async function createReportTemplate(
  formData: ReportTemplateFormData
): Promise<ReportTemplate> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("report_templates")
    .insert({
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      sections: formData.sections,
      tone: formData.tone,
      target_length: formData.targetLength,
      include_stats: formData.includeStats,
      multi_read_aware: formData.multiReadAware,
      is_system: false,
    })
    .select("*")
    .single();

  if (error) throw new Error(`템플릿 생성 실패: ${error.message}`);
  return transformRow(data);
}

/**
 * 템플릿 수정 (관리자)
 */
export async function updateReportTemplate(
  id: string,
  formData: Partial<ReportTemplateFormData>
): Promise<ReportTemplate> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  const dbData: Record<string, unknown> = {};
  if (formData.name !== undefined) dbData.name = formData.name;
  if (formData.description !== undefined) dbData.description = formData.description;
  if (formData.slug !== undefined) dbData.slug = formData.slug;
  if (formData.sections !== undefined) dbData.sections = formData.sections;
  if (formData.tone !== undefined) dbData.tone = formData.tone;
  if (formData.targetLength !== undefined) dbData.target_length = formData.targetLength;
  if (formData.includeStats !== undefined) dbData.include_stats = formData.includeStats;
  if (formData.multiReadAware !== undefined) dbData.multi_read_aware = formData.multiReadAware;

  const { data, error } = await supabase
    .from("report_templates")
    .update(dbData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`템플릿 수정 실패: ${error.message}`);
  return transformRow(data);
}

/**
 * 템플릿 삭제 (관리자, 시스템 템플릿 보호)
 */
export async function deleteReportTemplate(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  // 시스템 템플릿 보호
  const { data: template } = await supabase
    .from("report_templates")
    .select("is_system")
    .eq("id", id)
    .single();

  if (template?.is_system) {
    throw new Error("시스템 기본 템플릿은 삭제할 수 없습니다.");
  }

  const { error } = await supabase
    .from("report_templates")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`템플릿 삭제 실패: ${error.message}`);
}

/**
 * 기본 템플릿 지정 (관리자)
 */
export async function setDefaultTemplate(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();

  // 기존 기본 해제
  await supabase
    .from("report_templates")
    .update({ is_default: false })
    .eq("is_default", true);

  // 새 기본 지정
  const { error } = await supabase
    .from("report_templates")
    .update({ is_default: true })
    .eq("id", id);

  if (error) throw new Error(`기본 템플릿 지정 실패: ${error.message}`);
}
