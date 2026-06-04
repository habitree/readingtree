"use client";

/**
 * ReadingOverviewPanel (C8) — 독서 3축 통합 요약.
 *
 * 기획서 v2(§3)의 3축을 책 상세 한 화면에서 비교한다:
 *   ⏱ 독서시간(getReadingTimeStats) · 📊 읽기진행률(computeProgressPercent) · 🧭 여정(회독·기록).
 * A5 타입/유틸(`computeProgressPercent`)·A2(`formatDuration`) 위에 구성 → 다른 화면과 숫자 정합.
 * 아래 탭(시간/기록/여정)이 상세 드릴다운 역할을 한다.
 */

import { useEffect, useState } from "react";
import { Clock, BarChart3, Map } from "lucide-react";
import { getReadingTimeStats } from "@/app/actions/progress";
import { formatDuration } from "@/lib/utils/duration";
import { computeProgressPercent } from "@/lib/reading/progress";

interface Props {
  userBookId: string;
  currentPage: number;
  totalPages: number | null;
  /** completed_dates.length — 완독(회독) 횟수 */
  completedCount: number;
  status: string;
  /** 기록 총수 */
  recordsCount: number;
}

export function ReadingOverviewPanel({
  userBookId,
  currentPage,
  totalPages,
  completedCount,
  status,
  recordsCount,
}: Props) {
  const [time, setTime] = useState<{ totalSeconds: number; sessionCount: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReadingTimeStats(userBookId)
      .then((s) => {
        if (!cancelled) setTime({ totalSeconds: s.totalSeconds, sessionCount: s.sessionCount });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userBookId]);

  const percent = computeProgressPercent(currentPage, totalPages);
  const journeyLabel =
    completedCount > 0 ? `${completedCount}회독` : status === "completed" ? "완독" : "읽는 중";

  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {/* ⏱ 독서시간 */}
      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <div className="mb-1 flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">독서시간</span>
        </div>
        <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
          {time ? formatDuration(time.totalSeconds) : "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {time ? `${time.sessionCount}세션` : " "}
        </p>
      </div>

      {/* 📊 읽기진행률 */}
      <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="mb-1 flex items-center gap-1 text-blue-700 dark:text-blue-400">
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">진행률</span>
        </div>
        <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
          {percent != null ? `${percent}%` : "—"}
        </p>
        {percent != null && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} />
          </div>
        )}
        <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">
          {totalPages ? `p.${currentPage}/${totalPages}` : `p.${currentPage}`}
        </p>
      </div>

      {/* 🧭 여정 */}
      <div className="rounded-xl border border-violet-200/60 bg-violet-50/50 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
        <div className="mb-1 flex items-center gap-1 text-violet-700 dark:text-violet-400">
          <Map className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">여정</span>
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white">{journeyLabel}</p>
        <p className="mt-0.5 text-[11px] tabular-nums text-slate-500">{recordsCount}기록</p>
      </div>
    </div>
  );
}
