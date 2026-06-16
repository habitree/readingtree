/**
 * AI Provider 타입 정의
 * 모든 AI Provider에 공통으로 사용되는 타입
 */

// Provider 종류
export type AIProviderType = "gemini" | "openai" | "anthropic";

// Provider 상태
export type AIProviderStatus = "active" | "inactive" | "error" | "rate_limited";

// 기본 메시지 타입
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 채팅 메시지 (확장)
export interface AIChatMessage extends AIMessage {
  id?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

// 생성 옵션
export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

// 채팅 설정
export interface AIChatSettings {
  temperature: number;
  maxOutputTokens: number;
  systemPrompt?: string;
}

// 스트리밍 콜백
export interface AIStreamCallbacks {
  onContent: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

// Provider 설정
export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

// 요약 옵션
export interface AISummarizeOptions {
  maxLength?: number;
  style?: "concise" | "detailed" | "bullet";
  language?: string;
}

// Provider 응답
export interface AIResponse {
  content: string;
  model: string;
  usage?: AIUsage;
  finishReason?: string;
}

// 사용량 정보
export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Provider 인터페이스 (AIProvider 타입과 혼동 방지)
export interface AIProviderInterface {
  readonly type: AIProviderType;
  readonly isAvailable: boolean;

  // 텍스트 생성
  generate(prompt: string, options?: AIGenerateOptions): Promise<string>;

  // 채팅 (비스트리밍)
  chat(
    messages: AIMessage[],
    options?: AIGenerateOptions
  ): Promise<AIResponse>;

  // 채팅 (스트리밍)
  streamChat(
    messages: AIMessage[],
    options?: AIGenerateOptions,
    callbacks?: AIStreamCallbacks
  ): Promise<void>;

  // 요약
  summarize(text: string, options?: AISummarizeOptions): Promise<string>;
}

// Provider 팩토리 타입
export type AIProviderFactory = (config?: AIProviderConfig) => AIProviderInterface;

// 모델 정보
export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProviderType;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  capabilities: AIModelCapability[];
}

// 모델 기능
export type AIModelCapability =
  | "chat"
  | "completion"
  | "embedding"
  | "vision"
  | "function_calling"
  | "json_mode";

// Provider 에러
export interface AIProviderError {
  provider: AIProviderType;
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
}

// Rate Limit 정보
export interface AIRateLimitInfo {
  provider: AIProviderType;
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsRemaining?: number;
  tokensRemaining?: number;
  resetAt?: Date;
}

// Provider Health Check 결과
export interface AIProviderHealth {
  provider: AIProviderType;
  status: AIProviderStatus;
  latencyMs?: number;
  lastChecked: Date;
  error?: string;
}

// 지원되는 모델 목록 (상수)
export const SUPPORTED_MODELS: AIModelInfo[] = [
  // Gemini
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.3,
    capabilities: ["chat", "completion", "vision", "function_calling"],
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5,
    capabilities: ["chat", "completion", "vision", "function_calling"],
  },

  // OpenAI
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    capabilities: ["chat", "completion", "vision", "function_calling", "json_mode"],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    capabilities: ["chat", "completion", "vision", "function_calling", "json_mode"],
  },

  // Anthropic
  {
    id: "claude-fable-5",
    name: "Claude Fable 5",
    provider: "anthropic",
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    inputPricePerMillion: 10,
    outputPricePerMillion: 50,
    capabilities: ["chat", "completion", "vision", "function_calling", "json_mode"],
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    inputPricePerMillion: 5,
    outputPricePerMillion: 25,
    capabilities: ["chat", "completion", "vision", "function_calling", "json_mode"],
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    contextWindow: 1000000,
    maxOutputTokens: 64000,
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    capabilities: ["chat", "completion", "vision", "function_calling", "json_mode"],
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    inputPricePerMillion: 1,
    outputPricePerMillion: 5,
    capabilities: ["chat", "completion", "vision", "function_calling", "json_mode"],
  },
];

// 모델 ID로 모델 정보 조회
export function getModelInfo(modelId: string): AIModelInfo | undefined {
  return SUPPORTED_MODELS.find((m) => m.id === modelId);
}

// Provider별 모델 목록 조회
export function getModelsByProvider(provider: AIProviderType): AIModelInfo[] {
  return SUPPORTED_MODELS.filter((m) => m.provider === provider);
}

// 기능별 모델 목록 조회
export function getModelsByCapability(capability: AIModelCapability): AIModelInfo[] {
  return SUPPORTED_MODELS.filter((m) => m.capabilities.includes(capability));
}
