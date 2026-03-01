"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOCRStatus } from "@/hooks/use-ocr-status";
import { toast } from "sonner";
import { OCRStatusBadge } from "./ocr-status-badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getNoteDetail } from "@/app/actions/notes";
import { useTranslation } from "@/lib/i18n";
import { useUpgradeModal, isUpgradeLimitError } from "@/hooks/use-upgrade-modal";

interface OCRStatusCheckerProps {
  noteId: string;
  noteType: string;
  hasImage: boolean;
}

/**
 * OCR 상태를 확인하고 완료 시 알림을 표시하는 컴포넌트
 * 실패 시 재실행 버튼 제공
 */
export function OCRStatusChecker({
  noteId,
  noteType,
  hasImage,
}: OCRStatusCheckerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();
  const [isRetrying, setIsRetrying] = useState(false);
  const { status } = useOCRStatus({
    noteId,
    enabled: noteType === "transcription" && hasImage,
    pollInterval: 3000,
    onComplete: () => {
      toast.success(t("notes.ocrCompleteToast"), {
        description: t("notes.ocrCompleteDesc"),
        duration: 5000,
      });
      // 페이지 새로고침하여 최신 데이터 표시
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
  });

  // OCR 재실행 함수
  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      // 기록 정보 조회 (image_url 필요)
      const note = await getNoteDetail(noteId);
      
      if (!note || !note.image_url) {
        toast.error(t("notes.noteOrImageNotFound"));
        setIsRetrying(false);
        return;
      }

      // OCR 처리 재시작
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: note.id,
          imageUrl: note.image_url,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            const errorMsg = errorData.error || t("notes.ocrRetryFailed");
            if (isUpgradeLimitError(errorMsg)) {
              showUpgradeModal({ feature: "OCR 필사", message: errorMsg });
              setIsRetrying(false);
              return;
            }
          } catch {
            // JSON 파싱 실패 시 기본 에러로 폴백
          }
        }
        throw new Error(t("notes.ocrRetryFailed"));
      }

      toast.success(t("notes.ocrRetryStarted"), {
        description: t("notes.ocrRetryStartedDesc"),
        duration: 3000,
      });

      // 페이지 새로고침하여 상태 업데이트
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("OCR 재시작 오류:", error);
      toast.error(t("notes.ocrRetryFailed"));
    } finally {
      setIsRetrying(false);
    }
  };

  // OCR 처리 중이거나 완료된 경우 배지 표시
  if (status === "processing" || status === "completed") {
    return (
      <div className="flex items-center gap-2">
        <OCRStatusBadge status={status} />
      </div>
    );
  }

  // 실패한 경우 배지와 재실행 버튼 표시
  if (status === "failed") {
    return (
      <div className="flex items-center gap-2">
        <OCRStatusBadge status={status} />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="h-7 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? t("notes.retrying") : t("notes.retryOcr")}
        </Button>
      </div>
    );
  }

  return null;
}

