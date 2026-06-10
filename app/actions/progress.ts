"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isValidUUID, sanitizeErrorMessage, sanitizeErrorForLogging } from "@/lib/utils/validation";
import type { User } from "@supabase/supabase-js";
import type {
  ReadingLog,
  CreateReadingLogInput,
  CreateReadingStampInput,
  AttachStampInput,
  GetReadingStampsParams,
  ReadingStamp,
  ReadingStampsResult,
  SaveReadingSessionInput,
  UserReadingTimeStats,
  PaceSession,
  PaceSessionsResult,
  ReadingSpeedGuide,
} from "@/types/progress";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";
import { computeRobustPace, DEFAULT_PACE_CONSTANTS } from "@/lib/reading/pace";
import { summarizeReadingTime } from "@/lib/reading/time-stats";
import { earnPoints } from "./points";
import { updateBookProgress } from "./books/progress";

/**
 * 진행 로그 생성
 * @param data 진행 로그 데이터
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 *
 * @deprecated Phase 5 — 새 진입점은 `endReadingSession` (즉석 완결 세션 패턴).
 *   현재 호출처는 기존 동작 유지를 위해 보존. Phase 6에서 호출처 정리 후 thin wrapper로 축소 예정.
 *   문서: doc/update/기록기획/phases/phase-5-integration.md
 */
export async function createProgressLog(
  data: CreateReadingLogInput,
  user?: User | null
): Promise<{ success: boolean; logId: string }> {
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

  // UUID 검증
  if (!isValidUUID(data.user_book_id)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 페이지 번호 검증
  if (data.page_number < 0) {
    throw new Error("페이지 번호는 0 이상이어야 합니다.");
  }

  // 메모 길이 검증
  if (data.memo && data.memo.length > 500) {
    throw new Error("메모는 500자 이하여야 합니다.");
  }

  // 책 소유 확인
  const { data: userBook, error: bookCheckError } = await supabase
    .from("user_books")
    .select("id, book_id")
    .eq("id", data.user_book_id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (bookCheckError && bookCheckError.code !== "PGRST116") {
    throw new Error("책 소유 확인에 실패했습니다.");
  }

  if (!userBook) {
    throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
  }

  // end_page 는 page_number 와 미러링 (스탬프 마이그레이션 호환)
  const endPage = data.end_page ?? data.page_number;
  const startPage = data.start_page ?? null;

  const { data: log, error } = await supabase
    .from("reading_logs")
    .insert({
      user_id: currentUser.id,
      user_book_id: data.user_book_id,
      page_number: data.page_number,
      memo: data.memo?.trim() || null,
      is_public: data.is_public ?? true,
      started_at: data.started_at || null,
      ended_at: data.ended_at || null,
      reading_duration_seconds: data.reading_duration_seconds || 0,
      start_page: startPage,
      end_page: endPage,
      image_url: data.image_url || null,
    })
    .select()
    .single();

  if (error || !log) {
    throw new Error(sanitizeErrorMessage(error || new Error("진행 로그 생성에 실패했습니다.")));
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath(`/books/${data.user_book_id}`);
  revalidatePath("/");

  return { success: true, logId: log.id };
}

/**
 * 진행 로그 목록 조회
 * @param userBookId 사용자 책 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function getProgressLogs(
  userBookId: string,
  user?: User | null
): Promise<ReadingLog[]> {
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

  // UUID 검증
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  // 진행 로그 조회
  const { data, error } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("user_book_id", userBookId)
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return data || [];
}

/**
 * 진행 로그 삭제
 * @param logId 진행 로그 ID
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function deleteProgressLog(
  logId: string,
  user?: User | null
): Promise<{ success: boolean }> {
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

  // UUID 검증
  if (!isValidUUID(logId)) {
    throw new Error("유효하지 않은 로그 ID입니다.");
  }

  // 로그 소유 확인 및 삭제
  const { data: log, error: checkError } = await supabase
    .from("reading_logs")
    .select("id, user_book_id")
    .eq("id", logId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("진행 로그 조회에 실패했습니다.");
  }

  if (!log) {
    throw new Error("권한이 없습니다. 해당 진행 로그를 삭제할 권한이 없습니다.");
  }

  // 진행 로그 삭제
  const { error } = await supabase
    .from("reading_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath(`/books/${log.user_book_id}`);
  revalidatePath("/profile/reading-speed");
  revalidatePath("/profile");
  revalidatePath("/stats");
  revalidatePath("/");

  return { success: true };
}

/**
 * 시간기록(reading_logs) 항목의 메모·페이지 편집.
 *
 * 책 상세 > 독서 시간 탭의 각 항목 인라인 편집에 사용.
 *  - memo: 200자 이내 또는 null(삭제)
 *  - start_page / end_page: 0 이상, end >= start 보장
 *  - user_book.current_page 동기화는 호출자 책임 아님 — 단순 수정만
 *
 * RLS + 명시 owner 검증으로 권한 보호.
 */
export async function updateReadingLogEntry(
  logId: string,
  updates: {
    memo?: string | null;
    start_page?: number | null;
    end_page?: number | null;
    /** 독서 시간(초) 보정 — 독서 속도 상세에서 잘못된 시간 수정용. 0~24h */
    reading_duration_seconds?: number | null;
  },
  user?: User | null,
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  if (!isValidUUID(logId)) {
    throw new Error("유효하지 않은 로그 ID입니다.");
  }

  if (typeof updates.memo === "string" && updates.memo.length > 200) {
    throw new Error("메모는 200자 이하여야 합니다.");
  }

  // 기존 행 조회 + owner 검증 + 누락된 필드 채움
  const { data: existing, error: fetchError } = await supabase
    .from("reading_logs")
    .select("id, user_book_id, start_page, end_page, page_number")
    .eq("id", logId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("권한이 없거나 기록을 찾을 수 없습니다.");
  }

  const payload: Record<string, unknown> = {};

  if (updates.memo !== undefined) {
    payload.memo = updates.memo === null ? null : updates.memo.trim() || null;
  }

  let nextStart = existing.start_page ?? 0;
  let nextEnd = existing.end_page ?? existing.page_number ?? 0;

  if (updates.start_page !== undefined) {
    if (typeof updates.start_page === "number" && updates.start_page >= 0) {
      nextStart = updates.start_page;
    }
  }
  if (updates.end_page !== undefined) {
    if (typeof updates.end_page === "number" && updates.end_page >= 0) {
      nextEnd = updates.end_page;
    }
  }
  if (nextEnd < nextStart) nextEnd = nextStart;

  if (updates.start_page !== undefined) payload.start_page = nextStart;
  if (updates.end_page !== undefined) {
    payload.end_page = nextEnd;
    payload.page_number = nextEnd;
  }

  // 독서 시간 보정 — 0~24시간 범위로 클램프(생성 컬럼 pace_seconds_per_page 자동 재계산)
  if (updates.reading_duration_seconds !== undefined && updates.reading_duration_seconds !== null) {
    const dur = Math.round(updates.reading_duration_seconds);
    if (!Number.isFinite(dur) || dur < 0) {
      throw new Error("독서 시간은 0초 이상이어야 합니다.");
    }
    payload.reading_duration_seconds = Math.min(dur, 24 * 60 * 60);
  }

  if (Object.keys(payload).length === 0) {
    return { success: true };
  }

  const { error: updateError } = await supabase
    .from("reading_logs")
    .update(payload)
    .eq("id", logId)
    .eq("user_id", currentUser.id);

  if (updateError) {
    throw new Error(sanitizeErrorMessage(updateError));
  }

  revalidatePath("/notes");
  revalidatePath(`/books/${existing.user_book_id}`);
  revalidatePath("/profile/reading-speed");
  revalidatePath("/profile");
  revalidatePath("/stats");
  revalidatePath("/");

  return { success: true };
}

/**
 * 진행 로그 수정
 * @param logId 진행 로그 ID
 * @param memo 수정할 메모
 * @param user 선택적 사용자 정보 (전달되지 않으면 자동 조회)
 */
export async function updateProgressLog(
  logId: string,
  memo: string | null,
  user?: User | null
): Promise<{ success: boolean }> {
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

  // UUID 검증
  if (!isValidUUID(logId)) {
    throw new Error("유효하지 않은 로그 ID입니다.");
  }

  // 메모 길이 검증
  if (memo && memo.length > 500) {
    throw new Error("메모는 500자 이하여야 합니다.");
  }

  // 로그 소유 확인
  const { data: log, error: checkError } = await supabase
    .from("reading_logs")
    .select("id, user_book_id")
    .eq("id", logId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("진행 로그 조회에 실패했습니다.");
  }

  if (!log) {
    throw new Error("권한이 없습니다. 해당 진행 로그를 수정할 권한이 없습니다.");
  }

  // 진행 로그 수정
  const { error } = await supabase
    .from("reading_logs")
    .update({ memo: memo?.trim() || null })
    .eq("id", logId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  // 캐시 무효화
  revalidatePath("/notes");
  revalidatePath(`/books/${log.user_book_id}`);
  revalidatePath("/");

  return { success: true };
}

/** 자동 저장 최소 임계값 (초) */
const MIN_SESSION_SECONDS = 30;

/**
 * 음악 타이머 독서 세션 저장 (텍스트 불필요, 시간만 저장)
 * 책 미선택 시 READTREE_BOOK_ID 폴백
 *
 * @deprecated Phase 5 — 새 진입점은 `endReadingSession` (세션 모델).
 *   `reading-complete-dialog.tsx`에서 `NEXT_PUBLIC_RECORD_V2=0`일 때 폴백으로 사용.
 *   Phase 6에서 호출처 정리 후 thin wrapper로 축소 예정.
 */
export async function saveReadingSession(
  data: SaveReadingSessionInput,
): Promise<{ success: boolean; logId: string }> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("로그인이 필요합니다.");

  if (data.durationSeconds < MIN_SESSION_SECONDS) {
    throw new Error("30초 이상의 독서 시간만 저장할 수 있습니다.");
  }

  // user_book_id 결정: 전달된 값 또는 READTREE 시스템 책 폴백
  let userBookId = data.userBookId;

  if (userBookId && !isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  if (!userBookId) {
    const { data: existingUB } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", READTREE_BOOK_ID)
      .maybeSingle();

    if (existingUB) {
      userBookId = existingUB.id;
    } else {
      const { data: newUB, error: upsertError } = await supabase
        .from("user_books")
        .upsert(
          { user_id: user.id, book_id: READTREE_BOOK_ID, status: "reading" },
          { onConflict: "user_id,book_id" },
        )
        .select("id")
        .single();

      if (upsertError || !newUB) {
        throw new Error("시스템 책 등록에 실패했습니다.");
      }
      userBookId = newUB.id;
    }
  }

  const { data: log, error } = await supabase
    .from("reading_logs")
    .insert({
      user_id: user.id,
      user_book_id: userBookId,
      page_number: 0,
      memo: data.memo?.trim() || null,
      is_public: true,
      started_at: data.startedAt,
      ended_at: new Date().toISOString(),
      reading_duration_seconds: data.durationSeconds,
      start_page: null,
      end_page: 0,
      image_url: null,
    })
    .select()
    .single();

  if (error || !log) {
    throw new Error(sanitizeErrorMessage(error || new Error("독서 세션 저장에 실패했습니다.")));
  }

  revalidatePath("/notes");
  revalidatePath("/");

  return { success: true, logId: log.id };
}

// =============================================================================
// 독서 속도 가이드 — 이상치 제외 범위(페이지당 최소~최대 초) 사용자 지정
// =============================================================================

const SPEED_GUIDE_MIN_FLOOR = 1; // 최소 1초/페이지
const SPEED_GUIDE_MAX_CEIL = 4 * 60 * 60; // 최대 4시간/페이지

/** users.reading_speed_guide(JSONB) → 검증된 범위. NULL/이상값이면 앱 기본값. */
function parseGuide(raw: unknown): ReadingSpeedGuide {
  const guide: ReadingSpeedGuide = {
    minSecPerPage: DEFAULT_PACE_CONSTANTS.minSecPerPage,
    maxSecPerPage: DEFAULT_PACE_CONSTANTS.maxSecPerPage,
  };
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (typeof o.minSecPerPage === "number" && o.minSecPerPage > 0) {
      guide.minSecPerPage = o.minSecPerPage;
    }
    if (typeof o.maxSecPerPage === "number" && o.maxSecPerPage > 0) {
      guide.maxSecPerPage = o.maxSecPerPage;
    }
  }
  // 안전: max는 항상 min보다 커야 함
  if (guide.maxSecPerPage <= guide.minSecPerPage) {
    guide.maxSecPerPage = DEFAULT_PACE_CONSTANTS.maxSecPerPage;
    guide.minSecPerPage = DEFAULT_PACE_CONSTANTS.minSecPerPage;
  }
  return guide;
}

/** 현재 사용자의 속도 가이드 범위 조회(미설정 시 기본값). */
export async function getReadingSpeedGuide(user?: User | null): Promise<ReadingSpeedGuide> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetched },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetched) throw new Error("로그인이 필요합니다.");
    currentUser = fetched;
  }

  const { data } = await supabase
    .from("users")
    .select("reading_speed_guide")
    .eq("id", currentUser.id)
    .maybeSingle();

  return parseGuide(data?.reading_speed_guide);
}

/** 속도 가이드 범위 저장. 검증·클램프 후 JSONB로 기록. */
export async function updateReadingSpeedGuide(
  input: ReadingSpeedGuide,
): Promise<{ success: true; guide: ReadingSpeedGuide }> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("로그인이 필요합니다.");

  const min = Math.round(input.minSecPerPage);
  const max = Math.round(input.maxSecPerPage);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error("올바른 숫자를 입력해 주세요.");
  }
  if (min < SPEED_GUIDE_MIN_FLOOR) {
    throw new Error(`최소 한계는 ${SPEED_GUIDE_MIN_FLOOR}초 이상이어야 해요.`);
  }
  if (max > SPEED_GUIDE_MAX_CEIL) {
    throw new Error("최대 한계는 4시간을 넘을 수 없어요.");
  }
  if (max <= min) {
    throw new Error("최대 한계는 최소 한계보다 커야 해요.");
  }

  const guide: ReadingSpeedGuide = { minSecPerPage: min, maxSecPerPage: max };

  const { error } = await supabase
    .from("users")
    .update({ reading_speed_guide: guide })
    .eq("id", user.id);

  if (error) throw new Error(sanitizeErrorMessage(error));

  revalidatePath("/profile/reading-speed");
  revalidatePath("/profile");
  revalidatePath("/stats");
  revalidatePath("/");

  return { success: true, guide };
}

/**
 * 사용자 전체 독서 시간 통계 (책별이 아닌 전체)
 */
export async function getUserReadingTimeStats(): Promise<UserReadingTimeStats> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("로그인이 필요합니다.");

  const [{ data, error }, { data: guideRow }] = await Promise.all([
    supabase
      .from("reading_logs")
      .select("reading_duration_seconds, started_at, start_page, end_page")
      .eq("user_id", user.id)
      .gt("reading_duration_seconds", 0),
    supabase.from("users").select("reading_speed_guide").eq("id", user.id).maybeSingle(),
  ]);

  if (error) throw new Error(sanitizeErrorMessage(error));

  const logs = data || [];
  const guide = parseGuide(guideRow?.reading_speed_guide);
  const now = new Date();
  const todayStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStartIso = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();

  // 합산 로직은 공용 순수 헬퍼로 위임(lib/reading/time-stats) — 중복 제거.
  const summary = summarizeReadingTime(logs, { todayStartIso, weekStartIso });

  // 전체 페이지당 평균(가중) — 적격 세션만 집계하되, 타이머 과다·오기록 등
  // 이상치는 사용자 가이드 범위로 자동 제외(로버스트)하여 평균 왜곡 방지.
  const pace = computeRobustPace(logs, guide);

  return {
    totalSeconds: summary.totalSeconds,
    sessionCount: summary.sessionCount,
    averageSeconds: summary.averageSeconds,
    todaySeconds: summary.todaySeconds,
    thisWeekSeconds: summary.thisWeekSeconds,
    pacePerPageSeconds: pace.pacePerPageSeconds,
    totalPagesRead: pace.pagesRead,
  };
}

/**
 * 독서 속도 상세용 — 페이스에 기여한 전체 세션 목록(책 무관).
 * 적격 세션(start_page·end_page·시간 모두 양수, end>start)만 책정보와 함께 최신순 반환.
 * 독서 속도 상세 페이지에서 개별 기록 확인·수정·삭제 대상으로 사용.
 */
export async function getPaceSessions(): Promise<PaceSessionsResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("로그인이 필요합니다.");

  // 시간 기록이 있는 모든 세션(페이지 유무 무관) + 사용자 가이드 범위
  const [{ data, error }, { data: guideRow }] = await Promise.all([
    supabase
      .from("reading_logs")
      .select(`
        id, user_book_id, created_at, start_page, end_page, reading_duration_seconds,
        memo, image_url, image_urls, promoted_at,
        user_books!inner(
          id,
          books(title, cover_image_url, total_pages)
        )
      `)
      .eq("user_id", user.id)
      .gt("reading_duration_seconds", 0)
      .order("created_at", { ascending: false }),
    supabase.from("users").select("reading_speed_guide").eq("id", user.id).maybeSingle(),
  ]);

  if (error) throw new Error(sanitizeErrorMessage(error));

  const guide = parseGuide(guideRow?.reading_speed_guide);

  interface RawRow {
    id: string;
    user_book_id: string;
    created_at: string;
    start_page: number | null;
    end_page: number | null;
    reading_duration_seconds: number | null;
    memo: string | null;
    image_url: string | null;
    image_urls: string[] | null;
    promoted_at: string | null;
    user_books?: {
      books?: { title?: string | null; cover_image_url?: string | null; total_pages?: number | null }
        | { title?: string | null; cover_image_url?: string | null; total_pages?: number | null }[]
        | null;
    } | { books?: unknown }[] | null;
  }

  const rows = (data ?? []) as unknown as RawRow[];
  const paced: PaceSession[] = [];
  const timeOnly: PaceSession[] = [];

  for (const r of rows) {
    const sp = r.start_page;
    const ep = r.end_page;
    const dur = r.reading_duration_seconds ?? 0;
    if (dur <= 0) continue;

    const ub = Array.isArray(r.user_books) ? r.user_books[0] : r.user_books;
    const bookRaw = ub && "books" in ub ? ub.books : null;
    const book = Array.isArray(bookRaw) ? bookRaw[0] : bookRaw;

    const startPage = sp ?? 0;
    const endPage = ep ?? startPage;
    const hasProgress = sp != null && ep != null && ep - sp > 0;

    const imageUrls = Array.isArray(r.image_urls) ? r.image_urls.filter((u): u is string => typeof u === "string" && u.length > 0) : [];

    const session: PaceSession = {
      id: r.id,
      userBookId: r.user_book_id,
      createdAt: r.created_at,
      startPage,
      endPage,
      durationSeconds: dur,
      pacePerPageSeconds: hasProgress ? dur / (endPage - startPage) : 0,
      bookTitle: book?.title ?? "알 수 없는 책",
      coverImageUrl: book?.cover_image_url ?? null,
      totalPages: book?.total_pages ?? null,
      memo: r.memo ?? null,
      imageUrl: r.image_url ?? (imageUrls[0] ?? null),
      imageUrls,
      promotedAt: r.promoted_at ?? null,
    };

    if (hasProgress) paced.push(session);
    else timeOnly.push(session);
  }

  return { paced, timeOnly, guide };
}

/**
 * 독서 시간 기록 목록 조회 (시간 데이터가 있는 로그만)
 */
export async function getReadingTimeLogs(
  userBookId: string,
  user?: User | null
): Promise<ReadingLog[]> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  if (!isValidUUID(userBookId)) throw new Error("유효하지 않은 책 ID입니다.");

  const { data, error } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("user_book_id", userBookId)
    .eq("user_id", currentUser.id)
    .gt("reading_duration_seconds", 0)
    .order("created_at", { ascending: false });

  if (error) throw new Error(sanitizeErrorMessage(error));
  return data || [];
}

/**
 * 독서 시간 통계 조회
 */
export async function getReadingTimeStats(
  userBookId: string,
  user?: User | null
): Promise<{
  totalSeconds: number;
  sessionCount: number;
  averageSeconds: number;
}> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  if (!isValidUUID(userBookId)) throw new Error("유효하지 않은 책 ID입니다.");

  const { data, error } = await supabase
    .from("reading_logs")
    .select("reading_duration_seconds")
    .eq("user_book_id", userBookId)
    .eq("user_id", currentUser.id)
    .gt("reading_duration_seconds", 0);

  if (error) throw new Error(sanitizeErrorMessage(error));

  // 책별 시간 합산 — 공용 순수 헬퍼 재사용(오늘/이번주 경계 불필요).
  const summary = summarizeReadingTime(data || []);

  return {
    totalSeconds: summary.totalSeconds,
    sessionCount: summary.sessionCount,
    averageSeconds: summary.averageSeconds,
  };
}

// =============================================================================
// 스탬프 (Reading Stamp) 액션
// 사진 + 페이지 구간 + 시간을 한 행으로 묶는 통합 기록 단위.
// reading_logs.image_url IS NOT NULL → 스탬프로 분류.
// =============================================================================

/** 스탬프 최소 시간 (초) */
const STAMP_MIN_SECONDS = 30;
/** 스탬프 메모 최대 길이 */
const STAMP_MEMO_MAX = 500;

/**
 * 새 세션의 시작 페이지 결정 — 진행률(user_books.current_page) 기준.
 *
 * 정책 (사용자 요구: "독서 시작 시 진행률 기준 시작 페이지로 기본 적용"):
 *   - user_books.current_page 와 직전 reading_logs.end_page 중 더 큰 값을 사용.
 *   - 사용자가 책 상세에서 진행률을 수동 갱신했을 때 그 값(current_page)이 정확.
 *   - 단, 마지막 세션의 end_page 가 더 멀리 진행됐다면 그쪽을 우선.
 *   - 둘 다 없으면 0.
 *
 * 호출처: record-start-step.tsx (UI prefill), startReadingSession (서버 결정).
 */
export async function getLastEndPage(
  userBookId: string,
  user?: User | null,
): Promise<number> {
  if (!isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }

  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  const [lastLogResult, userBookResult] = await Promise.all([
    supabase
      .from("reading_logs")
      .select("end_page, page_number")
      .eq("user_book_id", userBookId)
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_books")
      .select("current_page")
      .eq("id", userBookId)
      .eq("user_id", currentUser.id)
      .maybeSingle(),
  ]);

  const fromLog = lastLogResult.data
    ? (lastLogResult.data.end_page ?? lastLogResult.data.page_number ?? null)
    : null;
  const fromBook = userBookResult.data?.current_page ?? null;

  const candidates: number[] = [];
  if (typeof fromLog === "number" && fromLog >= 0) candidates.push(fromLog);
  if (typeof fromBook === "number" && fromBook >= 0) candidates.push(fromBook);
  if (candidates.length === 0) return 0;

  return Math.max(...candidates);
}

/**
 * 스탬프 생성 — 사진/페이지 구간/시간을 묶어 reading_logs 에 저장.
 * - start_page 미입력 시 직전 end_page 자동승계
 * - end_page 는 user_books.current_page 동기화
 * - earnPoints("note_create") 적립
 *
 * @deprecated Phase 5 — 새 진입점은 `endReadingSession` (사진은 image_urls 배열, DB 트리거가 image_url 미러링·promoted_at 자동).
 *   `StampCaptureSheet`에서 `NEXT_PUBLIC_RECORD_V2=0`일 때 폴백으로 사용.
 *   Phase 6에서 호출처 정리 후 thin wrapper로 축소 예정.
 */
export async function createReadingStamp(
  input: CreateReadingStampInput,
  user?: User | null,
): Promise<{ success: boolean; logId: string; pointsEarned: number; reachedEnd: boolean }> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  // 입력 검증
  if (input.reading_duration_seconds < STAMP_MIN_SECONDS) {
    throw new Error(`${STAMP_MIN_SECONDS}초 이상의 독서 시간만 저장할 수 있습니다.`);
  }
  if (input.end_page < 0) {
    throw new Error("페이지 번호는 0 이상이어야 합니다.");
  }
  if (input.memo && input.memo.length > STAMP_MEMO_MAX) {
    throw new Error(`메모는 ${STAMP_MEMO_MAX}자 이하여야 합니다.`);
  }

  // user_book_id 결정 (saveReadingSession 패턴: 미지정 시 READTREE 책 폴백)
  let userBookId = input.user_book_id;
  if (userBookId && !isValidUUID(userBookId)) {
    throw new Error("유효하지 않은 책 ID입니다.");
  }
  if (!userBookId) {
    const { data: existingUB } = await supabase
      .from("user_books")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("book_id", READTREE_BOOK_ID)
      .maybeSingle();

    if (existingUB) {
      userBookId = existingUB.id;
    } else {
      const { data: newUB, error: upsertError } = await supabase
        .from("user_books")
        .upsert(
          { user_id: currentUser.id, book_id: READTREE_BOOK_ID, status: "reading" },
          { onConflict: "user_id,book_id" },
        )
        .select("id")
        .single();

      if (upsertError || !newUB) {
        throw new Error("시스템 책 등록에 실패했습니다.");
      }
      userBookId = newUB.id;
    }
  } else {
    // 책 소유 확인
    const { data: ownership } = await supabase
      .from("user_books")
      .select("id")
      .eq("id", userBookId)
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (!ownership) {
      throw new Error("권한이 없습니다. 해당 책을 소유하고 있지 않습니다.");
    }
  }

  // 위 분기에서 userBookId 가 항상 결정되지만 TypeScript narrowing 한계로 const 재바인딩
  if (!userBookId) {
    throw new Error("책 ID 결정에 실패했습니다.");
  }
  const resolvedBookId: string = userBookId;

  // start_page 자동승계
  let startPage = input.start_page;
  if (typeof startPage !== "number") {
    startPage = await getLastEndPage(resolvedBookId, currentUser);
  }
  if (startPage < 0) startPage = 0;

  // end_page 검증 (start_page 보다 작지 않게)
  const endPage = Math.max(input.end_page, startPage);

  const startedAt = input.started_at
    ?? new Date(Date.now() - input.reading_duration_seconds * 1000).toISOString();
  const endedAt = input.ended_at ?? new Date().toISOString();

  // 사진 입력 정규화: image_urls 우선, 없으면 image_url 단일을 배열로.
  const normalizedImageUrls: string[] = (() => {
    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      return input.image_urls.filter((u) => typeof u === "string" && u.trim().length > 0).slice(0, 5);
    }
    if (input.image_url && input.image_url.trim().length > 0) {
      return [input.image_url];
    }
    return [];
  })();

  // INSERT
  const { data: log, error: insertError } = await supabase
    .from("reading_logs")
    .insert({
      user_id: currentUser.id,
      user_book_id: resolvedBookId,
      page_number: endPage,
      memo: input.memo?.trim() || null,
      is_public: input.is_public ?? true,
      started_at: startedAt,
      ended_at: endedAt,
      reading_duration_seconds: input.reading_duration_seconds,
      start_page: startPage,
      end_page: endPage,
      image_url: normalizedImageUrls[0] ?? null,
      image_urls: normalizedImageUrls.length > 0 ? normalizedImageUrls : null,
    })
    .select()
    .single();

  if (insertError || !log) {
    throw new Error(sanitizeErrorMessage(insertError || new Error("스탬프 저장에 실패했습니다.")));
  }

  // user_books.current_page 동기화 (실패해도 스탬프는 성공)
  let reachedEnd = false;
  try {
    const result = await updateBookProgress(resolvedBookId, endPage, currentUser);
    reachedEnd = result.reachedEnd;
  } catch (err) {
    console.error("[createReadingStamp] updateBookProgress 실패:", sanitizeErrorForLogging(err));
  }

  // 포인트 적립 (실패해도 스탬프는 성공)
  let pointsEarned = 0;
  try {
    const result = await earnPoints("note_create", {
      user: currentUser,
      referenceId: log.id,
      referenceType: "reading_log",
      description: normalizedImageUrls.length > 0 ? "스탬프 작성" : "독서 세션 기록",
    });
    if (result.success) pointsEarned = result.points_earned;
  } catch (err) {
    console.error("[createReadingStamp] earnPoints 실패:", sanitizeErrorForLogging(err));
  }

  // 캐시 무효화
  revalidatePath("/");
  revalidatePath("/stamps");
  revalidatePath("/notes");
  revalidatePath(`/books/${resolvedBookId}`);

  return { success: true, logId: log.id, pointsEarned, reachedEnd };
}

/**
 * 스탬프 목록 조회
 * - userBookId 미지정: 사용자의 모든 스탬프
 * - 사진 있는(image_url IS NOT NULL) 행만 반환 → /stamps 그리드 전용
 * - 책 정보 함께 join
 */
export async function getReadingStamps(
  params: GetReadingStampsParams = {},
  user?: User | null,
): Promise<ReadingStampsResult> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  const limit = Math.min(Math.max(params.limit ?? 30, 1), 100);

  let query = supabase
    .from("reading_logs")
    .select(`
      *,
      user_books!inner(
        id,
        books(id, title, author, cover_image_url, total_pages)
      )
    `)
    .eq("user_id", currentUser.id)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (params.userBookId) {
    if (!isValidUUID(params.userBookId)) {
      throw new Error("유효하지 않은 책 ID입니다.");
    }
    query = query.eq("user_book_id", params.userBookId);
  }

  if (params.cursor) {
    query = query.lt("created_at", params.cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  const stamps: ReadingStamp[] = sliced.map((row) => {
    const userBooks = row.user_books as unknown as
      | { id: string; books?: { id: string; title: string; author: string | null; cover_image_url: string | null; total_pages: number | null } }
      | null;
    const book = userBooks?.books;
    const sessionRow = row as Record<string, unknown>;
    return {
      id: row.id,
      user_id: row.user_id,
      user_book_id: row.user_book_id,
      page_number: row.page_number,
      memo: row.memo,
      is_public: row.is_public,
      started_at: row.started_at,
      ended_at: row.ended_at,
      reading_duration_seconds: row.reading_duration_seconds ?? 0,
      image_url: row.image_url,
      start_page: row.start_page,
      end_page: row.end_page,
      pace_seconds_per_page: row.pace_seconds_per_page,
      created_at: row.created_at,
      updated_at: row.updated_at,
      book: book
        ? {
            id: book.id,
            title: book.title,
            author: book.author,
            cover_image_url: book.cover_image_url,
            total_pages: book.total_pages,
          }
        : undefined,
      promoted_at: (sessionRow.promoted_at as string | null | undefined) ?? null,
      // 세션 컬럼 (Phase 1) — DB 마이그 적용 전에는 fallback 기본값
      status: (sessionRow.status as ReadingStamp["status"]) ?? "completed",
      bookmark_text: (sessionRow.bookmark_text as string | null | undefined) ?? null,
      bookmark_page: (sessionRow.bookmark_page as number | null | undefined) ?? null,
      image_urls: (sessionRow.image_urls as string[] | null | undefined) ?? (row.image_url ? [row.image_url] : []),
      client_session_id: (sessionRow.client_session_id as string | null | undefined) ?? null,
      app_version: (sessionRow.app_version as string | null | undefined) ?? null,
      // 음악 통합 (Phase 8.A) — 마이그 적용 전에는 fallback 기본값
      target_seconds: (sessionRow.target_seconds as number | null | undefined) ?? null,
      music_playlist_id: (sessionRow.music_playlist_id as string | null | undefined) ?? null,
      music_track_ids: (sessionRow.music_track_ids as string[] | null | undefined) ?? [],
      music_started_at: (sessionRow.music_started_at as string | null | undefined) ?? null,
    };
  });

  return {
    stamps,
    nextCursor: hasMore ? sliced[sliced.length - 1].created_at : null,
  };
}

/**
 * 기존 reading_log 에 사진을 첨부해 스탬프로 승격.
 * - image_url 이 이미 있으면 사진 교체로 동작 (promoted_at 유지)
 * - image_url 이 NULL → NOT NULL 첫 전환 시 promoted_at = NOW()
 * - start_page / end_page 미입력 시 기존 값 유지
 * - 권한: 본인 행만 (RLS + user_id 명시 검증)
 * - 포인트 추가 적립 없음 (이미 기록 시점에 적립됨)
 */
export async function attachStampToLog(
  logId: string,
  input: AttachStampInput,
  user?: User | null,
): Promise<{ success: boolean; promoted: boolean; logId: string }> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  if (!isValidUUID(logId)) {
    throw new Error("유효하지 않은 로그 ID입니다.");
  }

  // 사진 입력 정규화: image_urls 우선, 없으면 image_url 단일을 배열로.
  const normalizedImageUrls: string[] = (() => {
    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      return input.image_urls.filter((u) => typeof u === "string" && u.trim().length > 0).slice(0, 5);
    }
    if (input.image_url && input.image_url.trim().length > 0) {
      return [input.image_url];
    }
    return [];
  })();

  if (normalizedImageUrls.length === 0) {
    throw new Error("이미지 URL이 필요합니다.");
  }

  if (input.memo && input.memo.length > 500) {
    throw new Error("메모는 500자 이하여야 합니다.");
  }

  // 로그 소유 + 기존 image_url 조회
  const { data: existingLog, error: checkError } = await supabase
    .from("reading_logs")
    .select("id, user_book_id, image_url, start_page, end_page, page_number")
    .eq("id", logId)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("로그 조회에 실패했습니다.");
  }

  if (!existingLog) {
    throw new Error("권한이 없습니다. 해당 기록에 접근할 수 없습니다.");
  }

  const wasNotStamp = !existingLog.image_url;
  const newStartPage = input.start_page ?? existingLog.start_page ?? null;
  const newEndPage = input.end_page ?? existingLog.end_page ?? existingLog.page_number ?? null;

  const updatePayload: Record<string, unknown> = {
    image_url: normalizedImageUrls[0],
    image_urls: normalizedImageUrls,
  };
  if (input.start_page !== undefined) updatePayload.start_page = newStartPage;
  if (input.end_page !== undefined) {
    updatePayload.end_page = newEndPage;
    if (typeof newEndPage === "number") updatePayload.page_number = newEndPage;
  }
  if (input.memo !== undefined) updatePayload.memo = input.memo.trim() || null;

  // promoted_at 첫 승격 시에만 NOW() (이미 사진 있던 행은 유지)
  if (wasNotStamp) {
    updatePayload.promoted_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("reading_logs")
    .update(updatePayload)
    .eq("id", logId)
    .eq("user_id", currentUser.id);

  if (updateError) {
    throw new Error(sanitizeErrorMessage(updateError));
  }

  // user_books.current_page 동기화 (end_page 가 갱신된 경우)
  if (input.end_page !== undefined && typeof newEndPage === "number") {
    try {
      await updateBookProgress(existingLog.user_book_id, newEndPage, currentUser);
    } catch (err) {
      console.error("[attachStampToLog] updateBookProgress 실패:", sanitizeErrorForLogging(err));
    }
  }

  revalidatePath("/");
  revalidatePath("/stamps");
  revalidatePath("/notes");
  revalidatePath("/profile/reading-speed");
  revalidatePath(`/books/${existingLog.user_book_id}`);

  return { success: true, promoted: wasNotStamp, logId };
}

/**
 * 사진 첨부 가능한 최근 reading_log 목록 (image_url IS NULL).
 * 사후 첨부 진입 화면(예: 토스트 클릭, 책 상세 행 칩)에서 사용.
 */
export async function getRecentRecordsForAttach(
  params: { userBookId?: string; limit?: number; daysWindow?: number } = {},
  user?: User | null,
): Promise<ReadingLog[]> {
  const supabase = await createServerSupabaseClient();

  let currentUser = user;
  if (!currentUser) {
    const {
      data: { user: fetchedUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !fetchedUser) throw new Error("로그인이 필요합니다.");
    currentUser = fetchedUser;
  }

  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const daysWindow = params.daysWindow ?? 7;
  const sinceIso = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("reading_logs")
    .select("*")
    .eq("user_id", currentUser.id)
    .is("image_url", null)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.userBookId) {
    if (!isValidUUID(params.userBookId)) {
      throw new Error("유효하지 않은 책 ID입니다.");
    }
    query = query.eq("user_book_id", params.userBookId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(sanitizeErrorMessage(error));
  }

  return (data ?? []) as ReadingLog[];
}
