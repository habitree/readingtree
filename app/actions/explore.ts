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

  // 태그 필터
  if (options?.tag) {
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
 * 좋아요 토글
 */
export async function toggleNoteLike(noteId: string): Promise<{
  liked: boolean;
  likeCount: number;
}> {
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();

  // 노트가 공개인지 확인
  const { data: note } = await supabase
    .from("notes")
    .select("id, is_public, like_count")
    .eq("id", noteId)
    .single();

  if (!note || !note.is_public) {
    throw new Error("공개 노트만 좋아요할 수 있습니다.");
  }

  // 기존 좋아요 확인
  const { data: existing } = await supabase
    .from("note_likes")
    .select("id")
    .eq("note_id", noteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // 좋아요 취소
    await supabase.from("note_likes").delete().eq("id", existing.id);
    const newCount = Math.max((note.like_count || 0) - 1, 0);
    await supabase.from("notes").update({ like_count: newCount }).eq("id", noteId);
    return { liked: false, likeCount: newCount };
  } else {
    // 좋아요 추가
    await supabase.from("note_likes").insert({
      note_id: noteId,
      user_id: user.id,
    });
    const newCount = (note.like_count || 0) + 1;
    await supabase.from("notes").update({ like_count: newCount }).eq("id", noteId);
    return { liked: true, likeCount: newCount };
  }
}
