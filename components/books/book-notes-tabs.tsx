"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteList } from "@/components/notes/note-list";
import { UnifiedRecordFeed } from "@/components/records/unified-record-feed";
import { ReadingJourney } from "./reading-journey";
import { ReadingTimeTab } from "./reading-time-tab";
import { ReadingOverviewPanel } from "./reading-overview-panel";
import { BookEmptyOnboarding } from "./book-empty-onboarding";
import { Map, FileText, Clock } from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import type { UnifiedRecord } from "@/types/unified-record";

interface BookNotesTabsProps {
  userBookId: string;
  notes: NoteWithBook[];
  startedAt: string;
  completedDates: string[];
  status: string;
  currentPage: number;
  totalPages: number | null;
  /**
   * 사진 첨부(스탬프 승격) 시 책 정보 매칭에 사용.
   * 누락 시 attach 시트가 다른 책으로 자동 채워져 책 정보 불일치가 발생함.
   */
  bookInfo?: {
    bookId: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
    totalPages: number | null;
  };
  /** 통합 기록 피드(기록 기획 13) — 제공되면 "기록" 탭을 책-스코프 통합 피드로 승격 */
  unifiedRecords?: UnifiedRecord[] | null;
  unifiedNextCursor?: string | null;
}

/**
 * 책 상세 페이지의 기록 탭 컴포넌트
 * "기록" + "독서 여정" + "독서 시간(스탬프 통합)" 3탭 구성
 *
 * 스탬프는 별도 탭으로 두지 않고 "독서 시간" 탭에서 사진 유무와 무관하게
 * 한 줄로 통합 표시한다. (사진 있는 항목 = 스탬프)
 */
export function BookNotesTabs({
  userBookId,
  notes,
  startedAt,
  completedDates,
  status,
  currentPage,
  totalPages,
  bookInfo,
  unifiedRecords = null,
  unifiedNextCursor = null,
}: BookNotesTabsProps) {
  const showUnified = unifiedRecords != null;
  const progressNotes = notes.filter((n) => n.type === "progress");
  const detailNotesCount = notes.filter((n) => n.type !== "progress").length;

  const detailNotes = notes.filter((n) => n.type !== "progress");
  const totalCount = notes.length;

  if (totalCount === 0) {
    return <BookEmptyOnboarding userBookId={userBookId} />;
  }

  return (
    <Tabs defaultValue="time" className="w-full">
      {/* 3축 통합 요약 (C8) — 시간·진행률·여정 한눈에, 아래 탭이 상세 */}
      <ReadingOverviewPanel
        userBookId={userBookId}
        currentPage={currentPage}
        totalPages={totalPages}
        completedCount={completedDates.length}
        status={status}
        recordsCount={totalCount}
      />
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="time" className="flex items-center gap-1 text-xs sm:text-sm">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>독서 시간</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-1 text-xs sm:text-sm">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>기록</span>
          {detailNotesCount > 0 && (
            <span className="ml-0.5 text-[11px] bg-muted-foreground/20 text-muted-foreground px-1 py-0.5 rounded-full">
              {detailNotesCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="journey" className="flex items-center gap-1 text-xs sm:text-sm">
          <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>여정</span>
          {totalCount > 0 && (
            <span className="ml-0.5 text-[11px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="time">
        <ReadingTimeTab userBookId={userBookId} bookInfo={bookInfo} />
      </TabsContent>

      <TabsContent value="notes">
        {showUnified ? (
          <UnifiedRecordFeed
            initialRecords={unifiedRecords ?? []}
            initialNextCursor={unifiedNextCursor}
            bookId={userBookId}
          />
        ) : (
          <NoteList notes={notes} excludeProgress={true} />
        )}
      </TabsContent>

      <TabsContent value="journey">
        <ReadingJourney
          startedAt={startedAt}
          completedDates={completedDates}
          status={status}
          currentPage={currentPage}
          totalPages={totalPages}
          progressNotes={progressNotes}
          detailNotes={detailNotes}
        />
      </TabsContent>
    </Tabs>
  );
}
