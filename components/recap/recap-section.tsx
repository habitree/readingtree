"use client";

/**
 * /stats "월간 독서결산" 섹션 오케스트레이터.
 *
 * 서버에서 초기 결산(initialView)·초기 책목록(initialBooks)을 받아 렌더하고,
 * 월 스위처 변경 시 getRecapForView + getMonthlyBooksList를 병렬 재조회한다.
 * 책 목록 미리보기는 인앱 전용 — 공개 페이지 공용인 RecapView에는 넣지 않는다.
 */

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { getRecapForView, type RecapView as RecapViewData } from "@/app/actions/recap/generate";
import { getMonthlyBooksList } from "@/app/actions/recap/books-list";
import type { MonthlyBooksResult } from "@/app/actions/recap/types";
import { RecapView } from "./recap-view";
import { RecapMonthSwitcher } from "./recap-month-switcher";
import { MonthlyBooksShowcase } from "./monthly-books-showcase";
import { Card } from "@/components/ui/card";

interface RecapSectionProps {
  initialView: RecapViewData;
  initialBooks: MonthlyBooksResult | null;
}

export function RecapSection({ initialView, initialBooks }: RecapSectionProps) {
  const [view, setView] = useState<RecapViewData>(initialView);
  const [books, setBooks] = useState<MonthlyBooksResult | null>(initialBooks);
  const [isPending, startTransition] = useTransition();

  const handleChange = (year: number, month: number) => {
    startTransition(async () => {
      const [nextView, nextBooks] = await Promise.all([
        getRecapForView(year, month),
        getMonthlyBooksList(year, month),
      ]);
      if (nextView) setView(nextView);
      setBooks(nextBooks);
    });
  };

  const yearMonth = `${view.year}-${String(view.month).padStart(2, "0")}`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">월간 독서결산</h2>
        <RecapMonthSwitcher year={view.year} month={view.month} onChange={handleChange} disabled={isPending} />
      </div>

      {isPending ? (
        <Card className="flex items-center justify-center gap-2 py-12 text-sm text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          결산을 불러오는 중…
        </Card>
      ) : (
        <>
          <RecapView
            computed={view.computed}
            aiCaption={view.share?.aiCaption}
            share={view.share ? { shareId: view.share.shareId, isPublic: view.share.isPublic } : null}
            readOnly={view.isGuest}
          />
          {books && books.totalBooks > 0 && (
            <MonthlyBooksShowcase result={books} variant="preview" yearMonth={yearMonth} />
          )}
        </>
      )}
    </section>
  );
}
