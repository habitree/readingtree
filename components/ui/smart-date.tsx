"use client";

import { useState, useEffect } from "react";
import { formatSmartDate, formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface SmartDateProps {
  date: string | Date;
  className?: string;
  as?: "time" | "span";
}

/**
 * 하이드레이션 안전한 스마트 날짜 컴포넌트
 *
 * `formatSmartDate`는 `isToday()`, `isYesterday()`, `new Date()` 등
 * 현재 시각에 의존하는 로직을 포함하여 SSR/CSR 간 텍스트 불일치(하이드레이션 에러)를 유발합니다.
 *
 * - SSR: 정적 날짜 포맷 (`formatDate` → "yyyy년 MM월 dd일")
 * - CSR(마운트 후): 상대적 스마트 포맷 ("14:30", "어제 14:30", "3일 전" 등)
 */
export function SmartDate({ date, className, as: Tag = "time" }: SmartDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const isoString = dateObj.toISOString();

  // SSR: 안전한 정적 포맷, CSR: 스마트 포맷
  const displayText = mounted ? formatSmartDate(dateObj) : formatDate(dateObj);

  return (
    <Tag
      className={cn(className)}
      dateTime={Tag === "time" ? isoString : undefined}
      suppressHydrationWarning
    >
      {displayText}
    </Tag>
  );
}
