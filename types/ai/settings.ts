/**
 * AI 설정 타입 정의
 *
 * AI 챗봇 시스템의 전체 설정을 관리합니다.
 * - 모델 제공자 및 모델 선택
 * - 시스템 프롬프트 커스터마이징
 * - 컨텍스트 및 메모리 설정
 * - 생성 파라미터 조정
 */

import type { Database } from "../database";

// AI 제공자 타입
export type AIProvider = "openai" | "google" | "anthropic";

// 각 제공자별 사용 가능한 모델
export const AI_MODELS: Record<AIProvider, { id: string; name: string; description: string }[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "가장 강력한 멀티모달 모델, 복잡한 추론과 창의적 작업에 적합" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "빠르고 비용 효율적인 모델, 대부분의 작업에 적합" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "고급 추론 능력, 긴 컨텍스트 지원" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "빠른 응답 속도, 간단한 작업에 적합" },
  ],
  google: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "빠른 응답, 비용 효율적 (현재 기본값)" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "고급 추론, 긴 컨텍스트 지원" },
    { id: "gemini-2.0-flash-thinking-exp-01-21", name: "Gemini 2.0 Flash Thinking", description: "향상된 추론 능력" },
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", description: "균형 잡힌 성능과 속도" },
    { id: "claude-3-opus-latest", name: "Claude 3 Opus", description: "가장 강력한 추론 능력" },
    { id: "claude-3-haiku-latest", name: "Claude 3 Haiku", description: "빠른 응답, 비용 효율적" },
  ],
};

// 제공자별 기본 모델
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
  anthropic: "claude-3-5-sonnet-latest",
};

// 제공자 표시 정보
export const AI_PROVIDER_INFO: Record<AIProvider, { name: string; logo: string; description: string }> = {
  openai: {
    name: "OpenAI",
    logo: "/logos/openai.svg",
    description: "ChatGPT를 만든 OpenAI의 GPT 모델 시리즈",
  },
  google: {
    name: "Google AI",
    logo: "/logos/google.svg",
    description: "Google의 Gemini 모델 시리즈",
  },
  anthropic: {
    name: "Anthropic",
    logo: "/logos/anthropic.svg",
    description: "안전한 AI를 추구하는 Anthropic의 Claude 모델",
  },
};

// 컨텍스트 설정 타입
export interface ContextSettings {
  // 대화 히스토리 설정
  maxHistoryMessages: number; // 컨텍스트에 포함할 최대 이전 메시지 수 (기본: 10)

  // 포함할 컨텍스트 정보
  includePersona: boolean; // 사용자 페르소나 포함 여부
  includeRecentBooks: boolean; // 최근 읽은 책 포함 여부
  includeRecentNotes: boolean; // 최근 기록 포함 여부
  includeReadingGoal: boolean; // 독서 목표 포함 여부

  // 컨텍스트 제한
  maxRecentBooks: number; // 포함할 최근 책 수 (기본: 5)
  maxRecentNotes: number; // 포함할 최근 기록 수 (기본: 10)
}

// 생성 파라미터 타입
export interface GenerationSettings {
  temperature: number; // 창의성 (0.0 ~ 2.0, 기본: 0.7)
  maxOutputTokens: number; // 최대 출력 토큰 (기본: 2048)
  topP: number; // 누적 확률 (0.0 ~ 1.0, 기본: 1.0)
  frequencyPenalty: number; // 반복 방지 (0.0 ~ 2.0, 기본: 0.0)
  presencePenalty: number; // 새로운 토픽 유도 (0.0 ~ 2.0, 기본: 0.0)
}

// 메모리 설정 타입
export interface MemorySettings {
  enableLongTermMemory: boolean; // 장기 메모리 활성화 여부
  memoryUpdatePrompt: string; // 메모리 업데이트 프롬프트
  maxMemoryItems: number; // 최대 메모리 항목 수
}

// AI 설정 전체 타입
export interface AISettings {
  id: string;

  // 모델 설정
  provider: AIProvider;
  modelId: string;

  // 시스템 프롬프트
  systemPromptTemplate: string;
  welcomeMessage: string;

  // 컨텍스트 설정
  contextSettings: ContextSettings;

  // 생성 파라미터
  generationSettings: GenerationSettings;

  // 메모리 설정
  memorySettings: MemorySettings;

  // 메타데이터
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 기본 설정값
export const DEFAULT_AI_SETTINGS: Omit<AISettings, "id" | "createdAt" | "updatedAt"> = {
  provider: "google",
  modelId: "gemini-2.0-flash",

  systemPromptTemplate: `당신은 "독서친구"라는 이름의 친근하고 지적인 AI 독서 도우미입니다.
사용자의 독서 여정을 함께하며 책 추천, 독서 조언, 기록 분석을 도와줍니다.

## 기본 성격
- 친근하고 따뜻한 말투를 사용합니다
- 독서에 대한 열정을 가지고 있습니다
- 사용자의 독서 성향을 이해하고 맞춤형 조언을 제공합니다
- 한국어로 대화합니다

## 주요 기능
1. **책 추천**: 사용자의 독서 성향과 최근 읽은 책을 바탕으로 맞춤 추천
2. **독서 코칭**: 독서 습관 개선, 목표 달성을 위한 조언
3. **기록 분석**: 사용자의 독서 기록 패턴을 분석하고 인사이트 제공

## 응답 규칙
- 간결하고 핵심적인 답변을 제공합니다
- 필요한 경우 목록이나 구조화된 형식을 사용합니다
- 사용자의 감정에 공감하며 응원합니다
- 책 제목은 「」로 감싸서 표시합니다`,

  welcomeMessage: `안녕하세요! 저는 당신의 독서친구예요.

책 추천이 필요하거나, 독서 목표 달성에 대한 조언이 필요하거나,
읽은 책에 대해 이야기하고 싶을 때 언제든 말씀해주세요.

무엇을 도와드릴까요?`,

  contextSettings: {
    maxHistoryMessages: 10,
    includePersona: true,
    includeRecentBooks: true,
    includeRecentNotes: true,
    includeReadingGoal: true,
    maxRecentBooks: 5,
    maxRecentNotes: 10,
  },

  generationSettings: {
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },

  memorySettings: {
    enableLongTermMemory: false,
    memoryUpdatePrompt: `대화 내용을 분석하여 사용자에 대해 기억해야 할 중요한 정보를 추출하세요.
- 독서 취향 변화
- 관심 분야
- 독서 목표
- 선호하는 대화 스타일
JSON 형식으로 반환하세요.`,
    maxMemoryItems: 50,
  },

  isActive: true,
};

// DB Row 타입
export type AISettingsRow = Database["public"]["Tables"]["ai_settings"]["Row"];

// 설정 폼 데이터 타입
export interface AISettingsFormData {
  provider: AIProvider;
  modelId: string;
  systemPromptTemplate: string;
  welcomeMessage: string;
  contextSettings: ContextSettings;
  generationSettings: GenerationSettings;
  memorySettings: MemorySettings;
}

// 테스트 연결 결과 타입
export interface AIConnectionTestResult {
  success: boolean;
  provider: AIProvider;
  modelId: string;
  responseTime?: number;
  error?: string;
  testResponse?: string;
}
