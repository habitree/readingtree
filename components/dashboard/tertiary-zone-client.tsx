"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import dynamic from "next/dynamic";
import { CollapsibleSection } from "./sections/collapsible-section";
import { PersonaInsightCard } from "./sections/home-hero-section";
import { MonthlySummaryCard } from "./sections/monthly-summary-card";

const MonthlyBookCalendar = dynamic(
  () => import("./sections/monthly-book-calendar").then((mod) => mod.MonthlyBookCalendar),
  {
    loading: () => (
      <div className="h-64 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    ),
  }
);
import { getMonthlyBookActivities } from "@/app/actions/stats";
import { getSampleMonthlyActivities } from "@/app/actions/sample";
import { generateDemoMonthlyActivities } from "@/lib/demo-calendar-data";
import type { DailyBookActivity } from "@/app/actions/stats";
import type { UserPersona, ReadingStats } from "@/types/persona";

interface TertiaryZoneClientProps {
  monthlyActivities: Record<string, DailyBookActivity>;
  initialYear: number;
  initialMonth: number;
  persona: UserPersona | null;
  readingStats: ReadingStats | null;
  isGuest?: boolean;
}

/**
 * Tertiary Zone 내부 컨텐츠 (중복 방지용)
 */
function TertiaryContent({
  activities,
  year,
  month,
  onMonthChange,
  persona,
  readingStats,
}: {
  activities: Record<string, DailyBookActivity>;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  persona: UserPersona | null;
  readingStats: ReadingStats | null;
}) {
  const hasPersonaData = persona && readingStats;

  return (
    <div className="space-y-4">
      {/* 월간 요약 */}
      <MonthlySummaryCard activities={activities} year={year} month={month} />

      {/* 월별 책 표지 캘린더 */}
      <MonthlyBookCalendar
        activities={activities}
        year={year}
        month={month}
        onMonthChange={onMonthChange}
      />

      {/* 페르소나 인사이트 */}
      {hasPersonaData && (
        <PersonaInsightCard persona={persona} stats={readingStats} />
      )}
    </div>
  );
}

/**
 * Tertiary Zone 클라이언트 컴포넌트
 * 모바일: 접이식 섹션 / 데스크톱: 항상 표시 + sticky
 */
export function TertiaryZoneClient({
  monthlyActivities: initialActivities,
  initialYear,
  initialMonth,
  persona,
  readingStats,
  isGuest = false,
}: TertiaryZoneClientProps) {
  const { t } = useTranslation();
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
      let newActivities: Record<string, DailyBookActivity>;
      if (isGuest) {
        const sampleData = await getSampleMonthlyActivities(newYear, newMonth);
        // 샘플 데이터가 없으면 데모 데이터로 대체
        newActivities = Object.keys(sampleData || {}).length > 0
          ? sampleData
          : generateDemoMonthlyActivities(newYear, newMonth);
      } else {
        newActivities = await getMonthlyBookActivities(null, newYear, newMonth);
      }
      setCachedData(prev => ({
        ...prev,
        [cacheKey]: newActivities,
      }));
      setActivities(newActivities);
      setYear(newYear);
      setMonth(newMonth);
    } catch (error) {
      if (isGuest) {
        // 에러 시에도 게스트는 데모 데이터 표시
        const demoData = generateDemoMonthlyActivities(newYear, newMonth);
        setCachedData(prev => ({ ...prev, [cacheKey]: demoData }));
        setActivities(demoData);
        setYear(newYear);
        setMonth(newMonth);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cachedData, isGuest]);

  const hasActivityData = Object.keys(activities).length > 0 || isLoading;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    return null;
  }

  return (
    <>
      {/* 모바일: 기존 접이식 */}
      <div className="lg:hidden">
        <CollapsibleSection
          title={t("dashboard.secretGarden")}
          storageKey="dashboard-tertiary"
          defaultOpen={false}
        >
          <TertiaryContent
            activities={activities}
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            persona={persona}
            readingStats={readingStats}
          />
        </CollapsibleSection>
      </div>

      {/* 데스크톱: 항상 표시 + sticky */}
      <div className="hidden lg:block lg:sticky lg:top-20">
        <div className="space-y-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <span>{t("dashboard.secretGarden")}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <TertiaryContent
            activities={activities}
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            persona={persona}
            readingStats={readingStats}
          />
        </div>
      </div>
    </>
  );
}
