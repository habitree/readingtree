/**
 * 통합 기록(Unified Record) 표현 타입 — 기록 기획 13
 *
 * 두 평행 세계(notes / reading_logs)를 "표시·편집"용 단일 형태로 정규화한다.
 * 저장 구조는 그대로 두고 읽기 레이어에서만 머지(마이그레이션 0).
 *
 * - source = "reading_log" → 시간세션 / 스탬프
 * - source = "note"        → 진행율 메모(progress) / 자유 상세(quote·memo·transcription)
 *
 * 정규화·머지·그룹핑은 순수 함수 `lib/reading/unified.ts`가 담당.
 * 조회(머지 액션)는 `app/actions/records.ts::getUnifiedRecords`.
 */

import type { DetailKind, NoteType } from "./note";

export type RecordSource = "reading_log" | "note";

/** 피드 카드 종류 — 골격은 동일, 작은 배지로만 구분 (요구 4) */
export type UnifiedRecordKind = "time" | "progress" | "stamp" | "detail";

/** 단일 편집 라우팅 타깃 (use-unified-record-edit 가 분기) */
export type UnifiedEditTarget =
  | { kind: "reading_log"; logId: string }
  | {
      kind: "note";
      noteId: string;
      noteType: NoteType;
      detailKind: DetailKind | null;
    };

export interface UnifiedRecordBook {
  /** user_books.id — 자유 기록(책 없음)은 null (D3) */
  userBookId: string | null;
  /** books.id (편집 시트 RecordSheetBook.bookId용) */
  bookId: string | null;
  title: string | null;
  author: string | null;
  coverImageUrl: string | null;
  totalPages: number | null;
}

export interface UnifiedRecord {
  source: RecordSource;
  /** 원본 PK (reading_logs.id | notes.id) */
  sourceId: string;
  createdAt: string;
  /** KST yyyy-MM-dd — 날짜·책 그룹핑 키 */
  kstDateKey: string;
  book: UnifiedRecordBook;

  // ── 적응형 슬롯 ("있는 것만" 표시) ──
  durationSeconds: number | null;
  startPage: number | null;
  endPage: number | null;
  /** progress note 등 비정형 페이지(TEXT 허용) */
  pageLabel: string | null;
  memo: string | null;
  imageUrls: string[];
  bookmarkText: string | null;
  bookmarkPage: number | null;

  // ── note 전용 표시 데이터 ──
  /** 자유 상세(quote/memo/transcription)의 원본 content (NoteContentViewer용) */
  content: string | null;
  noteType: NoteType | null;
  detailKind: DetailKind | null;
  title: string | null;
  /** 필사 OCR 텍스트 (있을 때) */
  transcriptionText: string | null;
  /** notes.is_public — 보기 시트의 공유 가능 여부 판단용. reading_log는 null */
  isPublic: boolean | null;

  // ── 파생 배지 (정의 불변 — 00-master.md와 동일) ──
  kind: UnifiedRecordKind;
  /** image_url≠NULL && promoted_at≠NULL */
  isStamp: boolean;
  /** 시간 있고 페이지 진행 없음 */
  isTimeOnly: boolean;

  editTarget: UnifiedEditTarget;
}

/** 날짜·책 그룹 ("오늘 · 책제목" 헤더 단위) */
export interface UnifiedRecordGroup {
  /** `${kstDateKey}__${userBookId ?? "none"}` */
  key: string;
  kstDateKey: string;
  book: UnifiedRecordBook;
  records: UnifiedRecord[];
  /** 그룹 내 가장 최근 기록 시각 (정렬용) */
  latestAt: string;
}

/** getUnifiedRecords 파라미터 */
export interface GetUnifiedRecordsParams {
  bookId?: string;
  startDate?: string;
  endDate?: string;
  /** created_at keyset cursor (이 시각 미만을 가져옴) */
  cursor?: string;
  limit?: number;
  sort?: "latest" | "oldest";
  /** 종류 필터 (미지정 = 전체) */
  kinds?: UnifiedRecordKind[];
}

/** getUnifiedRecords 결과 (created_at keyset 페이지네이션) */
export interface UnifiedRecordsResult {
  records: UnifiedRecord[];
  nextCursor: string | null;
}
