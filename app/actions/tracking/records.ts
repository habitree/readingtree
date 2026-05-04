"use server";

/**
 * 기록 세션 이벤트 트래킹 (기록 기능 전면 개편 Phase 7)
 *
 * 4종 이벤트:
 *   record_started     — startReadingSession 성공 시
 *   record_ended       — endReadingSession 성공 시
 *   record_abandoned   — cancelActiveSession(abandoned) + reapOrphanSessions
 *   detail_added       — addNoteToSession 성공 시
 *
 * 패턴: share_events와 동일 — 무음 실패, service_role INSERT.
 * 마이그레이션: doc/database/migration-202605041100__tracking__record_events.sql
 */

import { createAdminSupabaseClient } from "@/lib/supabase/server";

export type RecordEventName =
  | "record_started"
  | "record_ended"
  | "record_abandoned"
  | "detail_added";

interface RecordEventInput {
  event: RecordEventName;
  userId: string;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * 기록 세션 이벤트 1건 기록.
 * 실패해도 사용자 플로우를 막지 않는다 (무음 실패 — share_events 패턴).
 */
export async function recordRecordEvent(input: RecordEventInput): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.from("record_events").insert({
      user_id: input.userId,
      event: input.event,
      session_id: input.sessionId ?? null,
      metadata: input.metadata ?? null,
    });

    if (error && process.env.NODE_ENV !== "production") {
      console.warn("[recordRecordEvent] 실패:", error.message);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[recordRecordEvent] 예외:", err);
    }
  }
}
