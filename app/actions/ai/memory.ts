"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";

/**
 * 사용자의 AI 장기 기억 조회
 */
export async function getUserMemories(limit = 50): Promise<
  { memory_type: string; content: string }[]
> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("user_ai_memories")
    .select("memory_type, content")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("메모리 조회 실패:", error);
    return [];
  }

  return data ?? [];
}

/**
 * AI 메모리 저장 (upsert)
 * 같은 memory_type + content 조합이면 업데이트, 아니면 새로 생성
 */
export async function saveMemory(
  memoryType: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createServerSupabaseClient();

  // 동일 유형의 유사한 메모리가 있는지 확인
  const { data: existing } = await supabase
    .from("user_ai_memories")
    .select("id, content")
    .eq("user_id", user.id)
    .eq("memory_type", memoryType)
    .limit(10);

  // 동일 내용이 이미 있으면 updated_at만 갱신
  const duplicate = existing?.find((m) => m.content === content);
  if (duplicate) {
    await supabase
      .from("user_ai_memories")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", duplicate.id);
    return;
  }

  // 최대 50개 제한 — 초과 시 가장 오래된 것 삭제
  const { count } = await supabase
    .from("user_ai_memories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count >= 50) {
    const { data: oldest } = await supabase
      .from("user_ai_memories")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: true })
      .limit(1);

    if (oldest?.[0]) {
      await supabase
        .from("user_ai_memories")
        .delete()
        .eq("id", oldest[0].id);
    }
  }

  // 새 메모리 삽입
  const { error } = await supabase
    .from("user_ai_memories")
    .insert({
      user_id: user.id,
      memory_type: memoryType,
      content,
      metadata: metadata ?? null,
    });

  if (error) {
    console.error("메모리 저장 실패:", error);
  }
}

/**
 * AI 메모리 삭제
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createServerSupabaseClient();

  await supabase
    .from("user_ai_memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", user.id);
}

/**
 * 모든 AI 메모리 삭제
 */
export async function deleteAllMemories(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createServerSupabaseClient();

  await supabase
    .from("user_ai_memories")
    .delete()
    .eq("user_id", user.id);
}
