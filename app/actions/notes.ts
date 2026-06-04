"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getKSTToday } from "@/lib/utils/timezone";
import type {
  CreateNoteInput,
  UpdateNoteInput,
  NoteType,
  SourceType,
  NoteWithBook,
  Transcription,
} from "@/types/note";
import { isValidUUID, isValidLength, isValidTags, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "./auth";
import { earnPoints, updateStreak, spendPoints } from "./points";
import type { PointActionType } from "@/types/points";
import { getRandomDefaultCoverPath } from "@/lib/constants/default-covers";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";
import { checkFeatureAccess } from "./subscription";
import { getSampleUserId } from "./sample";

/**
 * 기록 생성
 * @param data 기록 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 *
 * 모니터링 (2026-06-04 운영 데이터 기준 재조정):
 *   - photo → 사실상 미사용(최근 30일 0건). 사진은 reading_logs.image_urls(스탬프)로 이관됨 → 신규 생성은 레거시.
 *   - progress → **활성**(최근 30일 15건). 진행률 슬라이더 → 여정(reading-journey)의 데이터 소스 → deprecated 아님(차단 X).
 *   따라서 warn은 photo에만 한정한다.
 */
export async function createNote(data: CreateNoteInput, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // photo만 레거시 모니터링 (progress는 진행률/여정의 활성 경로 — 차단 대상 아님)
  if (data.type === "photo") {
    console.warn(
      `[legacy] createNote(type=photo) — 사진은 RecordSheet(스탬프/세션 image_urls)로 이관됨. caller=${data.source_type ?? "unknown"}`,
    );
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

  // 노트 생성 한도 체크
  const access = await checkFeatureAccess("notes_create", currentUser);
  if (!access.allowed) {
    if (access.canUseWithPoints) {
      const spendResult = await spendPoints("note_create", {
        user: currentUser,
        description: "노트 추가 생성",
      });
      if (!spendResult.success) {
        throw new Error(
          `이번 달 기록 한도(${access.limit}개)에 도달했습니다. 추가 생성에 ${access.pointCost}P가 필요하지만 포인트가 부족합니다.`
        );
      }
    } else {
      throw new Error(
        `이번 달 기록 한도(${access.limit}개)에 도달했습니다.`
      );
    }
  }

  // book_id UUID 검증 (optional — 책 없이 저장 가능)
  if (data.book_id && !isValidUUID(data.book_id)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  if (data.title && !isValidLength(data.title, 1, 100)) {
    throw new Error("제목은 100자 이하여야 합니다.");
  }

  // 입력 검증
  // quote_content와 memo_content 검증
  if (data.quote_content && !isValidLength(data.quote_content, 1, 5000)) {
    throw new Error("인상깊은 구절은 1자 이상 5,000자 이하여야 합니다.");
  }
  if (data.memo_content && !isValidLength(data.memo_content, 1, 10000)) {
    throw new Error("내 생각은 1자 이상 10,000자 이하여야 합니다.");
  }

  // 기존 content 필드 검증 (하위 호환성)
  if (data.content && !isValidLength(data.content, 1, 10000)) {
    throw new Error("내용은 1자 이상 10,000자 이하여야 합니다.");
  }

  // 최소 하나의 값이 있어야 함
  const hasQuote = data.quote_content && data.quote_content.trim().length > 0;
  const hasMemo = data.memo_content && data.memo_content.trim().length > 0;
  const hasContent = data.content && data.content.trim().length > 0;
  const hasImage = data.image_url && data.image_url.trim().length > 0;
  const isProgressType = data.type === "progress";
  const hasPageNumber = data.page_number !== null && data.page_number !== undefined;
  const hasReadingDuration = data.reading_duration_seconds && data.reading_duration_seconds > 0;

  // 독서 시간 기록이 있으면 텍스트 없이도 저장 허용 (나중에 보완 가능)
  if (!hasQuote && !hasMemo && !hasContent && !hasImage && !(isProgressType && hasPageNumber) && !hasReadingDuration) {
    throw new Error("인상깊은 구절, 내 생각, 내용, 또는 이미지 중 최소 하나는 입력해주세요.");
  }

  if (data.tags && !isValidTags(data.tags, 10, 50)) {
    throw new Error("태그는 최대 10개까지, 각 태그는 50자 이하여야 합니다.");
  }

  if (data.page_number !== null && data.page_number !== undefined) {
    const pageNum = typeof data.page_number === 'string' ? parseInt(data.page_number, 10) : data.page_number;
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      throw new Error("페이지 번호는 1 이상의 정수여야 합니다.");
    }
  }

  // 책 소유 확인 및 book_id 조회 (book_id가 있는 경우에만)
  let resolvedBookId: string | null = null;

  if (data.book_id) {
    // data.book_id는 user_books.id이므로, user_books에서 book_id를 조회해야 함
    const { data: userBook, error: bookCheckError } = await supabase
      .from("user_books")
      .select("id, book_id")
      .eq("id", data.book_id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (bookCheckError && bookCheckError.code !== "PGRST116") {
      throw new Error("책 소유 확인에 실패했습니다.");
    }

    if (!userBook || !userBook.book_id) {
      throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
    }

    resolvedBookId = userBook.book_id;
  }

  // book_id가 없으면 "Readtree 기록" 시스템 책에 자동 할당
  if (!resolvedBookId) {
    resolvedBookId = READTREE_BOOK_ID;

    const { data: existingUB } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("book_id", READTREE_BOOK_ID)
      .maybeSingle();

    if (!existingUB) {
      await supabase.from("user_books").upsert(
        {
          user_id: currentUser.id,
          book_id: READTREE_BOOK_ID,
          status: "reading",
        },
        { onConflict: "user_id,book_id" }
      );
    }
  }

  // related_user_book_ids 검증
  let relatedUserBookIds: string[] | null = null;
  if (data.related_user_book_ids && data.related_user_book_ids.length > 0) {
    // 각 ID가 유효한 UUID인지 확인
    for (const id of data.related_user_book_ids) {
      if (!isValidUUID(id)) {
        throw new Error(`유효하지 않은 관련 책 ID입니다: ${id}`);
      }
      // 주 책과 중복되지 않는지 확인
      if (id === data.book_id) {
        throw new Error("주 책은 관련 책 목록에 포함할 수 없습니다.");
      }
    }

    // 각 ID가 현재 사용자의 user_books에 속하는지 확인
    const { data: relatedUserBooks, error: relatedBooksError } = await supabase
      .from("user_books")
      .select("id")
      .in("id", data.related_user_book_ids)
      .eq("user_id", currentUser.id);

    if (relatedBooksError) {
      throw new Error("관련 책 확인에 실패했습니다.");
    }

    if (!relatedUserBooks || relatedUserBooks.length !== data.related_user_book_ids.length) {
      throw new Error("일부 관련 책을 소유하고 있지 않거나 권한이 없습니다.");
    }

    // 중복 제거 및 정렬
    relatedUserBookIds = [...new Set(data.related_user_book_ids)];
  }

  // content 구성: quote_content와 memo_content를 JSON으로 저장
  let content: string | null = null;
  if (data.quote_content || data.memo_content) {
    const contentData: { quote?: string; memo?: string } = {};
    if (data.quote_content && data.quote_content.trim().length > 0) {
      contentData.quote = data.quote_content.trim();
    }
    if (data.memo_content && data.memo_content.trim().length > 0) {
      contentData.memo = data.memo_content.trim();
    }
    content = JSON.stringify(contentData);
  } else if (data.content) {
    // 기존 content 필드 사용 (하위 호환성)
    content = data.content;
  }

  // type 결정: 명시적 type > 이미지 기반 > 콘텐츠 기반 > 기본 memo
  let noteType = data.type;
  if (!noteType) {
    if (data.image_url) {
      noteType = data.upload_type === "photo" ? "photo" : "transcription";
    } else if (data.quote_content?.trim() && !data.memo_content?.trim()) {
      noteType = "quote";
    } else {
      noteType = "memo";
    }
  }

  // Readtree 기록 + 이미지 없음 → 랜덤 기본 표지 배정
  let imageUrl = data.image_url || null;
  if (resolvedBookId === READTREE_BOOK_ID && !imageUrl) {
    const coverPath = getRandomDefaultCoverPath();
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(coverPath);
    imageUrl = publicUrl;
  }

  // 기록 생성
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: currentUser.id,
      book_id: resolvedBookId,
      title: data.title || null,
      type: noteType,
      content: content,
      image_url: imageUrl,
      page_number: data.page_number || null,
      is_public: data.is_public ?? true,
      tags: data.tags || null,
      related_user_book_ids: relatedUserBookIds,
      source_type: data.source_type || null,
      source_label: data.source_label || null,
      status: data.status || "published",
    })
    .select()
    .single();

  if (error || !note) {
    throw new Error(sanitizeErrorMessage(error || new Error("기록 생성에 실패했습니다.")));
  }

  // 포인트 적립 (완전히 독립적으로 처리 - 실패해도 노트 생성에 영향 없음)
  let pointsEarned = 0;
  try {
    let pointActionType: PointActionType = "note_create";
    if (noteType === "quote") pointActionType = "note_quote";
    else if (noteType === "memo") pointActionType = "note_memo";
    else if (noteType === "photo") pointActionType = "note_photo";
    else if (noteType === "transcription") pointActionType = "note_transcription";
    else if (noteType === "progress") pointActionType = "note_progress";

    const [, pointsResult] = await Promise.all([
      updateStreak(currentUser).catch(() => null),
      earnPoints(pointActionType, {
        user: currentUser,
        referenceId: note.id,
        referenceType: "note",
        description: `${data.title || "기록"} 작성`,
      }).catch(() => null),
    ]).catch(() => [null, null]);

    if (pointsResult && pointsResult.success) {
      pointsEarned = pointsResult.points_earned;
    }
  } catch {
    // 포인트 설정 중 에러 발생해도 완전히 무시
  }

  revalidatePath("/notes");
  if (data.book_id) {
    revalidatePath(`/books/${data.book_id}`);
  }
  revalidatePath(`/notes/${note.id}`);
  revalidatePath("/");

  return { success: true, noteId: note.id, pointsEarned };
}

/**
 * 진행률 변경의 여정 편입 (DEC-6).
 *
 * 메모 없는 단순 진행 기록을 "같은 날 1점"으로 집약한다:
 *   - 같은 날(KST) 같은 책의 메모 없는 progress 노트가 있으면 page_number만 갱신,
 *   - 없으면 새로 생성.
 * 후퇴/정정(페이지 감소)은 호출부에서 제외해 여정 노이즈를 줄인다.
 * 메모가 있는 진행 기록은 항상 별도 createNote(type='progress', content)로 남긴다.
 */
export async function upsertDailyProgressNote(
  userBookId: string,
  page: number,
): Promise<{ action: "created" | "updated"; noteId: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const todayKstMidnight = getKSTToday().toISOString();

  // 같은 날 메모 없는 progress 노트(content IS NULL) 탐색
  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", userBookId)
    .eq("type", "progress")
    .is("content", null)
    .gte("created_at", todayKstMidnight)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("notes")
      .update({ page_number: String(page) })
      .eq("id", existing.id);
    if (error) throw new Error("진행 기록 갱신에 실패했습니다.");
    revalidatePath(`/books/${userBookId}`);
    return { action: "updated", noteId: existing.id };
  }

  const result = await createNote({
    book_id: userBookId,
    type: "progress",
    page_number: String(page),
    is_public: true,
  });
  return { action: "created", noteId: result.noteId };
}

/**
 * 빠른 기록 (Quick Capture)
 * 최소한의 입력으로 draft 상태 기록을 즉시 생성
 * @param content 자유 텍스트 (인용구/생각 자동 구분 없이 memo로 저장)
 * @param bookId user_books.id (선택, 없으면 READTREE_BOOK_ID)
 * @param readingDurationSeconds 독서 시간 (타이머 연동, 선택)
 *
 * @deprecated Phase 5 — 새 진입점은 `addNoteToSession` (sessionId NULL = 자유 상세 D3).
 *   현재 호출처는 보존(QuickCapture 시트). Phase 6에서 상세기록 전용 시그니처로 정리 예정.
 */
export async function createQuickNote(
  content: string,
  bookId?: string,
  readingDurationSeconds?: number,
  options?: {
    status?: "draft" | "published";
    quoteContent?: string;
    pageNumber?: string;
    imageUrl?: string;
    uploadType?: "photo" | "transcription";
  },
) {
  if (content && !isValidLength(content, 0, 10000)) {
    throw new Error("내용은 10,000자 이하여야 합니다.");
  }

  const trimmedContent = content?.trim() || "";

  return createNote({
    book_id: bookId,
    memo_content: trimmedContent || undefined,
    quote_content: options?.quoteContent?.trim() || undefined,
    page_number: options?.pageNumber || undefined,
    image_url: options?.imageUrl || undefined,
    upload_type: options?.uploadType || undefined,
    status: options?.status ?? "draft",
    is_public: true,
    reading_duration_seconds: readingDurationSeconds,
  });
}

/**
 * draft → published 전환 (상세 추가 후 발행)
 * @param noteId 기록 ID
 * @param data 추가/수정할 데이터 (선택)
 */
export async function promoteNote(
  noteId: string,
  data?: UpdateNoteInput,
  user?: User | null,
) {
  const supabase = await createServerSupabaseClient();

  if (!isValidUUID(noteId)) {
    throw new Error("유효하지 않은 기록 ID입니다.");
  }

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  // 소유권 확인
  const { data: existingNote, error: fetchError } = await supabase
    .from("notes")
    .select("id, status, user_id")
    .eq("id", noteId)
    .eq("user_id", currentUser.id)
    .single();

  if (fetchError || !existingNote) {
    throw new Error("기록을 찾을 수 없거나 권한이 없습니다.");
  }

  // 업데이트할 데이터 구성
  const updateData: Record<string, unknown> = { status: "published" };

  if (data) {
    if (data.title !== undefined) updateData.title = data.title;
    if (data.quote_content || data.memo_content) {
      const contentData: { quote?: string; memo?: string } = {};
      if (data.quote_content?.trim()) contentData.quote = data.quote_content.trim();
      if (data.memo_content?.trim()) contentData.memo = data.memo_content.trim();
      updateData.content = JSON.stringify(contentData);
    }
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.page_number !== undefined) updateData.page_number = data.page_number;
    if (data.is_public !== undefined) updateData.is_public = data.is_public;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.related_user_book_ids !== undefined) updateData.related_user_book_ids = data.related_user_book_ids;
  }

  const { error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId)
    .eq("user_id", currentUser.id);

  if (error) {
    throw new Error("기록 발행에 실패했습니다.");
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/");

  return { success: true };
}

/**
 * 기록 수정
 * @param noteId 기록 ID
 * @param data 수정할 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateNote(noteId: string, data: UpdateNoteInput, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  // noteId UUID 검증
  if (!isValidUUID(noteId)) {
    throw new Error("유효하지 않은 기록 ID입니다.");
  }

  // 태그 검증
  if (data.tags && !isValidTags(data.tags, 10, 50)) {
    throw new Error("태그는 최대 10개까지, 각 태그는 50자 이하여야 합니다.");
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

  // 기록 소유 확인 및 필요한 모든 필드를 한 번에 조회 (중복 쿼리 방지)
  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, book_id, content")
    .eq("id", noteId)
    .eq("user_id", currentUser.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error("기록 조회에 실패했습니다.");
  }

  if (!note) {
    throw new Error("권한이 없습니다. 해당 기록을 수정할 권한이 없습니다.");
  }

  // content 구성: quote_content와 memo_content를 JSON으로 저장
  let content: string | null | undefined = undefined;
  if (data.quote_content !== undefined || data.memo_content !== undefined) {
    // 첫 조회에서 가져온 note.content 재사용 (중복 쿼리 제거)
    let existingQuote: string | undefined;
    let existingMemo: string | undefined;

    if (note.content) {
      try {
        const parsed = JSON.parse(note.content);
        if (typeof parsed === "object" && parsed !== null) {
          existingQuote = parsed.quote;
          existingMemo = parsed.memo;
        }
      } catch {
        // JSON이 아니면 기존 content를 memo로 처리
        existingMemo = note.content;
      }
    }

    const contentData: { quote?: string; memo?: string } = {};
    if (data.quote_content !== undefined) {
      contentData.quote = data.quote_content.trim().length > 0 ? data.quote_content.trim() : undefined;
    } else if (existingQuote) {
      contentData.quote = existingQuote;
    }

    if (data.memo_content !== undefined) {
      contentData.memo = data.memo_content.trim().length > 0 ? data.memo_content.trim() : undefined;
    } else if (existingMemo) {
      contentData.memo = existingMemo;
    }

    // quote와 memo가 모두 없으면 null, 하나라도 있으면 JSON
    if (!contentData.quote && !contentData.memo) {
      content = null;
    } else {
      content = JSON.stringify(contentData);
    }
  } else if (data.content !== undefined) {
    // 기존 content 필드 사용 (하위 호환성)
    content = data.content;
  }

  // type 결정: 업로드 타입이 있으면 해당 타입, 없으면 기존 타입 유지
  let noteType: NoteType | undefined = undefined;
  if (data.image_url !== undefined || data.upload_type !== undefined) {
    if (data.image_url) {
      noteType = data.upload_type === "photo" ? "photo" : "transcription";
    } else {
      // 이미지가 제거되면 memo로 변경
      noteType = "memo";
    }
  }

  // related_user_book_ids 검증
  let relatedUserBookIds: string[] | null | undefined = undefined;
  if (data.related_user_book_ids !== undefined) {
    if (data.related_user_book_ids.length === 0) {
      relatedUserBookIds = null;
    } else {
      // 각 ID가 유효한 UUID인지 확인
      for (const id of data.related_user_book_ids) {
        if (!isValidUUID(id)) {
          throw new Error(`유효하지 않은 관련 책 ID입니다: ${id}`);
        }
      }

      // 첫 조회에서 가져온 note.book_id 재사용 (중복 쿼리 제거)
      // 주 책의 user_books.id 조회
      const { data: mainUserBook } = await supabase
        .from("user_books")
        .select("id")
        .eq("book_id", note.book_id)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (mainUserBook) {
        // 주 책과 중복되지 않는지 확인
        if (data.related_user_book_ids.includes(mainUserBook.id)) {
          throw new Error("주 책은 관련 책 목록에 포함할 수 없습니다.");
        }
      }

      // 각 ID가 현재 사용자의 user_books에 속하는지 확인
      const { data: relatedUserBooks, error: relatedBooksError } = await supabase
        .from("user_books")
        .select("id")
        .in("id", data.related_user_book_ids)
        .eq("user_id", currentUser.id);

      if (relatedBooksError) {
        throw new Error("관련 책 확인에 실패했습니다.");
      }

      if (!relatedUserBooks || relatedUserBooks.length !== data.related_user_book_ids.length) {
        throw new Error("일부 관련 책을 소유하고 있지 않거나 권한이 없습니다.");
      }

      // 중복 제거 및 정렬
      relatedUserBookIds = [...new Set(data.related_user_book_ids)];
    }
  }

  // 기록 수정
  const updateData: any = {
    title: data.title !== undefined ? (data.title || null) : undefined,
    page_number: data.page_number !== undefined ? data.page_number : undefined,
    is_public: data.is_public !== undefined ? data.is_public : undefined,
    tags: data.tags !== undefined ? data.tags : undefined,
  };

  if (relatedUserBookIds !== undefined) {
    updateData.related_user_book_ids = relatedUserBookIds;
  }

  if (content !== undefined) {
    updateData.content = content;
  }

  if (noteType !== undefined) {
    updateData.type = noteType;
  }

  if (data.image_url !== undefined) {
    updateData.image_url = data.image_url;
  }

  const { error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // revalidatePath: note.book_id를 알고 있으므로 재조회 없이 처리
  // /books 경로 전체를 갱신하여 해당 book_id를 가진 모든 페이지 갱신
  revalidatePath("/notes");
  revalidatePath("/books"); // 책 목록 페이지 갱신
  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/"); // 홈페이지도 갱신

  return { success: true };
}

/**
 * 기록 삭제
 * @param noteId 기록 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteNote(noteId: string, user?: User | null) {
  const supabase = await createServerSupabaseClient();

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

  // 기록 소유 확인
  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, book_id, image_url")
    .eq("id", noteId)
    .eq("user_id", currentUser.id)
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error("기록 조회에 실패했습니다.");
  }

  if (!note) {
    throw new Error("권한이 없습니다. 해당 기록을 삭제할 권한이 없습니다.");
  }

  // 이미지가 있으면 Storage에서 삭제
  if (note.image_url) {
    try {
      // Supabase Storage 경로 추출
      // URL 형식: https://[project].supabase.co/storage/v1/object/public/images/photos/[userId]/[fileName]
      const url = new URL(note.image_url);

      // Supabase Storage URL 형식 검증
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !note.image_url.startsWith(supabaseUrl)) {
        throw new Error("유효하지 않은 Storage URL입니다.");
      }

      const pathParts = url.pathname.split("/storage/v1/object/public/");

      if (pathParts.length === 2) {
        const fullPath = pathParts[1];
        const pathSegments = fullPath.split("/");

        if (pathSegments.length >= 2) {
          const bucket = pathSegments[0]; // "images"
          const filePath = pathSegments.slice(1).join("/"); // "photos/[userId]/[fileName]"

          // 경로에 path traversal 패턴이 없는지 검증
          if (filePath.includes("..") || filePath.includes("//")) {
            throw new Error("유효하지 않은 파일 경로입니다.");
          }

          const { error: removeError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (removeError) {
            const safeError = sanitizeErrorForLogging(removeError);
            console.error("이미지 삭제 오류:", safeError);
            // 이미지 삭제 실패해도 기록은 삭제 진행
          }
        }
      }
    } catch (error) {
      const safeError = sanitizeErrorForLogging(error);
      console.error("이미지 삭제 오류:", safeError);
      // 이미지 삭제 실패해도 기록은 삭제 진행
    }
  }

  // 기록 삭제
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // revalidatePath: note.book_id를 알고 있으므로 재조회 없이 처리
  // /books 경로 전체를 갱신하여 해당 book_id를 가진 모든 페이지 갱신
  revalidatePath("/notes");
  revalidatePath("/books"); // 책 목록 페이지 갱신
  revalidatePath("/"); // 홈페이지도 갱신

  return { success: true };
}

/**
 * 기록 목록 조회
 * 게스트 사용자의 경우 샘플 데이터 반환
 * @param bookId 책 ID (선택)
 * @param type 기록 유형 필터 (선택)
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @param includeBook books 정보 포함 여부 (기본값: true, 하위 호환성 유지)
 */
export interface GetNotesOptions {
  /** status 필터 (기본값: "all" — draft+published 모두) */
  status?: "draft" | "published" | "all";
  /** 자유 기록만 (READTREE_BOOK_ID, progress 제외) */
  isFree?: boolean;
  /** 출처 타입 필터 */
  sourceType?: SourceType;
}

export async function getNotes(bookId?: string, type?: NoteType, user?: User | null, includeBook: boolean = true, options?: GetNotesOptions): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  let currentUser = user;
  let authError = null;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: fetchedError,
    } = await supabase.auth.getUser();
    currentUser = fetchedUser;
    authError = fetchedError;
  }

  // 게스트 사용자인 경우 관리자(샘플 사용자)의 최신 데이터 반환
  if (authError || !currentUser) {
    const sampleUserId = await getSampleUserId();
    const adminSupabase = createAdminSupabaseClient();

    const selectQuery = includeBook
      ? `*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`
      : `*, transcriptions (extracted_text, raw_extracted_text, status)`;

    let query = adminSupabase
      .from("notes")
      .select(selectQuery)
      .eq("user_id", sampleUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: sampleNotes, error: sampleError } = await query;

    if (sampleError) {
      return [];
    }

    const notes = (sampleNotes || []).map((note: any) => {
      const book = Array.isArray(note.books) ? note.books[0] : (note.books || note.book);
      const transcription = note.transcriptions || undefined;
      const { books, transcriptions, ...restNote } = note;
      return {
        ...restNote,
        book: book || undefined,
        transcription: transcription || undefined,
      };
    }) as NoteWithBook[];

    return notes;
  }

  // 인증된 사용자는 기존 로직 사용
  // bookId 변환과 notes 쿼리 준비를 병렬로 시작
  const selectQuery = includeBook
    ? `*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`
    : `*, transcriptions (extracted_text, raw_extracted_text, status)`;

  const [userBookResult] = await Promise.all([
    // bookId가 user_books.id인 경우, books.id를 조회
    bookId && isValidUUID(bookId)
      ? supabase
        .from("user_books")
        .select("book_id")
        .eq("id", bookId)
        .eq("user_id", currentUser.id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // userBook 결과에 따라 bookId 설정
  let actualBookId = bookId;
  if (userBookResult.data) {
    actualBookId = userBookResult.data.book_id;
  }

  // notes 쿼리 구성 및 실행
  // 최신 등록된 기록이 상단에 오도록 created_at을 우선 정렬 기준으로 설정
  let query = supabase
    .from("notes")
    .select(selectQuery)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .order("page_number", { ascending: true, nullsFirst: false });

  if (actualBookId) {
    query = query.eq("book_id", actualBookId);
  }

  if (type) {
    query = query.eq("type", type);
  }

  // status 필터 (기본: 전체)
  const statusFilter = options?.status ?? "all";
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  // 자유 기록 필터 (READTREE_BOOK_ID, progress 제외)
  if (options?.isFree) {
    query = query.eq("book_id", READTREE_BOOK_ID).neq("type", "progress");
  }

  // 출처 타입 필터
  if (options?.sourceType) {
    query = query.eq("source_type", options.sourceType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // Supabase 조인 결과가 배열로 반환될 수 있으므로 객체로 변환
  // Supabase는 `books` 키로 반환하지만 타입은 `book` (단수)로 정의됨
  const notes = (data || []).map((note: any) => {
    // books가 배열인 경우 첫 번째 요소 사용, 객체인 경우 그대로 사용
    const book = Array.isArray(note.books) ? note.books[0] : (note.books || note.book);
    // transcriptions: UNIQUE 제약조건으로 단일 객체 반환 (1:1 관계)
    const transcription = note.transcriptions || undefined;
    const { books, transcriptions, ...restNote } = note; // books, transcriptions 키 제거
    return {
      ...restNote,
      book: book || undefined,
      transcription: transcription || undefined,
    };
  }) as NoteWithBook[];

  return notes;
}

/**
 * 기록 상세 조회
 * @param noteId 기록 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getNoteDetail(noteId: string, user?: User | null) {
  const supabase = await createServerSupabaseClient();

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

  // 노트 조회 + user_books.id 조회를 병렬 실행 (순차 → 병렬로 최적화)
  const [noteResult, userBooksResult] = await Promise.all([
    supabase
      .from("notes")
      .select(
        `
        *,
        books (
          id,
          title,
          author,
          cover_image_url
        ),
        transcriptions (
          extracted_text,
          raw_extracted_text,
          status
        )
      `
      )
      .eq("id", noteId)
      .eq("user_id", currentUser.id)
      .maybeSingle(),
    supabase
      .from("user_books")
      .select("id, book_id")
      .eq("user_id", currentUser.id),
  ]);

  if (noteResult.error && noteResult.error.code !== "PGRST116") {
    throw new Error(sanitizeErrorMessage(noteResult.error));
  }

  if (!noteResult.data) {
    throw new Error("기록을 찾을 수 없거나 권한이 없습니다.");
  }

  // user_books에서 book_id로 매칭하여 user_book_id 조회
  const userBookIdMap = new Map<string, string>();
  if (userBooksResult.data) {
    for (const ub of userBooksResult.data) {
      userBookIdMap.set(ub.book_id, ub.id);
    }
  }

  // Supabase 조인 결과 정규화: transcriptions → transcription (단수)
  const { transcriptions, books, ...restData } = noteResult.data as any;
  const book = Array.isArray(books) ? books[0] : books;
  const userBookId = noteResult.data.book_id
    ? userBookIdMap.get(noteResult.data.book_id) ?? null
    : null;

  return {
    ...restData,
    book: book || undefined,
    transcription: transcriptions || undefined,
    user_book_id: userBookId,
  };
}

/**
 * 기록 소유권 검증
 * @param noteId 기록 ID
 * @param userId 사용자 ID
 * @returns 소유권이 있으면 true, 없으면 false
 */
export async function verifyNoteOwnership(noteId: string, userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data: note, error: noteCheckError } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", noteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (noteCheckError && noteCheckError.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(`기록 조회 실패: ${noteCheckError.message}`);
  }

  return note !== null;
}

/**
 * 공개 기록 조회 (카드뉴스용)
 * 공개 기록 또는 본인 기록 조회 가능
 * @param noteId 기록 ID
 * @param userId 사용자 ID (선택, 로그인한 경우)
 * @returns 기록 데이터 (books 정보 포함)
 */
export async function getPublicNote(noteId: string, userId?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("notes")
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        cover_image_url
      )
    `
    )
    .eq("id", noteId);

  // 로그인한 사용자인 경우 본인 기록도 조회 가능
  if (userId) {
    // userId가 유효한 UUID인지 검증 (PostgREST 필터 주입 방지)
    const { isValidUUID } = await import("@/lib/utils/validation");
    if (!isValidUUID(userId)) {
      throw new Error("유효하지 않은 사용자 ID입니다.");
    }
    query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
  } else {
    // 비로그인 사용자는 공개 기록만 조회 가능
    query = query.eq("is_public", true);
  }

  const { data: note, error } = await query.single();

  if (error || !note) {
    throw new Error("기록을 찾을 수 없거나 공개되지 않은 기록입니다.");
  }

  return note;
}

/**
 * 사용자별 태그 목록 조회
 * 사용자가 사용한 모든 태그를 중복 제거하여 반환
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @returns 태그 배열 (정렬된 순서)
 */
export async function getUserTags(user?: User | null): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const currentUser = user || await getCurrentUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase.rpc("get_user_tags", {
    p_user_id: currentUser.id,
  });

  if (error) {
    console.error("태그 조회 오류:", sanitizeErrorForLogging(error));
    return [];
  }

  return (data || []).map((row: { tag: string }) => row.tag);
}

/**
 * 태그별 사용 빈도 조회 (태그 클라우드용)
 */
export async function getUserTagsWithCount(user?: User | null): Promise<{ tag: string; count: number }[]> {
  const supabase = await createServerSupabaseClient();

  const currentUser = user || await getCurrentUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase.rpc("get_user_tags_with_count", {
    p_user_id: currentUser.id,
  });

  if (error || !data) return [];

  return data.map((row: { tag: string; cnt: number }) => ({
    tag: row.tag,
    count: Number(row.cnt),
  }));
}

/**
 * 태그 사용 횟수 조회
 * 특정 태그가 몇 개의 기록에 사용되었는지 반환
 * @param tag 태그명
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 * @returns 사용 횟수
 */
export async function getTagUsageCount(tag: string, user?: User | null): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const currentUser = user || await getCurrentUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  // 해당 태그를 가진 기록 수 조회
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", currentUser.id)
    .contains("tags", [tag]);

  if (error) {
    console.error("태그 사용 횟수 조회 오류:", sanitizeErrorForLogging(error));
    return 0;
  }

  return notes?.length || 0;
}

/**
 * 태그 완전 삭제
 * 해당 태그를 가진 모든 기록에서 태그를 제거
 * @param tag 삭제할 태그명
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteTag(tag: string, user?: User | null) {
  const supabase = await createServerSupabaseClient();

  const currentUser = user || await getCurrentUser();
  if (!currentUser) throw new Error("로그인이 필요합니다.");

  const { data: updatedCount, error } = await supabase.rpc("delete_tag_from_notes", {
    p_user_id: currentUser.id,
    p_tag: tag,
  });

  if (error) {
    throw new Error(`태그 삭제 실패: ${sanitizeErrorMessage(error)}`);
  }

  // 캐시 갱신
  revalidatePath("/notes");
  revalidatePath("/books");
  revalidatePath("/search");
  revalidatePath("/");

  return { success: true, updatedCount: updatedCount || 0 };
}

/**
 * 필사 OCR 데이터 초기 생성 (처리 시작 시점)
 * @param noteId 기록 ID
 */
export async function createTranscriptionInitial(noteId: string) {
  const supabase = await createServerSupabaseClient();

  // 기록 존재 확인 (RLS 정책으로 인해 권한 확인도 함께 수행)
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError && noteError.code !== "PGRST116") {
    throw new Error(`기록 조회 실패: ${noteError.message}`);
  }

  if (!note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  // 기존 transcription 확인
  const { data: existingTranscription } = await supabase
    .from("transcriptions")
    .select("id, status")
    .eq("note_id", noteId)
    .maybeSingle();

  if (existingTranscription) {
    // 이미 존재하면 상태만 업데이트 (처리 중으로 변경)
    if (existingTranscription.status !== "processing") {
      const { error: updateError } = await supabase
        .from("transcriptions")
        .update({
          status: "processing",
        })
        .eq("id", existingTranscription.id);

      if (updateError) {
        throw new Error(`필사 데이터 상태 업데이트 실패: ${updateError.message}`);
      }
    }
    return { success: true, transcriptionId: existingTranscription.id };
  }

  // 새 transcription 생성 (처리 중 상태)
  const { data: newTranscription, error: insertError } = await supabase
    .from("transcriptions")
    .insert({
      note_id: noteId,
      extracted_text: "", // 아직 추출되지 않음
      quote_content: null,
      memo_content: null,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`필사 데이터 생성 실패: ${insertError.message}`);
  }

  return { success: true, transcriptionId: newTranscription.id };
}

/**
 * 필사 OCR 데이터 생성 또는 업데이트
 * @param noteId 기록 ID
 * @param extractedText OCR로 추출된 텍스트 (보정된 텍스트 또는 원본)
 * @param rawExtractedText OCR 원본 텍스트 (GPT 보정 전, 선택적)
 */
export async function createOrUpdateTranscription(
  noteId: string,
  extractedText: string,
  rawExtractedText?: string
) {
  const supabase = await createServerSupabaseClient();

  // 기록 존재 확인 (RLS 정책으로 인해 권한 확인도 함께 수행)
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError && noteError.code !== "PGRST116") {
    throw new Error(`기록 조회 실패: ${noteError.message}`);
  }

  if (!note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  // 기존 transcription 확인
  const { data: existingTranscription } = await supabase
    .from("transcriptions")
    .select("id")
    .eq("note_id", noteId)
    .maybeSingle();

  // 원본 텍스트가 없으면 보정된 텍스트를 원본으로 사용
  const rawText = rawExtractedText?.trim() || extractedText.trim();

  if (existingTranscription) {
    // 기존 transcription 업데이트
    // OCR 결과는 extracted_text에만 저장하고, quote_content는 null로 유지 (사용자가 나중에 편집 가능)
    const { error: updateError } = await supabase
      .from("transcriptions")
      .update({
        extracted_text: extractedText.trim(),
        raw_extracted_text: rawText,
        quote_content: null, // OCR 결과는 extracted_text에만 저장
        memo_content: null, // 사용자가 나중에 추가 가능
        status: "completed",
      })
      .eq("id", existingTranscription.id);

    if (updateError) {
      console.error("[createOrUpdateTranscription] 업데이트 오류:", updateError);
      throw new Error(`필사 데이터 업데이트 실패: ${updateError.message}`);
    }

    console.log("[createOrUpdateTranscription] Transcription 업데이트 완료:", {
      transcriptionId: existingTranscription.id,
      noteId,
      status: "completed",
      extractedTextLength: extractedText.trim().length,
      rawTextLength: rawText.length,
    });
  } else {
    // 새 transcription 생성
    // OCR 결과는 extracted_text에만 저장하고, quote_content는 null로 유지
    const { data: newTranscription, error: insertError } = await supabase
      .from("transcriptions")
      .insert({
        note_id: noteId,
        extracted_text: extractedText.trim(),
        raw_extracted_text: rawText,
        quote_content: null, // OCR 결과는 extracted_text에만 저장
        memo_content: null, // 사용자가 나중에 추가 가능
        status: "completed",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[createOrUpdateTranscription] 생성 오류:", insertError);
      throw new Error(`필사 데이터 생성 실패: ${insertError.message}`);
    }

    console.log("[createOrUpdateTranscription] Transcription 생성 완료:", {
      transcriptionId: newTranscription.id,
      noteId,
      status: "completed",
      extractedTextLength: extractedText.trim().length,
      rawTextLength: rawText.length,
    });
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath("/books");

  return { success: true };
}

/**
 * 필사 OCR 데이터 상태 업데이트
 * @param noteId 기록 ID
 * @param status 상태 (processing | completed | failed)
 */
export async function updateTranscriptionStatus(
  noteId: string,
  status: "processing" | "completed" | "failed"
) {
  const supabase = await createServerSupabaseClient();

  // 기록 존재 확인
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError && noteError.code !== "PGRST116") {
    throw new Error(`기록 조회 실패: ${noteError.message}`);
  }

  if (!note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  // transcription 업데이트
  const { error: updateError } = await supabase
    .from("transcriptions")
    .update({ status })
    .eq("note_id", noteId);

  if (updateError) {
    throw new Error(`필사 데이터 상태 업데이트 실패: ${updateError.message}`);
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath("/books");

  return { success: true };
}

/**
 * 필사 OCR 데이터 조회
 * @param noteId 기록 ID
 */
export async function getTranscription(noteId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("note_id", noteId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`필사 데이터 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * 필사 OCR 데이터 업데이트 (구절/생각 수정)
 * @param noteId 기록 ID
 * @param quoteContent 책 구절
 * @param memoContent 사용자의 생각
 */
export async function updateTranscription(
  noteId: string,
  quoteContent?: string,
  memoContent?: string
) {
  const supabase = await createServerSupabaseClient();

  // 기록 존재 및 소유 확인
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError && noteError.code !== "PGRST116") {
    throw new Error(`기록 조회 실패: ${noteError.message}`);
  }

  if (!note) {
    throw new Error("기록을 찾을 수 없습니다.");
  }

  // transcription 업데이트
  const updateData: { quote_content?: string | null; memo_content?: string | null } = {};
  if (quoteContent !== undefined) {
    updateData.quote_content = quoteContent.trim() || null;
  }
  if (memoContent !== undefined) {
    updateData.memo_content = memoContent.trim() || null;
  }

  const { error: updateError } = await supabase
    .from("transcriptions")
    .update(updateData)
    .eq("note_id", noteId);

  if (updateError) {
    throw new Error(`필사 데이터 업데이트 실패: ${updateError.message}`);
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath("/books");

  return { success: true };
}

/**
 * 기록 내용 업데이트 (OCR 결과 저장용) - 하위 호환성 유지
 * @deprecated createOrUpdateTranscription을 사용하세요
 */
export async function updateNoteContent(noteId: string, extractedText: string) {
  return createOrUpdateTranscription(noteId, extractedText);
}

/** KST 기준 현재 날짜의 자정(00:00:00) UTC ISO 문자열 반환 */
function getKSTTodayISO(): string {
  return getKSTToday().toISOString();
}

/**
 * 자유 기록 통계 조회 (홈 카드용)
 * @param user 선택적 사용자 정보
 */
export async function getFreeNoteStats(user?: User | null): Promise<{
  totalCount: number;
  todayCount: number;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) {
      return { totalCount: 0, todayCount: 0 };
    }
    currentUser = fetchedUser;
  }

  const todayISO = getKSTTodayISO();

  const [totalResult, todayResult] = await Promise.all([
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("book_id", READTREE_BOOK_ID)
      .neq("type", "progress"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("book_id", READTREE_BOOK_ID)
      .neq("type", "progress")
      .gte("created_at", todayISO),
  ]);

  return {
    totalCount: totalResult.count ?? 0,
    todayCount: todayResult.count ?? 0,
  };
}

/**
 * 자유 기록 목록 조회
 * book_id = READTREE_BOOK_ID 기록만 반환, progress 타입 제외
 * draft 기록 목록 조회
 * @param user 선택적 사용자 정보
 */
export async function getDraftNotes(user?: User | null): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !fetchedUser) return [];
    currentUser = fetchedUser;
  }

  const { data, error } = await supabase
    .from("notes")
    .select("*, books (id, title, author, cover_image_url)")
    .eq("user_id", currentUser.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((note: Record<string, unknown>) => {
    const book = Array.isArray(note.books) ? (note.books as Record<string, unknown>[])[0] : note.books;
    const { books, ...restNote } = note;
    return { ...restNote, book: book || undefined } as NoteWithBook;
  });
}

/**
 * draft 기록 개수 조회 (경량 쿼리, 네비게이션 뱃지용)
 */
export async function getDraftNotesCount(user?: User | null): Promise<number> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !fetchedUser) return 0;
    currentUser = fetchedUser;
  }

  const { count, error } = await supabase
    .from("notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", currentUser.id)
    .eq("status", "draft");

  if (error) return 0;
  return count ?? 0;
}

/**
 * @param type 기록 유형 필터 (선택)
 * @param sourceType 출처 유형 필터 (선택)
 * @param user 선택적 사용자 정보
 */
export async function getFreeNotes(
  type?: NoteType,
  sourceType?: SourceType,
  user?: User | null
): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

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

  let query = supabase
    .from("notes")
    .select(`*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`)
    .eq("user_id", currentUser.id)
    .eq("book_id", READTREE_BOOK_ID)
    .neq("type", "progress")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  if (sourceType) {
    query = query.eq("source_type", sourceType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (data || []).map((note: any) => {
    const book = Array.isArray(note.books) ? note.books[0] : (note.books || undefined);
    const transcription = note.transcriptions || undefined;
    const { books, transcriptions, ...restNote } = note;
    return {
      ...restNote,
      book: book || undefined,
      transcription: transcription || undefined,
    };
  }) as NoteWithBook[];
}

/**
 * 특정 책(userBookId)과 연결된 자유기록 목록 반환
 * related_user_book_ids 배열에 userBookId가 포함된 노트
 */
export async function getFreeNotesForBook(
  userBookId: string,
  user?: User | null
): Promise<NoteWithBook[]> {
  const supabase = await createServerSupabaseClient();

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

  const { data, error } = await supabase
    .from("notes")
    .select(`*, books (id, title, author, cover_image_url)`)
    .eq("user_id", currentUser.id)
    .eq("book_id", READTREE_BOOK_ID)
    .neq("type", "progress")
    .contains("related_user_book_ids", [userBookId])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (data || []).map((note: unknown) => {
    const n = note as Record<string, unknown>;
    const booksField = n.books;
    const book = Array.isArray(booksField) ? booksField[0] : (booksField || undefined);
    const { books: _, ...restNote } = n;
    return {
      ...restNote,
      book: book || undefined,
    };
  }) as NoteWithBook[];
}

/**
 * 같은 책의 이전/다음 기록 ID 조회 (기록 상세 네비게이션용)
 */
export async function getAdjacentNoteIds(
  currentNoteId: string,
  bookId: string
): Promise<{ prevId: string | null; nextId: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();
    const currentUser = await getCurrentUser();
    if (!currentUser) return { prevId: null, nextId: null };

    const { data: current } = await supabase
      .from("notes")
      .select("created_at")
      .eq("id", currentNoteId)
      .maybeSingle();

    if (!current) return { prevId: null, nextId: null };

    const [prevResult, nextResult] = await Promise.all([
      supabase
        .from("notes")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", currentUser.id)
        .eq("status", "published")
        .lt("created_at", current.created_at)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("notes")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", currentUser.id)
        .eq("status", "published")
        .gt("created_at", current.created_at)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      prevId: prevResult.data?.id ?? null,
      nextId: nextResult.data?.id ?? null,
    };
  } catch {
    return { prevId: null, nextId: null };
  }
}

