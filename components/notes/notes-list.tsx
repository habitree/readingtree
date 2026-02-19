import { NoteList } from "./note-list";
import { getNotes } from "@/app/actions/notes";

interface NotesListProps {
  bookId: string;
}

/**
 * 책별 기록 목록 컴포넌트
 */
export async function NotesList({ bookId }: NotesListProps) {
  const notes = await getNotes(bookId);

  return <NoteList notes={notes as any} bookId={bookId} />;
}
