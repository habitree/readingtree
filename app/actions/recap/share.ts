"use server";

/**
 * 월간 독서결산 공유 server actions (스탬프 stamps/share.ts 미러).
 *
 * - getRecapForShare(shareId): 공유 다이얼로그/공개 페이지용. RLS(공개 OR 본인)로 권한 처리.
 * - setRecapPublic(shareId, isPublic): 본인 only.
 * - getRecapAiCaption(shareId): AI 한줄평 지연 생성 + 캐시.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { isValidUUID } from "@/lib/utils/validation";
import type { RecapShareData, RecapStats, RecapHighlights } from "./types";

interface RecapShareRow {
  user_id: string;
  share_id: string;
  is_public: boolean;
  share_version: number;
  year: number;
  month: number;
  stats: RecapStats;
  highlights: RecapHighlights;
  ai_caption: string | null;
}

/**
 * 공유용 결산 조회. RLS가 권한 처리: 공개 OR 본인만 row 반환.
 * 비공개·없음 → null. anon 컨텍스트에서도 동작.
 */
export async function getRecapForShare(shareId: string): Promise<RecapShareData | null> {
  if (!shareId || !isValidUUID(shareId)) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_recaps")
    .select("user_id, share_id, is_public, share_version, year, month, stats, highlights, ai_caption")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as RecapShareRow;

  // 사용자 표시 정보 (best-effort)
  let profile: RecapShareData["profile"] = null;
  try {
    const { data: user } = await supabase
      .from("users")
      .select("name, avatar_url")
      .eq("id", row.user_id)
      .maybeSingle();
    if (user) profile = { name: user.name ?? null, avatarUrl: user.avatar_url ?? null };
  } catch {
    // anon 등에서 실패 시 무시
  }

  return {
    shareId: row.share_id,
    userId: row.user_id,
    isPublic: !!row.is_public,
    shareVersion: row.share_version ?? 1,
    year: row.year,
    month: row.month,
    stats: row.stats,
    highlights: row.highlights,
    aiCaption: row.ai_caption ?? null,
    profile,
  };
}

/** 공개 상태 토글. 본인만. */
export async function setRecapPublic(
  shareId: string,
  isPublic: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!shareId || !isValidUUID(shareId)) return { success: false, error: "잘못된 결산 ID" };

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("monthly_recaps")
    .update({ is_public: isPublic })
    .eq("share_id", shareId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * AI 한줄평 지연 생성. 캐시가 있으면 반환, 없으면 Gemini로 생성 후 저장.
 * 본인 또는 공개 결산에 한해 동작(RLS). 실패 시 null.
 */
export async function getRecapAiCaption(shareId: string): Promise<string | null> {
  if (!shareId || !isValidUUID(shareId)) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_recaps")
    .select("user_id, year, month, stats, highlights, ai_caption")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as RecapShareRow;
  if (row.ai_caption) return row.ai_caption;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const caption = await generateCaption(apiKey, row);
  if (!caption) return null;

  // 캐시 저장 (본인일 때만 RLS 통과; 실패해도 캡션은 반환)
  await supabase.from("monthly_recaps").update({ ai_caption: caption }).eq("share_id", shareId);
  return caption;
}

async function generateCaption(apiKey: string, row: RecapShareRow): Promise<string | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const s = row.stats;
    const h = row.highlights;
    const minutes = Math.round(s.totalReadingSeconds / 60);
    const prompt = `다음은 한 독자의 ${row.year}년 ${row.month}월 독서 결산입니다. 이 사람의 한 달을 따뜻하게 격려하고 다음 달 독서를 응원하는 한 문장을 작성하세요.
한 문장, 40자 이내, 친근한 어투, 특수문자·이모지 금지.

- 페르소나: ${h.personaTitle}
- 완독: ${s.completedBooks}권 / 기록: ${s.totalNotes}개 / 독서시간: ${minutes}분
- 기록한 날: ${s.activeDays}일 / 최대 연속: ${s.maxStreakInMonth}일
- 이달의 책: ${h.topBook?.title ?? "없음"}

예시: "꾸준함이 쌓여 멋진 한 달을 만들었네요. 다음 달도 함께 읽어요."`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/^["']|["']$/g, "").slice(0, 80);
    return text || null;
  } catch (e) {
    console.error("[getRecapAiCaption] 생성 오류:", e);
    return null;
  }
}
