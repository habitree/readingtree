import { Suspense } from "react";
import { BookList } from "@/components/books/book-list";
import { BookTable } from "@/components/books/book-table";
import { BookListView } from "@/components/books/book-list-view";
import { BookStatsCards } from "@/components/books/book-stats-cards";
import { BookSearchInput } from "@/components/books/book-search-input";
import { ViewModeToggle } from "@/components/books/view-mode-toggle";
import { StatusFilter } from "@/components/books/status-filter";
import { getUserBooksWithNotes } from "@/app/actions/books";
import { getSampleBooksWithNotes, getSampleBookshelfBooks } from "@/app/actions/sample";
import type { ReadingStatus } from "@/types/book";

interface BookshelfPageContentProps {
  status?: ReadingStatus;
  query?: string;
  view: "grid" | "table";
  user?: any;
  bookshelfId?: string;
  isGuest?: boolean;
}

/**
 * 서재 페이지 공통 컨텐츠 컴포넌트
 * 내 서재와 서재 개별 페이지에서 공통으로 사용
 */
export function BookshelfPageContent({
  status,
  query,
  view,
  user,
  bookshelfId,
  isGuest = false,
}: BookshelfPageContentProps) {
  return (
    <>
      {/* 통계 카드 - 게스트도 샘플 통계 표시 */}
      <Suspense fallback={<div className="h-32" />}>
        <BookshelfStats status={status} query={query} user={user} bookshelfId={bookshelfId} isGuest={isGuest} />
      </Suspense>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <BookSearchInput />
        </div>
        <div className="flex items-center gap-4">
          <StatusFilter currentStatus={status} />
          {!isGuest && <ViewModeToggle />}
        </div>
      </div>

      {/* 책 목록 (그리드 또는 테이블/리스트) */}
      {/* 모바일에서는 리스트 뷰, 데스크톱에서는 테이블 뷰 */}
      <Suspense fallback={<BookList books={[]} isLoading />}>
        {view === "table" && !isGuest ? (
          <>
            {/* 테이블 뷰: 모바일에서는 리스트 뷰, 데스크톱에서는 테이블 뷰 */}
            <div className="lg:hidden">
              <BooksListViewContent status={status} query={query} user={user} bookshelfId={bookshelfId} />
            </div>
            <div className="hidden lg:block">
              <BooksTableContent status={status} query={query} user={user} bookshelfId={bookshelfId} />
            </div>
          </>
        ) : (
          /* 그리드 뷰 또는 게스트 사용자 */
          <BooksListGrid status={status} query={query} user={user} bookshelfId={bookshelfId} />
        )}
      </Suspense>
    </>
  );
}

async function BookshelfStats({
  status,
  query,
  user,
  bookshelfId,
  isGuest = false,
}: {
  status?: ReadingStatus;
  query?: string;
  user?: any;
  bookshelfId?: string;
  isGuest?: boolean;
}) {
  try {
    if (isGuest || !user) {
      // 게스트 사용자: 샘플 데이터 통계
      if (bookshelfId) {
        // 특정 서재의 샘플 통계
        const { stats } = await getSampleBookshelfBooks(bookshelfId, status, query);
        return <BookStatsCards stats={stats} />;
      }
      const { stats } = await getSampleBooksWithNotes(status, query);
      return <BookStatsCards stats={stats} />;
    }
    const { stats } = await getUserBooksWithNotes(status, query, user, bookshelfId);
    return <BookStatsCards stats={stats} />;
  } catch (error) {
    console.error("BookshelfStats 오류:", error);
    return null;
  }
}

async function BooksTableContent({
  status,
  query,
  user,
  bookshelfId,
}: {
  status?: ReadingStatus;
  query?: string;
  user?: any;
  bookshelfId?: string;
}) {
  try {
    const { books } = await getUserBooksWithNotes(status, query, user, bookshelfId);
    return <BookTable books={books} />;
  } catch (error) {
    console.error("BooksTableContent 오류:", error);
    return <BookTable books={[]} />;
  }
}

async function BooksListGrid({
  status,
  query,
  user,
  bookshelfId,
}: {
  status?: ReadingStatus;
  query?: string;
  user?: any;
  bookshelfId?: string;
}) {
  try {
    let booksData: any[] = [];
    let isSample = false;

    if (!user) {
      // 게스트 사용자: 관리자(샘플) 데이터 조회
      try {
        if (bookshelfId) {
          // 특정 서재의 샘플 책 목록
          const { books: sampleBooks } = await getSampleBookshelfBooks(bookshelfId, status, query);
          booksData = sampleBooks || [];
        } else {
          const { books: sampleBooks } = await getSampleBooksWithNotes(status, query);
          booksData = sampleBooks || [];
        }
        isSample = true;
      } catch (error) {
        console.error("BooksListGrid: getSampleBooks 오류:", error);
        booksData = [];
      }
    } else {
      // 인증된 사용자: 기록 정보 포함 조회
      try {
        const { books: booksWithNotes } = await getUserBooksWithNotes(status, query, user, bookshelfId);
        booksData = booksWithNotes || [];
      } catch (error) {
        console.error("BooksListGrid: getUserBooksWithNotes 오류:", error);
        booksData = [];
      }
    }

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

    return <BookList books={books} isSample={isSample} />;
  } catch (error) {
    console.error("BooksListGrid 렌더링 오류:", error);
    return <BookList books={[]} />;
  }
}

/**
 * 모바일용 리스트 뷰 (테이블 뷰의 모바일 대체)
 */
async function BooksListViewContent({
  status,
  query,
  user,
  bookshelfId,
}: {
  status?: ReadingStatus;
  query?: string;
  user?: any;
  bookshelfId?: string;
}) {
  try {
    const { books: booksData } = await getUserBooksWithNotes(status, query, user, bookshelfId);

    // BookListView 컴포넌트가 기대하는 형태로 변환
    const books = (booksData || [])
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
        },
        groupBooks: item.groupBooks || [],
      }));

    return <BookListView books={books} />;
  } catch (error) {
    console.error("BooksListViewContent 오류:", error);
    return <BookListView books={[]} />;
  }
}
