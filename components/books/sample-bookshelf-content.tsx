import { Suspense } from "react";
import { BookList } from "@/components/books/book-list";
import { BookStatsCards } from "@/components/books/book-stats-cards";
import { BookSearchInput } from "@/components/books/book-search-input";
import { StatusFilter } from "@/components/books/status-filter";
import { getSampleBooksWithNotes } from "@/app/actions/sample";
import type { ReadingStatus } from "@/types/book";

interface SampleBookshelfContentProps {
  status?: ReadingStatus;
  query?: string;
}

/**
 * 샘플 서재 컨텐츠 컴포넌트
 * 샘플 사용자의 책 목록을 읽기 전용으로 표시
 */
export function SampleBookshelfContent({
  status,
  query,
}: SampleBookshelfContentProps) {
  return (
    <>
      {/* 통계 카드 */}
      <Suspense fallback={<div className="h-32" />}>
        <SampleBookshelfStats status={status} query={query} />
      </Suspense>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <BookSearchInput basePath="/sample" />
        </div>
        <div className="flex items-center gap-4">
          <StatusFilter currentStatus={status} basePath="/sample" />
        </div>
      </div>

      {/* 책 목록 (그리드 뷰만 지원) */}
      <Suspense fallback={<BookList books={[]} isLoading />}>
        <SampleBooksListGrid status={status} query={query} />
      </Suspense>
    </>
  );
}

async function SampleBookshelfStats({
  status,
  query,
}: {
  status?: ReadingStatus;
  query?: string;
}) {
  try {
    const { stats } = await getSampleBooksWithNotes(status, query);
    return <BookStatsCards stats={stats} />;
  } catch (error) {
    console.error("SampleBookshelfStats 오류:", error);
    return null;
  }
}

async function SampleBooksListGrid({
  status,
  query,
}: {
  status?: ReadingStatus;
  query?: string;
}) {
  try {
    const { books: booksData } = await getSampleBooksWithNotes(status, query);

    // BookList 컴포넌트가 기대하는 형태로 변환
    const books = booksData
      .filter((item) => item.books && item.books.id)
      .map((item) => ({
        id: item.id,
        status: item.status,
        books: {
          id: item.books.id,
          title: item.books.title,
          author: item.books.author,
          publisher: item.books.publisher,
          isbn: item.books.isbn,
          cover_image_url: item.books.cover_image_url,
          published_date: item.books.published_date || null,
          created_at: item.books.created_at || "",
          updated_at: item.books.updated_at || "",
        },
        groupBooks: item.groupBooks || [],
      }));

    return <BookList books={books} isSample />;
  } catch (error) {
    console.error("SampleBooksListGrid 렌더링 오류:", error);
    return <BookList books={[]} />;
  }
}
