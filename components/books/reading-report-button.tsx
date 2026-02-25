"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n";

const MIN_NOTES = 3;

interface SavedReportMeta {
  shareId: string;
  isPublic: boolean;
  savedAt: string;
}

interface ReadingReportButtonProps {
  userBookId: string;
  noteCount: number;
  isGuest: boolean;
  savedReport?: SavedReportMeta | null;
}

export function ReadingReportButton({
  userBookId,
  noteCount,
  isGuest,
  savedReport,
}: ReadingReportButtonProps) {
  const { t } = useTranslation();

  if (isGuest) return null;

  const isEnabled = noteCount >= MIN_NOTES;
  const remaining = MIN_NOTES - noteCount;

  const savedAtFormatted = savedReport
    ? new Date(savedReport.savedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  if (!isEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-1.5 opacity-50"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs">{t("books.aiReport")}</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("books.aiReportMinNotes", { count: remaining })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        {/* AI 리포트 생성 버튼 */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
        >
          <Link href={`/books/${userBookId}/report`}>
            <FileText className="h-3.5 w-3.5" />
            <span className="text-xs">{t("books.aiReport")}</span>
          </Link>
        </Button>

        {/* 저장된 리포트 열기 버튼 */}
        {savedReport && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-400/50 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <Link href={`/books/${userBookId}/report?view=saved`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="text-xs">리포트 열기</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  마지막 저장:{" "}
                  {savedAtFormatted}
                  {savedReport.isPublic && (
                    <span className="ml-1 text-emerald-500">· 공개 중</span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 발행시간 표시 */}
      {savedReport && savedAtFormatted && (
        <p className="text-[11px] text-muted-foreground/70 pl-0.5">
          리포트 저장: {savedAtFormatted}
          {savedReport.isPublic && (
            <span className="ml-1 text-emerald-500 dark:text-emerald-400">· 공개 중</span>
          )}
        </p>
      )}
    </div>
  );
}
