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
