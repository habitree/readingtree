/**
 * 통합 기록 정규화·머지·그룹핑 — 순수 함수 (기록 기획 13 Phase 0)
 *
 * DB 접근 금지. `lib/reading/pace.ts`·`time-stats.ts`와 동일 레이어.
 * reading_logs / notes 행을 UnifiedRecord로 변환하고, 시간순 머지 + 날짜·책 그룹핑한다.
 *
 * 중복 제거 규칙(3.3): notes.reading_log_id != null(세션 연결 상세)은 세션 카드 하위로
 *   접고 reading_log를 1차 카드로 표시 → 한 세션 = 카드 1개. 본 머지는 표시 출처가
 *   분리된 행만 받는다(노트 측은 reading_log_id IS NULL + type='progress'만 조회).
 */

import { parseNoteContentFields } from "@/lib/utils/note";
import type { DetailKind, NoteType } from "@/types/note";
import type {
  UnifiedRecord,
  UnifiedRecordBook,
  UnifiedRecordGroup,
} from "@/types/unified-record";

/** reading_logs 행(조인 평탄화 후) — getUnifiedRecords가 구성 */
export interface UnifiedReadingLogRow {
  id: string;
  user_book_id: string | null;
  created_at: string;
  start_page: number | null;
  end_page: number | null;
  page_number: number | null;
  reading_duration_seconds: number | null;
  memo: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  promoted_at: string | null;
  bookmark_text: string | null;
  bookmark_page: number | null;
  book: UnifiedRecordBook;
}

/** notes 행(조인 평탄화 후) — getUnifiedRecords가 구성 */
export interface UnifiedNoteRow {
  id: string;
  created_at: string;
  type: NoteType;
  detail_kind: DetailKind | null;
  title: string | null;
  content: string | null;
  page_number: string | null;
  image_url: string | null;
  reading_duration_seconds: number | null;
  transcription_text: string | null;
  book: UnifiedRecordBook;
}

const MAX_IMAGES = 5;

/** ISO(UTC) → KST(UTC+9, DST 없음) 기준 yyyy-MM-dd */
export function toKstDateKey(iso: string): string {
  const kst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function normalizeImageUrls(
  urls: string[] | null | undefined,
  single: string | null | undefined,
): string[] {
  if (Array.isArray(urls) && urls.length > 0) {
    const filtered = urls.filter(
      (u): u is string => typeof u === "string" && u.trim().length > 0,
    );
    if (filtered.length > 0) return filtered.slice(0, MAX_IMAGES);
  }
  if (single && single.trim().length > 0) return [single];
  return [];
}

export function readingLogToUnified(row: UnifiedReadingLogRow): UnifiedRecord {
  const imageUrls = normalizeImageUrls(row.image_urls, row.image_url);
  const startPage = row.start_page;
  const endPage = row.end_page ?? row.page_number;
  const hasProgress =
    startPage != null && endPage != null && endPage - startPage > 0;
  const isStamp = imageUrls.length > 0 && row.promoted_at != null;
  const duration = row.reading_duration_seconds ?? 0;
  // 진행 기록(데이터 단일화 §11 ③): 시간 0 + 사진 없음 + 끝 페이지 있음 = 페이지-only 진행 체크
  const isProgressLog = !isStamp && imageUrls.length === 0 && duration <= 0 && endPage != null;
  const isTimeOnly = duration > 0 && !hasProgress && !isStamp;

  return {
    source: "reading_log",
    sourceId: row.id,
    createdAt: row.created_at,
    kstDateKey: toKstDateKey(row.created_at),
    book: row.book,
    durationSeconds: duration > 0 ? duration : null,
    startPage,
    endPage,
    pageLabel: isProgressLog && endPage != null ? String(endPage) : null,
    memo: row.memo,
    imageUrls,
    bookmarkText: row.bookmark_text,
    bookmarkPage: row.bookmark_page,
    content: null,
    noteType: null,
    detailKind: null,
    title: null,
    transcriptionText: null,
    kind: isStamp ? "stamp" : isProgressLog ? "progress" : "time",
    isStamp,
    isTimeOnly,
    editTarget: { kind: "reading_log", logId: row.id },
  };
}

export function noteToUnified(row: UnifiedNoteRow): UnifiedRecord {
  const isProgress = row.type === "progress";
  const memo = isProgress ? parseNoteContentFields(row.content).memo : null;
  const imageUrls = normalizeImageUrls(null, row.image_url);
  const duration =
    row.reading_duration_seconds && row.reading_duration_seconds > 0
      ? row.reading_duration_seconds
      : null;

  return {
    source: "note",
    sourceId: row.id,
    createdAt: row.created_at,
    kstDateKey: toKstDateKey(row.created_at),
    book: row.book,
    durationSeconds: duration,
    startPage: null,
    endPage: null,
    pageLabel: row.page_number,
    memo,
    imageUrls,
    bookmarkText: null,
    bookmarkPage: null,
    content: isProgress ? null : row.content,
    noteType: row.type,
    detailKind: row.detail_kind,
    title: row.title,
    transcriptionText: row.transcription_text,
    kind: isProgress ? "progress" : "detail",
    isStamp: false,
    isTimeOnly: false,
    editTarget: {
      kind: "note",
      noteId: row.id,
      noteType: row.type,
      detailKind: row.detail_kind,
    },
  };
}

/**
 * 여러 소스의 UnifiedRecord를 created_at 기준 단일 정렬.
 * 입력이 분리 조회됐어도 결과는 하나의 시간순 피드.
 */
export function mergeAndSort(
  sources: UnifiedRecord[][],
  sort: "latest" | "oldest" = "latest",
): UnifiedRecord[] {
  const all = sources.flat();
  const dir = sort === "oldest" ? 1 : -1;
  return all.sort((a, b) => {
    if (a.createdAt === b.createdAt) return 0;
    // latest(dir=-1): 최신(큰 createdAt) 먼저 → a가 더 오래면 뒤로(+1)
    return a.createdAt < b.createdAt ? -dir : dir;
  });
}

/**
 * "날짜 · 책" 그룹핑. 입력이 정렬된 순서를 그대로 보존(첫 등장 순서 = 그룹 순서).
 * → 최신순 입력이면 날짜 desc, 같은 날 다른 책은 최근 활동순.
 */
export function groupUnifiedByDateBook(
  records: UnifiedRecord[],
): UnifiedRecordGroup[] {
  const map = new Map<string, UnifiedRecordGroup>();
  const order: string[] = [];

  for (const r of records) {
    const key = `${r.kstDateKey}__${r.book.userBookId ?? "none"}`;
    let group = map.get(key);
    if (!group) {
      group = {
        key,
        kstDateKey: r.kstDateKey,
        book: r.book,
        records: [],
        latestAt: r.createdAt,
      };
      map.set(key, group);
      order.push(key);
    }
    group.records.push(r);
    if (r.createdAt > group.latestAt) group.latestAt = r.createdAt;
  }

  return order.map((k) => map.get(k)!);
}

/** 월별 그룹(타임라인 뷰). 입력 순서 보존 → 정렬 방향대로 월 나열. */
export interface UnifiedMonthGroup {
  /** "yyyy-MM" */
  key: string;
  records: UnifiedRecord[];
}
export function groupUnifiedByMonth(records: UnifiedRecord[]): UnifiedMonthGroup[] {
  const map = new Map<string, UnifiedMonthGroup>();
  const order: string[] = [];
  for (const r of records) {
    const key = r.kstDateKey.slice(0, 7);
    let g = map.get(key);
    if (!g) {
      g = { key, records: [] };
      map.set(key, g);
      order.push(key);
    }
    g.records.push(r);
  }
  return order.map((k) => map.get(k)!);
}

/** 책별 그룹(책별 뷰). 날짜 무관, 책 단위로 묶음. 입력 순서 보존. */
export function groupUnifiedByBook(records: UnifiedRecord[]): UnifiedRecordGroup[] {
  const map = new Map<string, UnifiedRecordGroup>();
  const order: string[] = [];
  for (const r of records) {
    const key = r.book.userBookId ?? "none";
    let g = map.get(key);
    if (!g) {
      g = { key, kstDateKey: r.kstDateKey, book: r.book, records: [], latestAt: r.createdAt };
      map.set(key, g);
      order.push(key);
    }
    g.records.push(r);
    if (r.createdAt > g.latestAt) g.latestAt = r.createdAt;
  }
  return order.map((k) => map.get(k)!);
}
