"use server";

/**
 * 월간 독서결산 생성/스냅샷 (DB 쓰기).
 *
 * - generateMonthlyRecap(year, month): 인앱 본인 생성/재생성 (UPSERT, share_version++).
 * - getRecapForView(year, month): /stats 섹션 진입점.
 *     인증 사용자 → 스냅샷 보장(현재 달은 재생성, 과거 달은 동결) 후 반환.
 *     게스트 → 샘플 데모 결산(스냅샷·공유 없음).
 * - upsertRecapSnapshot(supabase, userId, computed): 크론(admin)·인앱 공용 코어.
 */

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/app/actions/auth";
import { getSampleUserId } from "@/app/actions/sample";
import { computeRecapForUser } from "./compute";
import type { RecapComputed, RecapRecord } from "./types";

interface RecapRow {
  id: string;
  user_id: string;
  share_id: string;
  year: number;
  month: number;
  stats: RecapComputed["stats"];
  highlights: RecapComputed["highlights"];
  ai_caption: string | null;
  is_public: boolean;
  share_version: number;
  generated_at: string;
}

function rowToRecord(row: RecapRow): RecapRecord {
  return {
    id: row.id,
    userId: row.user_id,
    shareId: row.share_id,
    year: row.year,
    month: row.month,
    stats: row.stats,
    highlights: row.highlights,
    aiCaption: row.ai_caption,
    isPublic: row.is_public,
    shareVersion: row.share_version,
    generatedAt: row.generated_at,
  };
}

/** KST 기준 현재 연/월 */
function currentKstYearMonth(): { year: number; month: number } {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

/** (year, month)가 현재 KST 월보다 미래인지 */
function isFutureMonth(year: number, month: number): boolean {
  const cur = currentKstYearMonth();
  return year > cur.year || (year === cur.year && month > cur.month);
}
function isCurrentMonth(year: number, month: number): boolean {
  const cur = currentKstYearMonth();
  return year === cur.year && month === cur.month;
}

/**
 * 스냅샷 UPSERT 코어. 크론(admin 클라이언트)과 인앱(server 클라이언트) 양쪽에서 사용.
 * 충돌(이미 존재) 시: stats/highlights/generated_at 갱신 + share_version++ +
 * ai_caption 초기화(데이터가 바뀌었으므로 재생성 대상). is_public·share_id는 보존.
 */
export async function upsertRecapSnapshot(
  supabase: SupabaseClient,
  userId: string,
  computed: RecapComputed,
): Promise<RecapRecord | null> {
  const { data: existing } = await supabase
    .from("monthly_recaps")
    .select("*")
    .eq("user_id", userId)
    .eq("year", computed.year)
    .eq("month", computed.month)
    .maybeSingle();

  if (existing) {
    const existingRow = existing as RecapRow;
    // 집계 결과가 동일하면 write 생략 (share_version 증가·ai_caption 초기화 방지).
    const unchanged =
      JSON.stringify(existingRow.stats) === JSON.stringify(computed.stats) &&
      JSON.stringify(existingRow.highlights) === JSON.stringify(computed.highlights);
    if (unchanged) return rowToRecord(existingRow);

    const { data, error } = await supabase
      .from("monthly_recaps")
      .update({
        stats: computed.stats,
        highlights: computed.highlights,
        ai_caption: null,
        share_version: (existingRow.share_version ?? 1) + 1,
        generated_at: new Date().toISOString(),
      })
      .eq("id", existingRow.id)
      .select("*")
      .single();
    if (error || !data) return null;
    return rowToRecord(data as RecapRow);
  }

  const { data, error } = await supabase
    .from("monthly_recaps")
    .insert({
      user_id: userId,
      year: computed.year,
      month: computed.month,
      stats: computed.stats,
      highlights: computed.highlights,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return rowToRecord(data as RecapRow);
}

/** 인앱 본인 생성/재생성 */
export async function generateMonthlyRecap(
  year: number,
  month: number,
): Promise<{ success: true; recap: RecapRecord } | { success: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };
  if (isFutureMonth(year, month)) return { success: false, error: "미래의 달은 결산할 수 없어요." };

  const supabase = await createServerSupabaseClient();
  const computed = await computeRecapForUser(supabase, user.id, year, month);
  const record = await upsertRecapSnapshot(supabase, user.id, computed);
  if (!record) return { success: false, error: "결산 생성에 실패했어요." };

  revalidatePath("/stats");
  return { success: true, recap: record };
}

export interface RecapView {
  year: number;
  month: number;
  computed: RecapComputed;
  /** 공유 정보 (게스트·빈 달이면 null) */
  share: { shareId: string; isPublic: boolean; shareVersion: number; aiCaption: string | null } | null;
  isGuest: boolean;
}

/**
 * /stats "월간 결산" 섹션 진입점.
 * - 게스트: 샘플 데모 결산(스냅샷·공유 없음)
 * - 인증: 스냅샷 보장(현재 달=재생성, 과거 달=없으면 생성·있으면 동결) 후 반환
 */
export async function getRecapForView(year: number, month: number): Promise<RecapView | null> {
  if (isFutureMonth(year, month)) return null;

  const user = await getCurrentUser();

  // 게스트 데모
  if (!user) {
    const sampleId = await getSampleUserId();
    if (!sampleId) return null;
    const admin = createAdminSupabaseClient();
    const computed = await computeRecapForUser(admin, sampleId, year, month);
    return { year, month, computed, share: null, isGuest: true };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("monthly_recaps")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  // 과거 달 + 스냅샷 존재 → 동결된 스냅샷 그대로
  if (existing && !isCurrentMonth(year, month)) {
    const rec = rowToRecord(existing as RecapRow);
    return {
      year,
      month,
      computed: { year, month, stats: rec.stats, highlights: rec.highlights, isEmpty: isComputedEmpty(rec) },
      share: rec.shareVersion
        ? { shareId: rec.shareId, isPublic: rec.isPublic, shareVersion: rec.shareVersion, aiCaption: rec.aiCaption }
        : null,
      isGuest: false,
    };
  }

  // 현재 달 또는 스냅샷 없음 → 재계산 + UPSERT
  const computed = await computeRecapForUser(supabase, user.id, year, month);
  const record = await upsertRecapSnapshot(supabase, user.id, computed);

  return {
    year,
    month,
    computed,
    share: record && !computed.isEmpty
      ? { shareId: record.shareId, isPublic: record.isPublic, shareVersion: record.shareVersion, aiCaption: record.aiCaption }
      : null,
    isGuest: false,
  };
}

function isComputedEmpty(rec: RecapRecord): boolean {
  const s = rec.stats;
  return s.totalNotes === 0 && s.sessionCount === 0 && s.completedBooks === 0;
}
