/**
 * 읽기진행률(📊) 계산 — 단일 출처(A5).
 *
 * `Math.min(Math.round((current/total)*100), 100)` 패턴이 앱 곳곳에 중복돼 있었다
 * (reading-progress·reading.ts·books-list·sample 등). 본 모듈로 통합한다.
 *
 * 순수 모듈 — 서버·클라이언트 양쪽 import.
 */

import type { ReadingProgressMetrics } from "@/types/reading-metrics";

/**
 * 진행률(%) — 0~100 상한. totalPages가 없거나 0이면 null.
 * currentPage 미지정은 0으로 간주.
 */
export function computeProgressPercent(
  currentPage: number | null | undefined,
  totalPages: number | null | undefined
): number | null {
  if (!totalPages || totalPages <= 0) return null;
  const cur = currentPage ?? 0;
  return Math.min(Math.round((cur / totalPages) * 100), 100);
}

/**
 * %(0~100) → 페이지. `computeProgressPercent` 의 역함수.
 * totalPages가 없거나 0이면 환산 불가이므로 null.
 *
 * 이북은 뷰어가 %만 알려주는 경우가 있어 입력을 %로도 받는다. 저장 단위는
 * 여전히 페이지 하나뿐이며, 이 함수는 입력 시점에만 쓰인다.
 */
export function percentToPage(
  percent: number | null | undefined,
  totalPages: number | null | undefined
): number | null {
  if (!totalPages || totalPages <= 0) return null;
  if (percent == null || !Number.isFinite(percent)) return null;
  const clamped = Math.min(Math.max(percent, 0), 100);
  return Math.min(Math.round((totalPages * clamped) / 100), totalPages);
}

/** 진행률 축 메트릭 묶음 */
export function toProgressMetrics(
  currentPage: number | null | undefined,
  totalPages: number | null | undefined
): ReadingProgressMetrics {
  return {
    currentPage: currentPage ?? null,
    totalPages: totalPages ?? null,
    percent: computeProgressPercent(currentPage, totalPages),
  };
}
