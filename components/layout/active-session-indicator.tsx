"use client";

/**
 * 진행 중 세션 인디케이터 (Phase 4)
 *
 * 모바일: FAB 영역 — `mobile-nav.tsx`가 `variant="fab"`로 사용.
 * 데스크톱: 헤더 우측 inline pill — `header.tsx`가 `variant="pill"`로 사용.
 *
 * 데이터 fetching은 `useReadingSession`이 담당 (폴링·BroadcastChannel·visibilitychange).
 * 클릭 시 `useRecordSheetStore.openEnd()`로 종료 step 진입.
 *
 * D5: 음악 미니플레이어와 별도 영역 — 좌표·z-index 충돌 없음.
 */

import { useReadingSession } from "@/hooks/use-reading-session";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { RecordActivePill } from "@/components/records/record-active-pill";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "fab" | "pill";
  className?: string;
}

export function ActiveSessionIndicator({ variant = "pill", className }: Props) {
  const { user } = useAuth();
  const { session, elapsedSeconds } = useReadingSession();
  const openEnd = useRecordSheetStore((s) => s.openEnd);

  if (!user || !session) return null;

  const handleClick = () => {
    const book: RecordSheetBook | null = session.book
      ? {
          id: session.user_book_id,
          bookId: session.book.id,
          title: session.book.title,
          author: session.book.author,
          coverImageUrl: session.book.cover_image_url,
          totalPages: session.book.total_pages,
        }
      : null;
    openEnd(session.id, { book });
  };

  return (
    <RecordActivePill
      elapsedSeconds={elapsedSeconds}
      bookTitle={session.book?.title}
      coverImageUrl={session.book?.cover_image_url}
      variant={variant}
      onClick={handleClick}
      className={cn(className)}
    />
  );
}
