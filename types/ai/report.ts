/**
 * AI 독서 리포트 관련 타입 정의
 */

import type { AIProvider } from "./settings";

/** 리포트 AI 설정 */
export interface AIReportSettings {
  id: string;
  provider: AIProvider;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
}

/** 리포트 설정 기본값 */
export const DEFAULT_REPORT_SETTINGS: Omit<AIReportSettings, "id"> = {
  provider: "openai",
  modelId: "gpt-4o-mini",
  systemPrompt: `당신은 독서 분석 전문가입니다. 사용자의 독서 노트를 분석하여 구조화된 리포트를 작성합니다.

## 작성 규칙
- 마크다운 형식으로 작성
- 한국어로 작성
- 사용자의 노트 내용을 존중하며 원문을 왜곡하지 않음
- 인사이트는 노트 내용에서 근거를 찾아 작성
- 간결하고 읽기 쉽게 작성`,
  temperature: 0.7,
  maxOutputTokens: 4096,
};

/** 리포트 생성 결과 */
export interface ReadingReportResult {
  success: boolean;
  report?: string;
  noteCount?: number;
  generatedAt?: string;
  error?: string;
}

/** 리포트 설정 폼 데이터 */
export interface ReportSettingsFormData {
  provider: AIProvider;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
}

/** DB 저장된 리포트 */
export interface SavedReport {
  id: string;
  shareId: string;
  userBookId: string;
  reportMarkdown: string;
  noteCount: number;
  isPublic: boolean;
  bookTitle: string;
  bookAuthor: string | null;
  coverImageUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  noteIds: string[];
  includeNotes: boolean;
  viewCount: number;
}

// ─── 이모지 반응 ────────────────────────────────────────────────────

/** 리포트 반응 타입 */
export type ReportReactionType = "impressive" | "want_to_read" | "insightful";

/** 반응별 집계 */
export interface ReportReactionCounts {
  impressive: number;
  want_to_read: number;
  insightful: number;
}

/** 반응 메타 정보 */
export const REACTION_META: Record<
  ReportReactionType,
  { emoji: string; label: string }
> = {
  impressive: { emoji: "👏", label: "멋지다" },
  want_to_read: { emoji: "📚", label: "나도 읽어볼게" },
  insightful: { emoji: "💡", label: "인사이트 얻었어" },
};

/** 공유 페이지용 공개 노트 요약 */
export interface PublicNoteSummary {
  id: string;
  type: string;
  title: string | null;
  pageNumber: string | null;
  content: string | null;
  createdAt: string;
}

/** 마크다운 파싱된 리포트 섹션 */
export interface ReportSection {
  id: string;
  title: string;
  content: string;
  icon: string;
  colorTheme: string;
}

/** 리포트에 사용된 노트 요약 */
export interface NoteSummary {
  id: string;
  type: string;
  title: string | null;
  pageNumber: string | null;
  createdAt: string;
}

/** 리포트용 책 정보 */
export interface BookInfoForReport {
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  currentPage: number | null;
  totalPages: number | null;
}
