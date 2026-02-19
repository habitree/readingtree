"use client";

import { Card } from "@/components/ui/card";
import { CalendarDays, BookOpen } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * Tertiary Zone 빈 상태 가이드
 * 활동 데이터가 없을 때 가이드 콘텐츠를 표시하여 이탈 방지
 */
export function TertiaryZoneEmptyGuide() {
  const { t } = useTranslation();

  return (
    <Card className="p-4 sm:p-5 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("empty.tertiaryGuideTitle")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("empty.tertiaryGuideDesc")}
          </p>
          {/* 샘플 캘린더 미리보기 */}
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`h-4 flex-1 rounded-sm ${
                  i === 1 || i === 3 || i === 5
                    ? "bg-forest-300 dark:bg-forest-600"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
          <Link
            href="/books/search"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t("dashboard.quickAddBook")}
          </Link>
        </div>
      </div>
    </Card>
  );
}
