"use client";

import { useState, useCallback } from "react";
import { CollapsibleSection } from "./sections/collapsible-section";
import { MonthlyBookCalendar } from "./sections/monthly-book-calendar";
import { PersonaInsightCard } from "./sections/home-hero-section";
import { getMonthlyBookActivities } from "@/app/actions/stats";
import type { DailyBookActivity } from "@/app/actions/stats";
import type { UserPersona, ReadingStats } from "@/types/persona";

interface TertiaryZoneClientProps {
  monthlyActivities: Record<string, DailyBookActivity>;
  initialYear: number;
  initialMonth: number;
  persona: UserPersona | null;
  readingStats: ReadingStats | null;
}

/**
 * Tertiary Zone 클라이언트 컴포넌트
 * 접이식 섹션으로 추가 정보 표시
 */
export function TertiaryZoneClient({
  monthlyActivities: initialActivities,
  initialYear,
  initialMonth,
  persona,
  readingStats,
}: TertiaryZoneClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [activities, setActivities] = useState<Record<string, DailyBookActivity>>(initialActivities);
  const [isLoading, setIsLoading] = useState(false);

  // 캐시된 월별 데이터
  const [cachedData, setCachedData] = useState<Record<string, Record<string, DailyBookActivity>>>({
    [`${initialYear}-${initialMonth}`]: initialActivities,
  });

  const handleMonthChange = useCallback(async (newYear: number, newMonth: number) => {
    const cacheKey = `${newYear}-${newMonth}`;

    // 캐시에 있으면 바로 사용
    if (cachedData[cacheKey]) {
      setYear(newYear);
      setMonth(newMonth);
      setActivities(cachedData[cacheKey]);
      return;
    }

    // 없으면 서버에서 조회
    setIsLoading(true);
    try {
      const newActivities = await getMonthlyBookActivities(null, newYear, newMonth);
      setCachedData(prev => ({
        ...prev,
        [cacheKey]: newActivities,
      }));
      setActivities(newActivities);
      setYear(newYear);
      setMonth(newMonth);
    } catch (error) {
      console.error("월별 활동 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cachedData]);

  const hasActivityData = Object.keys(activities).length > 0 || isLoading;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    return null;
  }

  return (
    <CollapsibleSection
      title="더 보기"
      storageKey="dashboard-tertiary"
      defaultOpen={false}
    >
      <div className="space-y-4">
        {/* 월별 책 표지 캘린더 */}
        <MonthlyBookCalendar
          activities={activities}
          year={year}
          month={month}
          onMonthChange={handleMonthChange}
        />

        {/* 페르소나 인사이트 */}
        {hasPersonaData && (
          <PersonaInsightCard persona={persona} stats={readingStats} />
        )}
      </div>
    </CollapsibleSection>
  );
}
