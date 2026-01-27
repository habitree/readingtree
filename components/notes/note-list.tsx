import { NoteCard } from "./note-card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteListSkeleton } from "@/components/ui/skeletons";
import { FileText } from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import { grids } from "@/lib/design-tokens";

interface NoteListProps {
  notes: NoteWithBook[];
  isLoading?: boolean;
}

/**
 * 기록 목록 컴포넌트
 */
export function NoteList({ notes, isLoading }: NoteListProps) {
  if (isLoading) {
    return <NoteListSkeleton count={6} />;
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="기록이 없습니다"
        description="첫 번째 기록을 작성하고 독서 여정을 시작해보세요!"
        variant="encouraging"
        action={{
          label: "기록 작성하기",
          href: "/notes/new",
        }}
      />
    );
  }

  return (
    <div className={grids.noteList}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} showDeleteButton={true} />
      ))}
    </div>
  );
}
