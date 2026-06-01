"use client";

/**
 * /stats "월간 독서결산" 섹션 오케스트레이터.
 *
 * 서버에서 초기 결산(initialView)을 받아 렌더하고, 월 스위처 변경 시
 * getRecapForView 서버 액션으로 해당 월 데이터를 재조회한다.
 * (과거 달은 1회 생성 후 동결, 현재 달은 매 조회 시 재스냅샷)
 */

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { getRecapForView, type RecapView as RecapViewData } from "@/app/actions/recap/generate";
import { RecapView } from "./recap-view";
import { RecapMonthSwitcher } from "./recap-month-switcher";
import { Card } from "@/components/ui/card";

interface RecapSectionProps {
  initialView: RecapViewData;
}

export function RecapSection({ initialView }: RecapSectionProps) {
  const [view, setView] = useState<RecapViewData>(initialView);
  const [isPending, startTransition] = useTransition();

  const handleChange = (year: number, month: number) => {
    startTransition(async () => {
      const next = await getRecapForView(year, month);
      if (next) setView(next);
    });
  };

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
        <RecapView
          computed={view.computed}
          aiCaption={view.share?.aiCaption}
          share={view.share ? { shareId: view.share.shareId, isPublic: view.share.isPublic } : null}
          readOnly={view.isGuest}
        />
      )}
    </section>
  );
}
