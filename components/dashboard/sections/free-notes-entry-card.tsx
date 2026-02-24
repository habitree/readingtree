"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StickyNote, ChevronRight, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FreeNotesEntryCardProps {
  totalCount: number;
  todayCount: number;
}

/**
 * 홈 화면 자유 기록 진입 카드
 * - 상단: 통계 + /notes/free 링크
 * - 하단: Quick Capture 인라인 입력 (즉시 메모 기록)
 */
export function FreeNotesEntryCard({ totalCount, todayCount }: FreeNotesEntryCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [memo, setMemo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmpty = totalCount === 0;
  const canSubmit = memo.trim().length > 0 && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const content = memo.trim();

    startTransition(async () => {
      try {
        await createNote({
          type: "memo",
          memo_content: content,
          is_public: false,
        });
        setMemo("");
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
        router.refresh();
      } catch {
        toast.error(t("notes.quickCaptureError"));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 overflow-hidden">
      {/* 상단 헤더 — /notes/free 링크 */}
      <Link href="/notes/free" className="block p-3 sm:p-4 hover:opacity-90 transition-opacity">
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

      {/* 하단 Quick Capture 입력 */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-white dark:bg-slate-900 px-3 py-2 transition-colors",
            savedFlash
              ? "border-amber-400 dark:border-amber-500"
              : "border-slate-200 dark:border-slate-700 focus-within:border-amber-400 dark:focus-within:border-amber-500"
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("notes.quickCapturePlaceholder")}
            className="flex-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            maxLength={500}
            disabled={isPending}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "shrink-0 rounded-md p-1.5 transition-colors",
              canSubmit
                ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950"
                : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : savedFlash ? (
              <span className="text-[11px] font-semibold text-amber-500">✓</span>
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {savedFlash && (
          <p className="text-[10px] text-amber-500 mt-1 pl-1">{t("notes.quickCaptureSuccess")}</p>
        )}
      </div>
    </Card>
  );
}
