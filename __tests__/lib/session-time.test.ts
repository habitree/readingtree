import { describe, it, expect } from "vitest";
import { computeActiveSeconds } from "@/lib/utils/session-time";

const START = "2026-11-09T10:00:00.000Z";
const at = (iso: string) => new Date(iso).getTime();

describe("computeActiveSeconds — 일시정지 제외 활성 독서시간", () => {
  it("일시정지 없음 = now − started_at (기존 계산과 동일)", () => {
    expect(computeActiveSeconds({ started_at: START }, at("2026-11-09T10:10:00.000Z"))).toBe(600);
  });

  it("누적 일시정지 시간을 뺀다", () => {
    expect(
      computeActiveSeconds(
        { started_at: START, paused_seconds: 120 },
        at("2026-11-09T10:10:00.000Z"),
      ),
    ).toBe(480);
  });

  it("일시정지 중에는 paused_at 시점에서 멈춘다 (now 무관)", () => {
    const s = { started_at: START, paused_at: "2026-11-09T10:05:00.000Z", paused_seconds: 60 };
    expect(computeActiveSeconds(s, at("2026-11-09T10:10:00.000Z"))).toBe(240);
    expect(computeActiveSeconds(s, at("2026-11-09T12:00:00.000Z"))).toBe(240);
  });

  it("started_at 없음/잘못된 값/음수 결과는 0", () => {
    expect(computeActiveSeconds({ started_at: null }, 0)).toBe(0);
    expect(computeActiveSeconds({ started_at: "nope" }, 0)).toBe(0);
    expect(
      computeActiveSeconds({ started_at: START, paused_seconds: 9999 }, at("2026-11-09T10:01:00.000Z")),
    ).toBe(0);
  });
});
