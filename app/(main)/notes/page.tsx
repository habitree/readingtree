import { Suspense } from "react";
import { Metadata } from "next";
import { NoteList } from "@/components/notes/note-list";
import { getNotes } from "@/app/actions/notes";
import { getCurrentUser } from "@/app/actions/auth";
import type { NoteType } from "@/types/note";
import { typography } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "기록 목록 | ReadTree",
  description: "내가 작성한 모든 기록을 확인하세요",
};

interface NotesPageProps {
  searchParams: {
    type?: string;
    bookId?: string;
  };
}

/**
 * 기록 목록 페이지
 */
export default async function NotesPage({ searchParams }: NotesPageProps) {
  const type = searchParams.type as NoteType | undefined;
  const bookId = searchParams.bookId;
  // 서버에서 사용자 정보 조회 (쿠키 기반 세션)
  const user = await getCurrentUser();
  const isGuest = !user;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className={typography.pageTitle}>
          기록 목록
        </h1>
        <p className={typography.pageDescription}>
          내가 작성한 모든 기록을 확인하세요
        </p>
      </div>

      <Suspense fallback={<NoteList notes={[]} isLoading />}>
        <NotesList type={type} bookId={bookId} />
      </Suspense>
    </div>
  );
}

async function NotesList({
  type,
  bookId,
}: {
  type?: NoteType;
  bookId?: string;
}) {
  const notes = await getNotes(bookId, type);

  return <NoteList notes={notes as any} />;
}

