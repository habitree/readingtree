"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "../auth";
import type {
  ReportReactionType,
  ReportReactionCounts,
} from "@/types/ai/report";

/**
 * 반응 추가 (로그인/비로그인 모두 가능)
 */
export async function addReportReaction(
  reportId: string,
  reactionType: ReportReactionType,
  anonymousId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch {
      // 비로그인 상태
    }

    if (!userId && !anonymousId) {
      return { success: false, error: "식별자가 필요합니다." };
    }

    const { data, error } = await supabase.rpc("add_report_reaction", {
      p_report_id: reportId,
      p_reaction_type: reactionType,
      p_user_id: userId,
      p_anonymous_id: userId ? null : anonymousId,
    });

    if (error) throw error;
    return { success: data === true };
  } catch {
    return { success: false, error: "반응 추가에 실패했습니다." };
  }
}

/**
 * 반응 제거
 */
export async function removeReportReaction(
  reportId: string,
  reactionType: ReportReactionType,
  anonymousId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch {
      // 비로그인 상태
    }

    if (!userId && !anonymousId) {
      return { success: false, error: "식별자가 필요합니다." };
    }

    const { data, error } = await supabase.rpc("remove_report_reaction", {
      p_report_id: reportId,
      p_reaction_type: reactionType,
      p_user_id: userId,
      p_anonymous_id: userId ? null : anonymousId,
    });

    if (error) throw error;
    return { success: data === true };
  } catch {
    return { success: false, error: "반응 제거에 실패했습니다." };
  }
}

/**
 * 리포트별 반응 집계 조회
 */
export async function getReportReactionCounts(
  reportId: string
): Promise<ReportReactionCounts> {
  const defaults: ReportReactionCounts = {
    impressive: 0,
    want_to_read: 0,
    insightful: 0,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_report_reaction_counts", {
      p_report_id: reportId,
    });

    if (error || !data) return defaults;

    for (const row of data as Array<{ reaction_type: ReportReactionType; count: unknown }>) {
      const key = row.reaction_type;
      if (key in defaults) {
        defaults[key] = Number(row.count);
      }
    }

    return defaults;
  } catch {
    return defaults;
  }
}

/**
 * 특정 유저의 반응 목록 조회 (비로그인: anonymous_id 기반)
 */
export async function getUserReportReactions(
  reportId: string,
  anonymousId?: string
): Promise<ReportReactionType[]> {
  try {
    const supabase = await createServerSupabaseClient();

    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.id ?? null;
    } catch {
      // 비로그인
    }

    if (!userId && !anonymousId) return [];

    const { data, error } = await supabase.rpc("get_user_report_reactions", {
      p_report_id: reportId,
      p_user_id: userId,
      p_anonymous_id: userId ? null : anonymousId,
    });

    if (error || !data) return [];

    return (data as Array<{ reaction_type: ReportReactionType }>).map(
      (r) => r.reaction_type
    );
  } catch {
    return [];
  }
}
