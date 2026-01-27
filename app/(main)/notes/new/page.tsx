import { Metadata } from "next";
import { NoteFormNew } from "@/components/notes/note-form-new";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/validation";
import { typography } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "기록 작성 | ReadTree",
  description: "새로운 기록을 작성하세요",
};

interface NewNotePageProps {
  searchParams: Promise<{
    bookId?: string;
  }> | {
    bookId?: string;
  };
}

/**
 * 기록 작성 페이지
 * US-010~US-015: 기록 작성 기능
 * 
 * 성능 최적화:
 * - Supabase 클라이언트 재사용 (중복 생성 방지)
 * - 사용자 정보와 책 소유 확인 병렬 처리
 * - 검증 단계 최적화
 */
export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  // Next.js 15+ 에서 searchParams는 Promise일 수 있음
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const bookId = resolvedSearchParams.bookId;

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
      <div>
        <h1 className={typography.pageTitle}>기록 작성</h1>
        <p className={typography.pageDescription}>
          책에 대한 기록을 작성하세요
        </p>
      </div>

      <NoteFormNew bookId={bookId} />
    </div>
  );
}

