"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n";

const MIN_NOTES = 3;

interface ReadingReportButtonProps {
  userBookId: string;
  noteCount: number;
  isGuest: boolean;
}

export function ReadingReportButton({
  userBookId,
  noteCount,
  isGuest,
}: ReadingReportButtonProps) {
  const { t } = useTranslation();

  if (isGuest) return null;

  const isEnabled = noteCount >= MIN_NOTES;
  const remaining = MIN_NOTES - noteCount;

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
  );
}
