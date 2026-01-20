import { BookCard } from "./book-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import type { BookWithUserBook } from "@/types/book";
import type { UserBook, ReadingStatus } from "@/types/book";

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
  }>;
  isLoading?: boolean;
  isSample?: boolean;
}

/**
 * 책 목록 컴포넌트
 * 그리드 형태로 책 카드들을 표시
 */
export function BookList({ books, isLoading, isSample = false }: BookListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">등록된 책이 없습니다</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            첫 번째 책을 추가하고 독서 여정을 시작해보세요!
          </p>
        </div>
        <Button asChild className="mt-4">
          <Link href="/books/search">
            <Plus className="mr-2 h-4 w-4" />
            책 추가하기
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
            isSample={isSample}
          />
        );
      })}
    </div>
  );
}

