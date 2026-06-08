import { describe, it, expect } from "vitest";
import {
  computePace,
  computeRobustPace,
  classifyPaceSessions,
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

describe("computeRobustPace — 이상치 자동 제외", () => {
  it("하드 타당범위 밖(너무 빠름/시간 의심)을 제외한다", () => {
    const logs: PaceLog[] = [
      { reading_duration_seconds: 600, start_page: 0, end_page: 15 }, // 40/p 정상
      { reading_duration_seconds: 2000, start_page: 0, end_page: 1 }, // 2000/p > 1800 → above_max
      { reading_duration_seconds: 2, start_page: 0, end_page: 2 }, // 1/p < 3 → below_min
    ];
    const r = computeRobustPace(logs);
    expect(r.pacePerPageSeconds).toBe(40); // 정상 1건만
    expect(r.pagesRead).toBe(15);
    expect(r.excludedCount).toBe(2);
    const reasons = r.excluded.map((e) => e.reason).sort();
    expect(reasons).toEqual(["above_max", "below_min"]);
  });

  it("표본 ≥5면 MAD 통계 이상치를 제외한다", () => {
    const logs: PaceLog[] = [
      ...Array.from({ length: 5 }, () => ({
        reading_duration_seconds: 400,
        start_page: 0,
        end_page: 10,
      })), // 40/p ×5
      { reading_duration_seconds: 2000, start_page: 0, end_page: 10 }, // 200/p (범위 내지만 이상치)
    ];
    const r = computeRobustPace(logs);
    expect(r.pacePerPageSeconds).toBe(40); // 200/p 제외 후 정상값
    expect(r.pagesRead).toBe(50);
    expect(r.excludedCount).toBe(1);
    expect(r.excluded[0].reason).toBe("mad_outlier");
  });

  it("소표본(<5)에서는 MAD를 생략해 정상 데이터를 보존한다", () => {
    const logs: PaceLog[] = [
      { reading_duration_seconds: 400, start_page: 0, end_page: 10 }, // 40/p
      { reading_duration_seconds: 400, start_page: 0, end_page: 10 }, // 40/p
      { reading_duration_seconds: 2000, start_page: 0, end_page: 10 }, // 200/p (범위 내)
    ];
    const r = computeRobustPace(logs);
    // 3건뿐이라 MAD 미적용 → 셋 다 사용 (2800/30)
    expect(r.excludedCount).toBe(0);
    expect(r.pagesRead).toBe(30);
    expect(r.pacePerPageSeconds).toBeCloseTo(2800 / 30, 5);
  });

  it("MAD=0(동일값 다수)이어도 하한으로 정상 데이터를 제외하지 않는다", () => {
    const logs: PaceLog[] = [
      ...Array.from({ length: 5 }, () => ({
        reading_duration_seconds: 400,
        start_page: 0,
        end_page: 10,
      })), // 40/p ×5
      { reading_duration_seconds: 500, start_page: 0, end_page: 10 }, // 50/p (밴드 내)
    ];
    const r = computeRobustPace(logs);
    expect(r.excludedCount).toBe(0); // median 40 ± floor(5)*3.5=17.5, |50-40|=10 보존
  });

  it("적격 0건 → null (NaN 방지)", () => {
    expect(computeRobustPace([]).pacePerPageSeconds).toBeNull();
  });
});

describe("classifyPaceSessions — 사유 분류(입력 순서 정렬)", () => {
  it("not_paced/below_min/above_max/정상을 순서대로 매핑", () => {
    const logs: PaceLog[] = [
      { reading_duration_seconds: 100, start_page: null, end_page: null }, // not_paced
      { reading_duration_seconds: 2, start_page: 0, end_page: 2 }, // below_min
      { reading_duration_seconds: 2000, start_page: 0, end_page: 1 }, // above_max
      { reading_duration_seconds: 600, start_page: 0, end_page: 15 }, // 정상 → null
    ];
    expect(classifyPaceSessions(logs)).toEqual(["not_paced", "below_min", "above_max", null]);
  });
});

describe("순환 검증 — 평균값으로 추정한 페이지는 평균을 바꾸지 않는다", () => {
  it("추정 세션 주입 시 pace 불변, pagesRead만 증가", () => {
    const base: PaceLog[] = [{ reading_duration_seconds: 600, start_page: 0, end_page: 15 }]; // 40/p
    const before = computeRobustPace(base);
    expect(before.pacePerPageSeconds).toBe(40);

    // 시간만 세션(dur=400)을 평균 40으로 추정 → 페이지 round(400/40)=10
    const estimated: PaceLog = { reading_duration_seconds: 400, start_page: 0, end_page: 10 };
    const after = computeRobustPace([...base, estimated]);

    expect(after.pacePerPageSeconds).toBe(40); // 평균 불변(순환)
    expect(after.pagesRead).toBe(before.pagesRead + 10); // 볼륨만 증가
  });
});
