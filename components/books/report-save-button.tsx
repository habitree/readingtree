"use client";

import { useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveReadingReport } from "@/app/actions/ai/report";
import type { BookInfoForReport } from "@/types/ai/report";

interface ReportSaveButtonProps {
  userBookId: string;
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteIds: string[];
  onSaved?: (shareId: string) => void;
  /** 이미 저장된 경우 초기 shareId */
  initialShareId?: string | null;
}

export function ReportSaveButton({
  userBookId,
  reportMarkdown,
  bookInfo,
  noteCount,
  noteIds,
  onSaved,
  initialShareId,
}: ReportSaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(initialShareId ?? null);

  const isSaved = !!shareId;

  const handleSave = async () => {
    if (isSaved) return;
    setIsSaving(true);
    try {
      const result = await saveReadingReport(
        userBookId,
        reportMarkdown,
        bookInfo,
        noteCount,
        noteIds
      );
      if (result.success && result.shareId) {
        setShareId(result.shareId);
        onSaved?.(result.shareId);
        toast.success("리포트가 저장되었습니다.");
      } else {
        const errMsg = result.error ?? "";
        const isSchemaError = errMsg.includes("does not exist") || errMsg.includes("column");
        toast.error(
          isSchemaError
            ? "서버 설정을 업데이트 중이에요. 잠시 후 다시 시도해 주세요."
            : errMsg || "저장 중 오류가 발생했습니다.",
          { duration: 5000 }
        );
      }
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaved) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 cursor-default" disabled>
        <Check className="h-3.5 w-3.5" />
        저장됨
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleSave}
      disabled={isSaving}
    >
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      {isSaving ? "저장 중..." : "저장"}
    </Button>
  );
}
