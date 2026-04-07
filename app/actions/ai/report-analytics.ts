"use server";

/**
 * AI 리포트 사용 통계 서버 액션
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "../auth";
import type { ReportUsageStats } from "@/types/ai/report-template";

const EMPTY_STATS: ReportUsageStats = {
  totalReports: 0,
  monthlyReports: 0,
  avgGenerationTimeMs: null,
  templatePopularity: [],
  topUsers: [],
};

async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) throw new Error("관리자 권한이 필요합니다.");
}

/**
 * 리포트 사용 통계 조회 (관리자)
 */
export async function getReportUsageStats(): Promise<ReportUsageStats> {
  await requireAdmin();

  try {
    const supabase = await createServerSupabaseClient();

    // 전체 리포트 수
    const { count: totalReports } = await supabase
      .from("ai_generated_reports")
      .select("*", { count: "exact", head: true });

    // 이번 달 리포트 수
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: monthlyReports } = await supabase
      .from("ai_generated_reports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    // 평균 생성 시간 (새 컬럼이 없을 수 있음)
    let avgGenerationTimeMs: number | null = null;
    try {
      const { data: avgData } = await supabase
        .from("ai_generated_reports")
        .select("generation_time_ms")
        .not("generation_time_ms", "is", null);

      if (avgData && avgData.length > 0) {
        const sum = avgData.reduce((acc, r) => acc + (r.generation_time_ms || 0), 0);
        avgGenerationTimeMs = Math.round(sum / avgData.length);
      }
    } catch {
      // generation_time_ms 컬럼이 아직 없을 수 있음
    }

    // 템플릿별 인기도 (새 컬럼/테이블이 없을 수 있음)
    let templatePopularity: ReportUsageStats["templatePopularity"] = [];
    try {
      const { data: templateData } = await supabase
        .from("ai_generated_reports")
        .select("template_id")
        .not("template_id", "is", null);

      const templateCounts = new Map<string, number>();
      for (const row of templateData || []) {
        const tid = row.template_id as string;
        templateCounts.set(tid, (templateCounts.get(tid) || 0) + 1);
      }

      const templateIds = Array.from(templateCounts.keys());
      if (templateIds.length > 0) {
        const { data: templates } = await supabase
          .from("report_templates")
          .select("id, name")
          .in("id", templateIds);

        const nameMap = new Map<string, string>();
        for (const t of templates || []) {
          nameMap.set(t.id, t.name);
        }

        templatePopularity = templateIds
          .map((tid) => ({
            templateId: tid,
            templateName: nameMap.get(tid) || "알 수 없음",
            count: templateCounts.get(tid) || 0,
          }))
          .sort((a, b) => b.count - a.count);
      }
    } catch {
      // template_id 컬럼 또는 report_templates 테이블이 없을 수 있음
    }

    // 사용자별 TOP 10
    const { data: userReports } = await supabase
      .from("ai_generated_reports")
      .select("user_id");

    const userCounts = new Map<string, number>();
    for (const row of userReports || []) {
      const uid = row.user_id as string;
      userCounts.set(uid, (userCounts.get(uid) || 0) + 1);
    }

    const topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalReports: totalReports || 0,
      monthlyReports: monthlyReports || 0,
      avgGenerationTimeMs,
      templatePopularity,
      topUsers,
    };
  } catch (error) {
    console.error("리포트 통계 조회 실패:", error);
    return EMPTY_STATS;
  }
}
