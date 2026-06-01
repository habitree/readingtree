"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RecapMonthSwitcher } from "./recap-month-switcher";

/**
 * 전용 페이지(/recap/[yearMonth])용 월 스위처.
 * 결산 섹션의 인앱 스위처와 달리 라우트 이동(router.push)으로 월을 전환한다.
 */
export function RecapPageMonthSwitcher({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (y: number, m: number) => {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    startTransition(() => router.push(`/recap/${ym}`));
  };

  return <RecapMonthSwitcher year={year} month={month} onChange={handleChange} disabled={isPending} />;
}
