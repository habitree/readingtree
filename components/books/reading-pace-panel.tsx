"use client";

/**
 * ReadingPacePanel (C7) — 페이지별/구간별 독서 페이스 요약.
 *
 * 세션(reading_logs)의 구간(start_page~end_page)과 시간을 묶어
 * "페이지당 평균 시간"과 "남은 분량 예상 시간"을 보여준다(시간×진행률 결합).
 * 데이터는 책 상세 시간탭이 이미 로드한 logs를 그대로 사용한다(추가 쿼리 없음).
 */

import { Gauge, BookOpenCheck, Hourglass } from "lucide-react";
import { formatDuration } from "@/lib/utils/duration";
import type { ReadingLog } from "@/types/progress";

interface Props {
  logs: ReadingLog[];
  totalPages: number | null;
}

/** 페이지당 평균을 사람이 읽는 표기로 ("38초" / "1분 12초") */
function formatPacePerPage(secondsPerPage: number): string {
  const s = Math.round(secondsPerPage);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}분 ${rem}초` : `${m}분`;
}

export function ReadingPacePanel({ logs, totalPages }: Props) {
  // 페이지 구간 + 시간이 모두 있는 세션만 페이스 집계 대상
  const segments = logs.filter(
    (l) =>
      l.start_page != null &&
      l.end_page != null &&
      l.end_page - l.start_page > 0 &&
      l.reading_duration_seconds > 0,
  );

  if (segments.length === 0) return null;

  const pagesRead = segments.reduce((sum, l) => sum + (l.end_page! - l.start_page!), 0);
  const totalSeconds = segments.reduce((sum, l) => sum + l.reading_duration_seconds, 0);
  const pacePerPage = pagesRead > 0 ? totalSeconds / pagesRead : 0;

  const furthestPage = Math.max(...segments.map((l) => l.end_page!));
  const remainingPages = totalPages && totalPages > furthestPage ? totalPages - furthestPage : 0;
  const remainingSeconds = Math.round(remainingPages * pacePerPage);

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
    </div>
  );
}
