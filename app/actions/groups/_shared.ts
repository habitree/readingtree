import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MemberRole = "leader" | "moderator" | "member";
export type MemberStatus = "pending" | "approved" | "rejected";
export type JoinType = "open" | "approval" | "private";

/**
 * createServerSupabaseClient의 반환 타입을 다른 도메인 파일에서 사용할 수 있도록 export
 */
export type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/**
 * 현재 주의 시작일(월요일) 계산 (KST 기준)
 */
export function getWeekStart(date: Date = new Date()): string {
  // KST 기준으로 변환
  const kstOffset = 9 * 60 * 60 * 1000;
  const d = new Date(date.getTime() + kstOffset);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD 형식
}

/**
 * 그룹 멤버 활동 통계 업데이트
 * 기록 공유/해제 시 notes_count 증감
 */
export async function updateGroupActivityStats(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  delta: number // +1 for share, -1 for unshare
) {
  const weekStart = getWeekStart();

  // 기존 통계 조회
  const { data: existing } = await supabase
    .from("group_activity_stats")
    .select("id, notes_count")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  if (existing) {
    // 기존 레코드 업데이트
    const newCount = Math.max(0, (existing.notes_count || 0) + delta);
    await supabase
      .from("group_activity_stats")
      .update({
        notes_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else if (delta > 0) {
    // 새 레코드 생성 (감소 시에는 생성하지 않음)
    await supabase.from("group_activity_stats").insert({
      group_id: groupId,
      user_id: userId,
      week_start: weekStart,
      notes_count: delta,
    });
  }
}

/**
 * 그룹 권한 검증 결과 타입
 */
export interface GroupAccessResult {
  user: { id: string };
  group: { id: string; leader_id: string };
  membership: { role: MemberRole; status: MemberStatus } | null;
  isLeader: boolean;
  isModerator: boolean;
  isMember: boolean;
}

/**
 * 그룹 접근 권한 검증 헬퍼 함수
 * @param supabase - Supabase 클라이언트
 * @param groupId - 그룹 ID
 * @param requiredRole - 필요한 최소 권한 ('leader' | 'moderator' | 'member')
 * @returns GroupAccessResult
 * @throws Error - 권한이 없거나 로그인하지 않은 경우
 */
export async function checkGroupAccess(
  supabase: SupabaseClient,
  groupId: string,
  requiredRole?: "leader" | "moderator" | "member"
): Promise<GroupAccessResult> {
  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 그룹 정보 조회
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  // 멤버십 조회
  const { data: membership } = await supabase
    .from("group_members")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  const isLeader = group.leader_id === user.id;
  const isModerator = membership?.role === "moderator";
  const isMember = !!membership;

  // 권한 검증
  if (requiredRole === "leader" && !isLeader) {
    throw new Error("리더만 이 작업을 수행할 수 있습니다.");
  }

  if (requiredRole === "moderator" && !isLeader && !isModerator) {
    throw new Error("리더 또는 부리더만 이 작업을 수행할 수 있습니다.");
  }

  if (requiredRole === "member" && !isLeader && !isMember) {
    throw new Error("모임 멤버만 이 작업을 수행할 수 있습니다.");
  }

  return {
    user: { id: user.id },
    group: { id: group.id, leader_id: group.leader_id },
    membership: membership as { role: MemberRole; status: MemberStatus } | null,
    isLeader,
    isModerator,
    isMember,
  };
}
