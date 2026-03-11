"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "./_shared";

// ============================================================
// 관리자 ID 조회 (통계에서 제외용)
// ============================================================

async function getAdminUserIds(): Promise<Set<string>> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("is_admin", true);
  return new Set((data ?? []).map((u) => u.id));
}

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
// 관리자 조회 함수 (관리자 접속 제외)
// ============================================================

export interface TrackingSummary {
  uniqueVisitors: number;
  activeIPs: number;
  pageViews: number;
  loginAttempts: number;
  newSignups: number;
}

export async function getTrackingSummary(): Promise<TrackingSummary> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();
  const adminIds = await getAdminUserIds();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [accessRes, loginRes, signupRes] = await Promise.all([
    admin
      .from("access_logs")
      .select("user_id, ip_address, id")
      .gte("created_at", todayISO),
    admin
      .from("login_logs")
      .select("id, user_id")
      .gte("created_at", todayISO),
    // 오늘 가입한 사용자 수
    admin
      .from("users")
      .select("id")
      .gte("created_at", todayISO)
      .eq("is_admin", false),
  ]);

  // 관리자 접속 제외
  const accessLogs = (accessRes.data ?? []).filter(
    (l) => !l.user_id || !adminIds.has(l.user_id)
  );
  const loginLogs = (loginRes.data ?? []).filter(
    (l) => !l.user_id || !adminIds.has(l.user_id)
  );

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
    newSignups: signupRes.data?.length ?? 0,
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
  const adminIds = await getAdminUserIds();

  const { data } = await admin
    .from("login_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + adminIds.size); // 관리자 제외 후에도 충분한 결과

  if (!data) return [];

  // 관리자 제외
  const filtered = data.filter(
    (d) => !d.user_id || !adminIds.has(d.user_id)
  ).slice(0, limit);

  // user_id로 users 테이블에서 이름 조회
  const userIds = [...new Set(filtered.filter((d) => d.user_id).map((d) => d.user_id!))];
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

  return filtered.map((row) => ({
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
  const adminIds = await getAdminUserIds();

  const { data } = await admin
    .from("access_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + adminIds.size * 10);

  if (!data) return [];

  // 관리자 접속 제외
  const filtered = data.filter(
    (d) => !d.user_id || !adminIds.has(d.user_id)
  ).slice(0, limit);

  const userIds = [...new Set(filtered.filter((d) => d.user_id).map((d) => d.user_id!))];
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

  return filtered.map((row) => ({
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
  const adminIds = await getAdminUserIds();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await admin
    .from("access_logs")
    .select("path, user_id")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (!data || data.length === 0) return [];

  // 관리자 접속 제외 + /admin 경로 제외
  const filtered = data.filter(
    (d) =>
      (!d.user_id || !adminIds.has(d.user_id)) &&
      !d.path.startsWith("/admin")
  );

  const countMap = new Map<string, number>();
  for (const row of filtered) {
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
  const adminIds = await getAdminUserIds();

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

  // 관리자 접속 제외
  const accessLogs = (accessRes.data ?? []).filter(
    (l) => !l.user_id || !adminIds.has(l.user_id)
  );
  const loginLogs = (loginRes.data ?? []).filter(
    (l) => !l.user_id || !adminIds.has(l.user_id)
  );

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

// ============================================================
// 신규 분석 함수: 일별 트렌드, 회원가입 추적, 메뉴 사용 분석
// ============================================================

export interface DailyTrend {
  date: string; // YYYY-MM-DD
  visitors: number;
  pageViews: number;
  signups: number;
  logins: number;
}

export async function getDailyTrends(days = 14): Promise<DailyTrend[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();
  const adminIds = await getAdminUserIds();

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  const sinceISO = since.toISOString();

  const [accessRes, loginRes, signupRes] = await Promise.all([
    admin
      .from("access_logs")
      .select("user_id, created_at")
      .gte("created_at", sinceISO),
    admin
      .from("login_logs")
      .select("user_id, created_at, success")
      .gte("created_at", sinceISO),
    admin
      .from("users")
      .select("id, created_at")
      .gte("created_at", sinceISO)
      .eq("is_admin", false),
  ]);

  // 일별 집계 맵 초기화
  const dayMap = new Map<string, { visitors: Set<string>; pageViews: number; signups: number; logins: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { visitors: new Set(), pageViews: 0, signups: 0, logins: 0 });
  }

  // 접속 로그 (관리자 제외)
  for (const log of (accessRes.data ?? [])) {
    if (log.user_id && adminIds.has(log.user_id)) continue;
    const day = log.created_at.slice(0, 10);
    const entry = dayMap.get(day);
    if (!entry) continue;
    entry.pageViews++;
    if (log.user_id) entry.visitors.add(log.user_id);
  }

  // 로그인 로그 (관리자 제외, 성공만)
  for (const log of (loginRes.data ?? [])) {
    if (log.user_id && adminIds.has(log.user_id)) continue;
    if (!log.success) continue;
    const day = log.created_at.slice(0, 10);
    const entry = dayMap.get(day);
    if (entry) entry.logins++;
  }

  // 신규 가입
  for (const user of (signupRes.data ?? [])) {
    const day = user.created_at.slice(0, 10);
    const entry = dayMap.get(day);
    if (entry) entry.signups++;
  }

  return [...dayMap.entries()]
    .map(([date, entry]) => ({
      date,
      visitors: entry.visitors.size,
      pageViews: entry.pageViews,
      signups: entry.signups,
      logins: entry.logins,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface SignupEntry {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  provider: string | null;
  terms_agreed: boolean;
}

export async function getRecentSignups(limit = 30): Promise<SignupEntry[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("users")
    .select("id, name, email, created_at, terms_agreed")
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  // 각 사용자의 첫 로그인 로그에서 provider 조회
  const userIds = data.map((u) => u.id);
  let providerMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: loginData } = await admin
      .from("login_logs")
      .select("user_id, provider")
      .in("user_id", userIds)
      .eq("success", true)
      .order("created_at", { ascending: true });

    if (loginData) {
      for (const log of loginData) {
        if (log.user_id && !providerMap.has(log.user_id)) {
          providerMap.set(log.user_id, log.provider);
        }
      }
    }
  }

  return data.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    created_at: u.created_at,
    provider: providerMap.get(u.id) ?? null,
    terms_agreed: u.terms_agreed ?? false,
  }));
}

export interface MenuUsageItem {
  menu: string;
  label: string;
  uniqueUsers: number;
  totalViews: number;
}

// 주요 메뉴 경로 매핑
const MENU_LABELS: Record<string, string> = {
  "/": "홈(대시보드)",
  "/books": "내 서재",
  "/bookshelves": "책장",
  "/notes": "독서 노트",
  "/timeline": "타임라인",
  "/stats": "통계",
  "/groups": "독서 모임",
  "/profile": "프로필",
  "/pricing": "요금제",
  "/feature-requests": "기능 요청",
  "/sample": "샘플 체험",
  "/about": "서비스 소개",
  "/terms": "이용약관",
  "/privacy": "개인정보처리방침",
  "/login": "로그인",
  "/signup": "회원가입",
};

export async function getMenuUsageAnalysis(): Promise<MenuUsageItem[]> {
  await requireAdmin();
  const admin = createAdminSupabaseClient();
  const adminIds = await getAdminUserIds();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await admin
    .from("access_logs")
    .select("path, user_id")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (!data || data.length === 0) return [];

  // 관리자 제외 + /admin, /api, /callback 경로 제외
  const filtered = data.filter(
    (d) =>
      (!d.user_id || !adminIds.has(d.user_id)) &&
      !d.path.startsWith("/admin") &&
      !d.path.startsWith("/api") &&
      !d.path.startsWith("/callback")
  );

  // 메뉴별 집계 (하위 경로는 상위 메뉴로 그룹화)
  const menuMap = new Map<string, { users: Set<string>; views: number }>();

  for (const row of filtered) {
    // 경로에서 메뉴 추출: /books/123 → /books
    const segments = row.path.split("/").filter(Boolean);
    const menu = segments.length > 0 ? `/${segments[0]}` : "/";

    const entry = menuMap.get(menu) ?? { users: new Set(), views: 0 };
    entry.views++;
    if (row.user_id) entry.users.add(row.user_id);
    menuMap.set(menu, entry);
  }

  return [...menuMap.entries()]
    .map(([menu, entry]) => ({
      menu,
      label: MENU_LABELS[menu] ?? menu,
      uniqueUsers: entry.users.size,
      totalViews: entry.views,
    }))
    .sort((a, b) => b.totalViews - a.totalViews);
}
