"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWeekStart } from "./_shared";

/**
 * 구성원 진행 상황 조회
 */
export async function getMemberProgress(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 리더 권한 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  if (group.leader_id !== user.id) {
    throw new Error("리더만 진행 상황을 조회할 수 있습니다.");
  }

  // 승인된 멤버 목록 조회
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  if (membersError) {
    throw new Error(`멤버 목록 조회 실패: ${membersError.message}`);
  }

  // 멤버 user_id 목록 추출
  const memberList = members || [];
  const userIds = memberList.map((m) => m.user_id);

  if (userIds.length === 0) {
    return [];
  }

  // 배치 쿼리로 모든 멤버의 진행 상황 조회 (3개 쿼리로 최적화)
  const [completedBooksResult, allNotesResult, recentNotesResult] = await Promise.all([
    // 모든 멤버의 완독 책 조회
    supabase
      .from("user_books")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "completed"),
    // 모든 멤버의 기록 조회
    supabase
      .from("notes")
      .select("user_id")
      .in("user_id", userIds),
    // 모든 멤버의 최근 기록 조회
    supabase
      .from("notes")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
  ]);

  // 완독 책 수 집계 (user_id별 카운트)
  const completedBooksMap = new Map<string, number>();
  (completedBooksResult.data || []).forEach((book) => {
    const current = completedBooksMap.get(book.user_id) || 0;
    completedBooksMap.set(book.user_id, current + 1);
  });

  // 기록 수 집계 (user_id별 카운트)
  const notesCountMap = new Map<string, number>();
  (allNotesResult.data || []).forEach((note) => {
    const current = notesCountMap.get(note.user_id) || 0;
    notesCountMap.set(note.user_id, current + 1);
  });

  // 최근 활동 일자 (user_id별 첫 번째 = 가장 최근)
  const lastActivityMap = new Map<string, string>();
  (recentNotesResult.data || []).forEach((note) => {
    if (!lastActivityMap.has(note.user_id)) {
      lastActivityMap.set(note.user_id, note.created_at);
    }
  });

  // 멤버별 진행 상황 매핑
  const progress = memberList.map((member) => ({
    user: member.users || null,
    completedBooks: completedBooksMap.get(member.user_id) || 0,
    notesCount: notesCountMap.get(member.user_id) || 0,
    lastActivity: lastActivityMap.get(member.user_id) || null,
  }));

  return progress;
}

/**
 * 멤버별 활동 현황 조회
 */
export async function getMemberActivities(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버십 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;

  if (!isLeader && !isMember) {
    throw new Error("모임 멤버만 조회할 수 있습니다.");
  }

  // 지정도서 목록 조회
  const { data: groupBooks } = await supabase
    .from("group_books")
    .select("book_id")
    .eq("group_id", groupId);

  const bookIds = (groupBooks || []).map((gb) => gb.book_id);

  // 멤버 목록 조회
  const { data: members } = await supabase
    .from("group_members")
    .select(
      `
      user_id,
      role,
      users (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "approved");

  // 공유된 기록 조회
  const { data: sharedNotes } = await supabase
    .from("group_notes")
    .select(
      `
      note_id,
      shared_at,
      notes!inner (
        user_id,
        book_id,
        type
      )
    `
    )
    .eq("group_id", groupId);

  // 멤버별 활동 집계
  const activities = (members || []).map((member: any) => {
    const memberNotes = (sharedNotes || []).filter(
      (sn: any) => sn.notes?.user_id === member.user_id
    );

    const groupBookNotes = memberNotes.filter((sn: any) =>
      bookIds.includes(sn.notes?.book_id)
    );

    const lastShared = memberNotes.length > 0
      ? memberNotes.reduce((latest: any, sn: any) =>
          !latest || new Date(sn.shared_at) > new Date(latest.shared_at) ? sn : latest
        , null)
      : null;

    return {
      user: member.users,
      role: member.role,
      totalSharedNotes: memberNotes.length,
      groupBookNotes: groupBookNotes.length,
      lastSharedAt: lastShared?.shared_at || null,
      noteTypes: {
        quote: memberNotes.filter((sn: any) => sn.notes?.type === "quote").length,
        memo: memberNotes.filter((sn: any) => sn.notes?.type === "memo").length,
        photo: memberNotes.filter((sn: any) => sn.notes?.type === "photo").length,
        transcription: memberNotes.filter((sn: any) => sn.notes?.type === "transcription").length,
      },
    };
  });

  return activities;
}

/**
 * 그룹 주간 활동 통계 조회
 * group_activity_stats 테이블 활용
 */
export async function getGroupWeeklyStats(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 멤버십 또는 리더 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  const { data: group } = await supabase
    .from("groups")
    .select("leader_id")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;

  if (!isLeader && !isMember) {
    throw new Error("모임 멤버만 조회할 수 있습니다.");
  }

  // 이번 주, 지난 주 시작일 계산
  const thisWeekStart = getWeekStart();
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStart = getWeekStart(lastWeekDate);

  // 이번 주 통계 조회
  const { data: thisWeekStats } = await supabase
    .from("group_activity_stats")
    .select(`
      user_id,
      notes_count,
      books_completed,
      users (
        id,
        name,
        avatar_url
      )
    `)
    .eq("group_id", groupId)
    .eq("week_start", thisWeekStart)
    .order("notes_count", { ascending: false });

  // 지난 주 통계 조회 (비교용)
  const { data: lastWeekStats } = await supabase
    .from("group_activity_stats")
    .select("user_id, notes_count")
    .eq("group_id", groupId)
    .eq("week_start", lastWeekStart);

  // 지난 주 데이터 맵
  const lastWeekMap = new Map(
    (lastWeekStats || []).map((s: any) => [s.user_id, s.notes_count])
  );

  // 이번 주 총 기록 수
  const totalThisWeek = (thisWeekStats || []).reduce(
    (sum: number, s: any) => sum + (s.notes_count || 0),
    0
  );

  // 지난 주 총 기록 수
  const totalLastWeek = (lastWeekStats || []).reduce(
    (sum: number, s: any) => sum + (s.notes_count || 0),
    0
  );

  // 순위 및 트렌드 계산
  const rankedStats = (thisWeekStats || []).map((stat: any, index: number) => {
    const lastWeekCount = lastWeekMap.get(stat.user_id) || 0;
    const trend: "up" | "down" | "same" =
      stat.notes_count > lastWeekCount
        ? "up"
        : stat.notes_count < lastWeekCount
        ? "down"
        : "same";

    return {
      rank: index + 1,
      user: stat.users as { id: string; name: string; avatar_url: string | null },
      notesCount: stat.notes_count || 0,
      booksCompleted: stat.books_completed || 0,
      lastWeekCount,
      trend,
    };
  });

  return {
    weekStart: thisWeekStart,
    totalNotesThisWeek: totalThisWeek,
    totalNotesLastWeek: totalLastWeek,
    weekOverWeekChange: totalLastWeek > 0
      ? Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100)
      : totalThisWeek > 0 ? 100 : 0,
    memberStats: rankedStats,
  };
}
