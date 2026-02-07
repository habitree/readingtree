"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isValidUUID } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";

/**
 * 연결된 책 정보 타입
 */
export interface RelatedBook {
  id: string; // user_book_relations.id
  userBookId: string; // user_books.id
  bookId: string; // books.id
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  createdAt: string;
}

/**
 * 연결된 책 목록 조회
 * @param userBookId 내 서재의 책 ID (user_books.id)
 * @param user 선택적 사용자 정보
 */
export async function getRelatedBooks(
  userBookId: string,
  user?: User | null
): Promise<RelatedBook[]> {
  const supabase = await createServerSupabaseClient();

  // UUID 검증
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 연결된 책 조회 (source_user_book_id가 현재 책인 관계)
  // user_id 조건으로 RLS와 함께 소유권을 검증하므로 별도 소유권 확인 불필요
  const { data: relations, error: relationsError } = await supabase
    .from("user_book_relations")
    .select(`
      id,
      target_user_book_id,
      created_at,
      target_book:user_books!user_book_relations_target_user_book_id_fkey (
        id,
        books (
          id,
          title,
          author,
          cover_image_url
        )
      )
    `)
    .eq("source_user_book_id", userBookId)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (relationsError) {
    // 테이블 미존재(42P01) 등 스키마 오류 시 빈 배열 반환 (불필요한 에러 전파 방지)
    if (relationsError.code === "42P01" || relationsError.message?.includes("does not exist")) {
      return [];
    }
    console.error("연결된 책 조회 오류:", relationsError);
    throw new Error(`연결된 책 조회 실패: ${relationsError.message}`);
  }

  // 결과 매핑
  return (relations || []).map((relation: any) => ({
    id: relation.id,
    userBookId: relation.target_user_book_id,
    bookId: relation.target_book?.books?.id || "",
    title: relation.target_book?.books?.title || "알 수 없는 책",
    author: relation.target_book?.books?.author || null,
    coverImageUrl: relation.target_book?.books?.cover_image_url || null,
    createdAt: relation.created_at,
  }));
}

/**
 * 책 연결 추가 (양방향)
 * @param sourceUserBookId 출발 책 ID (user_books.id)
 * @param targetUserBookId 도착 책 ID (user_books.id)
 * @param user 선택적 사용자 정보
 */
export async function addBookRelation(
  sourceUserBookId: string,
  targetUserBookId: string,
  user?: User | null
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();

  // UUID 검증
  if (!isValidUUID(sourceUserBookId) || !isValidUUID(targetUserBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 같은 책인지 확인
  if (sourceUserBookId === targetUserBookId) {
    throw new Error("같은 책을 연결할 수 없습니다.");
  }

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 두 책 모두 사용자의 것인지 확인
  const { data: userBooks, error: booksCheckError } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", currentUser.id)
    .in("id", [sourceUserBookId, targetUserBookId]);

  if (booksCheckError || !userBooks || userBooks.length !== 2) {
    throw new Error("권한이 없거나 책을 찾을 수 없습니다.");
  }

  // 이미 연결되어 있는지 확인
  const { data: existingRelation } = await supabase
    .from("user_book_relations")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("source_user_book_id", sourceUserBookId)
    .eq("target_user_book_id", targetUserBookId)
    .maybeSingle();

  if (existingRelation) {
    throw new Error("이미 연결된 책입니다.");
  }

  // 양방향 연결 생성 (A→B, B→A)
  const { error: insertError } = await supabase
    .from("user_book_relations")
    .insert([
      {
        user_id: currentUser.id,
        source_user_book_id: sourceUserBookId,
        target_user_book_id: targetUserBookId,
      },
      {
        user_id: currentUser.id,
        source_user_book_id: targetUserBookId,
        target_user_book_id: sourceUserBookId,
      },
    ]);

  if (insertError) {
    console.error("책 연결 추가 오류:", insertError);
    throw new Error(`책 연결 추가 실패: ${insertError.message}`);
  }

  revalidatePath(`/books/${sourceUserBookId}`);
  revalidatePath(`/books/${targetUserBookId}`);

  return { success: true };
}

/**
 * 책 연결 삭제 (양방향)
 * @param sourceUserBookId 출발 책 ID (user_books.id)
 * @param targetUserBookId 도착 책 ID (user_books.id)
 * @param user 선택적 사용자 정보
 */
export async function removeBookRelation(
  sourceUserBookId: string,
  targetUserBookId: string,
  user?: User | null
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();

  // UUID 검증
  if (!isValidUUID(sourceUserBookId) || !isValidUUID(targetUserBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      throw new Error("로그인이 필요합니다.");
    }
    currentUser = fetchedUser;
  }

  // 양방향 연결 삭제 (A→B, B→A)
  const { error: deleteError } = await supabase
    .from("user_book_relations")
    .delete()
    .eq("user_id", currentUser.id)
    .or(
      `and(source_user_book_id.eq.${sourceUserBookId},target_user_book_id.eq.${targetUserBookId}),and(source_user_book_id.eq.${targetUserBookId},target_user_book_id.eq.${sourceUserBookId})`
    );

  if (deleteError) {
    console.error("책 연결 삭제 오류:", deleteError);
    throw new Error(`책 연결 삭제 실패: ${deleteError.message}`);
  }

  revalidatePath(`/books/${sourceUserBookId}`);
  revalidatePath(`/books/${targetUserBookId}`);

  return { success: true };
}

/**
 * 연결된 책 ID 목록 조회 (QuickBookSelector에서 제외용)
 * @param userBookId 내 서재의 책 ID (user_books.id)
 * @param user 선택적 사용자 정보
 */
export async function getRelatedBookIds(
  userBookId: string,
  user?: User | null
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  // UUID 검증
  if (!isValidUUID(userBookId)) {
    return [];
  }

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !fetchedUser) {
      return [];
    }
    currentUser = fetchedUser;
  }

  // 연결된 책 ID 조회
  const { data: relations, error: relationsError } = await supabase
    .from("user_book_relations")
    .select("target_user_book_id")
    .eq("source_user_book_id", userBookId)
    .eq("user_id", currentUser.id);

  if (relationsError || !relations) {
    return [];
  }

  return relations.map((r) => r.target_user_book_id);
}
