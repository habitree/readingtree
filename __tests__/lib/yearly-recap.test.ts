import { describe, it, expect } from "vitest";
import {
  buildYearlyRecap,
  selectSlides,
  type YearlyRecapInput,
  type YearlyNoteInput,
  type YearlyLogInput,
} from "@/lib/recap/yearly";
import {
  buildPersonaTitle,
  MONTHLY_PERSONA_THRESHOLDS,
  YEARLY_PERSONA_THRESHOLDS,
} from "@/lib/recap/persona-title";

const BOOK_A = { id: "a", title: "책 A", author: "저자 A", coverImageUrl: "https://example.com/a.jpg" };
const BOOK_B = { id: "b", title: "책 B", author: null, coverImageUrl: null };

function note(
  created_at: string,
  type = "quote",
  content: string | null = "문장",
  book: YearlyNoteInput["book"] = BOOK_A,
): YearlyNoteInput {
  return { created_at, type, content, book };
}
function log(started_at: string | null, seconds: number, bookTitle = "책 A"): YearlyLogInput {
  return { reading_duration_seconds: seconds, start_page: 1, end_page: 11, started_at, bookTitle };
}
function input(partial: Partial<YearlyRecapInput>): YearlyRecapInput {
  return { year: 2026, notes: [], logs: [], completed: [], logActivityCreatedAts: [], prev: null, ...partial };
}

describe("buildYearlyRecap", () => {
  it("빈 입력은 isEmpty 이고 슬라이드가 없다", () => {
    const r = buildYearlyRecap(input({}));
    expect(r.isEmpty).toBe(true);
    expect(r.stats.bestMonth).toBeNull();
    expect(r.stats.vsPrev).toBeNull();
    expect(selectSlides(r)).toEqual([]);
  });

  it("월별 버킷은 KST 경계를 따른다", () => {
    // 2026-12-31 23:59 KST = 14:59Z → 12월 / 2026-01-01 00:00 KST = 2025-12-31 15:00Z → 1월
    const r = buildYearlyRecap(
      input({
        logs: [log("2026-12-31T14:59:00Z", 600), log("2025-12-31T15:00:00Z", 1200)],
        notes: [note("2026-12-31T14:59:00Z"), note("2025-12-31T15:00:00Z")],
        completed: [{ completed_at: "2026-06-30T15:00:00Z", title: "책 A", coverImageUrl: null }],
      }),
    );
    expect(r.stats.monthly.seconds[11]).toBe(600);
    expect(r.stats.monthly.seconds[0]).toBe(1200);
    expect(r.stats.monthly.notes[11]).toBe(1);
    expect(r.stats.monthly.notes[0]).toBe(1);
    // 6-30 15:00Z = 7-1 00:00 KST → 7월
    expect(r.stats.monthly.completed[6]).toBe(1);
    expect(r.stats.bestMonth).toBe(1);
  });

  it("연도 밖 행은 월별 버킷에 넣지 않는다", () => {
    const r = buildYearlyRecap(input({ logs: [log("2027-01-01T00:00:00Z", 900)] }));
    expect(r.stats.monthly.seconds.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("총량·올해의 책·최장 세션·작년 대비를 계산한다", () => {
    const r = buildYearlyRecap(
      input({
        notes: [
          note("2026-03-01T01:00:00Z"),
          note("2026-03-02T01:00:00Z"),
          note("2026-03-03T01:00:00Z", "memo", "메모", BOOK_B),
        ],
        logs: [log("2026-03-01T01:00:00Z", 3600), log("2026-03-02T01:00:00Z", 7200, "책 B")],
        completed: [{ completed_at: "2026-03-05T01:00:00Z", title: "책 A", coverImageUrl: "https://example.com/a.jpg" }],
        logActivityCreatedAts: ["2026-03-04T01:00:00Z"],
        prev: { seconds: 3600, completedBooks: 3, notes: 1 },
      }),
    );
    expect(r.isEmpty).toBe(false);
    expect(r.stats.totalReadingSeconds).toBe(10800);
    expect(r.stats.totalPages).toBe(20);
    expect(r.stats.sessionCount).toBe(2);
    expect(r.stats.completedBooks).toBe(1);
    expect(r.stats.totalNotes).toBe(3);
    expect(r.stats.booksTouched).toBe(2);
    // 3-1~3-3 기록 + 3-4 독서 활동 → 4일 연속
    expect(r.stats.activeDays).toBe(4);
    expect(r.stats.maxStreak).toBe(4);
    expect(r.stats.vsPrev).toEqual({ secondsDelta: 7200, booksDelta: -2, notesDelta: 2 });
    expect(r.highlights.topBook).toMatchObject({ bookId: "a", noteCount: 2 });
    expect(r.highlights.longestSession).toEqual({ bookTitle: "책 B", minutes: 120 });
    expect(r.highlights.completedCovers).toEqual(["https://example.com/a.jpg"]);
  });

  it("시간대는 세션 시작 시각을 쓰고, 세션이 없으면 기록 시각을 쓴다", () => {
    // 14:00Z = 23:00 KST → 심야
    const withSessions = buildYearlyRecap(
      input({ logs: [log("2026-05-01T14:00:00Z", 600)], notes: [note("2026-05-01T00:00:00Z")] }),
    );
    expect(withSessions.highlights.peakTime).toBe("night");
    // 00:00Z = 09:00 KST → 아침
    const notesOnly = buildYearlyRecap(input({ notes: [note("2026-05-01T00:00:00Z")] }));
    expect(notesOnly.highlights.peakTime).toBe("morning");
  });

  it("올해의 문장은 인용을 메모보다 우선하고 말줄임표 포함 140자로 자른다", () => {
    const longMemo = "가".repeat(300);
    const r = buildYearlyRecap(
      input({
        notes: [
          note("2026-02-01T01:00:00Z", "memo", longMemo),
          note("2026-02-02T01:00:00Z", "quote", "짧은 인용"),
          note("2026-02-03T01:00:00Z", "quote", JSON.stringify({ quote: "나".repeat(200) })),
        ],
      }),
    );
    expect(r.highlights.memorableQuote?.text).toBe(`${"나".repeat(139)}…`);
    expect(r.highlights.memorableQuote?.bookTitle).toBe("책 A");
  });

  it("완독 표지는 12장까지만 담는다", () => {
    const completed = Array.from({ length: 20 }, (_, i) => ({
      completed_at: "2026-04-01T01:00:00Z",
      title: `책 ${i}`,
      coverImageUrl: `https://example.com/${i}.jpg`,
    }));
    const r = buildYearlyRecap(input({ completed }));
    expect(r.stats.completedBooks).toBe(20);
    expect(r.highlights.completedCovers).toHaveLength(12);
  });
});

describe("selectSlides", () => {
  it("데이터가 적으면 해당 슬라이드를 건너뛴다", () => {
    // 완독 1권만(표지 없음): 기록·세션이 없어 문장·리듬·성향 슬라이드가 빠진다
    const r = buildYearlyRecap(
      input({ completed: [{ completed_at: "2026-04-01T01:00:00Z", title: "책 A", coverImageUrl: null }] }),
    );
    expect(selectSlides(r)).toEqual(["intro", "totals", "monthly", "summary"]);
  });

  it("데이터가 충분하면 8장 모두 나온다", () => {
    const notes = [1, 2, 3].map((d) => note(`2026-03-0${d}T01:00:00Z`));
    const logs = [1, 2, 3].map((d) => log(`2026-03-0${d}T01:00:00Z`, 1800));
    const r = buildYearlyRecap(
      input({
        notes,
        logs,
        completed: [{ completed_at: "2026-03-05T01:00:00Z", title: "책 A", coverImageUrl: "https://example.com/a.jpg" }],
      }),
    );
    expect(selectSlides(r)).toEqual(["intro", "totals", "monthly", "book", "rhythm", "quote", "persona", "summary"]);
  });
});

describe("buildPersonaTitle", () => {
  const base = {
    totalNotes: 10,
    sessionCount: 10,
    completedBooks: 0,
    notesByType: { transcription: 0, photo: 0, memo: 0, quote: 5, progress: 0 },
    timeBuckets: { morning: 0, afternoon: 0, evening: 0, night: 3 },
  };

  it("월간 임계값(기본)은 기존 규칙과 같다", () => {
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 15 * 3600 })).toBe("몰입형 심야 문장 수집가");
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 5 * 3600 })).toBe("꾸준한 심야 문장 수집가");
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 3600 })).toBe("가벼운 심야 문장 수집가");
    expect(buildPersonaTitle({ ...base, totalNotes: 1, sessionCount: 1, totalReadingSeconds: 0 })).toBe(
      MONTHLY_PERSONA_THRESHOLDS.fallbackTitle,
    );
  });

  it("연간 임계값은 100시간·30권 기준이다", () => {
    const y = YEARLY_PERSONA_THRESHOLDS;
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 99 * 3600 }, y)).toBe("꾸준한 심야 문장 수집가");
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 100 * 3600 }, y)).toBe("몰입형 심야 문장 수집가");
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 0, completedBooks: 30 }, y)).toBe(
      "몰입형 심야 문장 수집가",
    );
    expect(buildPersonaTitle({ ...base, totalReadingSeconds: 10 * 3600, completedBooks: 5 }, y)).toBe(
      "가벼운 심야 문장 수집가",
    );
    expect(buildPersonaTitle({ ...base, totalNotes: 0, sessionCount: 0, totalReadingSeconds: 0 }, y)).toBe(
      y.fallbackTitle,
    );
  });
});
