"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CreateNoteInput,
  UpdateNoteInput,
  NoteType,
  NoteWithBook,
  Transcription,
} from "@/types/note";
import { isValidUUID, isValidLength, isValidTags, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "./auth";
import { earnPoints, updateStreak } from "./points";
import type { PointActionType } from "@/types/points";

/** "Readtree 기록" 시스템 책 well-known UUID */
const READTREE_BOOK_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 기록 생성
 * @param data 기록 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function createNote(data: CreateNoteInput, user?: User | null) {
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

  // progress 타입은 page_number만 있어도 OK
  if (!hasQuote && !hasMemo && !hasContent && !hasImage && !(isProgressType && hasPageNumber)) {
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
      await supabase.from("user_books").insert({
        user_id: currentUser.id,
        book_id: READTREE_BOOK_ID,
        status: "reading",
      });
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

  // 기록 생성
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: currentUser.id,
      book_id: resolvedBookId,
      title: data.title || null,
      type: noteType,
      content: content,
      image_url: data.image_url || null,
      page_number: data.page_number || null,
      is_public: data.is_public ?? true,
      tags: data.tags || null,
      related_user_book_ids: relatedUserBookIds,
      source_type: data.source_type || null,
      source_label: data.source_label || null,
    })
    .select()
    .single();

  if (error || !note) {
    throw new Error(sanitizeErrorMessage(error || new Error("기록 생성에 실패했습니다.")));
  }

  // 포인트 적립 (완전히 독립적으로 처리 - 실패해도 노트 생성에 영향 없음)
  // 포인트 시스템이 설정되지 않은 경우에도 노트 생성은 정상 동작해야 함
  try {
    // 노트 타입에 따른 포인트 적립
    let pointActionType: PointActionType = "note_create";
    if (noteType === "quote") {
      pointActionType = "note_quote";
    } else if (noteType === "memo") {
      pointActionType = "note_memo";
    } else if (noteType === "photo") {
      pointActionType = "note_photo";
    } else if (noteType === "transcription") {
      pointActionType = "note_transcription";
    } else if (noteType === "progress") {
      pointActionType = "note_progress";
    }

    // 포인트 시스템 호출 (실패해도 무시)
    await Promise.all([
      updateStreak(currentUser).catch(() => null),
      earnPoints(pointActionType, {
        user: currentUser,
        referenceId: note.id,
        referenceType: "note",
        description: `${data.title || "기록"} 작성`,
      }).catch(() => null),
    ]).catch(() => null);
  } catch {
    // 포인트 설정 중 에러 발생해도 완전히 무시
  }

  revalidatePath("/notes");
  if (data.book_id) {
    revalidatePath(`/books/${data.book_id}`);
  }
  revalidatePath(`/notes/${note.id}`);
  revalidatePath("/");

  return { success: true, noteId: note.id };
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
      const pathParts = url.pathname.split("/storage/v1/object/public/");

      if (pathParts.length === 2) {
        const fullPath = pathParts[1];
        const pathSegments = fullPath.split("/");

        if (pathSegments.length >= 2) {
          const bucket = pathSegments[0]; // "images"
          const filePath = pathSegments.slice(1).join("/"); // "photos/[userId]/[fileName]"

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
export async function getNotes(bookId?: string, type?: NoteType, user?: User | null, includeBook: boolean = true): Promise<NoteWithBook[]> {
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

  // 게스트 사용자인 경우 샘플 데이터 반환
  if (authError || !currentUser) {
    const selectQuery = includeBook
      ? `*, books (id, title, author, cover_image_url), transcriptions (extracted_text, raw_extracted_text, status)`
      : `*, transcriptions (extracted_text, raw_extracted_text, status)`;

    let query = supabase
      .from("notes")
      .select(selectQuery)
      .eq("is_sample", true)
      .order("created_at", { ascending: false })
      .limit(50); // 샘플 데이터는 최대 50개

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: sampleNotes, error: sampleError } = await query;

    if (sampleError) {
      // 샘플 데이터가 없어도 빈 배열 반환 (에러 발생하지 않음)
      return [];
    }

    // Supabase 조인 결과가 배열로 반환될 수 있으므로 객체로 변환
    const notes = (sampleNotes || []).map((note: any) => {
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

  const { data, error } = await supabase
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
    .maybeSingle(); // .single() 대신 .maybeSingle() 사용

  if (error && error.code !== "PGRST116") {
    // PGRST116은 "결과가 없음" 에러이므로 무시
    throw new Error(sanitizeErrorMessage(error));
  }

  if (!data) {
    throw new Error("기록을 찾을 수 없거나 권한이 없습니다.");
  }

  // user_books.id 조회 (책 상세 페이지 링크용)
  let userBookId = null;
  if (data.book_id) {
    const { data: userBook } = await supabase
      .from("user_books")
      .select("id")
      .eq("book_id", data.book_id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (userBook) {
      userBookId = userBook.id;
    }
  }

  // Supabase 조인 결과 정규화: transcriptions → transcription (단수)
  const { transcriptions, books, ...restData } = data as any;
  const book = Array.isArray(books) ? books[0] : books;

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

