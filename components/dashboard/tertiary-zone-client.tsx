"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, BookOpen, PenLine, Sparkles } from "lucide-react";
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
import { getSampleFilledMonthlyActivities } from "@/app/actions/sample";
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
  /** 로그인했지만 데이터가 없는 첫 사용자 (데모 캘린더 표시) */
  isFirstUser?: boolean;
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
  isFirstUser = false,
}: {
  activities: Record<string, DailyBookActivity>;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  persona: UserPersona | null;
  readingStats: ReadingStats | null;
  isFirstUser?: boolean;
}) {
  const { t } = useTranslation();
  const hasPersonaData = persona && readingStats;

  return (
    <div className="space-y-4">
      {isFirstUser ? (
        <>
          {/* ── 안내 카드: 비밀정원이 뭔지 설명 ── */}
          <div className="rounded-xl border border-forest-200/60 dark:border-forest-800/40 bg-gradient-to-br from-forest-50/80 to-emerald-50/60 dark:from-forest-950/40 dark:to-emerald-950/20 p-4 space-y-3">
            {/* 제목 + 샘플 뱃지 */}
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-forest-600 dark:text-forest-400 shrink-0" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t("empty.demoCalendarTitle")}
              </p>
              <span className="text-[9px] font-medium text-forest-600 dark:text-forest-400 bg-forest-100 dark:bg-forest-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                {t("empty.demoLabel")}
              </span>
            </div>

            {/* 핵심 설명: 기록이 남는다는 것 */}
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {t("empty.demoCalendarDesc")}
            </p>

            {/* 기록 방식 안내 */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { icon: PenLine, label: t("notes.typeTranscription") },
                { icon: BookOpen, label: t("notes.typeMemo") },
                { icon: Sparkles, label: t("notes.typeQuote") },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-forest-700 dark:text-forest-300 bg-white/70 dark:bg-white/10 px-2 py-0.5 rounded-full border border-forest-200/40 dark:border-forest-700/30"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>

            {/* 샘플임을 안내 */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              {t("empty.demoCalendarHow")}
            </p>
          </div>

          {/* ── 샘플 캘린더: 선명하게 100% 보여줌 ── */}
          <MonthlyBookCalendar
            activities={activities}
            year={year}
            month={month}
            onMonthChange={onMonthChange}
          />

          {/* ── 기록 방식 요약 카드 ── */}
          <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              {t("empty.demoSummaryTitle")}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("empty.demoSummaryDesc")}
            </p>
          </div>

          {/* ── CTA 버튼 ── */}
          <Link
            href="/books/search"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-forest-600 hover:bg-forest-700 text-white py-3 text-sm font-semibold transition-colors shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            {t("empty.demoCalendarCta")}
          </Link>
        </>
      ) : (
        <>
          {/* 기존 사용자: 월간 요약 */}
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
        </>
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
  isFirstUser = false,
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
      if (isFirstUser) {
        // 첫 사용자: 데모 데이터 직접 생성 (서버 호출 불필요)
        newActivities = generateDemoMonthlyActivities(newYear, newMonth);
        setCachedData(prev => ({ ...prev, [cacheKey]: newActivities }));
        setActivities(newActivities);
        setYear(newYear);
        setMonth(newMonth);
        setIsLoading(false);
        return;
      } else if (isGuest) {
        // 게스트 월 이동: 관리자 실제 데이터를 해당 월에 리매핑, 없으면 데모 폴백
        const sampleData = await getSampleFilledMonthlyActivities(newYear, newMonth);
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
  }, [cachedData, isGuest, isFirstUser]);

  const hasActivityData = Object.keys(activities).length > 0 || isLoading;
  const hasPersonaData = persona && readingStats;

  if (!hasActivityData && !hasPersonaData) {
    return null;
  }

  return (
    <>
      {/* 모바일: 접이식 (첫 사용자는 기본 열림) */}
      <div className="lg:hidden">
        <CollapsibleSection
          title={t("dashboard.secretGarden")}
          storageKey="dashboard-tertiary"
          defaultOpen={isFirstUser}
        >
          <TertiaryContent
            activities={activities}
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            persona={persona}
            readingStats={readingStats}
            isFirstUser={isFirstUser}
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
            isFirstUser={isFirstUser}
          />
        </div>
      </div>
    </>
  );
}
