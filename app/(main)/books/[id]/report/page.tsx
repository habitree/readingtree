import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cached";
import { getBookDetail } from "@/app/actions/books";
import { getNotes } from "@/app/actions/notes";
import { getSavedReport } from "@/app/actions/ai/report";
import { ReadingReportContent } from "@/components/books/reading-report-content";
import { parseCompletedDates } from "@/lib/utils/multi-reading";
import type { Metadata } from "next";
import type { BookInfoForReport, NoteSummary } from "@/types/ai/report";

const MIN_NOTES = 3;

interface ReportPageProps {
  params: { id: string };
  searchParams: { view?: string };
}

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const userBookId = resolvedParams.id;
  const viewSaved = resolvedSearch.view === "saved";

  // 인증 확인
  const user = await getCachedCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // 책 정보 조회
  let bookDetail: Record<string, unknown>;
  try {
    bookDetail = await getBookDetail(userBookId, user);
  } catch {
    redirect(`/books/${userBookId}`);
  }

  const book = bookDetail.books as Record<string, unknown>;

  // 노트 조회
  const notes = await getNotes(userBookId, undefined, user, false);
  if (notes.length < MIN_NOTES) {
    redirect(`/books/${userBookId}`);
  }

  // 저장된 리포트 조회 (view=saved이거나 항상 메타 확인)
  const savedReport = await getSavedReport(userBookId).catch(() => null);

  // 리포트용 책 정보
  const bookInfo: BookInfoForReport = {
    title: (book.title as string) || "제목 없음",
    author: (book.author as string | null) ?? null,
    coverImageUrl: (book.cover_image_url as string | null) ?? null,
    startedAt: (bookDetail.started_at as string | null) ?? null,
    completedAt: (bookDetail.completed_at as string | null) ?? null,
    status: (bookDetail.status as string) || "reading",
    currentPage: (bookDetail.current_page as number | null) ?? null,
    totalPages: (book.total_pages as number | null) ?? null,
  };

  // 노트 간략 목록
  const noteSummaries: NoteSummary[] = notes.map((note) => ({
    id: note.id,
    type: note.type,
    title: note.title,
    pageNumber: note.page_number,
    createdAt: note.created_at,
  }));

  // view=saved이고 저장된 리포트가 있으면 초기 데이터로 전달
  const initialSavedReport =
    viewSaved && savedReport
      ? {
          markdown: savedReport.reportMarkdown,
          savedAt: savedReport.savedAt,
          shareId: savedReport.shareId,
          isPublic: savedReport.isPublic,
          noteCount: savedReport.noteCount,
        }
      : undefined;

  // 다회독 횟수
  const completedDates = parseCompletedDates(
    (bookDetail as Record<string, unknown>).completed_dates
  );
  const completedCount = completedDates.length;

  return (
    <ReadingReportContent
      userBookId={userBookId}
      bookTitle={bookInfo.title}
      noteCount={notes.length}
      bookInfo={bookInfo}
      noteSummaries={noteSummaries}
      initialSavedReport={initialSavedReport}
      completedCount={completedCount}
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
