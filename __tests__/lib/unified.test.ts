import { describe, it, expect } from "vitest";
import {
  toKstDateKey,
  readingLogToUnified,
  noteToUnified,
  mergeAndSort,
  groupUnifiedByDateBook,
  type UnifiedReadingLogRow,
  type UnifiedNoteRow,
} from "@/lib/reading/unified";
import type { UnifiedRecordBook } from "@/types/unified-record";

/**
 * 통합 기록 정규화·머지·그룹핑(기록 기획 13 Phase 0) 검증.
 * reading_logs / notes 를 단일 UnifiedRecord 로 정규화하고, 시간순 머지 + 날짜·책 그룹핑이
 * 의도대로 동작하는지(특히 종류 배지·페이지/시간 슬롯·그룹 정합) 확인한다.
 */

const book: UnifiedRecordBook = {
  userBookId: "ub1",
  bookId: "b1",
  title: "책A",
  author: "저자",
  coverImageUrl: null,
  totalPages: 300,
};

function logRow(over: Partial<UnifiedReadingLogRow> = {}): UnifiedReadingLogRow {
  return {
    id: "l1",
    user_book_id: "ub1",
    created_at: "2026-06-15T01:00:00.000Z",
    start_page: null,
    end_page: null,
    page_number: null,
    reading_duration_seconds: null,
    memo: null,
    image_url: null,
    image_urls: null,
    promoted_at: null,
    bookmark_text: null,
    bookmark_page: null,
    book,
    ...over,
  };
}

function noteRow(over: Partial<UnifiedNoteRow> = {}): UnifiedNoteRow {
  return {
    id: "n1",
    created_at: "2026-06-15T02:00:00.000Z",
    type: "memo",
    detail_kind: null,
    title: null,
    content: null,
    page_number: null,
    image_url: null,
    reading_duration_seconds: null,
    transcription_text: null,
    book,
    ...over,
  };
}

describe("toKstDateKey — UTC→KST(UTC+9) 날짜 키", () => {
  it("KST 자정 넘김(UTC 15시) 시 다음 날로", () => {
    expect(toKstDateKey("2026-06-15T15:30:00.000Z")).toBe("2026-06-16");
  });
  it("KST 같은 날(UTC 14:59)", () => {
    expect(toKstDateKey("2026-06-15T14:59:00.000Z")).toBe("2026-06-15");
  });
});

describe("readingLogToUnified — 시간세션/스탬프 정규화", () => {
  it("페이지 진행 있는 시간세션 → kind=time, isTimeOnly=false", () => {
    const r = readingLogToUnified(
      logRow({ start_page: 45, end_page: 78, page_number: 78, reading_duration_seconds: 1920, memo: "좋다" }),
    );
    expect(r.kind).toBe("time");
    expect(r.isStamp).toBe(false);
    expect(r.isTimeOnly).toBe(false);
    expect(r.durationSeconds).toBe(1920);
    expect(r.startPage).toBe(45);
    expect(r.endPage).toBe(78);
    expect(r.memo).toBe("좋다");
    expect(r.editTarget).toEqual({ kind: "reading_log", logId: "l1" });
  });

  it("페이지 없는 시간만 세션 → isTimeOnly=true", () => {
    const r = readingLogToUnified(logRow({ reading_duration_seconds: 600 }));
    expect(r.kind).toBe("time");
    expect(r.isTimeOnly).toBe(true);
    expect(r.startPage).toBeNull();
  });

  it("사진+promoted_at → kind=stamp, isStamp=true", () => {
    const r = readingLogToUnified(
      logRow({
        reading_duration_seconds: 300,
        image_url: "u1.jpg",
        image_urls: ["u1.jpg", "u2.jpg"],
        promoted_at: "2026-06-15T01:05:00.000Z",
      }),
    );
    expect(r.kind).toBe("stamp");
    expect(r.isStamp).toBe(true);
    expect(r.imageUrls).toEqual(["u1.jpg", "u2.jpg"]);
  });

  it("사진은 있으나 promoted_at 없으면 스탬프 아님", () => {
    const r = readingLogToUnified(logRow({ image_url: "u1.jpg", image_urls: ["u1.jpg"], promoted_at: null }));
    expect(r.isStamp).toBe(false);
    expect(r.kind).toBe("time");
  });

  it("페이지-only 로그(시간0·사진없음·끝페이지) → kind=progress, pageLabel=끝페이지 (데이터 단일화 §11 ③)", () => {
    const r = readingLogToUnified(
      logRow({ reading_duration_seconds: 0, end_page: 120, page_number: 120, start_page: null }),
    );
    expect(r.kind).toBe("progress");
    expect(r.pageLabel).toBe("120");
    expect(r.durationSeconds).toBeNull();
    expect(r.isStamp).toBe(false);
    expect(r.isTimeOnly).toBe(false);
  });

  it("시간0이어도 끝페이지 없으면 progress 아님", () => {
    const r = readingLogToUnified(logRow({ reading_duration_seconds: 0, end_page: null, page_number: null }));
    expect(r.kind).not.toBe("progress");
  });

  it("사진 있는 페이지 로그는 시간0이어도 스탬프 우선", () => {
    const r = readingLogToUnified(
      logRow({ reading_duration_seconds: 0, end_page: 50, image_url: "u.jpg", image_urls: ["u.jpg"], promoted_at: "2026-06-15T01:00:00.000Z" }),
    );
    expect(r.kind).toBe("stamp");
  });
});

describe("noteToUnified — 진행율 메모 / 자유 상세 정규화", () => {
  it("progress 노트 → kind=progress, content JSON에서 memo 파싱, pageLabel 보존", () => {
    const r = noteToUnified(
      noteRow({ id: "n2", type: "progress", content: JSON.stringify({ memo: "여기까지" }), page_number: "120" }),
    );
    expect(r.kind).toBe("progress");
    expect(r.memo).toBe("여기까지");
    expect(r.pageLabel).toBe("120");
    expect(r.content).toBeNull(); // progress는 content 대신 memo로 표시
    expect(r.editTarget).toEqual({
      kind: "note",
      noteId: "n2",
      noteType: "progress",
      detailKind: null,
    });
  });

  it("자유 상세(quote) → kind=detail, content 원본 보존", () => {
    const r = noteToUnified(
      noteRow({ id: "n3", type: "quote", detail_kind: "quote", title: "제목", content: JSON.stringify({ quote: "구절" }) }),
    );
    expect(r.kind).toBe("detail");
    expect(r.noteType).toBe("quote");
    expect(r.content).toContain("구절");
    expect(r.title).toBe("제목");
  });
});

describe("mergeAndSort — 시간순 단일 정렬", () => {
  const a = readingLogToUnified(logRow({ id: "l1", created_at: "2026-06-15T01:00:00.000Z" }));
  const b = noteToUnified(noteRow({ id: "n1", created_at: "2026-06-15T03:00:00.000Z" }));
  const c = readingLogToUnified(logRow({ id: "l2", created_at: "2026-06-15T02:00:00.000Z" }));

  it("latest = 최신순", () => {
    const ids = mergeAndSort([[a, c], [b]], "latest").map((r) => r.sourceId);
    expect(ids).toEqual(["n1", "l2", "l1"]);
  });

  it("oldest = 오래된순", () => {
    const ids = mergeAndSort([[a, c], [b]], "oldest").map((r) => r.sourceId);
    expect(ids).toEqual(["l1", "l2", "n1"]);
  });
});

describe("groupUnifiedByDateBook — 날짜·책 그룹(입력 순서 보존)", () => {
  it("같은 날·같은 책의 시간세션+진행 메모는 한 그룹에 묶인다", () => {
    const log = readingLogToUnified(logRow({ id: "l1", created_at: "2026-06-15T05:00:00.000Z" }));
    const progress = noteToUnified(
      noteRow({ id: "n1", type: "progress", created_at: "2026-06-15T04:00:00.000Z" }),
    );
    const sorted = mergeAndSort([[log], [progress]], "latest");
    const groups = groupUnifiedByDateBook(sorted);
    expect(groups).toHaveLength(1);
    expect(groups[0].records.map((r) => r.sourceId)).toEqual(["l1", "n1"]);
    expect(groups[0].book.userBookId).toBe("ub1");
  });

  it("다른 책이면 그룹 분리, 다른 날이면 별도 그룹", () => {
    const book2: UnifiedRecordBook = { ...book, userBookId: "ub2", bookId: "b2", title: "책B" };
    const r1 = readingLogToUnified(logRow({ id: "l1", created_at: "2026-06-15T05:00:00.000Z" }));
    const r2 = readingLogToUnified(logRow({ id: "l2", user_book_id: "ub2", created_at: "2026-06-15T04:00:00.000Z", book: book2 }));
    const r3 = readingLogToUnified(logRow({ id: "l3", created_at: "2026-06-14T05:00:00.000Z" }));
    const groups = groupUnifiedByDateBook(mergeAndSort([[r1, r2, r3]], "latest"));
    expect(groups).toHaveLength(3);
    // 입력 정렬(최신순) 보존: 06-15·ub1 → 06-15·ub2 → 06-14·ub1
    expect(groups.map((g) => g.key)).toEqual([
      "2026-06-15__ub1",
      "2026-06-15__ub2",
      "2026-06-14__ub1",
    ]);
  });
});
