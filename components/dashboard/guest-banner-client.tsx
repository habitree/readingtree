"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/**
 * 게스트 배너 UI 클라이언트 컴포넌트
 * 서버 컴포넌트(GuestBanner)에서 렌더링 조건 확인 후 사용
 */
export function GuestBannerClient() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/40 dark:to-emerald-950/30 border border-forest-200/50 dark:border-forest-800/30 p-4 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-forest-100 dark:bg-forest-900/40">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-forest-600 dark:text-forest-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
            {t("auth.startMyReading")}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("auth.guestExploring")}
          </p>
        </div>
        <Link
          href="/login"
          className="shrink-0 inline-flex items-center justify-center rounded-lg bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium transition-colors duration-200 shadow-sm"
        >
          {t("auth.start")}
        </Link>
      </div>
    </div>
  );
}
