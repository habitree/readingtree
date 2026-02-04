"use client";

import { CollapsibleSection } from "./sections/collapsible-section";
import { ActivityCalendar } from "./sections/activity-calendar";
import { PersonaInsightCard } from "./sections/home-hero-section";
import type { DailyRecordByType } from "@/app/actions/stats";
import type { UserPersona, ReadingStats } from "@/types/persona";

interface TertiaryZoneClientProps {
  dailyRecordsByType: Record<string, DailyRecordByType>;
  persona: UserPersona | null;
  readingStats: ReadingStats | null;
}

/**
 * Tertiary Zone 클라이언트 컴포넌트
 * 접이식 섹션으로 추가 정보 표시
 */
export function TertiaryZoneClient({
  dailyRecordsByType,
  persona,
  readingStats,
}: TertiaryZoneClientProps) {
  const hasActivityData = Object.keys(dailyRecordsByType).length > 0;
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
        {/* 30일 활동 캘린더 */}
        {hasActivityData && (
          <ActivityCalendar dailyRecordsByType={dailyRecordsByType} />
        )}

        {/* 페르소나 인사이트 */}
        {hasPersonaData && (
          <PersonaInsightCard persona={persona} stats={readingStats} />
        )}
      </div>
    </CollapsibleSection>
  );
}
