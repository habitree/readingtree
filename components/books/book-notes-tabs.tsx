"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteList } from "@/components/notes/note-list";
import { ReadingJourney } from "./reading-journey";
import { ReadingTimeTab } from "./reading-time-tab";
import { BookEmptyOnboarding } from "./book-empty-onboarding";
import { Map, FileText, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { NoteWithBook } from "@/types/note";

interface BookNotesTabsProps {
  userBookId: string;
  notes: NoteWithBook[];
  startedAt: string;
  completedDates: string[];
  status: string;
  currentPage: number;
  totalPages: number | null;
}

/**
 * 책 상세 페이지의 기록 탭 컴포넌트
 * "독서 기록" + "독서 여정" + "독서 시간" 3탭 구성
 */
export function BookNotesTabs({
  userBookId,
  notes,
  startedAt,
  completedDates,
  status,
  currentPage,
  totalPages,
}: BookNotesTabsProps) {
  const { t } = useTranslation();
  const progressNotes = notes.filter((n) => n.type === "progress");
  const detailNotesCount = notes.filter((n) => n.type !== "progress").length;

  const detailNotes = notes.filter((n) => n.type !== "progress");
  const totalCount = notes.length;

  if (totalCount === 0) {
    return <BookEmptyOnboarding userBookId={userBookId} />;
  }

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="notes" className="flex items-center gap-1 text-xs sm:text-sm">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{t("books.detailedRecords")}</span>
          <span className="sm:hidden">기록</span>
          {detailNotesCount > 0 && (
            <span className="ml-0.5 text-[11px] bg-muted-foreground/20 text-muted-foreground px-1 py-0.5 rounded-full">
              {detailNotesCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="journey" className="flex items-center gap-1 text-xs sm:text-sm">
          <Map className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">독서 여정</span>
          <span className="sm:hidden">여정</span>
          {totalCount > 0 && (
            <span className="ml-0.5 text-[11px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="time" className="flex items-center gap-1 text-xs sm:text-sm">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">독서 시간</span>
          <span className="sm:hidden">시간</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        <NoteList notes={notes} excludeProgress={true} />
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

      <TabsContent value="time">
        <ReadingTimeTab userBookId={userBookId} />
      </TabsContent>
    </Tabs>
  );
}
