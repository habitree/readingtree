"use client";

import { FileText } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/**
 * 샘플 기록 빈 상태 컴포넌트 (클라이언트 컴포넌트)
 * 번역을 위해 useTranslation 사용
 */
export function SampleNotesEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-12 space-y-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <p className="text-muted-foreground">{t("empty.noNotes")}</p>
    </div>
  );
}
