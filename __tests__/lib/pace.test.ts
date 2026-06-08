import { describe, it, expect } from "vitest";
import {
  computePace,
  formatPacePerPage,
  estimateRemainingSeconds,
  type PaceLog,
} from "@/lib/reading/pace";

/**
 * 독서 페이스(페이지당 시간) 집계 검증.
 *
 * computePace는 적격 세션(페이지 진행 + 시간 모두 양수)만 가중 합산하고,
 * reading-pace-panel의 기존 필터와 동일한 결과를 내야 한다.
 */

describe("computePace — 가중 페이스 집계", () => {
  it("적격 세션만 합산하고 가중 평균을 낸다", () => {
    const logs: PaceLog[] = [
      { reading_duration_seconds: 600, start_page: 10, end_page: 30 }, // 20p / 600s
      { reading_duration_seconds: 1200, start_page: 30, end_page: 55 }, // 25p / 1200s
    ];
    const r = computePace(logs);
    // (600+1200) / (20+25) = 1800/45 = 40초/페이지
    expect(r.pagesRead).toBe(45);
    expect(r.pacedSeconds).toBe(1800);
    expect(r.sessionCount).toBe(2);
    expect(r.pacePerPageSeconds).toBe(40);
  });

  it("부적격 세션(널/역순/0초)을 제외한다", () => {
    const logs: PaceLog[] = [
      { reading_duration_seconds: 600, start_page: 10, end_page: 30 }, // 적격
      { reading_duration_seconds: null, start_page: 30, end_page: 50 }, // 시간 없음 → 제외
      { reading_duration_seconds: 300, start_page: 60, end_page: 40 }, // 역순 → 제외
      { reading_duration_seconds: 0, start_page: 1, end_page: 5 }, // 0초 → 제외
      { reading_duration_seconds: 200, start_page: null, end_page: 80 }, // 페이지 없음 → 제외
    ];
    const r = computePace(logs);
    expect(r.sessionCount).toBe(1);
    expect(r.pagesRead).toBe(20);
    expect(r.pacedSeconds).toBe(600);
    expect(r.pacePerPageSeconds).toBe(30);
  });

  it("적격 세션이 없으면 pacePerPageSeconds=null (NaN 방지)", () => {
    const logs: PaceLog[] = [
      { reading_duration_seconds: null, start_page: null, end_page: null },
      { reading_duration_seconds: 300, start_page: 60, end_page: 40 },
    ];
    const r = computePace(logs);
    expect(r.pacePerPageSeconds).toBeNull();
    expect(r.pagesRead).toBe(0);
    expect(r.sessionCount).toBe(0);
  });

  it("빈 입력 → null", () => {
    expect(computePace([]).pacePerPageSeconds).toBeNull();
  });
});

describe("formatPacePerPage — 사람이 읽는 표기", () => {
  it("60초 미만은 초", () => {
    expect(formatPacePerPage(38)).toBe("38초");
    expect(formatPacePerPage(38.4)).toBe("38초"); // 반올림
  });
  it("60초 이상은 분/초", () => {
    expect(formatPacePerPage(72)).toBe("1분 12초");
    expect(formatPacePerPage(120)).toBe("2분"); // 나머지 0이면 분만
  });
});

describe("estimateRemainingSeconds", () => {
  it("남은 페이지 × 페이지당 초", () => {
    expect(estimateRemainingSeconds(10, 40)).toBe(400);
  });
  it("음수 페이지는 0으로 클램프", () => {
    expect(estimateRemainingSeconds(-5, 40)).toBe(0);
  });
});
