"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, TreePine, Users, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/**
 * 게스트 배너 UI — 풀폭 온보딩 CTA
 * 핵심 가치를 3개 피처 포인트로 전달 + 강력한 CTA
 */
export function GuestBannerClient() {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-50 via-emerald-50 to-amber-50/30 dark:from-forest-950/60 dark:via-emerald-950/40 dark:to-slate-900 border border-forest-200/50 dark:border-forest-800/30 p-5 sm:p-7">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-forest-400/10 dark:bg-forest-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-300/15 dark:bg-amber-500/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

      <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-7">
        {/* 나무 일러스트 */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
          <Image
            src="/images/trees/level-3.webp"
            alt="ReadingTree"
            fill
            className="object-contain drop-shadow-lg"
          />
        </div>

        {/* 텍스트 영역 */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5">
            {t("dashboard.guestCtaTitle")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t("dashboard.guestCtaDesc")}
          </p>

          {/* 피처 포인트 3개 */}
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-forest-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("dashboard.guestCtaFeature1")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TreePine className="h-3.5 w-3.5 text-forest-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("dashboard.guestCtaFeature2")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-forest-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("dashboard.guestCtaFeature3")}</span>
            </div>
          </div>

          {/* CTA 버튼 */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white px-7 py-3 text-sm sm:text-base font-semibold transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            {t("dashboard.guestCtaButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
