"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import type { ActionResult } from "@/types/action-result";
import { fail, ok, failFromException } from "@/lib/errors";

export type NotificationKind =
  | "group_invite"
  | "note_comment"
  | "points_milestone"
  | "level_up"
  | "completion_celebration"
  | "report_ready"
  | "mission_reminder"
  | "system";

export interface NotificationRecord {
  id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  action_url: string | null;
  reference_id: string | null;
  reference_type: string | null;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationPrefs {
  group_invite: boolean;
  note_comment: boolean;
  points_milestone: boolean;
  level_up: boolean;
  completion_celebration: boolean;
  report_ready: boolean;
  mission_reminder: boolean;
  group_all_comments: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  group_invite: true,
  note_comment: true,
  points_milestone: true,
  level_up: true,
  completion_celebration: true,
  report_ready: true,
  mission_reminder: false,
  group_all_comments: false,
};

function kindToPrefKey(kind: NotificationKind): keyof NotificationPrefs | null {
  switch (kind) {
    case "group_invite":
      return "group_invite";
    case "note_comment":
      return "note_comment";
    case "points_milestone":
      return "points_milestone";
    case "level_up":
      return "level_up";
    case "completion_celebration":
      return "completion_celebration";
    case "report_ready":
      return "report_ready";
    case "mission_reminder":
      return "mission_reminder";
    case "system":
      return null; // 시스템 알림은 항상 수신
  }
}

/**
 * 알림 생성 (서버 사이드 전용).
 * 호출자 인증 여부와 무관하게 admin 클라이언트로 INSERT — 다른 사용자에게 발신 가능.
 * 수신자의 notification_prefs 토글을 확인하여 OFF인 경우 무음으로 건너뜀.
 */
export async function createNotification(
  userId: string,
  kind: NotificationKind,
  payload: {
    title: string;
    body?: string;
    actionUrl?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<ActionResult<{ id: string } | null>> {
  try {
    const admin = createAdminSupabaseClient();

    // 사용자 설정 확인
    const { data: userRow } = await admin
      .from("users")
      .select("notification_prefs")
      .eq("id", userId)
      .maybeSingle();

    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      ...((userRow?.notification_prefs as Partial<NotificationPrefs>) ?? {}),
    };

    const prefKey = kindToPrefKey(kind);
    if (prefKey && prefs[prefKey] === false) {
      return ok(null);
    }

    const { data, error } = await admin
      .from("notifications")
      .insert({
        user_id: userId,
        kind,
        title: payload.title,
        body: payload.body ?? null,
        action_url: payload.actionUrl ?? null,
        reference_id: payload.referenceId ?? null,
        reference_type: payload.referenceType ?? null,
        metadata: payload.metadata ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return fail("INTERNAL_ERROR", {
        message: "알림 생성에 실패했어요",
        meta: { cause: error.message },
      });
    }

    return ok({ id: data.id });
  } catch (error) {
    return failFromException(error);
  }
}

/**
 * 내 알림 목록 조회.
 */
export async function listNotifications(options?: {
  limit?: number;
  onlyUnread?: boolean;
}): Promise<ActionResult<NotificationRecord[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED");

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 20);

    if (options?.onlyUnread) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;
    if (error) {
      return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
    }
    return ok((data ?? []) as NotificationRecord[]);
  } catch (error) {
    return failFromException(error);
  }
}

/**
 * 미읽음 개수 조회 (벨 배지용).
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;

    const supabase = await createServerSupabaseClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * 선택한 알림들을 읽음 처리.
 */
export async function markNotificationsAsRead(
  ids: string[],
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED");
    if (ids.length === 0) return ok();

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("id", ids)
      .is("read_at", null);

    if (error) {
      return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
    }

    revalidatePath("/");
    return ok();
  } catch (error) {
    return failFromException(error);
  }
}

/**
 * 모든 미읽음 알림을 읽음 처리.
 */
export async function markAllNotificationsAsRead(): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED");

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
    }

    revalidatePath("/");
    return ok();
  } catch (error) {
    return failFromException(error);
  }
}

/**
 * 알림 삭제.
 */
export async function deleteNotification(
  id: string,
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED");

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) {
      return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
    }

    return ok();
  } catch (error) {
    return failFromException(error);
  }
}

/**
 * 알림 설정 조회 (기본값 병합).
 */
export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const user = await getCurrentUser();
  if (!user) return DEFAULT_PREFS;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("notification_prefs")
    .eq("id", user.id)
    .maybeSingle();

  return {
    ...DEFAULT_PREFS,
    ...((data?.notification_prefs as Partial<NotificationPrefs>) ?? {}),
  };
}

/**
 * 알림 설정 일부 업데이트.
 */
export async function updateNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<ActionResult<NotificationPrefs>> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("UNAUTHORIZED");

    const current = await getNotificationPrefs();
    const next: NotificationPrefs = { ...current, ...patch };

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("users")
      .update({ notification_prefs: next })
      .eq("id", user.id);

    if (error) {
      return fail("INTERNAL_ERROR", { meta: { cause: error.message } });
    }

    revalidatePath("/");
    return ok(next);
  } catch (error) {
    return failFromException(error);
  }
}
