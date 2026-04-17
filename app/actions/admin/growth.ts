"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "./_shared";

/**
 * 관리자 성장 대시보드용 집계 쿼리 모음.
 * 모든 함수는 관리자 권한 필수.
 */

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export interface GrowthSummary {
  dau: number; // today (KST 기준 today 00:00~)
  wau: number; // 7 days
  mau: number; // 30 days
  newSignupsToday: number;
  newSignups7d: number;
  activeUsers7d: number;
}

/**
 * DAU / WAU / MAU 요약.
 * unique user_id 기반. 관리자 제외.
 */
export async function getGrowthSummary(): Promise<GrowthSummary> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data: adminUsers } = await admin
    .from("users")
    .select("id")
    .eq("is_admin", true);
  const adminIds = new Set((adminUsers ?? []).map((u) => u.id));

  const todayStart = daysAgoISO(0);
  const week = daysAgoISO(7);
  const month = daysAgoISO(30);

  const { data: logs } = await admin
    .from("access_logs")
    .select("user_id, created_at")
    .gte("created_at", month);

  const rows = (logs ?? []).filter(
    (l) => l.user_id && !adminIds.has(l.user_id as string),
  );

  const dauSet = new Set<string>();
  const wauSet = new Set<string>();
  const mauSet = new Set<string>();
  for (const row of rows) {
    const uid = row.user_id as string;
    mauSet.add(uid);
    if (row.created_at >= week) wauSet.add(uid);
    if (row.created_at >= todayStart) dauSet.add(uid);
  }

  const { count: newSignupsToday } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayStart)
    .eq("is_admin", false);

  const { count: newSignups7d } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", week)
    .eq("is_admin", false);

  return {
    dau: dauSet.size,
    wau: wauSet.size,
    mau: mauSet.size,
    newSignupsToday: newSignupsToday ?? 0,
    newSignups7d: newSignups7d ?? 0,
    activeUsers7d: wauSet.size,
  };
}

export interface ShareMetricsRow {
  channel: string;
  count: number;
}

/**
 * 최근 30일 공유 이벤트 채널별 집계.
 */
export async function getShareMetrics(): Promise<{
  byChannel: ShareMetricsRow[];
  byKind: ShareMetricsRow[];
  total: number;
}> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("share_events")
    .select("channel, kind")
    .gte("created_at", daysAgoISO(30));

  const rows = data ?? [];

  const channelMap = new Map<string, number>();
  const kindMap = new Map<string, number>();
  for (const row of rows) {
    channelMap.set(row.channel, (channelMap.get(row.channel) ?? 0) + 1);
    kindMap.set(row.kind, (kindMap.get(row.kind) ?? 0) + 1);
  }

  return {
    byChannel: [...channelMap.entries()]
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count),
    byKind: [...kindMap.entries()]
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count),
    total: rows.length,
  };
}

export interface ReferralMetrics {
  total: number;
  pending: number;
  completed: number;
  conversionRate: number; // completed / total
  monthly: number; // 이번 달 completed
}

/**
 * 레퍼럴 전환율 요약.
 */
export async function getReferralMetrics(): Promise<ReferralMetrics> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("referrals")
    .select("status, completed_at, created_at");

  const rows = data ?? [];
  const completed = rows.filter((r) => r.status === "completed").length;
  const total = rows.length;
  const conversionRate = total > 0 ? completed / total : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthly = rows.filter(
    (r) => r.status === "completed" && r.completed_at && r.completed_at >= monthStart,
  ).length;

  return {
    total,
    pending: rows.filter((r) => r.status === "pending").length,
    completed,
    conversionRate,
    monthly,
  };
}

export interface SubscriptionFunnel {
  totalUsers: number;
  activeSubscribers: number;
  conversionRate: number;
}

export async function getSubscriptionFunnel(): Promise<SubscriptionFunnel> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { count: totalUsers } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", false);

  const { count: activeSubscribers } = await admin
    .from("user_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const total = totalUsers ?? 0;
  const active = activeSubscribers ?? 0;
  return {
    totalUsers: total,
    activeSubscribers: active,
    conversionRate: total > 0 ? active / total : 0,
  };
}

export interface PointFlowRow {
  date: string;
  earned: number;
  spent: number;
}

/**
 * 최근 7일 포인트 흐름 (적립 / 차감 분리).
 */
export async function getPointFlow(): Promise<PointFlowRow[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("point_transactions")
    .select("final_points, created_at")
    .gte("created_at", daysAgoISO(7));

  const rows = data ?? [];
  const map = new Map<string, { earned: number; spent: number }>();
  for (const row of rows) {
    const date = (row.created_at as string).slice(0, 10);
    const entry = map.get(date) ?? { earned: 0, spent: 0 };
    const amount = row.final_points as number;
    if (amount >= 0) entry.earned += amount;
    else entry.spent += Math.abs(amount);
    map.set(date, entry);
  }

  return [...map.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
