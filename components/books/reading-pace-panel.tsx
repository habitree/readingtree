"use client";

/**
 * ReadingPacePanel (C7) — 페이지별/구간별 독서 페이스 요약.
 *
 * 세션(reading_logs)의 구간(start_page~end_page)과 시간을 묶어
 * "페이지당 평균 시간"과 "남은 분량 예상 시간"을 보여준다(시간×진행률 결합).
 * 데이터는 책 상세 시간탭이 이미 로드한 logs를 그대로 사용한다(추가 쿼리 없음).
 */

import { Gauge, BookOpenCheck, Hourglass, Rabbit, Turtle } from "lucide-react";
import { formatDuration } from "@/lib/utils/duration";
import {
  computePace,
  formatPacePerPage,
  estimateRemainingSeconds,
} from "@/lib/reading/pace";
import type { ReadingLog } from "@/types/progress";

interface Props {
  logs: ReadingLog[];
  totalPages: number | null;
  /** 내 전체 페이지당 평균 초 — 이 책 페이스와 비교 표시용. 없으면 비교 생략 */
  overallPaceSeconds?: number | null;
}

/** 비교 "비슷" 판정 임계값 (±10%) */
const SIMILAR_THRESHOLD = 0.1;

export function ReadingPacePanel({ logs, totalPages, overallPaceSeconds }: Props) {
  const pace = computePace(logs);
  if (pace.pacePerPageSeconds == null) return null;

  const pacePerPage = pace.pacePerPageSeconds;
  const pagesRead = pace.pagesRead;
  const totalSeconds = pace.pacedSeconds;

  // 페이지 진행이 있는 세션의 최댓값(가장 멀리 간 페이지)으로 남은 분량 추정
  const furthestPage = Math.max(
    ...logs
      .filter((l) => l.start_page != null && l.end_page != null && l.end_page - l.start_page > 0)
      .map((l) => l.end_page!),
  );
  const remainingPages = totalPages && totalPages > furthestPage ? totalPages - furthestPage : 0;
  const remainingSeconds = estimateRemainingSeconds(remainingPages, pacePerPage);

  // 내 전체 평균 대비 비교 (overallPaceSeconds 있고 양수일 때만)
  let comparison: { kind: "faster" | "slower" | "similar"; percent: number } | null = null;
  if (overallPaceSeconds != null && overallPaceSeconds > 0) {
    const diff = (pacePerPage - overallPaceSeconds) / overallPaceSeconds;
    if (Math.abs(diff) <= SIMILAR_THRESHOLD) {
      comparison = { kind: "similar", percent: 0 };
    } else if (diff < 0) {
      // 페이지당 시간이 적음 = 더 빠름
      comparison = { kind: "faster", percent: Math.round(-diff * 100) };
    } else {
      comparison = { kind: "slower", percent: Math.round(diff * 100) };
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div className="mb-3 flex items-center gap-1.5">
        <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">독서 페이스</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
            {formatPacePerPage(pacePerPage)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">페이지당 평균</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-base font-bold tabular-nums text-slate-900 dark:text-white">
            <BookOpenCheck className="h-3.5 w-3.5 text-slate-400" />
            {pagesRead}p
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">읽은 분량 · {formatDuration(totalSeconds)}</div>
        </div>
        <div>
          {remainingPages > 0 ? (
            <>
              <div className="flex items-center justify-center gap-1 text-base font-bold tabular-nums text-slate-900 dark:text-white">
                <Hourglass className="h-3.5 w-3.5 text-slate-400" />
                {remainingPages}p
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                남음 · 예상 {formatDuration(remainingSeconds)}
              </div>
            </>
          ) : (
            <>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">완독</div>
              <div className="mt-0.5 text-[11px] text-slate-500">남은 분량 없음</div>
            </>
          )}
        </div>
      </div>
      {comparison && (
        <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-emerald-200/50 pt-2.5 text-[11px] dark:border-emerald-900/30">
          {comparison.kind === "faster" && (
            <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <Rabbit className="h-3.5 w-3.5" />
              내 평균보다 {comparison.percent}% 빠르게 읽고 있어요
            </span>
          )}
          {comparison.kind === "slower" && (
            <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
              <Turtle className="h-3.5 w-3.5" />
              내 평균보다 {comparison.percent}% 천천히 읽고 있어요
            </span>
          )}
          {comparison.kind === "similar" && (
            <span className="flex items-center gap-1 text-slate-500">
              <Gauge className="h-3.5 w-3.5" />
              내 평균 속도와 비슷해요
            </span>
          )}
        </div>
      )}
    </div>
  );
}
