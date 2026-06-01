"use client";

import Image from "next/image";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatReadingTime } from "@/lib/recap/text";
import type { MonthlyBookItem } from "@/app/actions/recap/types";

interface MonthlyBooksHeroProps {
  year: number;
  month: number;
  totalBooks: number;
  completedCount: number;
  totalReadingSeconds: number;
  books: MonthlyBookItem[];
  className?: string;
}

/**
 * "커버 책장 월(wall)" 프리미엄 히어로.
 *
 * 표지들이 책장에 꽂힌 듯 살짝 겹쳐 늘어선 선반 위에 큰 권수 숫자를 얹어
 * "이번 달에 몇 권을 읽었는지"를 가시적으로 표현. 책이 많을수록 선반이 가득 찬다.
 */
export function MonthlyBooksHero({
  year,
  month,
  totalBooks,
  completedCount,
  totalReadingSeconds,
  books,
  className,
}: MonthlyBooksHeroProps) {
  // 표지 있는 책 우선, 최대 12장
  const covers = books.filter((b) => b.coverImageUrl).slice(0, 12);
  const overflow = totalBooks - covers.length;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-stone-900 p-6 text-white shadow-lg",
        className,
      )}
    >
      {/* 은은한 우상단 글로우 */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-200">
          {year}년 {month}월 독서
        </p>

        <div className="mt-2 flex items-end gap-4">
          <div>
            <span className="text-5xl font-bold leading-none tabular-nums">{totalBooks}</span>
            <span className="ml-1.5 text-lg font-semibold text-emerald-100">권</span>
          </div>
          <div className="mb-1 space-y-0.5 text-sm text-emerald-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              완독 {completedCount}권
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-300" />
              {formatReadingTime(totalReadingSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* 책장 월: 표지 겹침 + 선반 */}
      <div className="relative mt-6">
        <div className="flex items-end pl-1">
          {covers.length > 0 ? (
            covers.map((b, i) => (
              <div
                key={b.bookId}
                className={cn(
                  "relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-stone-700 shadow-[2px_4px_10px_rgba(0,0,0,0.35)] ring-1 ring-black/10 transition-transform",
                  i > 0 && "-ml-4",
                )}
                style={{ transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 1.5}deg)`, zIndex: i }}
              >
                {b.coverImageUrl ? (
                  <Image src={b.coverImageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-5 w-5 text-stone-400" />
                  </div>
                )}
                {b.completedInMonth && (
                  <div className="absolute right-0 top-0 bg-emerald-500 px-1 py-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex h-24 items-center text-sm text-emerald-200/70">표지가 없는 책이에요</div>
          )}

          {overflow > 0 && (
            <div className="relative z-20 -ml-4 flex h-24 w-16 flex-shrink-0 items-center justify-center rounded-sm bg-emerald-900/80 text-sm font-bold text-emerald-100 shadow-md ring-1 ring-white/10">
              +{overflow}
            </div>
          )}
        </div>
        {/* 선반 */}
        <div className="mt-0 h-2 rounded-full bg-gradient-to-b from-amber-900/60 to-stone-950 shadow-[0_6px_12px_rgba(0,0,0,0.4)]" />
      </div>
    </div>
  );
}
