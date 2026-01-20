/**
 * 사용자 페르소나 관련 타입 정의
 */

import type { Database } from "./database";

// 기본 타입
export type UserPersona = Database["public"]["Tables"]["user_personas"]["Row"];
export type UserPersonaInsert = Database["public"]["Tables"]["user_personas"]["Insert"];
export type UserPersonaUpdate = Database["public"]["Tables"]["user_personas"]["Update"];

// 독서 속도
export type ReadingPace = "fast" | "steady" | "slow";
export const ReadingPaceLabels: Record<ReadingPace, string> = {
  fast: "빠른 독서가",
  steady: "꾸준한 독서가",
  slow: "음미하는 독서가",
};

// 기록 스타일
export type NoteStyle = "quote-focused" | "reflection-focused" | "visual" | "balanced";
export const NoteStyleLabels: Record<NoteStyle, string> = {
  "quote-focused": "인용구 수집가",
  "reflection-focused": "사색적 기록가",
  visual: "시각적 기록가",
  balanced: "균형잡힌 기록가",
};

// 활동 패턴
export type ActivityPattern = "morning" | "afternoon" | "evening" | "night";
export const ActivityPatternLabels: Record<ActivityPattern, string> = {
  morning: "아침형 독서가",
  afternoon: "점심형 독서가",
  evening: "저녁형 독서가",
  night: "밤형 독서가",
};

// 그룹 참여 스타일
export type GroupEngagement = "leader" | "active" | "observer" | "solo";
export const GroupEngagementLabels: Record<GroupEngagement, string> = {
  leader: "리더",
  active: "적극적 참여자",
  observer: "관찰자",
  solo: "솔로 독서가",
};

// 카테고리 선호도
export interface CategoryPreference {
  category: string;
  count: number;
  percentage: number;
}

// 독서 통계
export interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  readingBooks: number;
  averageReadingDays: number;
  averagePagesPerDay: number;
  totalNotes: number;
  noteTypeDistribution: {
    quote: number;
    memo: number;
    photo: number;
    transcription: number;
  };
}

// 활동 시간 분포
export interface ActivityTimeDistribution {
  morning: number;   // 6:00 - 12:00
  afternoon: number; // 12:00 - 18:00
  evening: number;   // 18:00 - 22:00
  night: number;     // 22:00 - 6:00
}

// 페르소나 분석 결과
export interface PersonaAnalysisResult {
  reading_pace: ReadingPace | null;
  note_style: NoteStyle | null;
  activity_pattern: ActivityPattern | null;
  group_engagement: GroupEngagement | null;
  reading_stats: ReadingStats;
  category_preferences: CategoryPreference[];
  activity_time_distribution: ActivityTimeDistribution;
  persona_summary: string | null;
}

// 페르소나 대시보드용 데이터
export interface PersonaDashboardData {
  persona: UserPersona | null;
  needsAnalysis: boolean;
  lastAnalyzedAt: string | null;
  analysisAge: number; // 시간 단위
}
