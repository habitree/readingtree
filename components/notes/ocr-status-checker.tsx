"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOCRStatus } from "@/hooks/use-ocr-status";
import { toast } from "sonner";
import { OCRStatusBadge } from "./ocr-status-badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getNoteDetail } from "@/app/actions/notes";

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
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const { status } = useOCRStatus({
    noteId,
    enabled: noteType === "transcription" && hasImage,
    pollInterval: 3000,
    onComplete: () => {
      toast.success("OCR 처리가 완료됐어요.", {
        description: "사진 필사 텍스트가 저장됐어요. 기록 상세 페이지에서 확인하세요.",
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
        toast.error("기록 또는 이미지를 찾을 수 없습니다.");
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
        throw new Error("OCR 재시작에 실패했습니다.");
      }

      toast.success("OCR 처리를 다시 시작했습니다.", {
        description: "처리 상태를 확인 중입니다...",
        duration: 3000,
      });

      // 페이지 새로고침하여 상태 업데이트
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("OCR 재시작 오류:", error);
      toast.error("OCR 재시작에 실패했습니다. 다시 시도해주세요.");
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
          {isRetrying ? "재시작 중..." : "재실행"}
        </Button>
      </div>
    );
  }

  return null;
}

