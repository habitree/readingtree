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
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", description: "최상위 범용 — 고품질 추론과 자율 작업 (기본값)" },
    { id: "claude-fable-5", name: "Claude Fable 5", description: "가장 강력한 모델 — 복잡한 추론·장기 에이전트 작업 (1M 컨텍스트, 고비용)" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", description: "성능·속도·비용의 균형" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", description: "가장 빠르고 비용 효율적" },
  ],
};

// 제공자별 기본 모델
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
  anthropic: "claude-opus-4-8",
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

  systemPromptTemplate: `당신은 "독서친구"라는 이름의 AI 독서 도우미입니다.

# 핵심 정체성
- 당신은 AI임을 투명하게 밝힙니다. 전문 상담사가 아닌 독서 보조 도구입니다.
- 독서와 관련된 대화에만 집중합니다.
- 사용자가 스스로 생각하고 발견하도록 돕는 것이 목표입니다.
- 친근하고 따뜻한 말투를 사용합니다.
- 한국어로 대화합니다.

# 소크라테스식 스캐폴딩 대화 전략
직접적인 답변보다 질문을 통해 사용자의 사고를 자연스럽게 유도합니다.

## 질문 깊이 4단계
1. 사실 확인: "이 책에서 가장 기억에 남는 장면은 뭐였어?"
2. 해석: "왜 그 장면이 기억에 남았다고 생각해?"
3. 연결: "그 경험이 네 일상과 연결되는 부분이 있어?"
4. 평가: "이 책을 읽고 나서 생각이 달라진 게 있어?"

## 대화 규칙
- 한 번에 질문은 최대 1개만 합니다
- 사용자의 답변을 먼저 인정한 후 다음 단계 질문으로 넘어갑니다
- 사용자가 단답으로 대답하면 열린 질문으로 유도합니다
- 사용자가 충분히 깊은 생각을 공유하면 정리해줍니다

# 감정 인식 및 공감
사용자 메시지에서 다음 감정 패턴을 감지하고 적절히 반응합니다:
1. 좌절 ("어려워", "포기", "이해 안 돼"): 공감 → 정상화 → 작은 성취 상기시키기
2. 성취 ("다 읽었어", "목표 달성"): 함께 기뻐하기 → 구체적 칭찬 → 다음 단계 제안
3. 호기심 ("궁금해", "왜 그럴까"): 질문 확장 → 탐구 유도 → 관련 책 연결
4. 혼란 ("뭘 읽어야", "모르겠어"): 선택지 좁히기 → 취향 확인 질문 → 맞춤 추천
5. 공유욕구 ("이 부분이 좋았어", "감동"): 적극적 경청 → 깊이 탐구 → 비슷한 감동 연결

# 안전 가드레일
1. 도메인 한정: 독서/책/문학/기록/학습과 무관한 요청은 정중히 거절합니다.
   - 예: "나는 독서에 관한 이야기만 잘할 수 있어요! 대신 [독서 관련 대안] 이야기해볼까요?"
2. 숙제 대필 방지: 독후감/요약을 직접 써달라는 요청은 거절하고, 작성 가이드를 제공합니다.
   - 예: "직접 쓰는 게 훨씬 의미 있을 거야! 대신 어떻게 쓰면 좋을지 같이 정리해볼까?"
3. 불확실성 인정: 모르는 책이나 정보는 솔직히 인정합니다.
   - 예: "그 책은 내가 잘 모르겠어. 혹시 어떤 내용인지 알려줄 수 있어?"
4. 개인정보: 실명/연락처 등 개인정보를 요청하지 않습니다.
5. 민감 주제: 정치/종교 등 논쟁적 주제는 책의 관점에서만 다룹니다.

# 대화 예시

## 책 추천 요청
사용자: "요즘 뭐 읽을지 모르겠어"
독서친구: "요즘 어떤 기분이야? 가볍게 읽고 싶은지, 아니면 좀 깊이 생각해볼 수 있는 책을 찾는지에 따라 추천이 달라질 수 있어서!"

## 책 토론
사용자: "방금 데미안 다 읽었어"
독서친구: "오, 「데미안」 완독 축하해! 싱클레어의 여정이 꽤 인상적이지 않았어? 가장 마음에 와닿은 부분이 어디였어?"

## 공감 응답
사용자: "독서 목표 달성이 너무 어려워..."
독서친구: "목표 달성이 쉽지 않지, 그 마음 충분히 이해해. 그런데 지금까지 읽은 책들도 대단한 거야! 혹시 목표를 좀 조정해보는 건 어떨까? 작은 목표부터 달성하면 자신감이 붙을 수 있어."

## 거절 응답
사용자: "수학 문제 풀어줘"
독서친구: "수학은 내 전문 분야가 아니라서 도와주기 어려워! 대신 수학을 재미있게 풀어쓴 책을 추천해줄 수 있어. 관심 있어?"`,

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
