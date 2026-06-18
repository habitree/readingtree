/**
 * OCR 보정 설정 타입 정의
 *
 * OCR 텍스트 보정 기능의 모델 및 설정을 관리합니다.
 * - 프로바이더별 모델 선택
 * - 비용 정보 제공
 * - 생성 파라미터 조정
 */

import type { AIProvider } from "./settings";

// 모델별 비용 정보 (USD per 1M tokens)
export interface ModelCost {
  input: number; // 입력 토큰당 비용 ($/1M tokens)
  output: number; // 출력 토큰당 비용 ($/1M tokens)
}

// OCR 보정 모델 정보
export interface OcrCorrectionModelInfo {
  id: string;
  name: string;
  recommended: boolean;
  cost: ModelCost;
}

// OCR 보정 모델 목록 (프로바이더별, 비용 정보 포함)
export const OCR_CORRECTION_MODELS: Record<AIProvider, OcrCorrectionModelInfo[]> = {
  openai: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", recommended: true, cost: { input: 0.15, output: 0.6 } },
    { id: "gpt-4o", name: "GPT-4o", recommended: false, cost: { input: 2.5, output: 10 } },
  ],
  google: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", recommended: true, cost: { input: 0.075, output: 0.3 } },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", recommended: false, cost: { input: 1.25, output: 5 } },
  ],
  anthropic: [
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", recommended: true, cost: { input: 1, output: 5 } },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", recommended: false, cost: { input: 3, output: 15 } },
  ],
};

// OCR 보정 생성 설정
export interface OcrCorrectionGenerationSettings {
  temperature: number; // 0.0 ~ 1.0 (기본: 0.3)
  maxOutputTokens: number; // 기본: 2048
}

// OCR 보정 설정 타입
export interface OcrCorrectionSettings {
  id: string;
  provider: AIProvider;
  modelId: string;
  generationSettings: OcrCorrectionGenerationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 기본 OCR 보정 설정
export const DEFAULT_OCR_CORRECTION_SETTINGS: Omit<OcrCorrectionSettings, "id" | "createdAt" | "updatedAt"> = {
  provider: "openai",
  modelId: "gpt-4o-mini",
  generationSettings: {
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
  isActive: true,
};

// OCR 보정 통계 타입
export interface OcrCorrectionStats {
  totalCorrections: number; // 전체 보정 횟수
  successfulCorrections: number; // 성공 횟수
  failedCorrections: number; // 실패 횟수
  successRate: number; // 성공률 (%)
  thisMonthCorrections: number; // 이번 달 보정 횟수
  thisMonthCostUsd: number; // 이번 달 예상 비용 (USD)
  avgInputTokens: number; // 평균 입력 토큰
  avgOutputTokens: number; // 평균 출력 토큰
}

// OCR 보정 설정 폼 데이터
export interface OcrCorrectionSettingsFormData {
  provider: AIProvider;
  modelId: string;
  generationSettings: OcrCorrectionGenerationSettings;
}

// OCR 보정 연결 테스트 결과
export interface OcrCorrectionTestResult {
  success: boolean;
  provider: AIProvider;
  modelId: string;
  responseTime?: number;
  error?: string;
  testOutput?: string;
}

// 비용 계산 유틸리티 타입
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * 토큰 사용량으로 비용 계산
 * @param provider AI 프로바이더
 * @param modelId 모델 ID
 * @param usage 토큰 사용량
 * @returns 예상 비용 (USD)
 */
export function calculateCost(provider: AIProvider, modelId: string, usage: TokenUsage): number {
  const models = OCR_CORRECTION_MODELS[provider];
  const model = models.find((m) => m.id === modelId);

  if (!model) {
    return 0;
  }

  const inputCost = (usage.inputTokens / 1_000_000) * model.cost.input;
  const outputCost = (usage.outputTokens / 1_000_000) * model.cost.output;

  return inputCost + outputCost;
}

/**
 * 월간 예상 비용 계산
 * @param provider AI 프로바이더
 * @param modelId 모델 ID
 * @param monthlyRequests 월간 예상 요청 수
 * @param avgInputTokens 평균 입력 토큰 (기본: 500)
 * @param avgOutputTokens 평균 출력 토큰 (기본: 300)
 * @returns 월간 예상 비용 (USD)
 */
export function estimateMonthlyCost(
  provider: AIProvider,
  modelId: string,
  monthlyRequests: number,
  avgInputTokens: number = 500,
  avgOutputTokens: number = 300
): number {
  const costPerRequest = calculateCost(provider, modelId, {
    inputTokens: avgInputTokens,
    outputTokens: avgOutputTokens,
  });

  return costPerRequest * monthlyRequests;
}
