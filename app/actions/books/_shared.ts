/** Open Library Covers 폴백: 요청당 최대 건수 (레이트리밋 5분 100회 고려) */
export const OPEN_LIBRARY_COVER_BATCH_LIMIT = 3;
/** 표지 확인 HEAD 요청 타임아웃(ms) — 응답 지연 방지 */
export const OPEN_LIBRARY_COVER_TIMEOUT_MS = 1500;

export interface AddBookInput {
  isbn?: string | null;
  title: string;
  author?: string | null;
  publisher?: string | null;
  published_date?: string | null;
  cover_image_url?: string | null;
}

/** 일괄 등록: 사용자 입력 행 */
export interface BulkBookRow {
  rowIndex: number;
  title: string;
  isbn?: string;
  author?: string;
  publisher?: string;
}

/** 일괄 등록: 매칭 상태 */
export type BulkMatchStatus = "pending" | "searching" | "matched" | "no_match" | "error" | "skipped";

/** 일괄 등록: 매칭 결과가 포함된 행 */
export interface BulkBookMatchedRow {
  input: BulkBookRow;
  status: BulkMatchStatus;
  matchedBook: AddBookInput | null;
  alternatives: AddBookInput[];
  selected: AddBookInput | null;
  error?: string;
}

/** 일괄 등록: 개별 추가 결과 */
export interface BulkAddResult {
  rowIndex: number;
  title: string;
  success: boolean;
  bookId?: string;
  userBookId?: string;
  error?: string;
}

/**
 * 날짜 문자열을 유효한 date 형식으로 정규화
 * "2014" -> "2014-01-01", "2014-05" -> "2014-05-01", "2014-05-20" -> "2014-05-20"
 */
export function normalizePublishedDate(dateStr: string | number | null | undefined): string | null {
  if (dateStr === null || dateStr === undefined) return null;

  // 숫자인 경우 문자열로 변환
  const strValue = String(dateStr).trim();
  if (!strValue) return null;

  // 년도만 있는 경우 (예: "2014")
  if (/^\d{4}$/.test(strValue)) {
    return `${strValue}-01-01`;
  }

  // 년-월 형식 (예: "2014-05")
  if (/^\d{4}-\d{2}$/.test(strValue)) {
    return `${strValue}-01`;
  }

  // 이미 유효한 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    return strValue;
  }

  // 그 외 형식은 null 반환 (파싱 실패 방지)
  return null;
}
