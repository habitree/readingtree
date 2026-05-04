"use client";

/**
 * RecordSheet — 통합 기록 시트 (기록 기능 전면 개편 Phase 3)
 *
 * 모드:
 *  - "start"  → 세션 시작
 *  - "end"    → 진행 중 세션 종료
 *  - "detail" → 상세기록 (구절/생각/필사)
 *
 * 컴포넌트는 라우터 역할만. 각 step이 자체 액션 호출.
 * Phase 5에서 모든 진입점이 useRecordSheet().openStart()/openEnd()/openDetail()을 사용.
 */

import { useEffect } from "react";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRecordSheet } from "@/hooks/use-record-sheet";
import { useReadingSession } from "@/hooks/use-reading-session";
import { RecordStartStep } from "./record-start-step";
import { RecordEndStep } from "./record-end-step";
import { RecordDetailStep } from "./record-detail-step";

export function RecordSheet() {
  const store = useRecordSheet();
  const { session: activeSession } = useReadingSession();

  // start 모드 진입 시 이미 진행 중인 세션이 있으면 end로 자동 전환 (D2)
  useEffect(() => {
    if (store.isOpen && store.mode === "start" && activeSession) {
      store.openEnd(activeSession.id, {
        book: activeSession.book
          ? {
              id: activeSession.user_book_id,
              bookId: activeSession.book.id,
              title: activeSession.book.title,
              author: activeSession.book.author,
              coverImageUrl: activeSession.book.cover_image_url,
              totalPages: activeSession.book.total_pages,
            }
          : null,
      });
    }
  }, [store.isOpen, store.mode, activeSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const title =
    store.mode === "start"
      ? "기록 시작"
      : store.mode === "end"
        ? "기록 종료"
        : "상세 기록";

  const description =
    store.mode === "start"
      ? "책과 시작 페이지를 확인하고 기록을 시작하세요."
      : store.mode === "end"
        ? "끝 페이지와 메모, 사진을 남기고 저장하세요."
        : "구절·생각·필사를 자유롭게 남길 수 있어요.";

  return (
    <Sheet
      open={store.isOpen}
      onOpenChange={(open) => {
        if (!open) store.close();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[95dvh] overflow-y-auto p-0 sm:max-w-2xl sm:mx-auto"
      >
        <div className="px-4 py-4 sm:px-6">
          <SheetHeader className="text-left pb-3">
            <SheetTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-emerald-600" />
              {title}
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          {store.mode === "start" && (
            <RecordStartStep
              selectedBook={store.selectedBook}
              prefillTargetSeconds={store.prefillTargetSeconds}
              prefillStartPage={store.prefillStartPage}
            />
          )}

          {store.mode === "end" && store.targetSessionId && (
            <RecordEndStep
              sessionId={store.targetSessionId}
              selectedBook={store.selectedBook}
              prefillEndPage={store.prefillEndPage}
              onSavedRequestDetail={(sessionId) =>
                store.openDetail(sessionId, { book: store.selectedBook })
              }
            />
          )}

          {store.mode === "detail" && (
            <RecordDetailStep
              sessionId={store.targetSessionId}
              selectedBook={store.selectedBook}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
