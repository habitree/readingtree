"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";

/**
 * 공유 트래킹.
 *
 * 완독 카드·노트·리포트 등에서 공유 버튼 클릭 시 호출한다.
 * 마이그레이션: doc/database/migration-202604170010__tracking__share_events.sql
 */

export type ShareEventKind = "note" | "report" | "completion" | "bookshelf";
export type ShareEventChannel =
  | "kakao"
  | "x"
  | "copy_link"
  | "native"
  | "download"
  | "instagram";

/**
 * 공유 이벤트 1건 기록. 실패해도 사용자 플로우를 막지 않는다 (무음 실패).
 *
 *   await recordShareEvent("completion", userBookId, "kakao");
 */
export async function recordShareEvent(
  kind: ShareEventKind,
  sourceId: string,
  channel: ShareEventChannel,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getCurrentUser();

    const { error } = await supabase.from("share_events").insert({
      user_id: user?.id ?? null,
      kind,
      source_id: sourceId,
      channel,
      metadata: metadata ?? null,
    });

    if (error && process.env.NODE_ENV !== "production") {
      console.warn("[recordShareEvent] 실패:", error.message);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[recordShareEvent] 예외:", error);
    }
  }
}
