"use client";

import Link from "next/link";
import { StickyNote, ChevronRight, PenLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { useQuickCaptureStore } from "@/hooks/use-quick-capture";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";

interface FreeNotesEntryCardProps {
  totalCount: number;
  todayCount: number;
}

/**
 * 홈 화면 메모 진입 카드
 * - 상단: 통계 + /notes?free=true 링크
 * - 하단: Quick Capture 진입점 (클릭 시 Quick Capture Sheet/Dialog 열기)
 */
export function FreeNotesEntryCard({ totalCount, todayCount }: FreeNotesEntryCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOpen: loginOpen, setIsOpen: setLoginOpen, title: loginTitle, description: loginDesc, requireLogin } = useLoginPrompt();
  const openQuickCapture = useQuickCaptureStore((s) => s.open);

  const isEmpty = totalCount === 0;

  const handleQuickCaptureClick = () => {
    if (!user) {
      requireLogin({
        title: t("nav.writeNoteLoginTitle"),
        description: t("nav.writeNoteLoginDesc"),
      });
      return;
    }
    openQuickCapture();
  };

  return (
    <>
      <Card className="border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 overflow-hidden">
        {/* 상단 헤더 — /notes?free=true 링크 */}
        <Link href="/notes?free=true" className="block p-3 sm:p-4 hover:opacity-90 transition-opacity">
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
        </Link>

        {/* 하단 Quick Capture 진입점 */}
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
          <button
            type="button"
            onClick={handleQuickCaptureClick}
            className="w-full flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 hover:border-amber-400 dark:hover:border-amber-500 transition-colors text-left"
          >
            <PenLine className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {t("notes.quickCapturePlaceholder")}
            </span>
          </button>
        </div>
      </Card>

      <LoginPromptModal open={loginOpen} onOpenChange={setLoginOpen} title={loginTitle} description={loginDesc} />
    </>
  );
}
