import { describe, it, expect } from "vitest";
import { computeReadingMetrics, type MetricNote, type MetricLog } from "@/lib/reading/metrics";

/**
 * A3 집계 코어 동등성 검증.
 *
 * compute.ts의 기존 인라인 집계를 **독립 레퍼런스**로 재구현하여,
 * computeReadingMetrics가 동일 숫자를 내는지 확인한다(동작 보존 보장).
 * 레퍼런스는 코어의 유틸(timezone/streak)을 import하지 않고 직접 구현한다.
 */

// ── 독립 레퍼런스 헬퍼 ────────────────────────────────────────────
function kstKeyRef(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function maxStreakRef(keys: string[]): number {
  const days = [...new Set(keys)].sort();
  if (days.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const now = new Date(`${days[i]}T00:00:00Z`).getTime();
    if (now - prev === 86400000) { cur += 1; if (cur > max) max = cur; }
    else if (now !== prev) cur = 1;
  }
  return max;
}
function reference(notes: MetricNote[], logs: MetricLog[], completedCount: number) {
  const notesByType: Record<string, number> = {};
  const dayCounts = new Map<string, number>();
  const books = new Set<string>();
  for (const n of notes) {
    notesByType[n.type] = (notesByType[n.type] ?? 0) + 1;
    const key = kstKeyRef(n.created_at);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    if (n.bookId) books.add(n.bookId);
  }
  let totalSeconds = 0, pages = 0;
  for (const l of logs) {
    totalSeconds += l.reading_duration_seconds ?? 0;
    if (l.start_page != null && l.end_page != null) pages += Math.max(0, l.end_page - l.start_page);
  }
  return {
    notes: notes.length,
    notesByType,
    totalSeconds,
    pages,
    sessionCount: logs.length,
    completedBooks: completedCount,
    booksTouched: books.size,
    activeDays: dayCounts.size,
    maxStreak: maxStreakRef([...dayCounts.keys()]),
  };
}

// ── 고정 데이터셋 (KST 경계 포함) ─────────────────────────────────
const notes: MetricNote[] = [
  { created_at: "2026-05-01T01:00:00Z", type: "quote", bookId: "b1" },        // KST 5/1 10:00
  { created_at: "2026-05-01T20:00:00Z", type: "memo", bookId: "b1" },         // KST 5/2 05:00 (경계 넘김)
  { created_at: "2026-05-02T03:00:00Z", type: "memo", bookId: "b2" },         // KST 5/2 12:00
  { created_at: "2026-05-03T04:00:00Z", type: "transcription", bookId: null },// KST 5/3, 책 없음
  { created_at: "2026-05-03T05:00:00Z", type: "quote", bookId: "b1" },        // KST 5/3
];
const logs: MetricLog[] = [
  { reading_duration_seconds: 600, start_page: 10, end_page: 30 },
  { reading_duration_seconds: 1200, start_page: 30, end_page: 55 },
  { reading_duration_seconds: null, start_page: null, end_page: null },
  { reading_duration_seconds: 300, start_page: 60, end_page: 40 },            // 역순 → max(0,-20)=0
];
const range = { start: new Date("2026-05-01T00:00:00Z"), end: new Date("2026-05-31T23:59:59Z") };

describe("computeReadingMetrics — 레퍼런스 동등성", () => {
  const m = computeReadingMetrics({ notes, logs, completedCount: 3, range });
  const r = reference(notes, logs, 3);

  it("notes/notesByType 일치", () => {
    expect(m.notes).toBe(r.notes);
    expect(m.notesByType).toEqual(r.notesByType);
  });
  it("시간/페이지/세션 일치", () => {
    expect(m.time.totalSeconds).toBe(r.totalSeconds);
    expect(m.pages).toBe(r.pages);
    expect(m.time.sessionCount).toBe(r.sessionCount);
  });
  it("완독/책종수/활동일/최대스트릭 일치", () => {
    expect(m.completedBooks).toBe(r.completedBooks);
    expect(m.booksTouched).toBe(r.booksTouched);
    expect(m.activeDays).toBe(r.activeDays);
    expect(m.maxStreak).toBe(r.maxStreak);
  });

  it("명시값 — KST 경계·역순 페이지·null 처리", () => {
    expect(m.notes).toBe(5);
    expect(m.notesByType).toEqual({ quote: 2, memo: 2, transcription: 1 });
    expect(m.time.totalSeconds).toBe(2100);          // 600+1200+0+300
    expect(m.pages).toBe(45);                          // 20 + 25 + 0(null) + 0(역순)
    expect(m.time.sessionCount).toBe(4);
    expect(m.time.avgSeconds).toBe(525);               // round(2100/4)
    expect(m.booksTouched).toBe(2);                    // b1, b2 (null 제외)
    expect(m.activeDays).toBe(3);                      // KST 5/1, 5/2, 5/3
    expect(m.maxStreak).toBe(3);                       // 5/1→5/2→5/3 연속
  });

  it("빈 입력 — 0/NaN 방지", () => {
    const e = computeReadingMetrics({ notes: [], logs: [], completedCount: 0, range });
    expect(e.notes).toBe(0);
    expect(e.time.avgSeconds).toBe(0);
    expect(e.activeDays).toBe(0);
    expect(e.maxStreak).toBe(0);
    expect(e.currentStreak).toBe(0);
  });

  it("currentStreak — streakDateKeys 우선 사용", () => {
    // 명시 날짜키가 비면 0
    expect(computeReadingMetrics({ notes, logs, completedCount: 0, range, streakDateKeys: [] }).currentStreak).toBe(0);
  });
});
