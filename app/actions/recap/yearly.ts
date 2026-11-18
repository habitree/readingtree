"use server";

/**
 * 연간 독서결산 조회·스냅샷·공개 전환 (REQ-0014).
 *
 * - getYearlyRecapForView(year): /recap/year/[year] 진입점.
 *     게스트 → 샘플 데모(스냅샷·공유 없음)
 *     올해 → 12월(또는 미리보기)에만 열리고, 볼 때마다 재계산 후 스냅샷 갱신
 *     지난 해 → 다음 해 1월 1일(KST) 이후 생성된 스냅샷이 있으면 확정본, 없으면 한 번 계산해 확정
 * - setYearlyRecapPublic(shareId, isPublic): 본인만.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/app/actions/auth";
import { getSampleUserId } from "@/app/actions/sample";
import { isValidUUID } from "@/lib/utils/validation";
import { getKSTYearMonth, kstMonthStart } from "@/lib/utils/timezone";
import { isYearlyRecapOpen } from "@/lib/feature-flags";
import { computeYearlyRecapForUser } from "./compute-yearly";
import type { YearlyRecapComputed } from "@/lib/recap/yearly";

interface YearlyRecapRow {
  id: string;
  share_id: string;
  year: number;
  stats: YearlyRecapComputed["stats"];
  highlights: YearlyRecapComputed["highlights"];
  is_public: boolean;
  share_version: number;
  generated_at: string;
}

export interface YearlyRecapShareInfo {
  shareId: string;
  isPublic: boolean;
  shareVersion: number;
}

export type YearlyRecapView =
  | { status: "locked"; year: number }
  | {
      status: "ok";
      year: number;
      computed: YearlyRecapComputed;
      /** 게스트·빈 결산이면 null */
      share: YearlyRecapShareInfo | null;
      userName: string | null;
      isGuest: boolean;
    };

function toShareInfo(row: YearlyRecapRow): YearlyRecapShareInfo {
  return { shareId: row.share_id, isPublic: row.is_public, shareVersion: row.share_version };
}

/** 스냅샷 UPSERT. 집계가 같으면 share_version 을 올리지 않는다. is_public·share_id 는 보존. */
async function upsertYearlySnapshot(
  supabase: SupabaseClient,
  userId: string,
  computed: YearlyRecapComputed,
  existing: YearlyRecapRow | null,
  /** 지난 해 확정용: 집계가 같아도 generated_at 을 갱신한다 */
  finalize: boolean,
): Promise<YearlyRecapRow | null> {
  if (existing) {
    const unchanged =
      JSON.stringify(existing.stats) === JSON.stringify(computed.stats) &&
      JSON.stringify(existing.highlights) === JSON.stringify(computed.highlights);
    if (unchanged && !finalize) return existing;
    const generatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("yearly_recaps")
      .update(
        unchanged
          ? { generated_at: generatedAt }
          : {
              stats: computed.stats,
              highlights: computed.highlights,
              share_version: (existing.share_version ?? 1) + 1,
              generated_at: generatedAt,
            },
      )
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) return null;
    return data as YearlyRecapRow;
  }

  const { data, error } = await supabase
    .from("yearly_recaps")
    .insert({ user_id: userId, year: computed.year, stats: computed.stats, highlights: computed.highlights })
    .select("*")
    .single();
  if (error || !data) return null;
  return data as YearlyRecapRow;
}

export async function getYearlyRecapForView(year: number): Promise<YearlyRecapView | null> {
  const current = getKSTYearMonth();
  if (!Number.isInteger(year) || year < 2000 || year > current.year) return null;
  if (!isYearlyRecapOpen(year)) return { status: "locked", year };

  const user = await getCurrentUser();

  if (!user) {
    const sampleId = await getSampleUserId();
    if (!sampleId) return null;
    const computed = await computeYearlyRecapForUser(createAdminSupabaseClient(), sampleId, year);
    return { status: "ok", year, computed, share: null, userName: null, isGuest: true };
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: existingData }, { data: profile }] = await Promise.all([
    supabase.from("yearly_recaps").select("*").eq("user_id", user.id).eq("year", year).maybeSingle(),
    supabase.from("users").select("name").eq("id", user.id).maybeSingle(),
  ]);
  const existing = (existingData ?? null) as YearlyRecapRow | null;
  const userName = (profile as { name: string | null } | null)?.name ?? null;

  // 지난 해 + 해가 끝난 뒤 생성된 스냅샷 → 확정본
  const yearClosedAt = kstMonthStart(year + 1, 1).getTime();
  if (existing && year < current.year && new Date(existing.generated_at).getTime() >= yearClosedAt) {
    const computed: YearlyRecapComputed = {
      year,
      stats: existing.stats,
      highlights: existing.highlights,
      isEmpty:
        existing.stats.totalNotes === 0 &&
        existing.stats.sessionCount === 0 &&
        existing.stats.completedBooks === 0 &&
        existing.stats.activeDays === 0,
    };
    return {
      status: "ok",
      year,
      computed,
      share: computed.isEmpty ? null : toShareInfo(existing),
      userName,
      isGuest: false,
    };
  }

  const computed = await computeYearlyRecapForUser(supabase, user.id, year);
  // 빈 결산은 저장하지 않는다(기존 스냅샷이 있으면 갱신은 한다).
  const row = computed.isEmpty && !existing ? null : await upsertYearlySnapshot(supabase, user.id, computed, existing, year < current.year);

  return {
    status: "ok",
    year,
    computed,
    share: row && !computed.isEmpty ? toShareInfo(row) : null,
    userName,
    isGuest: false,
  };
}

/** 공개 상태 토글. 본인만. */
export async function setYearlyRecapPublic(
  shareId: string,
  isPublic: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!shareId || !isValidUUID(shareId)) return { success: false, error: "잘못된 결산 ID" };

  const user = await getCurrentUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("yearly_recaps")
    .update({ is_public: isPublic })
    .eq("share_id", shareId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
