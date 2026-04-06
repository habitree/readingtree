/**
 * AI 리포트 템플릿 타입 정의
 */

/** 리포트 섹션 타입 */
export type SectionType =
  | "overview"
  | "insights"
  | "quotes"
  | "thoughts"
  | "journey"
  | "summary"
  | "discussion"
  | "action_items"
  | "comparison"
  | "growth"
  | "social_snippet"
  | "concept_map";

/** 템플릿 톤 */
export type TemplateTone = "formal" | "casual" | "academic" | "friendly";

/** 템플릿 길이 */
export type TargetLength = "short" | "medium" | "long";

/** 템플릿 섹션 설정 */
export interface ReportTemplateSectionConfig {
  key: SectionType;
  title: string;
  promptInstruction: string;
  maxLength: number | null;
  required: boolean;
  sortOrder: number;
  config?: Record<string, unknown>;
}

/** 리포트 템플릿 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  tone: TemplateTone;
  targetLength: TargetLength;
  includeStats: boolean;
  multiReadAware: boolean;
  isDefault: boolean;
  isSystem: boolean;
  sortOrder: number;
  sections: ReportTemplateSectionConfig[];
  createdAt: string;
  updatedAt: string;
}

/** 템플릿 생성/수정 폼 데이터 */
export interface ReportTemplateFormData {
  name: string;
  description: string | null;
  slug: string;
  sections: ReportTemplateSectionConfig[];
  tone: TemplateTone;
  targetLength: TargetLength;
  includeStats: boolean;
  multiReadAware: boolean;
}

/** 톤 레이블 */
export const TONE_LABELS: Record<TemplateTone, string> = {
  formal: "격식체",
  casual: "친근체",
  academic: "학술체",
  friendly: "따뜻한",
};

/** 길이 레이블 */
export const LENGTH_LABELS: Record<TargetLength, string> = {
  short: "짧게",
  medium: "보통",
  long: "자세히",
};

/** 섹션 타입 레이블 */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  overview: "책 개요",
  insights: "핵심 인사이트",
  quotes: "인상깊은 구절",
  thoughts: "나의 생각 정리",
  journey: "독서 여정",
  summary: "종합 요약",
  discussion: "토론 질문",
  action_items: "실천 항목",
  comparison: "회독별 비교",
  growth: "독서 성장 분석",
  social_snippet: "SNS 한줄평",
  concept_map: "핵심 개념 관계도",
};

/** 노트 유형 가중치 */
export interface NoteTypeWeights {
  quote: number;
  memo: number;
  transcription: number;
  progress: number;
  photo: number;
}

/** 확장된 리포트 설정 */
export interface AIReportSettingsExtended {
  id: string;
  provider: string;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  minNotesThreshold: number;
  maxNotesForAnalysis: number;
  enableMultiReading: boolean;
  noteTypeWeights: NoteTypeWeights;
  defaultTemplateId: string | null;
}

/** 리포트 사용 통계 */
export interface ReportUsageStats {
  totalReports: number;
  monthlyReports: number;
  avgGenerationTimeMs: number | null;
  templatePopularity: { templateId: string; templateName: string; count: number }[];
  topUsers: { userId: string; count: number }[];
}

/** 다회독 컨텍스트 */
export interface MultiReadingContext {
  totalReads: number;
  currentReadNumber: number;
  readingCycles: ReadingCycle[];
}

/** 회독 사이클 */
export interface ReadingCycle {
  readingNumber: number;
  startDate: string | null;
  endDate: string | null;
  noteCount: number;
}
