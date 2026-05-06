"use client";

/**
 * 책 상세 페이지 URL 링크 공유 버튼.
 *
 * 동작:
 *   - Web Share API 가능 시 시스템 공유 시트 (모바일/일부 PC)
 *   - 폴백: 클립보드 복사 + toast
 *
 * ReadingTimeTab 통계 영역 우측에 ReadingTimeShareButton(이미지 공유) 옆에 배치.
 */

import { useCallback, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReadingTimeLinkShareProps {
  bookTitle?: string | null;
  className?: string;
}

export function ReadingTimeLinkShare({ bookTitle, className }: ReadingTimeLinkShareProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = bookTitle ? `${bookTitle} 독서 기록` : "독서 기록";
    const text = bookTitle ? `${bookTitle}의 독서 기록을 공유합니다.` : "독서 기록을 공유합니다.";

    // Web Share API — 모바일에서 시스템 공유 시트 (카카오·인스타·메시지 등)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // 사용자가 공유 취소한 경우 — 더 이상 처리 안 함
        if (err instanceof Error && err.name === "AbortError") return;
        // 그 외 에러는 클립보드 폴백으로 진행
      }
    }

    // 폴백 — 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("링크를 복사했어요.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("링크 복사에 실패했어요.");
    }
  }, [bookTitle]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn("h-8 px-3 text-xs", className)}
      aria-label="링크 공유"
    >
      {copied ? (
        <>
          <Check className="mr-1 h-3.5 w-3.5" />
          복사됨
        </>
      ) : (
        <>
          <Link2 className="mr-1 h-3.5 w-3.5" />
          링크 공유
        </>
      )}
    </Button>
  );
}
