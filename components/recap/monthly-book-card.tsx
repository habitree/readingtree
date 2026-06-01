"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatReadingTime } from "@/lib/recap/text";
import type { MonthlyBookItem } from "@/app/actions/recap/types";

interface MonthlyBookCardProps {
  book: MonthlyBookItem;
  className?: string;
}

/**
 * 월간 대시보드 책 한 권 카드 (프리미엄).
 * 표지(3:4) + 완독 리본 + 제목·저자 + 메타 칩(기록·시간·페이지) + 발췌.
 * 전체 카드가 /books/{userBookId}로 링크.
 */
export function MonthlyBookCard({ book, className }: MonthlyBookCardProps) {
  return (
    <Link
      href={`/books/${book.userBookId}`}
      className={cn(
        "group flex flex-col gap-2 rounded-xl p-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/40",
        className,
      )}
    >
      {/* 표지 */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-stone-200 shadow-md transition-shadow group-hover:shadow-lg dark:bg-stone-800">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-stone-400" />
          </div>
        )}

        {/* 완독 리본 */}
        {book.completedInMonth && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
            완독
          </div>
        )}

        {/* 진행률 바 (읽는 중) */}
        {!book.completedInMonth && book.progressPercent != null && book.progressPercent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
            <div className="h-full bg-emerald-400" style={{ width: `${book.progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="min-w-0 px-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-800 dark:text-stone-100">
          {book.title}
        </p>
        {book.author && <p className="mt-0.5 line-clamp-1 text-xs text-stone-400">{book.author}</p>}

        {/* 메타 칩 */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-500">
          {book.noteCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <PenLine className="h-3 w-3 text-emerald-600" />
              {book.noteCount}
            </span>
          )}
          {book.readingSeconds > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3 text-emerald-600" />
              {formatReadingTime(book.readingSeconds)}
            </span>
          )}
          {book.pagesRead > 0 && <span className="tabular-nums">{book.pagesRead}p</span>}
        </div>

        {/* 발췌 */}
        {book.excerpt && (
          <p className="mt-1.5 line-clamp-2 border-l-2 border-emerald-200 pl-2 text-[11px] italic leading-relaxed text-stone-500 dark:text-stone-400">
            {book.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
