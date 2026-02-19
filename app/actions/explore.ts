"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";
import type { NoteWithBook } from "@/types/note";

export interface ExploreNote extends NoteWithBook {
  like_count: number;
  is_liked: boolean;
  author: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

type SortBy = "recent" | "popular";

/**
 * 공개 노트 탐색 피드
 * 정렬: recent (최신순) | popular (좋아요 많은순)
 */
export async function getPublicNotes(options?: {
  sortBy?: SortBy;
  page?: number;
  limit?: number;
  tag?: string;
  tags?: string[];
}): Promise<{ notes: ExploreNote[]; hasMore: boolean }> {
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser().catch(() => null);

  const sortBy = options?.sortBy || "recent";
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      books:book_id (id, title, author, cover_image_url),
      users:user_id (id, display_name, avatar_url)
    `,
      { count: "exact" }
    )
    .eq("is_public", true)
    .neq("type", "progress")
    .range(offset, offset + limit - 1);

  // 태그 필터 (다중 태그: AND 로직)
  if (options?.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags);
  } else if (options?.tag) {
    query = query.contains("tags", [options.tag]);
  }

  // 정렬
  if (sortBy === "popular") {
    query = query.order("like_count", { ascending: false, nullsFirst: false });
  }
  query = query.order("created_at", { ascending: false });

  const { data: notes, error, count } = await query;

  if (error) {
    console.error("[Explore] 공개 노트 조회 오류:", error);
    return { notes: [], hasMore: false };
  }

  // 현재 유저의 좋아요 목록 조회
  let userLikes = new Set<string>();
  if (user) {
    const noteIds = (notes || []).map((n: any) => n.id);
    if (noteIds.length > 0) {
      const { data: likes } = await supabase
        .from("note_likes")
        .select("note_id")
        .eq("user_id", user.id)
        .in("note_id", noteIds);

      if (likes) {
        userLikes = new Set(likes.map((l) => l.note_id));
      }
    }
  }

  const exploreNotes: ExploreNote[] = (notes || []).map((note: any) => ({
    ...note,
    book: note.books || undefined,
    like_count: note.like_count || 0,
    is_liked: userLikes.has(note.id),
    author: note.users || null,
  }));

  return {
    notes: exploreNotes,
    hasMore: (count || 0) > offset + limit,
  };
}

/**
 * 인기 태그 조회
 * 공개 노트에서 태그 빈도 상위 N개 반환
 */
export async function getExploreTags(limit = 15): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("get_explore_tags", {
    p_limit: limit,
  });

  if (error || !data) {
    console.error("[Explore] 태그 조회 오류:", error);
    return [];
  }

  return data.map((row: { tag: string; cnt: number }) => row.tag);
}

/**
 * 좋아요 토글 (원자적 RPC)
 */
export async function toggleNoteLike(noteId: string): Promise<{
  liked: boolean;
  likeCount: number;
}> {
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase.rpc("toggle_note_like", {
    p_note_id: noteId,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[Explore] 좋아요 토글 오류:", error);
    throw new Error("좋아요 처리에 실패했습니다.");
  }

  return {
    liked: data.liked,
    likeCount: data.like_count,
  };
}
