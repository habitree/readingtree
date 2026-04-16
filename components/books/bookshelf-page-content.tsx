import { BookList } from "@/components/books/book-list";
import { BookTable } from "@/components/books/book-table";
import { BookListView } from "@/components/books/book-list-view";
import { BookStatsCards } from "@/components/books/book-stats-cards";
import { BookSearchInput } from "@/components/books/book-search-input";
import { ViewModeToggle } from "@/components/books/view-mode-toggle";
import { StatusFilter } from "@/components/books/status-filter";
import { SortSelect } from "@/components/books/sort-select";
import { getUserBooksWithNotes, type BookStats } from "@/app/actions/books";
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

// 공통 책 데이터 타입
interface BookDataResult {
  books: any[];
  stats: BookStats;
  isSample: boolean;
}

/**
 * 서재 페이지 공통 컨텐츠 컴포넌트
 * 내 서재와 서재 개별 페이지에서 공통으로 사용
 *
 * 성능 최적화: 데이터를 한 번만 조회하여 모든 하위 컴포넌트에 전달
 */
export async function BookshelfPageContent({
  status,
  query,
  view,
  user,
  bookshelfId,
  isGuest = false,
}: BookshelfPageContentProps) {
  // 데이터 한 번만 조회 (중복 호출 제거)
  const bookData = await fetchBookData(status, query, user, bookshelfId, isGuest);

  return (
    <>
      {/* 통계 카드 - 조회된 데이터에서 stats 사용 */}
      <BookStatsCards stats={bookData.stats} />

      {/* 필터 및 검색 - 모바일에서 상단 고정 */}
      <div className="sticky top-12 sm:top-14 z-30 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 bg-background/95 backdrop-blur-sm border-b lg:relative lg:top-0 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-b-0">
        <div className="space-y-2 sm:space-y-0">
          {/* 모바일: 검색 전체 너비 + 필터 아래 행 / 데스크톱: 한 줄 */}
          <div className="sm:flex sm:items-center sm:gap-2">
            {/* 검색 입력 */}
            <div className="sm:flex-1 sm:min-w-0">
              <BookSearchInput />
            </div>
            {/* 필터 및 뷰 토글 */}
            <div className="flex items-center gap-1 mt-2 sm:mt-0 shrink-0">
              <SortSelect />
              <StatusFilter currentStatus={status} />
              {!isGuest && <ViewModeToggle />}
            </div>
          </div>
        </div>
      </div>

      {/* 책 목록 (그리드 또는 테이블/리스트) */}
      {/* 모바일에서는 리스트 뷰, 데스크톱에서는 테이블 뷰 */}
      {view === "table" && !isGuest ? (
        <>
          {/* 테이블 뷰: 모바일에서는 리스트 뷰, 데스크톱에서는 테이블 뷰 */}
          <div className="lg:hidden">
            <BooksListViewRenderer booksData={bookData.books} />
          </div>
          <div className="hidden lg:block">
            <BooksTableRenderer booksData={bookData.books} />
          </div>
        </>
      ) : (
        /* 그리드 뷰 또는 게스트 사용자 */
        <BooksListRenderer booksData={bookData.books} isSample={bookData.isSample} />
      )}
    </>
  );
}

/**
 * 데이터 조회 함수 - 한 번만 호출하여 stats와 books 모두 반환
 */
async function fetchBookData(
  status?: ReadingStatus,
  query?: string,
  user?: any,
  bookshelfId?: string,
  isGuest?: boolean
): Promise<BookDataResult> {
  const defaultStats: BookStats = {
    total: 0,
    reading: 0,
    completed: 0,
    paused: 0,
    not_started: 0,
    rereading: 0,
  };

  try {
    if (isGuest || !user) {
      // 게스트 사용자: 샘플 데이터 조회
      if (bookshelfId) {
        const { books, stats } = await getSampleBookshelfBooks(bookshelfId, status, query);
        return { books: books || [], stats: stats || defaultStats, isSample: true };
      }
      const { books, stats } = await getSampleBooksWithNotes(status, query);
      return { books: books || [], stats: stats || defaultStats, isSample: true };
    }

    // 인증된 사용자: 실제 데이터 조회
    const { books, stats } = await getUserBooksWithNotes(status, query, user, bookshelfId);
    return { books: books || [], stats: stats || defaultStats, isSample: false };
  } catch (error) {
    console.error("fetchBookData 오류:", error);
    return { books: [], stats: defaultStats, isSample: false };
  }
}

/**
 * 테이블 뷰 렌더러 (데이터를 props로 받음)
 */
function BooksTableRenderer({ booksData }: { booksData: any[] }) {
  return <BookTable books={booksData} />;
}

/**
 * 그리드 뷰 렌더러 (데이터를 props로 받음)
 */
function BooksListRenderer({ booksData, isSample = false }: { booksData: any[]; isSample?: boolean }) {
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
      relatedBooks: item.relatedBooks || [],
    }));

  return <BookList books={books} isSample={isSample} />;
}

/**
 * 모바일용 리스트 뷰 렌더러 (데이터를 props로 받음)
 */
function BooksListViewRenderer({ booksData }: { booksData: any[] }) {
  // BookListView 컴포넌트가 기대하는 형태로 변환
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
      },
      groupBooks: item.groupBooks || [],
    }));

  return <BookListView books={books} />;
}
