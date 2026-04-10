"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import { getRelatedBooks, type RelatedBook } from "@/app/actions/book-relations";
import { getImageUrl } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";
import { formatAuthor } from "@/lib/utils/book";

interface RelatedBooksListProps {
  userBookId: string;
  initialBooks?: RelatedBook[];
}

/**
 * 연결된 책 목록 컴포넌트
 * 책 상세 페이지에서 연결된 관련 도서를 표시
 */
export function RelatedBooksList({ userBookId, initialBooks }: RelatedBooksListProps) {
  const { t } = useTranslation();
  const [books, setBooks] = useState<RelatedBook[]>(initialBooks || []);
  const [isLoading, setIsLoading] = useState(!initialBooks);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // initialBooks가 제공된 경우 fetch 스킵
    if (initialBooks) return;

    const loadRelatedBooks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const relatedBooks = await getRelatedBooks(userBookId);
        setBooks(relatedBooks);
      } catch (err) {
        console.error("연결된 책 로드 실패:", err);
        setError(err instanceof Error ? err.message : t("books.relatedBooksLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    loadRelatedBooks();
  }, [userBookId, initialBooks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">{t("books.relatedBooksLoading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t("books.relatedBooksEmpty")}</p>
        <p className="text-xs mt-1">{t("books.relatedBooksEmptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.userBookId}`}
          className="group flex flex-col items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {/* 책 표지 */}
          <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-sm group-hover:shadow-md transition-shadow">
            {book.coverImageUrl ? (
              <Image
                src={getImageUrl(book.coverImageUrl)}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 64px, 80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-slate-400" />
              </div>
            )}
          </div>
          {/* 제목 */}
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-2 line-clamp-2 text-center leading-tight">
            {book.title}
          </span>
          {/* 저자 */}
          {book.author && (
            <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 text-center">
              {formatAuthor(book.author)}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
