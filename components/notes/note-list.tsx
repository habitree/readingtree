import { NoteCard } from "./note-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import type { NoteWithBook } from "@/types/note";

interface NoteListProps {
  notes: NoteWithBook[];
  isLoading?: boolean;
}

/**
 * 기록 목록 컴포넌트
 */
export function NoteList({ notes, isLoading }: NoteListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-lg">
            <div className="flex gap-3">
              <Skeleton className="h-[88px] w-16 sm:w-20 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} showDeleteButton={true} />
      ))}
    </div>
  );
}
