import { Metadata } from "next";
import { NoteFormNew } from "@/components/notes/note-form-new";
import { NoteCreationFlow } from "@/components/notes/note-creation-flow";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/app/actions/auth";
import { isValidUUID } from "@/lib/utils/validation";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "기록 작성 | ReadTree",
  description: "새로운 독서 기록을 작성하세요",
};

interface NewNotePageProps {
  searchParams: Promise<{
    bookId?: string;
    quickstart?: string;
  }> | {
    bookId?: string;
    quickstart?: string;
  };
}

/**
 * 기록 작성 페이지
 * - bookId 있으면 책 연결 기록
 * - quickstart=true 이면 책 없이 바로 폼 표시
 * - 둘 다 없으면 책 선택 통합 플로우 표시
 */
export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const bookId = resolvedSearchParams.bookId;
  const isQuickstart = resolvedSearchParams.quickstart === "true";

  // quickstart 모드: 책 없이 바로 폼 표시
  if (isQuickstart && !bookId) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }

    return (
      <div className="space-y-6">
        <PageHeader
          titleKey="notes.freeNote"
          descriptionKey="onboarding.firstNoteDescription"
        />
        <NoteFormNew />
      </div>
    );
  }

  // bookId 없으면 통합 플로우 표시 (리다이렉트 대신)
  if (!bookId || typeof bookId !== 'string' || !isValidUUID(bookId)) {
    return <NoteCreationFlow />;
  }

  // 사용자 확인
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Supabase 클라이언트 생성
  const supabase = await createServerSupabaseClient();

  // 1차: user_books.id로 직접 조회
  const { data: userBookDirect } = await supabase
    .from("user_books")
    .select("id, user_id")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .maybeSingle();

  let resolvedUserBookId = userBookDirect?.id;

  // 2차: 못 찾으면 books.id → user_books.book_id로 조회 (그룹 지정도서 등)
  if (!resolvedUserBookId) {
    const { data: userBookByBook } = await supabase
      .from("user_books")
      .select("id, user_id")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .maybeSingle();

    resolvedUserBookId = userBookByBook?.id;
  }

  if (!resolvedUserBookId) {
    redirect("/books");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="notes.writeNotePageTitle"
        descriptionKey="notes.writeNotePageDesc"
      />
      <NoteFormNew bookId={resolvedUserBookId} />
    </div>
  );
}
