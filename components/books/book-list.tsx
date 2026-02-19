"use client";

import { BookCard } from "./book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { BookListSkeleton } from "@/components/ui/skeletons";
import { BookOpen } from "lucide-react";
import type { BookWithUserBook } from "@/types/book";
import type { UserBook, ReadingStatus } from "@/types/book";
import { grids } from "@/lib/design-tokens";
import { useTranslation } from "@/lib/i18n";

interface RelatedBookPreview {
  userBookId: string;
  coverImageUrl: string | null;
  title: string;
}

interface BookListProps {
  books: Array<{
    id: string;
    status: ReadingStatus;
    books: {
      id: string;
      isbn: string | null;
      title: string;
      author: string | null;
      publisher: string | null;
      published_date: string | null;
      cover_image_url: string | null;
    };
    groupBooks?: Array<{
      group_id: string;
      group_name: string;
      group_leader_id: string;
    }>;
    relatedBooks?: RelatedBookPreview[];
  }>;
  isLoading?: boolean;
  isSample?: boolean;
}

/**
 * 책 목록 컴포넌트
 * 그리드 형태로 책 카드들을 표시
 */
export function BookList({ books, isLoading, isSample = false }: BookListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <BookListSkeleton count={10} />;
  }

  if (books.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("books.noBooksTitle")}
        description={t("books.noBooksDesc")}
        variant="encouraging"
        action={{
          label: t("books.addBookAction"),
          href: "/books/search",
        }}
      />
    );
  }

  return (
    <div className={grids.bookList}>
      {books.map((userBook) => {
        // userBook.id 검증
        if (!userBook.id || typeof userBook.id !== 'string' || userBook.id.trim() === '') {
          console.error('BookList: userBook.id가 유효하지 않습니다.', { userBook });
          return null;
        }
        
        return (
          <BookCard
            key={userBook.id}
            book={userBook.books as BookWithUserBook}
            userBookId={userBook.id}
            status={userBook.status}
            groupBooks={userBook.groupBooks}
            relatedBooks={userBook.relatedBooks}
            isSample={isSample}
          />
        );
      })}
    </div>
  );
}

