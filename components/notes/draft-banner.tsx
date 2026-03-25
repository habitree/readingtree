"use client";

import { FileEdit, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

interface DraftBannerProps {
  draftCount: number;
}

/**
 * Draft 기록 알림 배너
 * draftCount > 0일 때만 표시
 */
export function DraftBanner({ draftCount }: DraftBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (draftCount <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/notes?tab=inbox")}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 transition-colors text-left group"
    >
      <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
        <FileEdit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {t("notes.draftBanner").replace("{count}", String(draftCount))}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
