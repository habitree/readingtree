"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteList } from "@/components/notes/note-list";
import { ProgressLogList } from "./progress-log-list";
import { FileText, TrendingUp } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

interface BookNotesTabsProps {
  userBookId: string;
  notes: NoteWithBook[];
}

/**
 * 책 상세 페이지의 기록 탭 컴포넌트
 * "상세 기록" 탭과 "진행 로그" 탭으로 분리
 */
export function BookNotesTabs({ userBookId, notes }: BookNotesTabsProps) {
  // progress 타입 제외한 상세 기록 개수
  const detailNotesCount = notes.filter((n) => n.type !== "progress").length;
  // progress 타입만 있는 진행 로그 개수
  const progressNotesCount = notes.filter((n) => n.type === "progress").length;

  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="notes" className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span>상세 기록</span>
          {detailNotesCount > 0 && (
            <span className="ml-1 text-xs bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
              {detailNotesCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" />
          <span>진행 로그</span>
          {progressNotesCount > 0 && (
            <span className="ml-1 text-xs bg-teal-500/20 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full">
              {progressNotesCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notes">
        <NoteList notes={notes} excludeProgress={true} />
      </TabsContent>

      <TabsContent value="progress">
        <ProgressLogList userBookId={userBookId} />
      </TabsContent>
    </Tabs>
  );
}
