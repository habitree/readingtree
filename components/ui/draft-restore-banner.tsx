"use client";

import { FileEdit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DraftRestoreBannerProps {
  savedAt: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}

/**
 * 임시저장 복원 제안 배너
 * 폼 상단에 표시하여 이전 입력 내용 복원 또는 삭제를 안내
 */
export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
  className,
}: DraftRestoreBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-blue-50/70 dark:bg-blue-950/30",
        "border border-blue-200/60 dark:border-blue-800/40",
        "animate-in fade-in slide-in-from-top-2 duration-300",
        className,
      )}
    >
      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
        <FileEdit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
          {t("autoDraft.restoreTitle")}
        </p>
        {savedAt && (
          <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-0.5">
            {formatRelativeTime(savedAt)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-100/50"
        >
          <X className="h-3 w-3 mr-1" />
          {t("autoDraft.discard")}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onRestore}
          className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t("autoDraft.restore")}
        </Button>
      </div>
    </div>
  );
}
