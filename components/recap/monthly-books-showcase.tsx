"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthlyBooksHero } from "./monthly-books-hero";
import { MonthlyBookCard } from "./monthly-book-card";
import type { MonthlyBooksResult } from "@/app/actions/recap/types";

interface MonthlyBooksShowcaseProps {
  result: MonthlyBooksResult;
  /** preview = /stats 결산 임베드(표지 한 줄 + 전체보기), full = 전용 페이지 상세 그리드 */
  variant: "preview" | "full";
  /** 전체 보기 링크 대상 (YYYY-MM) */
  yearMonth: string;
  className?: string;
}

export function MonthlyBooksShowcase({ result, variant, yearMonth, className }: MonthlyBooksShowcaseProps) {
  if (result.totalBooks === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={`${result.month}월에 읽은 책이 아직 없어요`}
        description="책을 읽고 기록을 남기면 이 달의 책장이 채워져요."
        variant="encouraging"
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <MonthlyBooksHero
        year={result.year}
        month={result.month}
        totalBooks={result.totalBooks}
        completedCount={result.completedCount}
        totalReadingSeconds={result.totalReadingSeconds}
        books={result.books}
      />

      {variant === "preview" ? (
        <PreviewRow result={result} yearMonth={yearMonth} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {result.books.map((book) => (
            <MonthlyBookCard key={book.bookId} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

/** preview: 표지 한 줄(첫 6장) + "전체 N권 보기" 링크 */
function PreviewRow({ result, yearMonth }: { result: MonthlyBooksResult; yearMonth: string }) {
  const preview = result.books.slice(0, 6);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">이달 읽은 책</p>
        <Link
          href={`/recap/${yearMonth}`}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          전체 {result.totalBooks}권 보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Link href={`/recap/${yearMonth}`} className="flex gap-2 overflow-hidden">
        {preview.map((b) => (
          <div
            key={b.bookId}
            className="relative aspect-[3/4] w-[15%] min-w-[56px] flex-shrink-0 overflow-hidden rounded-md bg-stone-200 shadow-sm transition-shadow hover:shadow-md dark:bg-stone-800"
          >
            {b.coverImageUrl ? (
              <Image src={b.coverImageUrl} alt={b.title} fill sizes="80px" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-5 w-5 text-stone-400" />
              </div>
            )}
            {b.completedInMonth && (
              <div className="absolute inset-x-0 bottom-0 bg-emerald-500/90 py-0.5 text-center text-[8px] font-bold text-white">
                완독
              </div>
            )}
          </div>
        ))}
        {result.totalBooks > preview.length && (
          <div className="flex aspect-[3/4] w-[15%] min-w-[56px] flex-shrink-0 items-center justify-center rounded-md bg-stone-100 text-xs font-bold text-stone-500 dark:bg-stone-800">
            +{result.totalBooks - preview.length}
          </div>
        )}
      </Link>
    </div>
  );
}
