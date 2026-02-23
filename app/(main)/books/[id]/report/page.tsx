import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cached";
import { getBookDetail } from "@/app/actions/books";
import { getNotes } from "@/app/actions/notes";
import { ReadingReportContent } from "@/components/books/reading-report-content";
import type { Metadata } from "next";

const MIN_NOTES = 3;

interface ReportPageProps {
  params: { id: string };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const resolvedParams = await params;
  const userBookId = resolvedParams.id;

  // 인증 확인
  const user = await getCachedCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // 책 정보 조회
  let bookDetail;
  try {
    bookDetail = await getBookDetail(userBookId, user);
  } catch {
    redirect(`/books/${userBookId}`);
  }

  const book = bookDetail.books as Record<string, unknown>;

  // 노트 수 조회
  const notes = await getNotes(userBookId, undefined, user, false);
  if (notes.length < MIN_NOTES) {
    redirect(`/books/${userBookId}`);
  }

  return (
    <ReadingReportContent
      userBookId={userBookId}
      bookTitle={book.title as string}
      noteCount={notes.length}
    />
  );
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  try {
    const user = await getCachedCurrentUser();
    if (!user) return { title: "AI 리포트 | ReadTree" };

    const bookDetail = await getBookDetail(bookId, user);
    const book = bookDetail.books as Record<string, unknown>;
    return {
      title: `AI 리포트 - ${book.title} | ReadTree`,
    };
  } catch {
    return { title: "AI 리포트 | ReadTree" };
  }
}
