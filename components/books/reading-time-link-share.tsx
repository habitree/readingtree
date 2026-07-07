"use client";

/**
 * 책 상세 페이지 URL 링크 복사 버튼.
 *
 * 동작: 클릭 즉시 클립보드 복사 (공유 시트 없이 "바로 복사" — 2026-07-07 개편).
 *   - 1차: navigator.clipboard.writeText
 *   - 폴백: hidden textarea + execCommand("copy") (구형/인앱 브라우저)
 *
 * ReadingTimeTab 통계 영역 우측에 ReadingTimeShareButton(이미지 복사) 옆에 배치.
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

  const handleCopy = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;

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
      toast.error("링크 복사에 실패했어요.");
    }
  }, [bookTitle]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn("h-8 px-3 text-xs", className)}
      aria-label="링크 복사"
    >
      {copied ? (
        <>
          <Check className="mr-1 h-3.5 w-3.5" />
          복사됨
        </>
      ) : (
        <>
          <Link2 className="mr-1 h-3.5 w-3.5" />
          링크 복사
        </>
      )}
    </Button>
  );
}
