"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { BookOpen, Loader2, Check, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { addBook } from "@/app/actions/books";
import type { PopularBook } from "@/app/actions/books";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PopularBooksWidgetProps {
  books: PopularBook[];
}

/**
 * 인기 도서 위젯
 * 책 0권 사용자에게 대시보드에 표시하여 Cold Start 해소
 */
export function PopularBooksWidget({ books }: PopularBooksWidgetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [addingBookId, setAddingBookId] = useState<string | null>(null);
  const [addedBookIds, setAddedBookIds] = useState<Set<string>>(new Set());

  if (books.length === 0) return null;

  const handleWantToRead = async (book: PopularBook) => {
    if (addedBookIds.has(book.bookId)) return;
    setAddingBookId(book.bookId);
    try {
      await addBook(
        {
          title: book.title,
          author: book.author,
          cover_image_url: book.coverImageUrl,
          isbn: book.isbn,
        },
        "not_started"
      );
      setAddedBookIds((prev) => new Set(prev).add(book.bookId));
      toast.success(t("dashboard.wantToReadAdded"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setAddingBookId(null);
    }
  };

  return (
    <Card className="p-4 sm:p-5 border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {t("dashboard.popularBooksTitle")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("dashboard.popularBooksDesc")}
        </p>
      </div>

      {/* 가로 스크롤 리스트 */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {books.map((book) => {
          const isAdding = addingBookId === book.bookId;
          const isAdded = addedBookIds.has(book.bookId);

          return (
            <div key={book.bookId} className="shrink-0 w-28 flex flex-col items-center text-center">
              {/* 책 표지 */}
              <Link href="/books/search" className="block relative w-20 h-28 rounded-lg overflow-hidden shadow-sm mb-2 hover:shadow-md transition-shadow">
                {book.coverImageUrl ? (
                  <Image
                    src={book.coverImageUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800 dark:to-forest-900 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-forest-500" />
                  </div>
                )}
              </Link>

              {/* 책 제목 */}
              <p className="text-[11px] font-medium text-slate-900 dark:text-white line-clamp-2 leading-tight mb-0.5">
                {book.title}
              </p>

              {/* 독자 수 */}
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mb-1.5">
                <Users className="h-2.5 w-2.5" />
                <span>{t("dashboard.readersCount", { count: book.readerCount })}</span>
              </div>

              {/* 읽고 싶어요 버튼 */}
              <button
                onClick={() => handleWantToRead(book)}
                disabled={isAdding || isAdded}
                className={cn(
                  "w-full py-1 px-2 rounded-md text-[10px] font-medium transition-all",
                  isAdded
                    ? "bg-forest-50 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400 border border-forest-200 dark:border-forest-700"
                    : "bg-forest-600 hover:bg-forest-700 text-white shadow-sm"
                )}
              >
                {isAdding ? (
                  <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                ) : isAdded ? (
                  <span className="flex items-center justify-center gap-0.5">
                    <Check className="h-2.5 w-2.5" />
                    {t("dashboard.wantToReadAdded")}
                  </span>
                ) : (
                  t("dashboard.wantToRead")
                )}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
