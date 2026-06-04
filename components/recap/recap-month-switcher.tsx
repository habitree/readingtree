"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getKSTYearMonth } from "@/lib/utils/timezone";

interface RecapMonthSwitcherProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
}

export function RecapMonthSwitcher({ year, month, onChange, disabled }: RecapMonthSwitcherProps) {
  const cur = getKSTYearMonth();
  const isCurrentOrFuture = year > cur.year || (year === cur.year && month >= cur.month);

  const go = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(y, m);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => go(-1)} disabled={disabled}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[110px] text-center text-sm font-semibold tabular-nums">
        {year}년 {month}월
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => go(1)}
        disabled={disabled || isCurrentOrFuture}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
