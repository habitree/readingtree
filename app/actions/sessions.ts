"use server";

/**
 * 세션 기반 기록 액션 (기록 기능 전면 개편 Phase 2)
 *
 * 모든 기록은 reading_logs 한 행에서 시작·종료한다.
 *  - status = 'in_progress' → 진행 중 (사용자당 1개만, D2)
 *  - status = 'completed'  → 완료 (포인트 적립, D4)
 *  - status = 'abandoned'  → 취소 또는 12h orphan
 *
 * 스탬프 정의(image_url IS NOT NULL AND promoted_at IS NOT NULL)는 불변.
 * 본 파일은 새 진입점이며, legacy 함수(saveReadingSession 등)는 Phase 5에서 위임.
 *
 * 관련 문서: doc/update/기록기획/{01-data-model.md, phases/phase-2-actions.md}
 */

import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidUUID, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";
import type {
  ReadingLogActive,
  StartSessionInput,
  EndSessionInput,
} from "@/types/progress";
import type { AddDetailInput } from "@/types/note";
import { earnPoints } from "./points";
import { updateBookProgress } from "./books/progress";
import { getLastEndPage } from "./progress";
import { recordRecordEvent } from "./tracking/records";

const MEMO_MAX = 200;
const BOOKMARK_TEXT_MAX = 200;
const IMAGE_URLS_MAX = 5;
const CANCEL_DELETE_THRESHOLD_S = 30;
const ABANDON_HOURS = 12;
/**
 * 자동 폐기 임계값 — endReadingSession 시 이 미만이고
 * 메모/북마크/사진이 모두 비어있으면 행을 DELETE 하여 저장하지 않는다.
 * "3분 이내의 단순 시간만 있는 기록은 삭제" 정책.
 */
const AUTO_DISCARD_THRESHOLD_S = 180;

// =============================================================================
// 내부 헬퍼
// =============================================================================

async function resolveUser(passed?: User | null): Promise<User> {
  if (passed) return passed;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return user;
}

/** user_book_id 결정 — 미지정 시 READTREE_BOOK_ID 폴백 (saveReadingSession 패턴 재사용) */
async function resolveUserBookId(
  userId: string,
  passedUserBookId?: string,
): Promise<string> {
  const supabase = await createServerSupabaseClient();

  if (passedUserBookId) {
    if (!isValidUUID(passedUserBookId)) {
      throw new Error("유효하지 않은 책 ID입니다.");
    }
    const { data: ownership } = await supabase
      .from("user_books")
      .select("id")
      .eq("id", passedUserBookId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ownership) {
      throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
    }
    return passedUserBookId;
  }

  // READTREE 시스템 책 폴백
  const { data: existingUB } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", READTREE_BOOK_ID)
    .maybeSingle();

  if (existingUB) return existingUB.id;

  const { data: newUB, error: upsertError } = await supabase
    .from("user_books")
    .upsert(
      { user_id: userId, book_id: READTREE_BOOK_ID, status: "reading" },
      { onConflict: "user_id,book_id" },
    )
    .select("id")
    .single();

  if (upsertError || !newUB) {
    throw new Error("시스템 책 등록에 실패했습니다.");
  }
  return newUB.id;
}

// =============================================================================
// startReadingSession — 세션 시작
// =============================================================================

/**
 * 세션 시작.
 *
 * 멱등(client_session_id):
 *  - 동일 client_session_id로 재호출 시 첫 결과 반환 (isResumed=true).
 *  - 다중 탭 race 방지 — DB unique 부분 인덱스가 백업.
 *
 * 동시 세션(D2):
 *  - 사용자당 in_progress 1개만 — DB unique partial index로 강제.
 *  - 위반 시 명시적 에러 메시지로 변환.
 */
export async function startReadingSession(
  input: StartSessionInput,
  user?: User | null,
): Promise<{ sessionId: string; startedAt: string; isResumed: boolean }> {
  const currentUser = await resolveUser(user);
  const supabase = await createServerSupabaseClient();

  // (A) client_session_id 멱등 재조회
  if (input.client_session_id) {
    if (!isValidUUID(input.client_session_id)) {
      throw new Error("유효하지 않은 세션 키입니다.");
    }
    const { data: existing } = await supabase
      .from("reading_logs")
      .select("id, started_at")
      .eq("user_id", currentUser.id)
      .eq("client_session_id", input.client_session_id)
      .maybeSingle();

    if (existing) {
      return {
        sessionId: existing.id,
        startedAt: existing.started_at ?? new Date().toISOString(),
        isResumed: true,
      };
    }
  }

  // (B) user_book_id 결정
  const userBookId = await resolveUserBookId(currentUser.id, input.user_book_id);

  // (C) start_page 결정 (미지정 시 직전 end_page 자동승계)
  let startPage = input.start_page;
  if (typeof startPage !== "number") {
    startPage = await getLastEndPage(userBookId, currentUser);
  }
  if (startPage < 0) startPage = 0;

  const startedAt = new Date().toISOString();

  // (D) INSERT (status='in_progress')
  const { data: log, error } = await supabase
    .from("reading_logs")
    .insert({
      user_id: currentUser.id,
      user_book_id: userBookId,
      page_number: startPage,
      memo: null,
      is_public: true,
      started_at: startedAt,
      ended_at: null,
      reading_duration_seconds: 0,
      start_page: startPage,
      end_page: startPage,
      image_url: null,
      status: "in_progress",
      client_session_id: input.client_session_id ?? null,
      app_version: input.app_version ?? null,
      // Phase 8.A — 음악 통합 (NULL 허용 — 음악 없이도 시작 가능)
      target_seconds: input.target_seconds ?? null,
      music_playlist_id: input.music_playlist_id ?? null,
      music_started_at: input.music_playlist_id
        ? (input.music_started_at ?? startedAt)
        : null,
    })
    .select("id, started_at")
    .single();

  if (error || !log) {
    // unique 위반 → 사용자당 1세션 (D2)
    if (error?.code === "23505") {
      // 충돌 종류에 따라 멱등 또는 동시 세션
      if (error.message.includes("client_session_id")) {
        const { data: dup } = await supabase
          .from("reading_logs")
          .select("id, started_at")
          .eq("user_id", currentUser.id)
          .eq("client_session_id", input.client_session_id ?? "")
          .maybeSingle();
        if (dup) {
          return { sessionId: dup.id, startedAt: dup.started_at ?? startedAt, isResumed: true };
        }
      }
      throw new Error(
        "이미 진행 중인 기록이 있습니다. 먼저 종료해주세요.",
      );
    }
    throw new Error(sanitizeErrorMessage(error || new Error("세션 시작에 실패했습니다.")));
  }

  revalidatePath("/");

  // Phase 7 텔레메트리 (무음 실패)
  void recordRecordEvent({
    event: "record_started",
    userId: currentUser.id,
    sessionId: log.id,
    metadata: {
      has_book: !!input.user_book_id,
      has_target_seconds: !!input.target_seconds,
      target_seconds: input.target_seconds ?? null,
      start_page: startPage,
      // Phase 8.A
      has_music: !!input.music_playlist_id,
      music_playlist_id: input.music_playlist_id ?? null,
    },
  });

  return {
    sessionId: log.id,
    startedAt: log.started_at ?? startedAt,
    isResumed: false,
  };
}

// =============================================================================
// endReadingSession — 세션 종료
// =============================================================================

/**
 * 세션 종료.
 *  - status='in_progress' 행을 status='completed'로 전환.
 *  - end_page·메모·북마크·image_urls 일괄 저장.
 *  - 포인트는 D4 정책에 따라 1회만 적립 (note_create).
 *  - DB 트리거가 image_urls[0] → image_url 자동 미러링 + 첫 사진 시 promoted_at 자동.
 *
 * 자동 폐기:
 *  - duration < AUTO_DISCARD_THRESHOLD_S(=180s, 3분) 이고
 *    메모/북마크/사진이 모두 비어있으면 행 DELETE.
 *  - 이 경우 result.discarded=true 로 반환 → 호출자가 toast 메시지 분기.
 *  - 메모·사진·북마크 중 하나라도 있으면 정상 저장 (값을 보호).
 */
export async function endReadingSession(
  input: EndSessionInput,
  user?: User | null,
): Promise<{
  sessionId: string;
  durationSeconds: number;
  pointsEarned: number;
  reachedEnd: boolean;
  promotedToStamp: boolean;
  /** 시간 짧고 입력 없어 자동 폐기된 경우 true (행 DELETE 됨) */
  discarded?: boolean;
}> {
  const currentUser = await resolveUser(user);
  const supabase = await createServerSupabaseClient();

  if (!isValidUUID(input.session_id)) {
    throw new Error("유효하지 않은 세션 ID입니다.");
  }
  if (input.end_page < 0) {
    throw new Error("페이지 번호는 0 이상이어야 합니다.");
  }
  if (input.memo && input.memo.length > MEMO_MAX) {
    throw new Error(`메모는 ${MEMO_MAX}자 이하여야 합니다.`);
  }
  if (input.bookmark_text && input.bookmark_text.length > BOOKMARK_TEXT_MAX) {
    throw new Error(`북마크 메모는 ${BOOKMARK_TEXT_MAX}자 이하여야 합니다.`);
  }
  if (input.image_urls && input.image_urls.length > IMAGE_URLS_MAX) {
    throw new Error(`사진은 ${IMAGE_URLS_MAX}장까지 첨부할 수 있습니다.`);
  }

  // 진행 중 세션 조회
  const { data: session, error: fetchError } = await supabase
    .from("reading_logs")
    .select("id, user_id, user_book_id, started_at, start_page, status")
    .eq("id", input.session_id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError || !session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }
  if (session.status !== "in_progress") {
    throw new Error("이미 종료된 세션입니다.");
  }

  const startedAt = session.started_at ?? new Date().toISOString();
  const startedAtMs = new Date(startedAt).getTime();
  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAtMs) / 1000));

  const startPage = session.start_page ?? 0;
  const endPage = Math.max(input.end_page, startPage);
  const imageUrls = input.image_urls ?? [];

  // ─ 자동 폐기 판정: 3분 미만 + 메모·북마크·사진·페이지 진행 모두 없음 ─
  const trimmedMemo = input.memo?.trim() ?? "";
  const trimmedBookmark = input.bookmark_text?.trim() ?? "";
  const hasMemo = trimmedMemo.length > 0;
  const hasBookmark = trimmedBookmark.length > 0 || typeof input.bookmark_page === "number";
  const hasImages = imageUrls.length > 0;
  const hasPageProgress = endPage > startPage;
  const isShortAndEmpty =
    durationSeconds < AUTO_DISCARD_THRESHOLD_S &&
    !hasMemo && !hasBookmark && !hasImages && !hasPageProgress;

  if (isShortAndEmpty) {
    const { error: delError } = await supabase
      .from("reading_logs")
      .delete()
      .eq("id", session.id)
      .eq("user_id", currentUser.id);

    if (delError) {
      throw new Error(sanitizeErrorMessage(delError));
    }

    revalidatePath("/");

    // 텔레메트리 — auto_discard 사유로 abandoned 이벤트
    void recordRecordEvent({
      event: "record_abandoned",
      userId: currentUser.id,
      sessionId: session.id,
      metadata: {
        duration_s: durationSeconds,
        source: "auto_short_empty",
      },
    });

    return {
      sessionId: session.id,
      durationSeconds,
      pointsEarned: 0,
      reachedEnd: false,
      promotedToStamp: false,
      discarded: true,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("reading_logs")
    .update({
      page_number: endPage,
      end_page: endPage,
      memo: input.memo?.trim() || null,
      bookmark_text: input.bookmark_text?.trim() || null,
      bookmark_page: input.bookmark_page ?? null,
      image_urls: imageUrls,
      ended_at: endedAt.toISOString(),
      reading_duration_seconds: durationSeconds,
      status: "completed",
      is_public: input.is_public ?? true,
    })
    .eq("id", session.id)
    .eq("user_id", currentUser.id)
    .select("id, image_url, promoted_at")
    .single();

  if (updateError || !updated) {
    throw new Error(
      sanitizeErrorMessage(updateError || new Error("세션 종료에 실패했습니다.")),
    );
  }

  // user_books.current_page 동기화 (실패해도 세션은 성공)
  let reachedEnd = false;
  try {
    const result = await updateBookProgress(session.user_book_id, endPage, currentUser);
    reachedEnd = result.reachedEnd;
  } catch (err) {
    console.error("[endReadingSession] updateBookProgress 실패:", sanitizeErrorForLogging(err));
  }

  // 포인트 적립 (D4: 세션 종료 1회만)
  let pointsEarned = 0;
  try {
    const result = await earnPoints("note_create", {
      user: currentUser,
      referenceId: updated.id,
      referenceType: "reading_log",
      description: imageUrls.length > 0 ? "스탬프 작성" : "독서 세션 기록",
    });
    if (result.success) pointsEarned = result.points_earned;
  } catch (err) {
    console.error("[endReadingSession] earnPoints 실패:", sanitizeErrorForLogging(err));
  }

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath("/stamps");
  revalidatePath(`/books/${session.user_book_id}`);

  const promotedToStamp = !!updated.image_url && !!updated.promoted_at;

  // Phase 7 텔레메트리 (무음 실패)
  void recordRecordEvent({
    event: "record_ended",
    userId: currentUser.id,
    sessionId: updated.id,
    metadata: {
      duration_s: durationSeconds,
      pages_read: Math.max(0, input.end_page - startPage),
      has_memo: !!input.memo,
      has_bookmark: !!input.bookmark_text || typeof input.bookmark_page === "number",
      photo_count: imageUrls.length,
      promoted_to_stamp: promotedToStamp,
      reached_end: reachedEnd,
      points_earned: pointsEarned,
    },
  });

  return {
    sessionId: updated.id,
    durationSeconds,
    pointsEarned,
    reachedEnd,
    promotedToStamp,
  };
}

// =============================================================================
// getActiveSession — 진행 중 세션 조회
// =============================================================================

/**
 * 사용자의 현재 진행 중 세션 (단일, D2).
 * Active Pill·인디케이터에서 사용. 책 정보 join 포함.
 */
export async function getActiveSession(
  user?: User | null,
): Promise<ReadingLogActive | null> {
  const currentUser = await resolveUser(user).catch(() => null);
  if (!currentUser) return null;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reading_logs")
    .select(`
      *,
      user_books!inner (
        id,
        books (
          id,
          title,
          author,
          cover_image_url,
          total_pages
        )
      )
    `)
    .eq("user_id", currentUser.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const userBooksJoin = row.user_books as
    | { id: string; books?: { id: string; title: string; author: string | null; cover_image_url: string | null; total_pages: number | null } }
    | null;
  const book = userBooksJoin?.books;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    user_book_id: row.user_book_id as string,
    page_number: (row.page_number as number) ?? 0,
    memo: (row.memo as string | null) ?? null,
    is_public: (row.is_public as boolean) ?? true,
    started_at: (row.started_at as string | null) ?? null,
    ended_at: (row.ended_at as string | null) ?? null,
    reading_duration_seconds: (row.reading_duration_seconds as number) ?? 0,
    image_url: (row.image_url as string | null) ?? null,
    start_page: (row.start_page as number | null) ?? null,
    end_page: (row.end_page as number | null) ?? null,
    pace_seconds_per_page: (row.pace_seconds_per_page as number | null) ?? null,
    promoted_at: (row.promoted_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    status: "in_progress",
    bookmark_text: (row.bookmark_text as string | null) ?? null,
    bookmark_page: (row.bookmark_page as number | null) ?? null,
    image_urls: ((row.image_urls as string[] | null) ?? []) as string[],
    client_session_id: (row.client_session_id as string | null) ?? null,
    app_version: (row.app_version as string | null) ?? null,
    // 음악 통합 (Phase 8.A)
    target_seconds: (row.target_seconds as number | null) ?? null,
    music_playlist_id: (row.music_playlist_id as string | null) ?? null,
    music_track_ids: ((row.music_track_ids as string[] | null) ?? []) as string[],
    music_started_at: (row.music_started_at as string | null) ?? null,
    book: book
      ? {
          id: book.id,
          title: book.title,
          author: book.author,
          cover_image_url: book.cover_image_url,
          total_pages: book.total_pages,
        }
      : undefined,
  };
}

// =============================================================================
// cancelActiveSession — 세션 취소
// =============================================================================

/**
 * 진행 중 세션 취소.
 *  - 30초 미만 → 행 DELETE (기록으로 남기지 않음).
 *  - 이상 → status='abandoned' (감사 추적용 보존).
 */
export async function cancelActiveSession(
  sessionId: string,
  user?: User | null,
): Promise<{ deleted: boolean; abandoned: boolean }> {
  const currentUser = await resolveUser(user);
  const supabase = await createServerSupabaseClient();

  if (!isValidUUID(sessionId)) {
    throw new Error("유효하지 않은 세션 ID입니다.");
  }

  const { data: session, error: fetchError } = await supabase
    .from("reading_logs")
    .select("id, started_at, status")
    .eq("id", sessionId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError || !session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }
  if (session.status !== "in_progress") {
    return { deleted: false, abandoned: false };
  }

  const startedAtMs = session.started_at ? new Date(session.started_at).getTime() : Date.now();
  const elapsed = (Date.now() - startedAtMs) / 1000;

  if (elapsed < CANCEL_DELETE_THRESHOLD_S) {
    const { error: delError } = await supabase
      .from("reading_logs")
      .delete()
      .eq("id", session.id)
      .eq("user_id", currentUser.id);
    if (delError) throw new Error(sanitizeErrorMessage(delError));
    revalidatePath("/");
    return { deleted: true, abandoned: false };
  }

  const { error: updError } = await supabase
    .from("reading_logs")
    .update({
      status: "abandoned",
      ended_at: new Date().toISOString(),
      reading_duration_seconds: Math.max(0, Math.round(elapsed)),
    })
    .eq("id", session.id)
    .eq("user_id", currentUser.id);
  if (updError) throw new Error(sanitizeErrorMessage(updError));
  revalidatePath("/");

  // Phase 7 텔레메트리 (무음 실패)
  void recordRecordEvent({
    event: "record_abandoned",
    userId: currentUser.id,
    sessionId: session.id,
    metadata: {
      duration_s: Math.max(0, Math.round(elapsed)),
      source: "manual",
    },
  });

  return { deleted: false, abandoned: true };
}

// =============================================================================
// addNoteToSession — 상세기록 추가
// =============================================================================

/**
 * 상세기록(detail_kind: quote|memo|transcription) 생성.
 *  - sessionId 지정 시: notes.reading_log_id = sessionId
 *  - sessionId NULL 시: 자유 상세 (D3) — reading_log_id NULL
 *  - 포인트는 본 액션에서 별도 적립하지 않음 (D4 — 세션 종료 1회만).
 */
export async function addNoteToSession(
  sessionId: string | null,
  input: AddDetailInput,
  user?: User | null,
): Promise<{ noteId: string; pointsEarned: number }> {
  const currentUser = await resolveUser(user);
  const supabase = await createServerSupabaseClient();

  // 세션 ID 검증 + 소유 확인
  let bookIdForNote: string | null = null;
  let userBookIdForNote: string | null = null;
  if (sessionId) {
    if (!isValidUUID(sessionId)) {
      throw new Error("유효하지 않은 세션 ID입니다.");
    }
    const { data: session } = await supabase
      .from("reading_logs")
      .select("id, user_book_id, user_books!inner(book_id)")
      .eq("id", sessionId)
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (!session) throw new Error("세션을 찾을 수 없습니다.");
    userBookIdForNote = session.user_book_id;
    const userBooksJoin = session.user_books as { book_id?: string } | { book_id?: string }[] | null;
    if (Array.isArray(userBooksJoin)) {
      bookIdForNote = userBooksJoin[0]?.book_id ?? null;
    } else if (userBooksJoin) {
      bookIdForNote = userBooksJoin.book_id ?? null;
    }
  }

  // type 매핑 (legacy 호환)
  //  - quote → "quote"
  //  - memo → "memo"
  //  - transcription → "transcription"
  //  - review → "memo" (note_type ENUM 미확장 — 출력은 detail_kind로 구분, C9)
  const noteType = input.detail_kind === "review" ? "memo" : input.detail_kind;

  // content는 quote/memo JSON 묶음 (기존 createNote 패턴)
  const contentObj: Record<string, string> = {};
  if (input.quote_content) contentObj.quote = input.quote_content;
  if (input.memo_content) contentObj.memo = input.memo_content;
  const content = Object.keys(contentObj).length > 0 ? JSON.stringify(contentObj) : null;

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: currentUser.id,
      book_id: bookIdForNote,
      title: input.title?.trim() || null,
      type: noteType,
      detail_kind: input.detail_kind,
      reading_log_id: sessionId,
      content,
      image_url: input.image_url || null,
      page_number: input.page_number ?? null,
      is_public: input.is_public ?? true,
      tags: input.tags ?? null,
      related_user_book_ids: input.related_user_book_ids ?? null,
      status: "published",
    })
    .select("id")
    .single();

  if (error || !note) {
    throw new Error(sanitizeErrorMessage(error || new Error("상세기록 저장에 실패했습니다.")));
  }

  revalidatePath("/notes");
  if (userBookIdForNote) revalidatePath(`/books/${userBookIdForNote}`);

  // Phase 7 텔레메트리 (무음 실패)
  void recordRecordEvent({
    event: "detail_added",
    userId: currentUser.id,
    sessionId: sessionId,
    metadata: {
      detail_kind: input.detail_kind,
      has_session_link: !!sessionId,
      content_length:
        (input.quote_content?.length ?? 0) + (input.memo_content?.length ?? 0),
      has_image: !!input.image_url,
    },
  });

  // D4: 본 액션에서는 별도 포인트 적립 없음
  return { noteId: note.id, pointsEarned: 0 };
}

// =============================================================================
// reapOrphanSessions — orphan 정리 (Phase 6 cron 후보)
// =============================================================================

/**
 * 12시간 이상 in_progress 인 세션을 abandoned 로 자동 전환.
 * Phase 6 마이그(M5)의 코드 트윈. cron으로 daily 실행 가능.
 * 본 함수는 현재 사용자의 행만 정리 (RLS 안전).
 */
export async function reapOrphanSessions(
  user?: User | null,
): Promise<{ closed: number }> {
  const currentUser = await resolveUser(user);
  const supabase = await createServerSupabaseClient();

  const cutoff = new Date(Date.now() - ABANDON_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("reading_logs")
    .update({
      status: "abandoned",
      ended_at: new Date().toISOString(),
    })
    .eq("user_id", currentUser.id)
    .eq("status", "in_progress")
    .lt("started_at", cutoff)
    .select("id");

  if (error) throw new Error(sanitizeErrorMessage(error));
  const closedRows = data ?? [];

  // Phase 7 텔레메트리 — 자동 정리된 각 세션마다 abandoned 이벤트 발송
  for (const row of closedRows) {
    void recordRecordEvent({
      event: "record_abandoned",
      userId: currentUser.id,
      sessionId: (row as { id: string }).id,
      metadata: { source: "auto_12h" },
    });
  }

  return { closed: closedRows.length };
}

// =============================================================================
// attachMusicToSession — 진행 중 세션에 음악 추가/변경/정지 (Phase 8.C)
// =============================================================================

/**
 * 진행 중 세션에 음악을 추가/변경/정지.
 *  - music_playlist_id = string → 음악 추가/변경 (이전 NULL이면 music_started_at 자동)
 *  - music_playlist_id = null → 음악 정지 (DB는 NULL로 유지, music_started_at는 보존)
 *  - target_seconds 옵션으로 진행 중 목표 시간 변경 가능 ("+15분 더" 등)
 *
 * @deprecated 음악·기록 완전 분리 (2026-05-05) — 현재 호출처 0.
 *   향후 통합 재개 시 부활 가능. DB 컬럼·이벤트 타입은 보존.
 */
export async function attachMusicToSession(
  input: {
    session_id: string;
    music_playlist_id: string | null;
    target_seconds?: number;
  },
  user?: User | null,
): Promise<{
  sessionId: string;
  music_playlist_id: string | null;
  action: "add" | "change" | "remove";
}> {
  const currentUser = await resolveUser(user);
  const supabase = await createServerSupabaseClient();

  if (!isValidUUID(input.session_id)) {
    throw new Error("유효하지 않은 세션 ID입니다.");
  }

  // 세션 조회 + status·소유 검증
  const { data: session, error: fetchError } = await supabase
    .from("reading_logs")
    .select("id, status, music_playlist_id")
    .eq("id", input.session_id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError || !session) {
    throw new Error("세션을 찾을 수 없습니다.");
  }
  if (session.status !== "in_progress") {
    throw new Error("진행 중인 세션이 아닙니다.");
  }

  const sessionRow = session as Record<string, unknown>;
  const wasNullMusic = !sessionRow.music_playlist_id;
  const action: "add" | "change" | "remove" = !input.music_playlist_id
    ? "remove"
    : wasNullMusic
      ? "add"
      : "change";

  const updatePayload: Record<string, unknown> = {
    music_playlist_id: input.music_playlist_id,
    updated_at: new Date().toISOString(),
  };
  // 처음 음악 켤 때만 music_started_at 자동 설정
  if (input.music_playlist_id && wasNullMusic) {
    updatePayload.music_started_at = new Date().toISOString();
  }
  if (typeof input.target_seconds === "number" && input.target_seconds >= 0) {
    updatePayload.target_seconds = input.target_seconds;
  }

  const { error: updateError } = await supabase
    .from("reading_logs")
    .update(updatePayload)
    .eq("id", input.session_id)
    .eq("user_id", currentUser.id);

  if (updateError) {
    throw new Error(sanitizeErrorMessage(updateError));
  }

  revalidatePath("/");

  // Phase 7+8.C 텔레메트리 (무음 실패)
  void recordRecordEvent({
    event: "music_attached",
    userId: currentUser.id,
    sessionId: input.session_id,
    metadata: {
      action,
      music_playlist_id: input.music_playlist_id,
      target_seconds: input.target_seconds ?? null,
    },
  });

  return {
    sessionId: input.session_id,
    music_playlist_id: input.music_playlist_id,
    action,
  };
}
