"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createBookshelf, getMainBookshelf, getOrCreateGroupBookshelf } from "@/app/actions/bookshelves";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ReadingStatus } from "@/types/book";

/**
 * 모임에 지정도서 추가 (리더만 가능)
 */
export async function addGroupBook(
  groupId: string,
  bookId: string,
  targetCompletedAt?: string
) {
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
    throw new Error("리더만 지정도서를 추가할 수 있습니다.");
  }

  // 책 존재 확인
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    throw new Error("책을 찾을 수 없습니다.");
  }

  // 이미 추가된 지정도서인지 확인
  const { data: existing, error: existingError } = await supabase
    .from("group_books")
    .select("id")
    .eq("group_id", groupId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(`중복 체크 실패: ${existingError.message}`);
  }

  if (existing) {
    throw new Error("이미 추가된 지정도서입니다.");
  }

  // 지정도서 추가
  const { error: insertError } = await supabase.from("group_books").insert({
    group_id: groupId,
    book_id: bookId,
    target_completed_at: targetCompletedAt || null,
  });

  if (insertError) {
    throw new Error(`지정도서 추가 실패: ${insertError.message}`);
  }

  // 모든 멤버의 모임서재에 자동 동기화 (best-effort)
  try {
    await syncGroupBookToAllMembers(groupId, bookId);
  } catch (err) {
    console.error("[addGroupBook] 멤버 동기화 실패:", err);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/bookshelves");
  return { success: true };
}

/**
 * 모임 지정도서 목록 조회
 */
export async function getGroupBooks(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id, role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  // 리더인지 확인
  const { data: group } = await supabase
    .from("groups")
    .select("leader_id, join_type")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;
  const isPublic = group.join_type !== "private";

  // 접근 권한 확인 (리더, 멤버, 또는 공개 그룹)
  if (!isLeader && !isMember && !isPublic) {
    throw new Error("모임 멤버만 지정도서를 조회할 수 있습니다.");
  }

  // 지정도서 목록 조회
  const { data: groupBooks, error: groupBooksError } = await supabase
    .from("group_books")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        publisher,
        cover_image_url,
        published_date
      )
    `
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (groupBooksError) {
    throw new Error(`지정도서 조회 실패: ${groupBooksError.message}`);
  }

  return groupBooks || [];
}

/**
 * 모임 지정도서 목록 조회 (사용자의 개인 서재 연결 정보 포함)
 */
export async function getGroupBooksWithUserStatus(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 지정도서 목록 조회
  const groupBooks = await getGroupBooks(groupId);

  // 사용자가 이미 등록한 책 확인
  const bookIds = groupBooks.map((gb: any) => gb.book_id);
  let userBooks: any[] = [];

  if (bookIds.length > 0) {
    const { data: userBooksData } = await supabase
      .from("user_books")
      .select("book_id, status, started_at, reading_reason")
      .eq("user_id", user.id)
      .in("book_id", bookIds);

    userBooks = userBooksData || [];
  }

  // 최근 기록자 정보 조회 (지정도서별)
  let recentContributorsMap: Record<string, { id: string; name: string; avatar_url: string | null }[]> = {};
  if (bookIds.length > 0) {
    const { data: sharedNotes } = await supabase
      .from("group_notes")
      .select(`
        notes!inner (
          book_id,
          user_id,
          users (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq("group_id", groupId)
      .order("shared_at", { ascending: false });

    // 책별로 최근 기록자 3명씩 추출 (중복 제거)
    for (const sn of sharedNotes || []) {
      const note = (sn as any).notes;
      const bookId = note?.book_id;
      const noteUser = note?.users;
      if (!bookId || !noteUser || !bookIds.includes(bookId)) continue;

      if (!recentContributorsMap[bookId]) {
        recentContributorsMap[bookId] = [];
      }
      const existing = recentContributorsMap[bookId];
      if (existing.length < 3 && !existing.some((u) => u.id === noteUser.id)) {
        existing.push(noteUser);
      }
    }
  }

  // 지정도서에 사용자 상태 + 최근 기록자 추가
  const groupBooksWithStatus = groupBooks.map((gb: any) => {
    const userBook = userBooks.find((ub) => ub.book_id === gb.book_id);
    return {
      ...gb,
      isInMyLibrary: !!userBook,
      myStatus: userBook?.status || null,
      myStartedAt: userBook?.started_at || null,
      myReadingReason: userBook?.reading_reason || null,
      recentContributors: recentContributorsMap[gb.book_id] || [],
    };
  });

  return groupBooksWithStatus;
}

/**
 * 지정도서를 내 서재에 추가
 */
export async function addGroupBookToMyLibrary(
  groupId: string,
  bookId: string,
  status: "reading" | "completed" | "paused" | "not_started" | "rereading" = "reading"
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 지정도서를 추가할 수 있습니다.");
  }

  // 지정도서인지 확인
  const { data: groupBook } = await supabase
    .from("group_books")
    .select("id")
    .eq("group_id", groupId)
    .eq("book_id", bookId)
    .single();

  if (!groupBook) {
    throw new Error("지정도서가 아닙니다.");
  }

  // 이미 등록된 책인지 확인
  const { data: existing } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existing) {
    throw new Error("이미 내 서재에 등록된 책입니다.");
  }

  // 메인 서재 찾기
  const { data: mainBookshelf } = await supabase
    .from("bookshelves")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_main", true)
    .maybeSingle();

  if (!mainBookshelf) {
    throw new Error("메인 서재를 찾을 수 없습니다. 서재를 먼저 생성해주세요.");
  }

  // 내 서재에 추가
  const { error } = await supabase.from("user_books").insert({
    user_id: user.id,
    book_id: bookId,
    bookshelf_id: mainBookshelf.id,
    status: status,
    started_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`서재 추가 실패: ${error.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/books");
  return { success: true };
}

/**
 * 지정도서 삭제 (리더만 가능)
 */
export async function removeGroupBook(groupId: string, bookId: string) {
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
    throw new Error("리더만 지정도서를 삭제할 수 있습니다.");
  }

  // 지정도서 삭제
  const { error: deleteError } = await supabase
    .from("group_books")
    .delete()
    .eq("group_id", groupId)
    .eq("book_id", bookId);

  if (deleteError) {
    throw new Error(`지정도서 삭제 실패: ${deleteError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/bookshelves");
  return { success: true };
}

/**
 * 개인 서재를 모임에 공유
 */
export async function shareUserBookToGroup(groupId: string, userBookId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 서재를 공유할 수 있습니다.");
  }

  // 서재 소유자 확인
  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("user_id")
    .eq("id", userBookId)
    .single();

  if (userBookError || !userBook) {
    throw new Error("서재를 찾을 수 없습니다.");
  }

  if (userBook.user_id !== user.id) {
    throw new Error("본인의 서재만 공유할 수 있습니다.");
  }

  // 이미 공유된 서재인지 확인
  const { data: existing } = await supabase
    .from("group_shared_books")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_book_id", userBookId)
    .maybeSingle();

  if (existing) {
    throw new Error("이미 공유된 서재입니다.");
  }

  // 서재 공유
  const { error: shareError } = await supabase
    .from("group_shared_books")
    .insert({
      group_id: groupId,
      user_book_id: userBookId,
    });

  if (shareError) {
    throw new Error(`서재 공유 실패: ${shareError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임에 공유된 개인 서재 목록 조회
 */
export async function getSharedBooks(groupId: string) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
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
    .select("leader_id, join_type")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("모임을 찾을 수 없습니다.");
  }

  const isLeader = group.leader_id === user.id;
  const isMember = !!membership;
  const isPublic = group.join_type !== "private";

  // 접근 권한 확인 (리더, 멤버, 또는 공개 그룹)
  if (!isLeader && !isMember && !isPublic) {
    throw new Error("모임 멤버만 공유 서재를 조회할 수 있습니다.");
  }

  // 공유된 서재 목록 조회
  const { data: sharedBooks, error: sharedBooksError } = await supabase
    .from("group_shared_books")
    .select(
      `
      *,
      user_books (
        id,
        status,
        started_at,
        reading_reason,
        books (
          id,
          title,
          author,
          publisher,
          cover_image_url,
          published_date
        ),
        users (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq("group_id", groupId)
    .order("shared_at", { ascending: false });

  if (sharedBooksError) {
    throw new Error(`공유 서재 조회 실패: ${sharedBooksError.message}`);
  }

  return sharedBooks || [];
}

/**
 * 공유된 서재 공유 해제
 */
export async function unshareUserBookFromGroup(
  groupId: string,
  userBookId: string
) {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 서재 소유자 확인
  const { data: userBook, error: userBookError } = await supabase
    .from("user_books")
    .select("user_id")
    .eq("id", userBookId)
    .single();

  if (userBookError || !userBook) {
    throw new Error("서재를 찾을 수 없습니다.");
  }

  if (userBook.user_id !== user.id) {
    throw new Error("본인의 서재만 공유 해제할 수 있습니다.");
  }

  // 공유 해제
  const { error: unshareError } = await supabase
    .from("group_shared_books")
    .delete()
    .eq("group_id", groupId)
    .eq("user_book_id", userBookId);

  if (unshareError) {
    throw new Error(`공유 해제 실패: ${unshareError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * 모임 지정도서를 내 서재에 일괄 등록
 */
export async function addAllGroupBooksToMyLibrary(
  groupId: string,
  options: {
    bookshelfId?: string;
    createNewBookshelf?: boolean;
    bookshelfName?: string;
    status?: ReadingStatus;
  }
): Promise<{
  added: number;
  skipped: number;
  bookshelfId: string;
  bookshelfName: string;
}> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 모임 멤버 확인
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .single();

  if (!membership) {
    throw new Error("모임 멤버만 지정도서를 추가할 수 있습니다.");
  }

  // 모임 지정도서 전체 조회
  const { data: groupBooks, error: gbError } = await supabase
    .from("group_books")
    .select("book_id")
    .eq("group_id", groupId);

  if (gbError) {
    throw new Error(`지정도서 조회 실패: ${gbError.message}`);
  }

  if (!groupBooks || groupBooks.length === 0) {
    throw new Error("등록할 지정도서가 없습니다.");
  }

  const allBookIds = groupBooks.map((gb) => gb.book_id);

  // 이미 내 서재에 있는 책 확인
  const { data: existingBooks } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", user.id)
    .in("book_id", allBookIds);

  const existingBookIds = new Set((existingBooks || []).map((eb) => eb.book_id));
  const newBookIds = allBookIds.filter((id) => !existingBookIds.has(id));

  // 서재 결정
  let targetBookshelfId: string;
  let targetBookshelfName: string;

  if (options.createNewBookshelf) {
    // 모임 이름 조회
    const { data: group } = await supabase
      .from("groups")
      .select("name")
      .eq("id", groupId)
      .single();

    const shelfName = options.bookshelfName || `${group?.name || "독서모임"} 서재`;

    const newShelf = await createBookshelf({
      name: shelfName,
      description: `독서모임 지정도서`,
    });
    targetBookshelfId = newShelf.id;
    targetBookshelfName = newShelf.name;
  } else if (options.bookshelfId) {
    // 기존 서재 소유권 확인
    const { data: shelf, error: shelfError } = await supabase
      .from("bookshelves")
      .select("id, name")
      .eq("id", options.bookshelfId)
      .eq("user_id", user.id)
      .single();

    if (shelfError || !shelf) {
      throw new Error("서재를 찾을 수 없습니다.");
    }
    targetBookshelfId = shelf.id;
    targetBookshelfName = shelf.name;
  } else {
    // 메인 서재 fallback
    const mainShelf = await getMainBookshelf();
    if (!mainShelf) {
      throw new Error("메인 서재를 찾을 수 없습니다.");
    }
    targetBookshelfId = mainShelf.id;
    targetBookshelfName = mainShelf.name;
  }

  // 추가할 책이 없으면 바로 반환
  if (newBookIds.length === 0) {
    return {
      added: 0,
      skipped: allBookIds.length,
      bookshelfId: targetBookshelfId,
      bookshelfName: targetBookshelfName,
    };
  }

  // 일괄 insert
  const now = new Date().toISOString();
  const insertData = newBookIds.map((bookId) => ({
    user_id: user.id,
    book_id: bookId,
    bookshelf_id: targetBookshelfId,
    status: options.status || ("reading" as ReadingStatus),
    started_at: now,
  }));

  const { error: insertError } = await supabase
    .from("user_books")
    .insert(insertData);

  if (insertError) {
    throw new Error(`일괄 등록 실패: ${insertError.message}`);
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/books");
  revalidatePath("/bookshelves");

  return {
    added: newBookIds.length,
    skipped: existingBookIds.size,
    bookshelfId: targetBookshelfId,
    bookshelfName: targetBookshelfName,
  };
}

/**
 * 지정도서 1권을 모든 승인된 멤버의 모임서재에 동기화
 * addGroupBook 후 호출 (best-effort, 실패해도 메인 작업 영향 없음)
 */
export async function syncGroupBookToAllMembers(
  groupId: string,
  bookId: string
): Promise<void> {
  const adminSupabase = createAdminSupabaseClient();

  // 모임 정보 조회
  const { data: group } = await adminSupabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (!group) return;

  // 모든 승인된 멤버 조회
  const { data: members } = await adminSupabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("status", "approved");

  if (!members || members.length === 0) return;

  const now = new Date().toISOString();

  for (const member of members) {
    try {
      // 모임서재 확보
      const shelf = await getOrCreateGroupBookshelf(groupId, member.user_id, group.name);

      // 이미 등록된 책인지 확인 (어떤 서재든)
      const { data: existing } = await adminSupabase
        .from("user_books")
        .select("id")
        .eq("user_id", member.user_id)
        .eq("book_id", bookId)
        .maybeSingle();

      if (existing) continue;

      // 모임서재에 추가
      await adminSupabase.from("user_books").insert({
        user_id: member.user_id,
        book_id: bookId,
        bookshelf_id: shelf.id,
        status: "not_started",
        started_at: now,
      });
    } catch (err) {
      console.error(`[syncGroupBook] 멤버 ${member.user_id} 동기화 실패:`, err);
    }
  }

  revalidatePath("/bookshelves");
}

/**
 * 새 멤버 승인 시 기존 지정도서 전체를 모임서재에 동기화
 */
export async function syncGroupBooksToMember(
  groupId: string,
  userId: string
): Promise<void> {
  const adminSupabase = createAdminSupabaseClient();

  // 모임 정보
  const { data: group } = await adminSupabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (!group) return;

  // 지정도서 목록
  const { data: groupBooks } = await adminSupabase
    .from("group_books")
    .select("book_id")
    .eq("group_id", groupId);

  if (!groupBooks || groupBooks.length === 0) return;

  const bookIds = groupBooks.map((gb) => gb.book_id);

  // 이미 사용자가 가진 책 확인
  const { data: existingBooks } = await adminSupabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", userId)
    .in("book_id", bookIds);

  const existingSet = new Set((existingBooks || []).map((eb) => eb.book_id));
  const newBookIds = bookIds.filter((id) => !existingSet.has(id));

  if (newBookIds.length === 0) return;

  // 모임서재 확보
  const shelf = await getOrCreateGroupBookshelf(groupId, userId, group.name);

  // 일괄 추가
  const now = new Date().toISOString();
  const insertData = newBookIds.map((bookId) => ({
    user_id: userId,
    book_id: bookId,
    bookshelf_id: shelf.id,
    status: "not_started" as const,
    started_at: now,
  }));

  const { error } = await adminSupabase.from("user_books").insert(insertData);

  if (error) {
    console.error(`[syncGroupBooksToMember] 일괄 동기화 실패:`, error);
  }

  revalidatePath("/bookshelves");
}

/**
 * 멤버 탈퇴/강퇴 시 모임서재 연결 해제 (일반 서재로 전환, 데이터 보존)
 */
export async function unlinkGroupBookshelf(
  groupId: string,
  userId: string
): Promise<void> {
  const adminSupabase = createAdminSupabaseClient();

  const { error } = await adminSupabase
    .from("bookshelves")
    .update({ group_id: null })
    .eq("user_id", userId)
    .eq("group_id", groupId);

  if (error) {
    console.error(`[unlinkGroupBookshelf] 연결 해제 실패:`, error);
  }

  revalidatePath("/bookshelves");
}
