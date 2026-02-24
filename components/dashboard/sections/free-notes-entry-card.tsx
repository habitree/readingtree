"use client";

import Link from "next/link";
import { StickyNote, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface FreeNotesEntryCardProps {
  totalCount: number;
  todayCount: number;
}

/**
 * 홈 화면 자유 기록 진입 카드
 * 총 개수와 오늘 개수를 표시하며 /notes/free로 연결
 */
export function FreeNotesEntryCard({ totalCount, todayCount }: FreeNotesEntryCardProps) {
  const { t } = useTranslation();

  const isEmpty = totalCount === 0;

  return (
    <Link href="/notes/free">
      <Card className="p-3 sm:p-4 border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
            <StickyNote className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t("dashboard.freeNotesTitle")}
            </p>
            {isEmpty ? (
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {t("dashboard.freeNotesEmpty")}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("dashboard.freeNotesCount").replace("{count}", String(totalCount))}
                </p>
                {todayCount > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    · {t("dashboard.freeNotesToday").replace("{count}", String(todayCount))}
                  </span>
                )}
              </div>
            )}
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("dashboard.freeNotesDesc")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-400 shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
