import { NoteList } from "./note-list";
import { getNotes } from "@/app/actions/notes";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

interface NotesListProps {
  bookId: string;
}

/**
 * 책별 기록 목록 컴포넌트
 */
export async function NotesList({ bookId }: NotesListProps) {
  const notes = await getNotes(bookId);

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="기록이 없습니다"
        description="이 책에 대한 첫 기록을 남겨보세요"
        variant="encouraging"
        action={{
          label: "기록 추가",
          href: `/notes/new?bookId=${bookId}`,
        }}
        actionVariant="outline"
      />
    );
  }

  return <NoteList notes={notes as any} />;
}
