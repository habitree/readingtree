/**
 * 토큰 카운터 유틸리티
 * AI API 호출 시 토큰 수 추정 및 비용 계산
 *
 * 참고: 정확한 토큰 수는 각 Provider의 토크나이저에 따라 다르지만,
 * 이 유틸리티는 대략적인 추정치를 제공합니다.
 */

// 토큰 추정 설정
interface TokenEstimationConfig {
  // 한국어 문자당 평균 토큰 수 (약 1.5~2)
  koreanCharPerToken: number;
  // 영어 단어당 평균 토큰 수 (약 1.3)
  englishWordPerToken: number;
  // 기본 문자당 토큰 수
  defaultCharPerToken: number;
}

const DEFAULT_CONFIG: TokenEstimationConfig = {
  koreanCharPerToken: 1.8,
  englishWordPerToken: 1.3,
  defaultCharPerToken: 0.25,
};

// Provider별 모델 가격 (USD per 1M tokens)
interface ModelPricing {
  input: number;
  output: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },

  // Anthropic Claude
  "claude-fable-5": { input: 10, output: 50 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },

  // Google Gemini
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
};

// 토큰 추정 결과
export interface TokenEstimate {
  totalTokens: number;
  koreanTokens: number;
  englishTokens: number;
  otherTokens: number;
  breakdown: {
    koreanChars: number;
    englishWords: number;
    otherChars: number;
  };
}

// 비용 추정 결과
export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

/**
 * 한국어 문자 수 카운트
 * @param text 텍스트
 * @returns 한국어 문자 수
 */
export function countKoreanChars(text: string): number {
  const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/g;
  const matches = text.match(koreanRegex);
  return matches ? matches.length : 0;
}

/**
 * 영어 단어 수 카운트
 * @param text 텍스트
 * @returns 영어 단어 수
 */
export function countEnglishWords(text: string): number {
  const englishRegex = /[a-zA-Z]+/g;
  const matches = text.match(englishRegex);
  return matches ? matches.length : 0;
}

/**
 * 텍스트의 토큰 수 추정
 * @param text 텍스트
 * @param config 추정 설정 (선택)
 * @returns 토큰 추정 결과
 */
export function estimateTokens(
  text: string,
  config: TokenEstimationConfig = DEFAULT_CONFIG
): TokenEstimate {
  const koreanChars = countKoreanChars(text);
  const englishWords = countEnglishWords(text);

  // 한국어와 영어를 제외한 나머지 문자 (숫자, 특수문자 등)
  const koreanText = text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/g)?.join("") || "";
  const englishText = text.match(/[a-zA-Z]+/g)?.join(" ") || "";
  const otherChars = text.length - koreanText.length - englishText.replace(/\s/g, "").length;

  const koreanTokens = Math.ceil(koreanChars * config.koreanCharPerToken);
  const englishTokens = Math.ceil(englishWords * config.englishWordPerToken);
  const otherTokens = Math.ceil(otherChars * config.defaultCharPerToken);

  return {
    totalTokens: koreanTokens + englishTokens + otherTokens,
    koreanTokens,
    englishTokens,
    otherTokens,
    breakdown: {
      koreanChars,
      englishWords,
      otherChars,
    },
  };
}

/**
 * 메시지 배열의 총 토큰 수 추정
 * @param messages 메시지 배열
 * @returns 총 토큰 수
 */
export function estimateMessagesTokens(
  messages: { role: string; content: string }[]
): number {
  let totalTokens = 0;

  for (const message of messages) {
    // 각 메시지에 role 태그 오버헤드 추가 (약 4 토큰)
    totalTokens += 4;
    totalTokens += estimateTokens(message.content).totalTokens;
  }

  // 메시지 형식 오버헤드 추가 (약 3 토큰)
  totalTokens += 3;

  return totalTokens;
}

/**
 * API 호출 비용 추정
 * @param modelId 모델 ID
 * @param inputTokens 입력 토큰 수
 * @param outputTokens 출력 토큰 수
 * @returns 비용 추정 결과
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const pricing = MODEL_PRICING[modelId];

  if (!pricing) {
    // 알 수 없는 모델의 경우 기본 가격 사용
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: "USD",
    };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: "USD",
  };
}

/**
 * 지원되는 모델 목록 조회
 * @returns 모델 ID 목록
 */
export function getSupportedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}

/**
 * 모델 가격 정보 조회
 * @param modelId 모델 ID
 * @returns 가격 정보 또는 undefined
 */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}

/**
 * 텍스트를 최대 토큰 수에 맞게 자르기
 * @param text 원본 텍스트
 * @param maxTokens 최대 토큰 수
 * @returns 잘린 텍스트
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimate = estimateTokens(text);

  if (estimate.totalTokens <= maxTokens) {
    return text;
  }

  // 대략적인 문자 수 계산 (한국어 기준)
  const avgTokenPerChar = estimate.totalTokens / text.length;
  const targetLength = Math.floor(maxTokens / avgTokenPerChar);

  // 단어 경계에서 자르기 시도
  let truncated = text.slice(0, targetLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const lastPeriod = truncated.lastIndexOf(".");

  if (lastPeriod > targetLength * 0.8) {
    truncated = truncated.slice(0, lastPeriod + 1);
  } else if (lastSpace > targetLength * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }

  return truncated.trim();
}

/**
 * 컨텍스트 윈도우 사용량 계산
 * @param inputTokens 입력 토큰 수
 * @param maxContextTokens 최대 컨텍스트 토큰 수
 * @returns 사용률 (0-1)
 */
export function calculateContextUsage(
  inputTokens: number,
  maxContextTokens: number
): number {
  return Math.min(inputTokens / maxContextTokens, 1);
}

// 모델별 기본 컨텍스트 윈도우 크기
export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4-turbo": 128000,
  "gpt-3.5-turbo": 16385,

  // Anthropic Claude
  "claude-fable-5": 1000000,
  "claude-opus-4-8": 1000000,
  "claude-sonnet-4-6": 1000000,
  "claude-haiku-4-5": 200000,

  // Google Gemini
  "gemini-2.0-flash": 1048576,
  "gemini-1.5-pro": 2097152,
  "gemini-1.5-flash": 1048576,
};

/**
 * 모델의 컨텍스트 윈도우 크기 조회
 * @param modelId 모델 ID
 * @returns 컨텍스트 윈도우 크기 또는 기본값
 */
export function getContextWindowSize(modelId: string): number {
  return MODEL_CONTEXT_WINDOWS[modelId] || 8192;
}
