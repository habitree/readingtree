"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "./_shared";

// ============================================================
// 로그 기록 함수 (서버에서 호출)
// ============================================================

interface LoginLogInput {
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  provider: "email" | "kakao" | "google" | "unknown";
  success: boolean;
  errorMessage?: string | null;
}

export async function recordLoginLog(input: LoginLogInput) {
  try {
    const admin = createAdminSupabaseClient();
    await admin.from("login_logs").insert({
      user_id: input.userId ?? null,
      email: input.email ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      provider: input.provider,
      success: input.success,
      error_message: input.errorMessage ?? null,
    });
  } catch {
    // 로그 기록 실패해도 원래 동작에 영향 없도록 무시
  }
}

interface AccessLogInput {
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  path: string;
  referer?: string | null;
}

export async function recordAccessLog(input: AccessLogInput) {
  try {
    const admin = createAdminSupabaseClient();
    await admin.from("access_logs").insert({
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      path: input.path,
      referer: input.referer ?? null,
    });
  } catch {
    // 로그 기록 실패해도 원래 동작에 영향 없도록 무시
  }
}

// ============================================================
// 관리자 조회 함수
// ============================================================

export interface TrackingSummary {
  uniqueVisitors: number;
  activeIPs: number;
  pageViews: number;
  loginAttempts: number;
}

export async function getTrackingSummary(): Promise<TrackingSummary> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [accessRes, loginRes] = await Promise.all([
    admin
      .from("access_logs")
      .select("user_id, ip_address, id")
      .gte("created_at", todayISO),
    admin
      .from("login_logs")
      .select("id")
      .gte("created_at", todayISO),
  ]);

  const accessLogs = accessRes.data ?? [];
  const loginLogs = loginRes.data ?? [];

  const uniqueUsers = new Set(
    accessLogs.filter((l) => l.user_id).map((l) => l.user_id)
  );
  const uniqueIPs = new Set(
    accessLogs.filter((l) => l.ip_address).map((l) => l.ip_address)
  );

  return {
    uniqueVisitors: uniqueUsers.size,
    activeIPs: uniqueIPs.size,
    pageViews: accessLogs.length,
    loginAttempts: loginLogs.length,
  };
}

export interface LoginLogEntry {
  id: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  provider: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  user_name?: string | null;
}

export async function getLoginLogs(limit = 100): Promise<LoginLogEntry[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("login_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  // user_id로 users 테이블에서 이름 조회
  const userIds = [...new Set(data.filter((d) => d.user_id).map((d) => d.user_id!))];
  let userMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await admin
      .from("users")
      .select("id, name")
      .in("id", userIds);
    if (users) {
      userMap = new Map(users.map((u) => [u.id, u.name]));
    }
  }

  return data.map((row) => ({
    ...row,
    user_name: row.user_id ? userMap.get(row.user_id) ?? null : null,
  }));
}

export interface AccessLogEntry {
  id: string;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  path: string;
  referer: string | null;
  created_at: string;
  user_name?: string | null;
}

export async function getAccessLogs(limit = 200): Promise<AccessLogEntry[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("access_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  const userIds = [...new Set(data.filter((d) => d.user_id).map((d) => d.user_id!))];
  let userMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: users } = await admin
      .from("users")
      .select("id, name")
      .in("id", userIds);
    if (users) {
      userMap = new Map(users.map((u) => [u.id, u.name]));
    }
  }

  return data.map((row) => ({
    ...row,
    user_name: row.user_id ? userMap.get(row.user_id) ?? null : null,
  }));
}

export interface PageViewRanking {
  path: string;
  count: number;
}

export async function getPageViewRanking(): Promise<PageViewRanking[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  // 최근 7일간 인기 페이지
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await admin
    .from("access_logs")
    .select("path")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (!data || data.length === 0) return [];

  // path별 카운트 집계
  const countMap = new Map<string, number>();
  for (const row of data) {
    countMap.set(row.path, (countMap.get(row.path) ?? 0) + 1);
  }

  return [...countMap.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export interface IPActivitySummary {
  ip_address: string;
  pageViews: number;
  loginAttempts: number;
  lastAccess: string;
  userNames: string[];
}

export async function getIPActivitySummary(): Promise<IPActivitySummary[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const [accessRes, loginRes] = await Promise.all([
    admin
      .from("access_logs")
      .select("ip_address, user_id, created_at")
      .gte("created_at", since)
      .not("ip_address", "is", null),
    admin
      .from("login_logs")
      .select("ip_address, user_id")
      .gte("created_at", since)
      .not("ip_address", "is", null),
  ]);

  const accessLogs = accessRes.data ?? [];
  const loginLogs = loginRes.data ?? [];

  // IP별 집계
  const ipMap = new Map<
    string,
    { pageViews: number; loginAttempts: number; lastAccess: string; userIds: Set<string> }
  >();

  for (const log of accessLogs) {
    const ip = log.ip_address!;
    const entry = ipMap.get(ip) ?? {
      pageViews: 0,
      loginAttempts: 0,
      lastAccess: log.created_at,
      userIds: new Set<string>(),
    };
    entry.pageViews++;
    if (log.created_at > entry.lastAccess) entry.lastAccess = log.created_at;
    if (log.user_id) entry.userIds.add(log.user_id);
    ipMap.set(ip, entry);
  }

  for (const log of loginLogs) {
    const ip = log.ip_address!;
    const entry = ipMap.get(ip) ?? {
      pageViews: 0,
      loginAttempts: 0,
      lastAccess: "",
      userIds: new Set<string>(),
    };
    entry.loginAttempts++;
    if (log.user_id) entry.userIds.add(log.user_id);
    ipMap.set(ip, entry);
  }

  // user_id → name 매핑
  const allUserIds = new Set<string>();
  for (const entry of ipMap.values()) {
    for (const uid of entry.userIds) allUserIds.add(uid);
  }

  let userMap = new Map<string, string>();
  if (allUserIds.size > 0) {
    const { data: users } = await admin
      .from("users")
      .select("id, name")
      .in("id", [...allUserIds]);
    if (users) {
      userMap = new Map(users.map((u) => [u.id, u.name]));
    }
  }

  return [...ipMap.entries()]
    .map(([ip, entry]) => ({
      ip_address: ip,
      pageViews: entry.pageViews,
      loginAttempts: entry.loginAttempts,
      lastAccess: entry.lastAccess,
      userNames: [...entry.userIds].map((uid) => userMap.get(uid) ?? "알 수 없음"),
    }))
    .sort((a, b) => b.pageViews - a.pageViews)
    .slice(0, 50);
}
