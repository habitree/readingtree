# Phase 3: AI Provider 분리 (핵심 작업)

**실행 방식:** Task 3-1, 3-2, 3-3 병렬 → Task 3-4 순차

---

## Task 3-1: lib/ai/providers/gemini.ts 생성

### 소스 파일
- `lib/api/gemini.ts` (기존)

### Subagent 명령
```
lib/api/gemini.ts를 분석하여 lib/ai/providers/gemini.ts를 생성하세요.

1. 다음 내용을 포함하세요:
   - getGeminiClient() 함수
   - summarizeWithGemini() 함수 (summarizeBookDescription의 Gemini 부분)
   - 필요한 타입 정의

2. lib/ai/providers/gemini.ts 파일 구조:
   - import 문
   - 타입 정의
   - 클라이언트 초기화 함수
   - 요약 함수
   - export

3. 기존 lib/api/gemini.ts는 수정하지 마세요 (나중에 처리)
```

### 예상 코드 구조
```typescript
/**
 * Gemini AI Provider
 * Google Gemini API 클라이언트 및 유틸리티
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// 타입 정의
export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

// 클라이언트 초기화
export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new GoogleGenerativeAI(apiKey);
}

// 텍스트 생성
export async function generateWithGemini(
  prompt: string,
  options?: GeminiGenerateOptions
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: options?.model || "gemini-2.0-flash"
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// 책 요약 전용
export async function summarizeWithGemini(
  description: string
): Promise<string> {
  // 기존 summarizeBookDescription의 Gemini 로직
  // ...
}
```

---

## Task 3-2: lib/ai/providers/openai.ts 생성

### 소스 파일
- `lib/api/gemini.ts` (getOpenAIClient)
- `app/api/chat/route.ts` (callOpenAI, parseOpenAIStream)

### Subagent 명령
```
lib/api/gemini.ts와 app/api/chat/route.ts를 분석하여 lib/ai/providers/openai.ts를 생성하세요.

1. 다음 내용을 포함하세요:
   - getOpenAIClient() 함수 (gemini.ts에서)
   - callOpenAI() 함수 (route.ts에서)
   - parseOpenAIStream() 함수 (route.ts에서)
   - 필요한 타입 정의

2. 기존 파일들은 수정하지 마세요 (나중에 처리)
```

### 예상 코드 구조
```typescript
/**
 * OpenAI Provider
 * OpenAI API 클라이언트 및 유틸리티
 */

import OpenAI from "openai";

// 타입 정의
export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

// 클라이언트 초기화
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new OpenAI({ apiKey });
}

// 채팅 완성 (스트리밍)
export async function callOpenAI(
  modelId: string,
  systemPrompt: string,
  chatHistory: OpenAIMessage[],
  message: string,
  settings: OpenAIGenerateOptions
): Promise<ReadableStream> {
  // 기존 route.ts의 callOpenAI 로직
  // ...
}

// 스트림 파싱
export async function parseOpenAIStream(
  stream: ReadableStream,
  callbacks: StreamCallbacks
): Promise<void> {
  // 기존 route.ts의 parseOpenAIStream 로직
  // ...
}

// 단순 텍스트 생성 (비스트리밍)
export async function generateWithOpenAI(
  prompt: string,
  options?: OpenAIGenerateOptions
): Promise<string> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: options?.model || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature || 0.7,
  });
  return completion.choices[0]?.message?.content?.trim() || "";
}
```

---

## Task 3-3: lib/ai/providers/anthropic.ts 생성

### 소스 파일
- `app/api/chat/route.ts` (callAnthropic, parseAnthropicStream)

### Subagent 명령
```
app/api/chat/route.ts를 분석하여 lib/ai/providers/anthropic.ts를 생성하세요.

1. 다음 내용을 포함하세요:
   - getAnthropicClient() 함수 (새로 생성)
   - callAnthropic() 함수 (route.ts에서)
   - parseAnthropicStream() 함수 (route.ts에서)
   - 필요한 타입 정의

2. 기존 파일은 수정하지 마세요 (나중에 처리)
```

### 예상 코드 구조
```typescript
/**
 * Anthropic Provider
 * Anthropic Claude API 클라이언트 및 유틸리티
 */

import Anthropic from "@anthropic-ai/sdk";

// 타입 정의
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

// 클라이언트 초기화
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new Anthropic({ apiKey });
}

// 채팅 완성 (스트리밍)
export async function callAnthropic(
  modelId: string,
  systemPrompt: string,
  chatHistory: AnthropicMessage[],
  message: string,
  settings: AnthropicGenerateOptions
): Promise<ReadableStream> {
  // 기존 route.ts의 callAnthropic 로직
  // ...
}

// 스트림 파싱
export async function parseAnthropicStream(
  stream: ReadableStream,
  callbacks: StreamCallbacks
): Promise<void> {
  // 기존 route.ts의 parseAnthropicStream 로직
  // ...
}

// 단순 텍스트 생성 (비스트리밍)
export async function generateWithAnthropic(
  prompt: string,
  options?: AnthropicGenerateOptions
): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: options?.model || "claude-3-5-sonnet-latest",
    max_tokens: options?.maxTokens || 2048,
    messages: [{ role: "user", content: prompt }],
  });
  const textContent = message.content.find(c => c.type === "text");
  return textContent?.text?.trim() || "";
}
```

---

## Task 3-4: lib/ai/providers/index.ts 생성

### 의존성
- Task 3-1, 3-2, 3-3 완료 후 실행

### Subagent 명령
```
lib/ai/providers/index.ts를 생성하세요.

1. 공통 Provider 인터페이스 정의
2. 모든 provider export
3. getProvider() 팩토리 함수 생성
```

### 예상 코드 구조
```typescript
/**
 * AI Providers 진입점
 * 모든 AI Provider를 여기서 export합니다.
 */

// 공통 타입
export type AIProviderType = "google" | "openai" | "anthropic";

export interface StreamCallbacks {
  onContent: (content: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Provider exports
export * from "./gemini";
export * from "./openai";
export * from "./anthropic";

// 팩토리 함수
import { generateWithGemini } from "./gemini";
import { generateWithOpenAI } from "./openai";
import { generateWithAnthropic } from "./anthropic";

export async function generateText(
  provider: AIProviderType,
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  switch (provider) {
    case "google":
      return generateWithGemini(prompt, options);
    case "openai":
      return generateWithOpenAI(prompt, options);
    case "anthropic":
      return generateWithAnthropic(prompt, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

---

## 검증 방법

### 1. TypeScript 컴파일 확인
```bash
npx tsc --noEmit lib/ai/providers/*.ts
```

### 2. 단위 테스트 (선택)
```typescript
// lib/ai/providers/__tests__/providers.test.ts
import { getGeminiClient } from "../gemini";
import { getOpenAIClient } from "../openai";
import { getAnthropicClient } from "../anthropic";

describe("AI Providers", () => {
  test("Gemini client initializes", () => {
    expect(() => getGeminiClient()).not.toThrow();
  });

  test("OpenAI client initializes", () => {
    expect(() => getOpenAIClient()).not.toThrow();
  });

  test("Anthropic client initializes", () => {
    expect(() => getAnthropicClient()).not.toThrow();
  });
});
```

---

## 완료 체크리스트

- [ ] lib/ai/providers/gemini.ts 생성됨
- [ ] lib/ai/providers/openai.ts 생성됨
- [ ] lib/ai/providers/anthropic.ts 생성됨
- [ ] lib/ai/providers/index.ts 생성됨
- [ ] TypeScript 컴파일 오류 없음
- [ ] 기존 파일들은 수정되지 않음

---

## 다음 단계

Phase 3 완료 후:
1. Phase 4: Prompts 이동
2. Phase 5: Actions 이동 (새 providers 사용)
3. Phase 6: API 라우트 이동 (새 providers 사용)
