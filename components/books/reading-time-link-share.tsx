"use client";

/**
 * 책 상세 페이지 독서 기록 공유 버튼 (v4 — 2026-07-09).
 *
 * 공유 대상 URL을 "로그인 없이 열람 가능한 공개 공유 페이지"
 * (`/share/reading-time/[userBookId]`)로 지정한다. 이전(v3)에는
 * `window.location.href`(로그인 필수 책 상세 페이지)를 공유해 받은 사람이
 * 로그인 벽에 막히는 문제가 있었다.
 *
 * 동작:
 *   - 1차: Web Share API(navigator.share) — 모바일 네이티브 공유 시트로
 *          인스타·카카오·문자 등 SNS에 바로 전송 (제목·문구·공개 URL 포함)
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
  /** user_books.id — 공개 공유 페이지 경로 구성용 */
  userBookId: string;
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

export function ReadingTimeLinkShare({
  userBookId,
  bookTitle,
  className,
}: ReadingTimeLinkShareProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    // 로그인 없이 볼 수 있는 공개 공유 페이지로 링크 구성
    const url = `${window.location.origin}/share/reading-time/${userBookId}`;
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
          ? `${bookTitle} 공유 링크를 복사했어요. 누구나 열어볼 수 있어요.`
          : "공유 링크를 복사했어요. 누구나 열어볼 수 있어요.",
      );
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error("공유에 실패했어요.");
    }
  }, [userBookId, bookTitle]);

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
