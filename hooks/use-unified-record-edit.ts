"use client";

/**
 * 통합 기록 단일 편집 라우팅 — 기록 기획 13 Phase 3·4
 *
 * 피드의 어떤 카드든 동일한 진입점에서 편집하도록 editTarget으로 분기한다.
 *  - reading_log → RecordSheet attach 모드(openAttach). "시간만 → 나중에 페이지·메모 추가"
 *    수렴이 attach로 충족(요구 3). 기존 reading-time-tab/reading-speed-detail 와 동일 경로.
 *  - note(progress/detail) → /notes/[id]/edit (리치 편집 보존)
 *
 * 카나리(isRecordV2Enabled) OFF면 attach 대신 책 상세로 폴백.
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { isRecordV2Enabled } from "@/lib/feature-flags";
import type { UnifiedRecord } from "@/types/unified-record";

export function useUnifiedRecordEdit() {
  const router = useRouter();
  const openAttach = useRecordSheetStore((s) => s.openAttach);

  const editRecord = useCallback(
    (record: UnifiedRecord) => {
      const target = record.editTarget;

      if (target.kind === "reading_log") {
        const userBookId = record.book.userBookId;
        if (isRecordV2Enabled()) {
          const book: RecordSheetBook | null = userBookId
            ? {
                id: userBookId,
                bookId: record.book.bookId ?? "",
                title: record.book.title ?? "책",
                author: record.book.author,
                coverImageUrl: record.book.coverImageUrl,
                totalPages: record.book.totalPages,
              }
            : null;
          openAttach(target.logId, {
            book,
            startPage: record.startPage ?? undefined,
            endPage: record.endPage ?? undefined,
          });
        } else if (userBookId) {
          // 카나리 OFF 폴백 — 책 상세 시간 탭에서 편집
          router.push(`/books/${userBookId}`);
        } else {
          toast.info("이 기록은 책 상세에서 편집할 수 있어요.");
        }
        return;
      }

      // note(progress·detail) → 편집 페이지
      router.push(`/notes/${target.noteId}/edit`);
    },
    [openAttach, router],
  );

  return { editRecord };
}
