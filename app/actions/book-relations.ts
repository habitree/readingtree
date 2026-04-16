"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
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
    currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
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

/**
 * 기록의 관련 책들 간에 user_book_relations 자동 생성
 * mainUserBookId와 relatedUserBookIds 간의 모든 쌍에 대해 양방향 관계 생성
 * @param mainUserBookId 주 책 ID (user_books.id)
 * @param relatedUserBookIds 관련 책 ID 배열 (user_books.id[])
 * @param user 선택적 사용자 정보
 */
export async function syncBookRelationsFromNote(
  mainUserBookId: string,
  relatedUserBookIds: string[],
  user?: User | null
): Promise<{ created: number; skipped: number }> {
  const supabase = await createServerSupabaseClient();

  if (!relatedUserBookIds || relatedUserBookIds.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // UUID 검증
  if (!isValidUUID(mainUserBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }
  for (const id of relatedUserBookIds) {
    if (!isValidUUID(id)) {
      throw new Error("유효하지 않은 관련 책 ID입니다.");
    }
  }

  // 현재 사용자 확인
  let currentUser = user;
  if (!currentUser) {
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
  }

  // 모든 책이 사용자의 것인지 확인
  const allBookIds = [mainUserBookId, ...relatedUserBookIds];
  const uniqueBookIds = [...new Set(allBookIds)];

  const { data: userBooks, error: booksCheckError } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", currentUser.id)
    .in("id", uniqueBookIds);

  if (booksCheckError || !userBooks || userBooks.length !== uniqueBookIds.length) {
    throw new Error("권한이 없거나 책을 찾을 수 없습니다.");
  }

  // 모든 쌍 생성: mainBook ↔ 각 relatedBook, relatedBook끼리도 연결
  const pairs: Array<[string, string]> = [];

  // mainBook과 각 relatedBook
  for (const relatedId of relatedUserBookIds) {
    if (relatedId !== mainUserBookId) {
      pairs.push([mainUserBookId, relatedId]);
    }
  }

  // relatedBook들 간 상호 연결
  for (let i = 0; i < relatedUserBookIds.length; i++) {
    for (let j = i + 1; j < relatedUserBookIds.length; j++) {
      if (relatedUserBookIds[i] !== relatedUserBookIds[j]) {
        pairs.push([relatedUserBookIds[i], relatedUserBookIds[j]]);
      }
    }
  }

  if (pairs.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // 이미 존재하는 관계 확인
  const { data: existingRelations } = await supabase
    .from("user_book_relations")
    .select("source_user_book_id, target_user_book_id")
    .eq("user_id", currentUser.id);

  const existingSet = new Set<string>();
  for (const r of existingRelations || []) {
    existingSet.add(`${r.source_user_book_id}:${r.target_user_book_id}`);
  }

  // 새로 생성할 양방향 관계 수집
  const toInsert: Array<{
    user_id: string;
    source_user_book_id: string;
    target_user_book_id: string;
  }> = [];

  let skipped = 0;

  for (const [a, b] of pairs) {
    const forwardKey = `${a}:${b}`;
    const reverseKey = `${b}:${a}`;

    if (existingSet.has(forwardKey) || existingSet.has(reverseKey)) {
      skipped++;
      continue;
    }

    toInsert.push(
      { user_id: currentUser.id, source_user_book_id: a, target_user_book_id: b },
      { user_id: currentUser.id, source_user_book_id: b, target_user_book_id: a }
    );

    // 삽입 후 중복 방지를 위해 set에 추가
    existingSet.add(forwardKey);
    existingSet.add(reverseKey);
  }

  if (toInsert.length === 0) {
    return { created: 0, skipped };
  }

  const { error: insertError } = await supabase
    .from("user_book_relations")
    .insert(toInsert);

  if (insertError) {
    // unique constraint 위반은 무시 (동시 요청 등)
    if (insertError.code === "23505") {
      return { created: 0, skipped: skipped + pairs.length };
    }
    console.error("책 연결 동기화 오류:", insertError);
    throw new Error(`책 연결 동기화 실패: ${insertError.message}`);
  }

  const created = toInsert.length / 2; // 양방향이므로 실제 연결 수는 절반

  // 관련 경로 revalidate
  for (const bookId of uniqueBookIds) {
    revalidatePath(`/books/${bookId}`);
  }

  return { created, skipped };
}
