"use client";

/**
 * 책 상세 페이지 독서 기록 공유 버튼 (v3 — 2026-07-08).
 *
 * 동작:
 *   - 1차: Web Share API(navigator.share) — 모바일 네이티브 공유 시트로
 *          인스타·카카오·문자 등 SNS에 바로 전송 (제목·문구·URL 포함)
 *   - 2차: 클립보드 복사 (navigator.clipboard.writeText)
 *   - 3차: hidden textarea + execCommand("copy") (구형/인앱 브라우저)
 *
 * ReadingTimeTab 통계 영역 우측에 ReadingTimeShareButton(이미지 복사) 옆에 배치.
 */

import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReadingTimeLinkShareProps {
  bookTitle?: string | null;
  className?: string;
}

/** 구형/인앱 브라우저용 execCommand 폴백 */
function copyTextLegacy(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ReadingTimeLinkShare({ bookTitle, className }: ReadingTimeLinkShareProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = bookTitle ? `《${bookTitle}》 독서 기록` : "독서 기록";
    const text = bookTitle
      ? `📖 《${bookTitle}》 읽고 있어요 — ReadTree에서 독서 기록 중 🌳`
      : "📖 ReadTree에서 독서 기록 중 🌳";

    // 1차: 네이티브 공유 시트 (모바일 SNS 바로 공유)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return; // 공유 성공 또는 사용자 취소 — 조용히 종료
      } catch (err) {
        // 사용자가 취소(AbortError)한 경우는 폴백 없이 종료
        if (err instanceof DOMException && err.name === "AbortError") return;
        // 그 외 오류는 아래 클립보드 복사로 폴백
      }
    }

    // 2차·3차: 클립보드 복사
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = copyTextLegacy(url);
    }

    if (ok) {
      setCopied(true);
      toast.success(
        bookTitle
          ? `${bookTitle} 독서 기록 링크를 복사했어요.`
          : "독서 기록 링크를 복사했어요.",
      );
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error("공유에 실패했어요.");
    }
  }, [bookTitle]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn("h-8 px-3 text-xs", className)}
      aria-label="독서 기록 공유"
    >
      {copied ? (
        <>
          <Check className="mr-1 h-3.5 w-3.5" />
          복사됨
        </>
      ) : (
        <>
          <Share2 className="mr-1 h-3.5 w-3.5" />
          공유
        </>
      )}
    </Button>
  );
}
