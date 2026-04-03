"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  Bookshelf,
  BookshelfWithStats,
  CreateBookshelfInput,
  UpdateBookshelfInput,
} from "@/types/bookshelf";
import { checkFeatureAccess } from "./subscription";

/**
 * 사용자의 모든 서재 목록 조회
 */
export async function getBookshelves(): Promise<Bookshelf[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("bookshelves")
    .select("*, groups(name)")
    .eq("user_id", user.id)
    .order("is_main", { ascending: false })
    .order("order", { ascending: true });

  if (error) {
    throw new Error(`서재 목록 조회 실패: ${error.message}`);
  }

  return (data || []).map((shelf: Record<string, unknown>) => ({
    ...shelf,
    group_name: (shelf.groups as Record<string, unknown> | null)?.name || undefined,
    groups: undefined,
  })) as unknown as Bookshelf[];
}

/**
 * 사용자의 메인 서재 조회
 */
export async function getMainBookshelf(): Promise<Bookshelf | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_main", true)
    .maybeSingle();

  if (error) {
    throw new Error(`메인 서재 조회 실패: ${error.message}`);
  }

  return (data as Bookshelf) || null;
}

/**
 * 서재 상세 조회 (통계 포함)
 */
export async function getBookshelfWithStats(
  bookshelfId: string
): Promise<BookshelfWithStats | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 서재 정보 조회 (모임 이름 포함)
  const { data: rawBookshelf, error: bookshelfError } = await supabase
    .from("bookshelves")
    .select("*, groups(name)")
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  const bookshelf = rawBookshelf ? {
    ...rawBookshelf,
    group_name: (rawBookshelf.groups as Record<string, unknown> | null)?.name || undefined,
    groups: undefined,
  } : null;

  if (bookshelfError) {
    throw new Error(`서재 조회 실패: ${bookshelfError.message}`);
  }

  if (!bookshelf) {
    return null;
  }

  // 서재별 책 통계 조회
  const { data: stats, error: statsError } = await supabase
    .from("user_books")
    .select("status")
    .eq("bookshelf_id", bookshelfId);

  if (statsError) {
    throw new Error(`통계 조회 실패: ${statsError.message}`);
  }

  const bookCount = stats?.length || 0;
  const readingCount = stats?.filter((s) => s.status === "reading").length || 0;
  const completedCount =
    stats?.filter((s) => s.status === "completed").length || 0;
  const pausedCount = stats?.filter((s) => s.status === "paused").length || 0;
  const notStartedCount =
    stats?.filter((s) => s.status === "not_started").length || 0;
  const rereadingCount =
    stats?.filter((s) => s.status === "rereading").length || 0;

  return {
    ...(bookshelf as Bookshelf),
    book_count: bookCount,
    reading_count: readingCount,
    completed_count: completedCount,
    paused_count: pausedCount,
    not_started_count: notStartedCount,
    rereading_count: rereadingCount,
  };
}

/**
 * 새 서재 생성
 */
export async function createBookshelf(
  input: CreateBookshelfInput
): Promise<Bookshelf> {
  const user = await getCurrentUser();
  if (!user) {
    console.error("[createBookshelf] 인증 오류: 사용자 없음");
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  console.log("[createBookshelf] 사용자 확인:", { userId: user.id, email: user.email });

  // 서재 생성 한도 체크
  const access = await checkFeatureAccess("bookshelf_create", user);
  if (!access.allowed) {
    throw new Error(
      `서재 한도(${access.limit}개)에 도달했습니다.`
    );
  }

  // 사용자의 최대 order 값 조회
  const { data: maxOrderData, error: orderError } = await supabase
    .from("bookshelves")
    .select("order")
    .eq("user_id", user.id)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("[createBookshelf] order 조회 오류:", orderError);
    // order 조회 실패는 치명적이지 않으므로 기본값 사용
  }

  const nextOrder = maxOrderData?.order !== undefined ? maxOrderData.order + 1 : 0;

  console.log("[createBookshelf] 서재 생성 시도:", {
    userId: user.id,
    name: input.name,
    order: nextOrder,
  });

  const { data, error } = await supabase
    .from("bookshelves")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      order: input.order !== undefined ? input.order : nextOrder,
      is_public: input.is_public || false,
      is_main: false, // 메인 서재는 자동 생성만 가능
    })
    .select()
    .single();

  if (error) {
    console.error("[createBookshelf] 서재 생성 오류:", {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`서재 생성 실패: ${error.message}`);
  }

  console.log("[createBookshelf] 서재 생성 성공:", data?.id);

  revalidatePath("/bookshelves");
  revalidatePath("/books");

  return data as unknown as Bookshelf;
}

/**
 * 서재 정보 수정
 */
export async function updateBookshelf(
  bookshelfId: string,
  input: UpdateBookshelfInput
): Promise<Bookshelf> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 서재 소유권 확인
  const { data: existing } = await supabase
    .from("bookshelves")
    .select("id, is_main")
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
  }

  // 메인 서재는 is_main을 변경할 수 없음
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.order !== undefined) updateData.order = input.order;
  if (input.is_public !== undefined) updateData.is_public = input.is_public;

  const { data, error } = await supabase
    .from("bookshelves")
    .update(updateData)
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`서재 수정 실패: ${error.message}`);
  }

  revalidatePath("/bookshelves");
  revalidatePath(`/bookshelves/${bookshelfId}`);
  revalidatePath("/books");

  return data as unknown as Bookshelf;
}

/**
 * 서재 삭제
 */
export async function deleteBookshelf(bookshelfId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 서재 소유권 및 메인 서재 여부 확인
  const { data: existing } = await supabase
    .from("bookshelves")
    .select("id, is_main")
    .eq("id", bookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
  }

  if (existing.is_main) {
    throw new Error("메인 서재는 삭제할 수 없습니다.");
  }

  // 메인 서재 조회
  const { data: mainBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_main", true)
    .maybeSingle();

  if (!mainBookshelf) {
    throw new Error("메인 서재를 찾을 수 없습니다.");
  }

  // 삭제할 서재의 모든 책을 메인 서재로 이동
  const { error: moveError } = await supabase
    .from("user_books")
    .update({ bookshelf_id: mainBookshelf.id })
    .eq("bookshelf_id", bookshelfId);

  if (moveError) {
    throw new Error(`책 이동 실패: ${moveError.message}`);
  }

  // 서재 삭제
  const { error: deleteError } = await supabase
    .from("bookshelves")
    .delete()
    .eq("id", bookshelfId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(`서재 삭제 실패: ${deleteError.message}`);
  }

  revalidatePath("/bookshelves");
  revalidatePath("/books");
}

/**
 * 책을 다른 서재로 이동
 */
export async function moveBookToBookshelf(
  userBookId: string,
  targetBookshelfId: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 책 소유권 확인
  const { data: userBook } = await supabase
    .from("user_books")
    .select("id")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!userBook) {
    throw new Error("책을 찾을 수 없거나 권한이 없습니다.");
  }

  // 대상 서재 소유권 확인
  const { data: targetBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("id", targetBookshelfId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!targetBookshelf) {
    throw new Error("서재를 찾을 수 없거나 권한이 없습니다.");
  }

  // 책 이동
  const { error } = await supabase
    .from("user_books")
    .update({ bookshelf_id: targetBookshelfId })
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`책 이동 실패: ${error.message}`);
  }

  revalidatePath("/books");
  revalidatePath(`/bookshelves/${targetBookshelfId}`);
}

/**
 * 서재 순서 변경 (드래그 앤 드롭)
 * @param bookshelfOrders 서재 ID와 새 순서의 배열
 */
export async function updateBookshelfOrder(
  bookshelfOrders: { id: string; order: number }[]
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 모든 서재의 소유권 확인
  const { data: bookshelves, error: fetchError } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("user_id", user.id)
    .in(
      "id",
      bookshelfOrders.map((bo) => bo.id)
    );

  if (fetchError) {
    throw new Error(`서재 조회 실패: ${fetchError.message}`);
  }

  if (!bookshelves || bookshelves.length !== bookshelfOrders.length) {
    throw new Error("일부 서재를 찾을 수 없거나 권한이 없습니다.");
  }

  // 각 서재의 순서 업데이트
  const updatePromises = bookshelfOrders.map(({ id, order }) =>
    supabase
      .from("bookshelves")
      .update({ order })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updatePromises);
  const errors = results.filter((result) => result.error);

  if (errors.length > 0) {
    throw new Error(
      `서재 순서 변경 실패: ${errors.map((e) => e.error?.message).join(", ")}`
    );
  }

  revalidatePath("/bookshelves");
  revalidatePath("/books");
}

/**
 * 공개 서재 조회 (책 목록 + 소유자 정보 포함)
 * Admin Client 사용으로 RLS 우회 - is_public = true인 서재만 조회
 */
export async function getPublicBookshelfWithBooks(bookshelfId: string): Promise<{
  bookshelf: Bookshelf;
  books: Array<{
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
    status: string;
  }>;
  owner: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
} | null> {
  const supabase = createAdminSupabaseClient();

  // 공개 서재 조회
  const { data: bookshelf, error: bookshelfError } = await supabase
    .from("bookshelves")
    .select("*")
    .eq("id", bookshelfId)
    .eq("is_public", true)
    .maybeSingle();

  if (bookshelfError || !bookshelf) {
    return null;
  }

  // 서재에 속한 책 목록 조회
  const { data: userBooks, error: booksError } = await supabase
    .from("user_books")
    .select(`
      id,
      status,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `)
    .eq("bookshelf_id", bookshelfId)
    .order("created_at", { ascending: false });

  if (booksError) {
    return null;
  }

  const books = (userBooks || []).map((ub: any) => ({
    id: ub.books?.id || "",
    title: ub.books?.title || "제목 없음",
    author: ub.books?.author || null,
    cover_image_url: ub.books?.cover_image_url || null,
    status: ub.status || "not_started",
  }));

  // 소유자 정보 조회
  let owner: { id: string; name: string | null; avatar_url: string | null } | null = null;
  if (bookshelf.user_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("id", bookshelf.user_id)
      .maybeSingle();

    if (userData) {
      owner = userData;
    }
  }

  return {
    bookshelf: bookshelf as unknown as Bookshelf,
    books,
    owner,
  };
}

/**
 * 모임서재 조회 또는 생성 (adminClient 사용 — 동기화 시 다른 사용자의 서재 생성)
 */
export async function getOrCreateGroupBookshelf(
  groupId: string,
  userId: string,
  groupName: string
): Promise<Bookshelf> {
  const adminSupabase = createAdminSupabaseClient();

  // 기존 모임서재 조회
  const { data: existing } = await adminSupabase
    .from("bookshelves")
    .select("*")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (existing) {
    return existing as unknown as Bookshelf;
  }

  // 사용자의 최대 order 값 조회
  const { data: maxOrderData } = await adminSupabase
    .from("bookshelves")
    .select("order")
    .eq("user_id", userId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrderData?.order !== undefined ? maxOrderData.order + 1 : 0;

  // 모임서재 생성
  const { data, error } = await adminSupabase
    .from("bookshelves")
    .insert({
      user_id: userId,
      name: `${groupName} 서재`,
      description: `독서모임 지정도서`,
      order: nextOrder,
      is_public: false,
      is_main: false,
      group_id: groupId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`모임서재 생성 실패: ${error.message}`);
  }

  return data as unknown as Bookshelf;
}