import { getNotes } from "@/app/actions/notes";
import { getCurrentUser } from "@/app/actions/auth";
import type { NoteWithBook } from "@/types/note";
import { RecentNotesUI } from "./recent-notes-ui";

/**
 * 최근 노트 섹션 (Streaming SSR)
 */
export async function RecentNotesSection() {
  const user = await getCurrentUser();
  const notes = await getNotes(undefined, undefined, user);
  const recentNotes = (notes as NoteWithBook[]).slice(0, 5);

  return (
    <RecentNotesUI notes={recentNotes} />
  );
}
