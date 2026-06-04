/**
 * 월말 자동 월간 독서결산 생성 크론.
 *
 * 스케줄: 매월 1일 00:00 UTC (= 09:00 KST). 실행일 기준 "전월"을 결산한다.
 * vercel.json crons 에 등록. Vercel은 CRON_SECRET 환경변수를
 * `Authorization: Bearer <CRON_SECRET>` 헤더로 자동 부착한다.
 *
 * 동작:
 *   1) 전월에 활동(notes/reading_logs/완독) 있던 유저 수집
 *   2) 각 유저: computeRecapForUser → upsertRecapSnapshot (admin 클라이언트, RLS 우회)
 *   3) 빈 결산이 아니면 report_ready 알림 발송 (notification_prefs 존중은 createNotification 내부 처리)
 *
 * 스케일 주의: 유저 수가 많아지면 타임아웃(maxDuration) 내 배치 처리 또는
 * Vercel Queues 분할이 필요. 현재는 단순 순차 처리 + 유저별 에러 격리.
 */

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { computeRecapForUser } from "@/app/actions/recap/compute";
import { upsertRecapSnapshot } from "@/app/actions/recap/generate";
import { createNotification } from "@/app/actions/notifications";
import { kstMonthStart, kstMonthEnd } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** 실행 시점(KST) 기준 전월 {year, month} */
function previousKstMonth(): { year: number; month: number } {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  let year = kst.getUTCFullYear();
  let month = kst.getUTCMonth(); // 0-base 이므로 이미 "전월"의 1-base 값
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return { year, month };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month } = previousKstMonth();
  const start = kstMonthStart(year, month).toISOString();
  const end = kstMonthEnd(year, month).toISOString();
  const admin = createAdminSupabaseClient();

  // 전월 활동 유저 수집 (notes/reading_logs/완독 user_books)
  const userIds = new Set<string>();
  try {
    const [notesRes, logsRes, completedRes] = await Promise.all([
      admin.from("notes").select("user_id").gte("created_at", start).lte("created_at", end),
      admin.from("reading_logs").select("user_id").gte("started_at", start).lte("started_at", end),
      admin
        .from("user_books")
        .select("user_id")
        .eq("status", "completed")
        .gte("completed_at", start)
        .lte("completed_at", end),
    ]);
    for (const r of (notesRes.data ?? []) as { user_id: string }[]) userIds.add(r.user_id);
    for (const r of (logsRes.data ?? []) as { user_id: string }[]) userIds.add(r.user_id);
    for (const r of (completedRes.data ?? []) as { user_id: string }[]) userIds.add(r.user_id);
  } catch (e) {
    console.error("[cron/recap] 활동 유저 수집 실패:", e);
    return NextResponse.json({ error: "collect_failed" }, { status: 500 });
  }

  let generated = 0;
  let notified = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const computed = await computeRecapForUser(admin, userId, year, month);
      const record = await upsertRecapSnapshot(admin, userId, computed);
      if (!record) {
        failed += 1;
        continue;
      }
      generated += 1;

      if (!computed.isEmpty) {
        const res = await createNotification(userId, "report_ready", {
          title: `${month}월 독서결산이 도착했어요`,
          body: `${computed.highlights.personaTitle} · 완독 ${computed.stats.completedBooks}권`,
          actionUrl: `/stats?tab=recap&m=${year}-${String(month).padStart(2, "0")}`,
          referenceId: record.shareId,
          referenceType: "monthly_recap",
        });
        if (res.success) notified += 1;
      }
    } catch (e) {
      failed += 1;
      console.error(`[cron/recap] user ${userId} 처리 실패:`, e);
    }
  }

  return NextResponse.json({
    ok: true,
    period: `${year}-${String(month).padStart(2, "0")}`,
    users: userIds.size,
    generated,
    notified,
    failed,
  });
}
