"use client";

/**
 * BookTimerButton (분리 단계 C — 2026-05-05)
 *
 * 책 상세에서 "독서 시작" 버튼. 사용자 결정에 따라 음악 도메인과 분리:
 *  - 이전: setActiveBook + openTimerSheet (음악 + 타이머 + 책 동시 시작)
 *  - 현재: useRecordSheet.openStart({ book }) — 기록 세션만 시작 (음악 무관)
 */

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useReadingSession } from "@/hooks/use-reading-session";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";

interface BookTimerButtonProps {
  userBookId: string;
  bookId: string;
  title: string;
  coverUrl: string | null;
  className?: string;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "ghost";
}

export function BookTimerButton({
  userBookId,
  bookId,
  title,
  coverUrl,
  className,
  size = "sm",
  variant = "outline",
}: BookTimerButtonProps) {
  const openStart = useRecordSheetStore((s) => s.openStart);
  const { session } = useReadingSession();
  const isThisBookActive = session?.user_book_id === userBookId;

  const handleClick = () => {
    const book: RecordSheetBook = {
      id: userBookId,
      bookId,
      title,
      author: null,
      coverImageUrl: coverUrl,
      totalPages: null,
    };
    openStart({ book });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <Play className="mr-2 h-4 w-4" />
      {isThisBookActive ? "기록 진행 중" : "독서 기록"}
    </Button>
  );
}
