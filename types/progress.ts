/**
 * 진행 기록 관련 타입 정의
 * reading_logs 테이블과 매핑
 */

/**
 * 세션 상태 (migration-202605040100 도입)
 * - in_progress: 진행 중 (사용자당 1개만, D2)
 * - completed: 완료 (기본, 기존 행 모두 포함)
 * - abandoned: 취소 또는 12h orphan 자동 정리
 */
export type SessionStatus = "in_progress" | "completed" | "abandoned";

/**
 * 상세기록 분류 (migration-202605040300 도입)
 * 기존 notes.type 5종(quote/photo/memo/transcription/progress)을
 * 새 모델에서는 detail_kind(quote|memo|transcription)와 reading_logs(기록)로 분리.
 */
export type DetailKind = "quote" | "memo" | "transcription";

/**
 * 독서 진행 로그 기본 타입
 *
 * 스탬프 컬럼(image_url, start_page, end_page, pace_seconds_per_page)은
 * migration-202604291200__reading_logs__add_stamp_columns.sql 로 추가됨.
 * - image_url IS NOT NULL → "스탬프"로 분류 (그리드 노출)
 * - pace_seconds_per_page 는 STORED generated column (Postgres 자동 계산)
 *
 * 세션 컬럼(status, bookmark_*, image_urls, client_session_id, app_version)은
 * migration-202605040100__reading_logs__add_session_columns.sql 로 추가됨.
 * - 기록 기능 전면 개편 Phase 1 (세션 모델 통합)
 */
export interface ReadingLog {
  id: string;
  user_id: string;
  user_book_id: string;
  page_number: number;
  memo: string | null;
  is_public: boolean;
  started_at: string | null;
  ended_at: string | null;
  reading_duration_seconds: number;
  image_url: string | null;
  start_page: number | null;
  end_page: number | null;
  pace_seconds_per_page: number | null;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
  // 세션 모델 (Phase 1)
  status: SessionStatus;
  bookmark_text: string | null;
  bookmark_page: number | null;
  image_urls: string[];
  client_session_id: string | null;
  app_version: string | null;
  // 음악 통합 (Phase 8.A) — migration-202605051200
  target_seconds: number | null;
  music_playlist_id: string | null;
  music_track_ids: string[];
  music_started_at: string | null;
}

/**
 * 진행 중 세션 — getActiveSession 반환 타입
 * 책 정보 join 포함 (Active Pill 표시용)
 */
export interface ReadingLogActive extends ReadingLog {
  status: "in_progress";
  book?: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
    total_pages: number | null;
  };
}

/**
 * 세션 시작 입력 — startReadingSession 전용
 * - user_book_id 미지정 시 READTREE_BOOK_ID 폴백
 * - start_page 미지정 시 getLastEndPage(user_book_id) 자동승계
 * - target_seconds 0/미지정 = 무제한
 * - client_session_id = 멱등키 (다중 탭 race 방지)
 * - music_playlist_id (Phase 8.A): 음악 동시 시작 (NULL = 음악 없이)
 * - music_started_at (Phase 8.A): 음악 시작 시각, 보통 startedAt과 동일
 */
export interface StartSessionInput {
  user_book_id?: string;
  start_page?: number;
  target_seconds?: number;
  client_session_id?: string;
  app_version?: string;
  music_playlist_id?: string;
  music_started_at?: string;
}

/**
 * 세션 종료 입력 — endReadingSession 전용
 * - end_page 필수 (start_page 미만 불가, 같음 허용)
 * - bookmark_* (D1): 다음 시작점 한 줄 메모
 * - image_urls (≤5): 첫 장 = 대표 (image_url 자동 동기 — DB 트리거)
 * - 포인트는 D4 정책에 따라 1회만 적립
 */
export interface EndSessionInput {
  session_id: string;
  end_page: number;
  memo?: string;
  bookmark_text?: string;
  bookmark_page?: number;
  image_urls?: string[];
  is_public?: boolean;
}

/**
 * 스탬프 사후 첨부 입력 — attachStampToLog 전용
 * 기존 reading_log 에 사진/페이지를 추가해 스탬프로 승격.
 * - image_urls (≤5): 첫 장 = 대표. DB 트리거가 image_url 자동 동기화.
 * - image_url (단일): image_urls 미사용 시 호환용. 내부에서 [image_url]로 변환됨.
 */
export interface AttachStampInput {
  image_url?: string;
  image_urls?: string[];
  start_page?: number;
  end_page?: number;
  memo?: string;
}

/**
 * 진행 로그 생성 입력 타입
 */
export interface CreateReadingLogInput {
  user_book_id: string;
  page_number: number;
  memo?: string;
  is_public?: boolean;
  started_at?: string;
  ended_at?: string;
  reading_duration_seconds?: number;
  start_page?: number;
  end_page?: number;
  image_url?: string;
}

/**
 * 스탬프 생성 입력 — createReadingStamp 전용
 * page_number 는 end_page 로 자동 미러링되므로 생략.
 * start_page 는 미입력 시 직전 로그의 end_page 자동승계.
 */
export interface CreateReadingStampInput {
  user_book_id?: string;
  end_page: number;
  start_page?: number;
  /** 단일 사진 호환 입력. image_urls 미사용 시 [image_url]로 변환됨. */
  image_url?: string;
  /** 사진 배열 (≤5). 첫 장이 대표. DB 트리거가 image_url 자동 동기화. */
  image_urls?: string[];
  memo?: string;
  is_public?: boolean;
  started_at?: string;
  ended_at?: string;
  reading_duration_seconds: number;
}

/**
 * 스탬프 조회 파라미터
 */
export interface GetReadingStampsParams {
  userBookId?: string;
  limit?: number;
  cursor?: string;
}

/**
 * 스탬프 조회 결과 (책 + 사용자 정보 join)
 */
export interface ReadingStamp extends ReadingLog {
  book?: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
    total_pages: number | null;
  };
}

/**
 * 스탬프 페이지네이션 결과
 */
export interface ReadingStampsResult {
  stamps: ReadingStamp[];
  nextCursor: string | null;
}

/**
 * 진행 로그 수정 입력 타입
 */
export interface UpdateReadingLogInput {
  memo?: string | null;
  is_public?: boolean;
}

/**
 * 진행 로그 with 책 정보
 */
export interface ReadingLogWithBook extends ReadingLog {
  user_books?: {
    id: string;
    book_id: string;
    current_page: number;
    status: string;
    books?: {
      id: string;
      title: string;
      author: string | null;
      cover_image_url: string | null;
      total_pages: number | null;
    };
  };
}

/**
 * 진행 로그 목록 조회 필터
 */
export interface ReadingLogFilter {
  user_book_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * 음악 타이머 독서 세션 저장 입력 (텍스트 불필요, 시간만 저장)
 */
export interface SaveReadingSessionInput {
  durationSeconds: number;
  startedAt: string;
  userBookId?: string;
  memo?: string;
}

/**
 * 사용자 전체 독서 시간 통계
 */
export interface UserReadingTimeStats {
  totalSeconds: number;
  sessionCount: number;
  averageSeconds: number;
  todaySeconds: number;
  thisWeekSeconds: number;
}

/**
 * 진행 로그 통계
 */
export interface ReadingLogStats {
  total_logs: number;
  pages_read_today: number;
  pages_read_this_week: number;
  pages_read_this_month: number;
  average_pages_per_day: number;
  streak_days: number;
  /** 총 독서 시간 (초) */
  total_reading_seconds: number;
  /** 시간 기록이 있는 세션 수 */
  timed_sessions: number;
  /** 평균 세션 독서 시간 (초) */
  average_reading_seconds_per_session: number;
}
