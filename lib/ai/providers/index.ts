/**
 * AI Providers 통합 진입점
 * 모든 AI Provider를 통합 관리하는 모듈
 */

// 공통 타입 정의
export type AIProviderType = "google" | "openai" | "anthropic";

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamCallbacks {
  onContent: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

// Re-export from Gemini
export {
  getGeminiClient,
  getGeminiModel,
  generateWithGemini,
  summarizeWithGemini,
  createGeminiChatSession,
  streamGeminiMessage,
  type GeminiGenerateOptions,
  type GeminiChatMessage,
  type GeminiStreamCallbacks,
} from "./gemini";

// Re-export from OpenAI
export {
  getOpenAIClient,
  callOpenAI,
  parseOpenAIStream,
  generateWithOpenAI,
  summarizeWithOpenAI,
  streamOpenAIChat,
  type OpenAIMessage,
  type OpenAIGenerateOptions,
  type OpenAIStreamCallbacks,
  type OpenAIChatSettings,
} from "./openai";

// Re-export from Anthropic
export {
  getAnthropicApiKey,
  callAnthropic,
  parseAnthropicStream,
  generateWithAnthropic,
  summarizeWithAnthropic,
  streamAnthropicChat,
  type AnthropicMessage,
  type AnthropicGenerateOptions,
  type AnthropicStreamCallbacks,
  type AnthropicChatSettings,
} from "./anthropic";

/**
 * 통합 텍스트 생성 팩토리 함수
 * Provider에 관계없이 동일한 인터페이스로 텍스트 생성
 * @param provider AI Provider 타입 (google, openai, anthropic)
 * @param prompt 프롬프트 텍스트
 * @param options 생성 옵션
 * @returns 생성된 텍스트
 */
export async function generateText(
  provider: AIProviderType,
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  switch (provider) {
    case "google": {
      const { generateWithGemini } = await import("./gemini");
      return generateWithGemini(prompt, {
        model: options?.model,
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      });
    }
    case "openai": {
      const { generateWithOpenAI } = await import("./openai");
      return generateWithOpenAI(prompt, {
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });
    }
    case "anthropic": {
      const { generateWithAnthropic } = await import("./anthropic");
      return generateWithAnthropic(prompt, {
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });
    }
    default:
      throw new Error(`지원하지 않는 AI Provider입니다: ${provider}`);
  }
}

/**
 * 통합 책 요약 팩토리 함수
 * Provider에 관계없이 동일한 인터페이스로 책 요약
 * @param provider AI Provider 타입 (google, openai, anthropic)
 * @param description 원본 책소개 텍스트
 * @returns 요약된 텍스트
 */
export async function summarizeBook(
  provider: AIProviderType,
  description: string
): Promise<string> {
  switch (provider) {
    case "google": {
      const { summarizeWithGemini } = await import("./gemini");
      return summarizeWithGemini(description);
    }
    case "openai": {
      const { summarizeWithOpenAI } = await import("./openai");
      return summarizeWithOpenAI(description);
    }
    case "anthropic": {
      const { summarizeWithAnthropic } = await import("./anthropic");
      return summarizeWithAnthropic(description);
    }
    default:
      throw new Error(`지원하지 않는 AI Provider입니다: ${provider}`);
  }
}

/**
 * Provider 사용 가능 여부 확인
 * @param provider AI Provider 타입
 * @returns API 키가 설정되어 있으면 true
 */
export function isProviderAvailable(provider: AIProviderType): boolean {
  switch (provider) {
    case "google":
      return !!process.env.GEMINI_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "anthropic":
      return !!process.env.ANTHROPIC_API_KEY;
    default:
      return false;
  }
}

/**
 * 사용 가능한 모든 Provider 목록 조회
 * @returns 사용 가능한 Provider 배열
 */
export function getAvailableProviders(): AIProviderType[] {
  const providers: AIProviderType[] = ["google", "openai", "anthropic"];
  return providers.filter(isProviderAvailable);
}
