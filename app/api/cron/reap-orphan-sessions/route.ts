/**
 * orphan 세션 자동 정리 크론 (B6).
 *
 * 사용자가 종료를 누르지 않아 12시간 넘게 in_progress 로 남은 reading_logs 세션을
 * abandoned 로 자동 전환한다. (기록 기능 개편 v1.0 위험표의 orphan 정리 항목)
 *
 * reapOrphanSessions(sessions.ts)는 현재 사용자 행만 정리(RLS)하므로,
 * 크론에서는 admin 클라이언트로 전체 사용자 orphan을 일괄 정리한다.
 *
 * 스케줄: vercel.json crons. CRON_SECRET을 Bearer 헤더로 검증.
 */

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { recordRecordEvent } from "@/app/actions/tracking/records";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** in_progress 임계값(시간) — reapOrphanSessions(ABANDON_HOURS)와 동일 */
const ABANDON_HOURS = 12;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - ABANDON_HOURS * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("reading_logs")
    .update({ status: "abandoned", ended_at: new Date().toISOString() })
    .eq("status", "in_progress")
    .lt("started_at", cutoff)
    .select("id, user_id");

  if (error) {
    console.error("[cron/reap-orphan] 실패:", error);
    return NextResponse.json({ error: "reap_failed" }, { status: 500 });
  }

  const closed = (data ?? []) as { id: string; user_id: string }[];

  // Phase 7 텔레메트리 — 자동 정리된 각 세션마다 abandoned 이벤트
  for (const row of closed) {
    void recordRecordEvent({
      event: "record_abandoned",
      userId: row.user_id,
      sessionId: row.id,
      metadata: { source: "auto_12h_cron" },
    });
  }

  return NextResponse.json({ closed: closed.length });
}
