import { Metadata } from "next";
import { NoteFormNew } from "@/components/notes/note-form-new";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
 */
export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const bookId = resolvedSearchParams.bookId;
  const isQuickstart = resolvedSearchParams.quickstart === "true";

  // quickstart 모드: 책 없이 바로 폼 표시
  if (isQuickstart && !bookId) {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) {
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

  // bookId 검증 (한 번에 처리)
  if (!bookId || typeof bookId !== 'string' || !isValidUUID(bookId)) {
    redirect("/books");
  }

  // Supabase 클라이언트 생성 (한 번만)
  const supabase = await createServerSupabaseClient();

  // 사용자 정보와 책 소유 확인을 병렬로 처리
  const [userResult, userBookResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("user_books")
      .select("id, user_id")
      .eq("id", bookId)
      .maybeSingle(),
  ]);

  // 사용자 확인
  const user = userResult.data?.user;
  if (!user || userResult.error) {
    redirect("/login");
  }

  // 책 소유 확인
  const userBook = userBookResult.data;
  if (!userBook || userBookResult.error || userBook.user_id !== user.id) {
    redirect("/books");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="notes.writeNotePageTitle"
        descriptionKey="notes.writeNotePageDesc"
      />
      <NoteFormNew bookId={bookId} />
    </div>
  );
}
