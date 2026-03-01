"use server";

import { requireAdmin } from "./_shared";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// 건당 예상 단가 (원) - API 호출 비용 기준
const COST_PER_AI_CHAT = 0.5;
const COST_PER_OCR = 2.7;
const COST_PER_AI_REPORT = 1.5;

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

function calcCost(aiChat: number, ocr: number, aiReport: number): number {
  return Math.round(
    aiChat * COST_PER_AI_CHAT +
    ocr * COST_PER_OCR +
    aiReport * COST_PER_AI_REPORT
  );
}

/**
 * 전체 요약 통계
 * - AI 채팅: chat_messages (role='assistant') 카운트
 * - OCR: ocr_logs 카운트
 * - 리포트: ai_generated_reports 카운트
 */
export async function getAIUsageSummary(): Promise<AIUsageSummary> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 병렬 쿼리: 전체 + 이번 달
  const [
    { count: totalAiChat },
    { count: monthAiChat },
    { count: totalOcr },
    { count: monthOcr },
    { count: totalAiReport },
    { count: monthAiReport },
  ] = await Promise.all([
    // AI 채팅 - assistant 응답 수 = API 호출 수
    supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "assistant"),
    supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "assistant")
      .gte("created_at", monthStart),
    // OCR
    supabase
      .from("ocr_logs")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("ocr_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    // AI 리포트
    supabase
      .from("ai_generated_reports")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("ai_generated_reports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
  ]);

  const tAiChat = totalAiChat ?? 0;
  const tOcr = totalOcr ?? 0;
  const tAiReport = totalAiReport ?? 0;
  const mAiChat = monthAiChat ?? 0;
  const mOcr = monthOcr ?? 0;
  const mAiReport = monthAiReport ?? 0;

  return {
    totalAiChat: tAiChat,
    totalOcr: tOcr,
    totalAiReport: tAiReport,
    monthAiChat: mAiChat,
    monthOcr: mOcr,
    monthAiReport: mAiReport,
    monthEstimatedCost: calcCost(mAiChat, mOcr, mAiReport),
    totalEstimatedCost: calcCost(tAiChat, tOcr, tAiReport),
  };
}

/**
 * 사용자별 사용량 테이블
 * chat_sessions로 사용자별 AI 채팅 집계, ocr_logs/ai_generated_reports에서 user_id 집계
 */
export async function getAIUsageByUser(): Promise<AIUsageByUser[]> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 병렬로 3개 테이블 사용자별 집계
  const [chatResult, ocrResult, reportResult] = await Promise.all([
    // AI 채팅: chat_sessions의 message_count 합산 (assistant 메시지 ≈ message_count / 2)
    supabase
      .from("chat_sessions")
      .select("user_id, message_count"),
    // OCR
    supabase
      .from("ocr_logs")
      .select("user_id"),
    // 리포트
    supabase
      .from("ai_generated_reports")
      .select("user_id"),
  ]);

  // user_id별 집계
  const userMap = new Map<
    string,
    { aiChat: number; ocr: number; aiReport: number }
  >();

  const getOrCreate = (userId: string) => {
    const existing = userMap.get(userId);
    if (existing) return existing;
    const entry = { aiChat: 0, ocr: 0, aiReport: 0 };
    userMap.set(userId, entry);
    return entry;
  };

  // AI 채팅: message_count / 2 ≈ assistant 응답 수
  if (chatResult.data) {
    for (const session of chatResult.data) {
      const entry = getOrCreate(session.user_id);
      entry.aiChat += Math.floor((session.message_count ?? 0) / 2);
    }
  }

  // OCR
  if (ocrResult.data) {
    for (const log of ocrResult.data) {
      getOrCreate(log.user_id).ocr++;
    }
  }

  // 리포트
  if (reportResult.data) {
    for (const report of reportResult.data) {
      getOrCreate(report.user_id).aiReport++;
    }
  }

  if (userMap.size === 0) return [];

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
      estimatedCost: calcCost(counts.aiChat, counts.ocr, counts.aiReport),
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
  const sinceISO = sixMonthsAgo.toISOString();

  // 병렬로 3개 테이블 조회
  const [chatResult, ocrResult, reportResult] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("created_at")
      .eq("role", "assistant")
      .gte("created_at", sinceISO),
    supabase
      .from("ocr_logs")
      .select("created_at")
      .gte("created_at", sinceISO),
    supabase
      .from("ai_generated_reports")
      .select("created_at")
      .gte("created_at", sinceISO),
  ]);

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

  const addToMonth = (createdAt: string, field: "aiChat" | "ocr" | "aiReport") => {
    const d = new Date(createdAt);
    const entry = months.find(
      (m) => m.year === d.getFullYear() && parseInt(m.month) - 1 === d.getMonth()
    );
    if (entry) entry[field]++;
  };

  chatResult.data?.forEach((r) => addToMonth(r.created_at, "aiChat"));
  ocrResult.data?.forEach((r) => addToMonth(r.created_at, "ocr"));
  reportResult.data?.forEach((r) => addToMonth(r.created_at, "aiReport"));

  return months;
}
