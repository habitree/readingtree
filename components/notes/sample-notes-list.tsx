import { NoteCard } from "./note-card";
import { getSampleNotes } from "@/app/actions/sample";
import { FileText } from "lucide-react";

interface SampleNotesListProps {
  bookId: string;
}

/**
 * 샘플 책별 기록 목록 컴포넌트 (읽기 전용)
 * 비로그인 사용자에게 샘플 데이터 표시
 */
export async function SampleNotesList({ bookId }: SampleNotesListProps) {
  const notes = await getSampleNotes(bookId);

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <p className="text-muted-foreground">아직 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note as any}
          showDeleteButton={false}
        />
      ))}
    </div>
  );
}
