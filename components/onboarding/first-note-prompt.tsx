"use client";

import { PenLine, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useQuickCaptureStore } from "@/hooks/use-quick-capture";

/**
 * 첫 기록 유도 CTA 카드
 * hasFirstNote=false일 때 대시보드 Primary Zone에 표시
 * 모바일/PC 모두 Quick Capture를 엽니다
 */
export function FirstNotePrompt() {
  const { t } = useTranslation();
  const { open } = useQuickCaptureStore();

  const handleClick = () => {
    open();
  };

  return (
    <Card className="relative overflow-hidden border-forest-200/60 dark:border-forest-800/40 bg-gradient-to-br from-forest-50/80 via-white to-amber-50/40 dark:from-forest-950/40 dark:via-slate-900 dark:to-amber-950/20">
      {/* 장식 요소 */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-forest-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-400/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-900/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-forest-600 dark:text-forest-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
              {t("onboarding.firstNoteTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              {t("onboarding.firstNoteDescription")}
            </p>
            <Button
              onClick={handleClick}
              size="sm"
              className="rounded-full px-4 h-9 text-sm font-semibold shadow-sm"
            >
              <PenLine className="w-4 h-4 mr-1.5" />
              {t("onboarding.firstNoteCta")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
