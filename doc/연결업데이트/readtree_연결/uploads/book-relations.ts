"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./_shared";

// ============================================================
// 타입 정의
// ============================================================

export interface BookRelationsStats {
  totalRelations: number;
  uniqueBooks: number;
  usersWithRelations: number;
  avgConnectionsPerBook: number;
}

export interface GraphNode {
  id: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  connectionCount: number;
  userId: string;
  userName: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  createdAt: string;
}

export interface BookRelationsGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationEntry {
  id: string;
  sourceUserBookId: string;
  sourceTitle: string;
  sourceAuthor: string | null;
  sourceCoverUrl: string | null;
  targetUserBookId: string;
  targetTitle: string;
  targetAuthor: string | null;
  targetCoverUrl: string | null;
  userId: string;
  userName: string | null;
  createdAt: string;
}

export interface TopConnectedBook {
  userBookId: string;
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  connectionCount: number;
  userName: string | null;
}

export interface UserWithRelations {
  id: string;
  name: string | null;
  email: string | null;
  relationCount: number;
}

// ============================================================
// 헬퍼: 양방향 관계 중복 제거 키 생성
// ============================================================

function dedupeKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// ============================================================
// 통계
// ============================================================

export async function getBookRelationsStats(userId?: string): Promise<BookRelationsStats> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 모든 관계 조회
  let query = supabase
    .from("user_book_relations")
    .select("source_user_book_id, target_user_book_id, user_id");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: allRelations } = await query;

  if (!allRelations || allRelations.length === 0) {
    return { totalRelations: 0, uniqueBooks: 0, usersWithRelations: 0, avgConnectionsPerBook: 0 };
  }

  // 양방향 중복 제거
  const seen = new Set<string>();
  let totalRelations = 0;
  const uniqueBookIds = new Set<string>();
  const uniqueUserIds = new Set<string>();

  for (const r of allRelations) {
    const key = dedupeKey(r.source_user_book_id, r.target_user_book_id);
    uniqueBookIds.add(r.source_user_book_id);
    uniqueUserIds.add(r.user_id);

    if (!seen.has(key)) {
      seen.add(key);
      totalRelations++;
    }
  }

  const books = uniqueBookIds.size;
  const avg = books > 0 ? Math.round((totalRelations / books) * 10) / 10 : 0;

  return {
    totalRelations,
    uniqueBooks: books,
    usersWithRelations: uniqueUserIds.size,
    avgConnectionsPerBook: avg,
  };
}

// ============================================================
// 그래프 데이터
// ============================================================

export async function getBookRelationsGraph(userId?: string): Promise<BookRelationsGraphData> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 모든 관계 조회
  let edgesQuery = supabase
    .from("user_book_relations")
    .select("source_user_book_id, target_user_book_id, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (userId) {
    edgesQuery = edgesQuery.eq("user_id", userId);
  }

  const { data: rawEdges, error: edgesError } = await edgesQuery;

  if (edgesError || !rawEdges || rawEdges.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 양방향 중복 제거
  const seen = new Set<string>();
  const dedupedEdges: typeof rawEdges = [];
  for (const edge of rawEdges) {
    const key = dedupeKey(edge.source_user_book_id, edge.target_user_book_id);
    if (!seen.has(key)) {
      seen.add(key);
      dedupedEdges.push(edge);
    }
  }

  // 최대 500개 엣지로 제한
  const limitedEdges = dedupedEdges.slice(0, 500);

  // 고유 user_book_id 수집
  const userBookIds = new Set<string>();
  const userIds = new Set<string>();
  for (const edge of limitedEdges) {
    userBookIds.add(edge.source_user_book_id);
    userBookIds.add(edge.target_user_book_id);
    userIds.add(edge.user_id);
  }

  // user_books + books 정보 조회
  const { data: userBooksData } = await supabase
    .from("user_books")
    .select(`
      id,
      user_id,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .in("id", Array.from(userBookIds));

  // 사용자 정보 조회
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name")
    .in("id", Array.from(userIds));

  const userNameMap = new Map<string, string>();
  for (const u of usersData || []) {
    userNameMap.set(u.id, u.name || "");
  }

  // 연결 수 계산
  const connectionCountMap = new Map<string, number>();
  for (const edge of limitedEdges) {
    connectionCountMap.set(
      edge.source_user_book_id,
      (connectionCountMap.get(edge.source_user_book_id) || 0) + 1
    );
    connectionCountMap.set(
      edge.target_user_book_id,
      (connectionCountMap.get(edge.target_user_book_id) || 0) + 1
    );
  }

  // 노드 생성
  const nodes: GraphNode[] = (userBooksData || []).map((ub: Record<string, unknown>) => {
    const book = ub.books as Record<string, unknown> | null;
    return {
      id: ub.id as string,
      bookId: (book?.id as string) || "",
      title: (book?.title as string) || "알 수 없는 책",
      author: (book?.author as string) || null,
      coverImageUrl: (book?.cover_image_url as string) || null,
      connectionCount: connectionCountMap.get(ub.id as string) || 0,
      userId: ub.user_id as string,
      userName: userNameMap.get(ub.user_id as string) || null,
    };
  });

  // 엣지 생성
  const edges: GraphEdge[] = limitedEdges.map((edge) => ({
    source: edge.source_user_book_id,
    target: edge.target_user_book_id,
    createdAt: edge.created_at,
  }));

  return { nodes, edges };
}

// ============================================================
// 연결 목록 (페이지네이션)
// ============================================================

export async function getBookRelationsList(
  page: number = 1,
  pageSize: number = 20,
  userId?: string
): Promise<{ relations: RelationEntry[]; total: number }> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 모든 관계 조회 후 클라이언트 사이드 중복 제거 + 페이지네이션
  let query = supabase
    .from("user_book_relations")
    .select("id, source_user_book_id, target_user_book_id, user_id, created_at")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: allRelations, error: relationsError } = await query;

  if (relationsError || !allRelations || allRelations.length === 0) {
    return { relations: [], total: 0 };
  }

  // 양방향 중복 제거
  const seen = new Set<string>();
  const dedupedRelations: typeof allRelations = [];
  for (const r of allRelations) {
    const key = dedupeKey(r.source_user_book_id, r.target_user_book_id);
    if (!seen.has(key)) {
      seen.add(key);
      dedupedRelations.push(r);
    }
  }

  const total = dedupedRelations.length;
  const from = (page - 1) * pageSize;
  const paged = dedupedRelations.slice(from, from + pageSize);

  if (paged.length === 0) {
    return { relations: [], total };
  }

  // 관련 user_book_ids 수집
  const allUserBookIds = new Set<string>();
  const allUserIds = new Set<string>();
  for (const r of paged) {
    allUserBookIds.add(r.source_user_book_id);
    allUserBookIds.add(r.target_user_book_id);
    allUserIds.add(r.user_id);
  }

  // user_books + books 정보 조회
  const [userBooksRes, usersRes] = await Promise.all([
    supabase
      .from("user_books")
      .select(`
        id,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      `)
      .in("id", Array.from(allUserBookIds)),
    supabase
      .from("users")
      .select("id, name")
      .in("id", Array.from(allUserIds)),
  ]);

  const bookInfoMap = new Map<string, { title: string; author: string | null; coverUrl: string | null }>();
  for (const ub of userBooksRes.data || []) {
    const book = (ub as Record<string, unknown>).books as Record<string, unknown> | null;
    bookInfoMap.set(ub.id, {
      title: (book?.title as string) || "알 수 없는 책",
      author: (book?.author as string) || null,
      coverUrl: (book?.cover_image_url as string) || null,
    });
  }

  const userNameMap = new Map<string, string>();
  for (const u of usersRes.data || []) {
    userNameMap.set(u.id, u.name || "");
  }

  const relations: RelationEntry[] = paged.map((r) => {
    const source = bookInfoMap.get(r.source_user_book_id);
    const target = bookInfoMap.get(r.target_user_book_id);
    return {
      id: r.id,
      sourceUserBookId: r.source_user_book_id,
      sourceTitle: source?.title || "알 수 없는 책",
      sourceAuthor: source?.author || null,
      sourceCoverUrl: source?.coverUrl || null,
      targetUserBookId: r.target_user_book_id,
      targetTitle: target?.title || "알 수 없는 책",
      targetAuthor: target?.author || null,
      targetCoverUrl: target?.coverUrl || null,
      userId: r.user_id,
      userName: userNameMap.get(r.user_id) || null,
      createdAt: r.created_at,
    };
  });

  return { relations, total };
}

// ============================================================
// 가장 많이 연결된 책 Top N
// ============================================================

export async function getTopConnectedBooks(
  limit: number = 10,
  userId?: string
): Promise<TopConnectedBook[]> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 모든 관계에서 source 기준 카운트 (양방향이므로 source 쪽만 봐도 전체 연결 수)
  let query = supabase
    .from("user_book_relations")
    .select("source_user_book_id, user_id");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: relationsData } = await query;

  if (!relationsData || relationsData.length === 0) {
    return [];
  }

  // 연결 수 집계
  const countMap = new Map<string, { count: number; userId: string }>();
  for (const r of relationsData) {
    const existing = countMap.get(r.source_user_book_id);
    if (existing) {
      existing.count += 1;
    } else {
      countMap.set(r.source_user_book_id, { count: 1, userId: r.user_id });
    }
  }

  // 상위 N개 추출
  const sorted = Array.from(countMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const userBookIds = sorted.map(([id]) => id);
  const userIds = [...new Set(sorted.map(([, v]) => v.userId))];

  // 책 정보 + 사용자 정보 병렬 조회
  const [userBooksRes, usersRes] = await Promise.all([
    supabase
      .from("user_books")
      .select(`
        id,
        user_id,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      `)
      .in("id", userBookIds),
    supabase
      .from("users")
      .select("id, name")
      .in("id", userIds),
  ]);

  const bookInfoMap = new Map<string, { bookId: string; title: string; author: string | null; coverUrl: string | null; userId: string }>();
  for (const ub of userBooksRes.data || []) {
    const book = (ub as Record<string, unknown>).books as Record<string, unknown> | null;
    bookInfoMap.set(ub.id, {
      bookId: (book?.id as string) || "",
      title: (book?.title as string) || "알 수 없는 책",
      author: (book?.author as string) || null,
      coverUrl: (book?.cover_image_url as string) || null,
      userId: ub.user_id,
    });
  }

  const userNameMap = new Map<string, string>();
  for (const u of usersRes.data || []) {
    userNameMap.set(u.id, u.name || "");
  }

  return sorted.map(([userBookId, { count }]) => {
    const info = bookInfoMap.get(userBookId);
    return {
      userBookId,
      bookId: info?.bookId || "",
      title: info?.title || "알 수 없는 책",
      author: info?.author || null,
      coverImageUrl: info?.coverUrl || null,
      connectionCount: count,
      userName: userNameMap.get(info?.userId || "") || null,
    };
  });
}

// ============================================================
// 연결 관계가 있는 사용자 목록
// ============================================================

export async function getUsersWithRelations(): Promise<UserWithRelations[]> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 모든 관계 조회 후 중복 제거
  const { data: allRelations } = await supabase
    .from("user_book_relations")
    .select("source_user_book_id, target_user_book_id, user_id");

  if (!allRelations || allRelations.length === 0) return [];

  // 사용자별 중복 제거된 관계 수 집계
  const userRelationSets = new Map<string, Set<string>>();
  for (const r of allRelations) {
    const key = dedupeKey(r.source_user_book_id, r.target_user_book_id);
    if (!userRelationSets.has(r.user_id)) {
      userRelationSets.set(r.user_id, new Set());
    }
    userRelationSets.get(r.user_id)!.add(key);
  }

  const userIds = Array.from(userRelationSets.keys());

  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, email")
    .in("id", userIds);

  return (usersData || []).map((u) => ({
    id: u.id,
    name: u.name || null,
    email: u.email || null,
    relationCount: userRelationSets.get(u.id)?.size || 0,
  })).sort((a, b) => b.relationCount - a.relationCount);
}

// ============================================================
// 관리자 연결 삭제
// ============================================================

export async function adminDeleteBookRelation(
  sourceUserBookId: string,
  targetUserBookId: string,
  userId: string
): Promise<{ success: boolean }> {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  // 양방향 삭제 (A→B, B→A)
  const { error } = await supabase
    .from("user_book_relations")
    .delete()
    .eq("user_id", userId)
    .or(
      `and(source_user_book_id.eq.${sourceUserBookId},target_user_book_id.eq.${targetUserBookId}),and(source_user_book_id.eq.${targetUserBookId},target_user_book_id.eq.${sourceUserBookId})`
    );

  if (error) {
    console.error("관리자 책 연결 삭제 오류:", error);
    throw new Error(`책 연결 삭제 실패: ${error.message}`);
  }

  return { success: true };
}
