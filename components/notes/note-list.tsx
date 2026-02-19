"use client";

import { NoteCard } from "./note-card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteListSkeleton } from "@/components/ui/skeletons";
import { FileText } from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import { grids } from "@/lib/design-tokens";
import { useTranslation } from "@/lib/i18n";

interface NoteListProps {
  notes: NoteWithBook[];
  isLoading?: boolean;
  excludeProgress?: boolean;  // progress 타입 제외 옵션
  bookId?: string;  // 책별 기록 목록일 때 빈 상태 링크용
}

/**
 * 기록 목록 컴포넌트
 */
export function NoteList({ notes, isLoading, excludeProgress = false, bookId }: NoteListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <NoteListSkeleton count={6} />;
  }

  // excludeProgress가 true이면 progress 타입 제외
  const filteredNotes = excludeProgress
    ? notes.filter(n => n.type !== "progress")
    : notes;

  if (filteredNotes.length === 0) {
    const href = bookId ? `/notes/new?bookId=${bookId}` : "/notes/new";
    return (
      <EmptyState
        icon={FileText}
        title={t("notes.noNotesForBook")}
        description={bookId ? t("notes.noNotesForBookDesc") : t("notes.noNotesStartJourney")}
        variant="encouraging"
        action={{
          label: bookId ? t("notes.addNote") : t("notes.startWriting"),
          href,
        }}
        actionVariant={bookId ? "outline" : undefined}
      />
    );
  }

  return (
    <div className={grids.noteList}>
      {filteredNotes.map((note) => (
        <NoteCard key={note.id} note={note} showDeleteButton={true} />
      ))}
    </div>
  );
}
