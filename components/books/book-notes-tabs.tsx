"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteList } from "@/components/notes/note-list";
import { ReadingJourney } from "./reading-journey";
import { Map, FileText } from "lucide-react";
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
 * "독서 여정" 탭(기본)과 "독서 기록" 탭으로 구성
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

  return (
    <Tabs defaultValue="journey" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="journey" className="flex items-center gap-1.5">
          <Map className="h-4 w-4" />
          <span>독서 여정</span>
          {progressNotes.length > 0 && (
            <span className="ml-1 text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              {progressNotes.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span>{t("books.detailedRecords")}</span>
          {detailNotesCount > 0 && (
            <span className="ml-1 text-xs bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
              {detailNotesCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="journey">
        <ReadingJourney
          startedAt={startedAt}
          completedDates={completedDates}
          status={status}
          currentPage={currentPage}
          totalPages={totalPages}
          progressNotes={progressNotes}
        />
      </TabsContent>

      <TabsContent value="notes">
        <NoteList notes={notes} excludeProgress={true} />
      </TabsContent>
    </Tabs>
  );
}
