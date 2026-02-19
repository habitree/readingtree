"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { DailyBookActivity } from "@/app/actions/stats";
import { useTranslation } from "@/lib/i18n";

const STACK_COLORS = [
  "bg-forest-600 dark:bg-forest-500",
  "bg-forest-400 dark:bg-forest-400",
  "bg-amber-500 dark:bg-amber-400",
  "bg-sky-500 dark:bg-sky-400",
  "bg-rose-400 dark:bg-rose-400",
];

interface MonthlySummaryCardProps {
  activities: Record<string, DailyBookActivity>;
  year: number;
  month: number;
}

/**
 * 월간 요약 카드 — "N월에 N권 읽었어요"
 * TertiaryZone 캘린더 위에 배치
 */
export function MonthlySummaryCard({ activities, year, month }: MonthlySummaryCardProps) {
  const { t } = useTranslation();
  const summary = useMemo(() => {
    const uniqueBookIds = new Set<string>();
    let totalNotes = 0;
    let activeDays = 0;

    for (const day of Object.values(activities)) {
      if (day.books.length > 0) {
        activeDays++;
      }
      for (const book of day.books) {
        uniqueBookIds.add(book.bookId);
      }
      totalNotes += day.noteTypes.total;
    }

    return {
      bookCount: uniqueBookIds.size,
      noteCount: totalNotes,
      activeDays,
    };
  }, [activities]);

  if (summary.bookCount === 0) {
    return null;
  }

  return (
    <Card className="p-3 sm:p-4 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3">
        {/* 미니 책 스택 */}
        <div className="flex flex-col gap-0.5 shrink-0" aria-hidden="true">
          {Array.from({ length: Math.min(5, summary.bookCount) }).map((_, i) => (
            <div
              key={i}
              className={`${STACK_COLORS[i % STACK_COLORS.length]} rounded-sm`}
              style={{
                width: 20 - i * 1.5,
                height: 4,
                marginLeft: i * 1,
              }}
            />
          ))}
        </div>

        {/* 텍스트 */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("dashboard.monthlySummary", { month, count: summary.bookCount })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("dashboard.monthlySummaryDetail", { days: summary.activeDays, notes: summary.noteCount })}
          </p>
        </div>
      </div>
    </Card>
  );
}
