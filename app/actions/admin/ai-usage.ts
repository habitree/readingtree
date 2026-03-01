"use server";

import { requireAdmin } from "./_shared";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// 단가 (원)
const COST_PER_AI_CHAT = 0.5;
const COST_PER_OCR = 2.7;
const COST_PER_AI_REPORT = 1.5;

const AI_ACTION_TYPES = ["ai_chat_spend", "ocr_spend", "ai_report_spend"] as const;

export interface AIUsageSummary {
  totalAiChat: number;
  totalOcr: number;
  totalAiReport: number;
  monthAiChat: number;
  monthOcr: number;
  monthAiReport: number;
  monthEstimatedCost: number;
  totalEstimatedCost: number;
}

export interface AIUsageByUser {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  aiChatCount: number;
  ocrCount: number;
  aiReportCount: number;
  totalCount: number;
  estimatedCost: number;
}

export interface AIUsageMonthlyTrend {
  month: string;
  year: number;
  aiChat: number;
  ocr: number;
  aiReport: number;
}

/**
 * 전체 요약 통계
 */
export async function getAIUsageSummary(): Promise<AIUsageSummary> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 전체 카운트
  const { data: totalData } = await supabase
    .from("point_transactions")
    .select("action_type")
    .in("action_type", [...AI_ACTION_TYPES]);

  // 이번 달 카운트
  const { data: monthData } = await supabase
    .from("point_transactions")
    .select("action_type")
    .in("action_type", [...AI_ACTION_TYPES])
    .gte("created_at", monthStart);

  const countByType = (data: Array<{ action_type: string }> | null, type: string) =>
    data?.filter((d) => d.action_type === type).length ?? 0;

  const totalAiChat = countByType(totalData, "ai_chat_spend");
  const totalOcr = countByType(totalData, "ocr_spend");
  const totalAiReport = countByType(totalData, "ai_report_spend");

  const monthAiChat = countByType(monthData, "ai_chat_spend");
  const monthOcr = countByType(monthData, "ocr_spend");
  const monthAiReport = countByType(monthData, "ai_report_spend");

  return {
    totalAiChat,
    totalOcr,
    totalAiReport,
    monthAiChat,
    monthOcr,
    monthAiReport,
    monthEstimatedCost: Math.round(
      monthAiChat * COST_PER_AI_CHAT +
      monthOcr * COST_PER_OCR +
      monthAiReport * COST_PER_AI_REPORT
    ),
    totalEstimatedCost: Math.round(
      totalAiChat * COST_PER_AI_CHAT +
      totalOcr * COST_PER_OCR +
      totalAiReport * COST_PER_AI_REPORT
    ),
  };
}

/**
 * 사용자별 사용량 테이블
 */
export async function getAIUsageByUser(): Promise<AIUsageByUser[]> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("user_id, action_type")
    .in("action_type", [...AI_ACTION_TYPES]);

  if (!transactions || transactions.length === 0) return [];

  // user_id별 집계
  const userMap = new Map<
    string,
    { aiChat: number; ocr: number; aiReport: number }
  >();

  for (const tx of transactions) {
    const existing = userMap.get(tx.user_id) ?? { aiChat: 0, ocr: 0, aiReport: 0 };
    if (tx.action_type === "ai_chat_spend") existing.aiChat++;
    else if (tx.action_type === "ocr_spend") existing.ocr++;
    else if (tx.action_type === "ai_report_spend") existing.aiReport++;
    userMap.set(tx.user_id, existing);
  }

  // 사용자 정보 조회
  const userIds = Array.from(userMap.keys());
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, avatar_url")
    .in("id", userIds);

  const usersById = new Map(users?.map((u) => [u.id, u]) ?? []);

  const result: AIUsageByUser[] = [];
  for (const [userId, counts] of userMap) {
    const user = usersById.get(userId);
    const totalCount = counts.aiChat + counts.ocr + counts.aiReport;
    result.push({
      userId,
      name: user?.name ?? "알 수 없음",
      email: user?.email ?? "",
      avatarUrl: user?.avatar_url ?? null,
      aiChatCount: counts.aiChat,
      ocrCount: counts.ocr,
      aiReportCount: counts.aiReport,
      totalCount,
      estimatedCost: Math.round(
        counts.aiChat * COST_PER_AI_CHAT +
        counts.ocr * COST_PER_OCR +
        counts.aiReport * COST_PER_AI_REPORT
      ),
    });
  }

  // 총 사용횟수 내림차순
  result.sort((a, b) => b.totalCount - a.totalCount);
  return result;
}

/**
 * 최근 6개월 월별 추이
 */
export async function getAIUsageMonthlyTrend(): Promise<AIUsageMonthlyTrend[]> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("action_type, created_at")
    .in("action_type", [...AI_ACTION_TYPES])
    .gte("created_at", sixMonthsAgo.toISOString())
    .order("created_at", { ascending: true });

  // 6개월 빈 배열 준비
  const months: AIUsageMonthlyTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: `${d.getMonth() + 1}월`,
      year: d.getFullYear(),
      aiChat: 0,
      ocr: 0,
      aiReport: 0,
    });
  }

  if (transactions) {
    for (const tx of transactions) {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = months.find(
        (m) => `${m.year}-${new Date(m.year, parseInt(m.month) - 1).getMonth()}` === key
      );
      if (!entry) continue;
      if (tx.action_type === "ai_chat_spend") entry.aiChat++;
      else if (tx.action_type === "ocr_spend") entry.ocr++;
      else if (tx.action_type === "ai_report_spend") entry.aiReport++;
    }
  }

  return months;
}
