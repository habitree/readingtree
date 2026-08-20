# SA-03: Provider Extraction Agent ★핵심

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-03 |
| **이름** | Provider Extraction Agent |
| **역할** | AI Provider별 코드를 lib/ai/providers/로 추출 |
| **판단 범위** | 함수 추출 및 재구성 (로직 변경 없음) |
| **에스컬레이션 대상** | 오케스트레이터 |
| **중요도** | ★★★ 핵심 작업 |

---

## 2. 역할/책임 경계

### 하는 것
- 기존 코드에서 Provider별 함수 추출
- 새 파일에 함수 재배치
- 타입 정의 추가
- 공통 인터페이스 생성

### 하지 않는 것
- 함수 로직 수정
- 새로운 기능 추가
- 기존 파일 삭제 (re-export만)
- API 동작 변경

---

## 3. 입력 스키마

```typescript
interface SA03Input {
  // 추출 대상 파일들
  sourceFiles: {
    path: string;
    functions: string[];  // 추출할 함수명
  }[];

  // 생성할 Provider 파일들
  targetProviders: {
    name: string;         // gemini | openai | anthropic
    targetPath: string;   // 생성할 파일 경로
    functions: string[];  // 포함할 함수명
  }[];

  // index.ts 설정
  indexPath: string;
}
```

### 입력 예시
```json
{
  "sourceFiles": [
    {
      "path": "lib/api/gemini.ts",
      "functions": ["getGeminiClient", "getOpenAIClient", "summarizeBookDescription"]
    },
    {
      "path": "app/api/chat/route.ts",
      "functions": ["callOpenAI", "parseOpenAIStream", "callAnthropic", "parseAnthropicStream"]
    }
  ],
  "targetProviders": [
    {
      "name": "gemini",
      "targetPath": "lib/ai/providers/gemini.ts",
      "functions": ["getGeminiClient", "generateWithGemini", "summarizeWithGemini"]
    },
    {
      "name": "openai",
      "targetPath": "lib/ai/providers/openai.ts",
      "functions": ["getOpenAIClient", "callOpenAI", "parseOpenAIStream", "generateWithOpenAI"]
    },
    {
      "name": "anthropic",
      "targetPath": "lib/ai/providers/anthropic.ts",
      "functions": ["getAnthropicClient", "callAnthropic", "parseAnthropicStream", "generateWithAnthropic"]
    }
  ],
  "indexPath": "lib/ai/providers/index.ts"
}
```

---

## 4. 출력 스키마

```typescript
interface SA03Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  // 생성된 Provider 파일
  providersCreated: {
    name: string;
    path: string;
    functions: string[];
    linesOfCode: number;
  }[];

  // 추출된 함수 목록
  extractedFunctions: {
    name: string;
    sourceFile: string;
    targetFile: string;
    extracted: boolean;
  }[];

  // index.ts 생성 결과
  indexCreated: boolean;

  // 컴파일 결과
  compileResult: {
    success: boolean;
    errors?: string[];
  };

  // 불확실성
  uncertainty: {
    level: "LOW" | "MEDIUM" | "HIGH";
    type?: "INSUFFICIENT_INFO" | "CONFLICTING_SIGNALS" | "OUT_OF_SCOPE";
    message?: string;
    details?: string[];
  };

  nextStepReady: boolean;
}
```

### 출력 예시 (성공)
```json
{
  "status": "SUCCESS",
  "providersCreated": [
    { "name": "gemini", "path": "lib/ai/providers/gemini.ts", "functions": ["getGeminiClient", "generateWithGemini", "summarizeWithGemini"], "linesOfCode": 85 },
    { "name": "openai", "path": "lib/ai/providers/openai.ts", "functions": ["getOpenAIClient", "callOpenAI", "parseOpenAIStream", "generateWithOpenAI"], "linesOfCode": 120 },
    { "name": "anthropic", "path": "lib/ai/providers/anthropic.ts", "functions": ["getAnthropicClient", "callAnthropic", "parseAnthropicStream", "generateWithAnthropic"], "linesOfCode": 110 }
  ],
  "extractedFunctions": [
    { "name": "getGeminiClient", "sourceFile": "lib/api/gemini.ts", "targetFile": "lib/ai/providers/gemini.ts", "extracted": true },
    { "name": "getOpenAIClient", "sourceFile": "lib/api/gemini.ts", "targetFile": "lib/ai/providers/openai.ts", "extracted": true },
    { "name": "callOpenAI", "sourceFile": "app/api/chat/route.ts", "targetFile": "lib/ai/providers/openai.ts", "extracted": true },
    { "name": "callAnthropic", "sourceFile": "app/api/chat/route.ts", "targetFile": "lib/ai/providers/anthropic.ts", "extracted": true }
  ],
  "indexCreated": true,
  "compileResult": { "success": true },
  "uncertainty": { "level": "LOW" },
  "nextStepReady": true
}
```

---

## 5. 품질 기준

| 기준 | 검증 방법 |
|------|----------|
| 함수 시그니처 동일 | 원본과 비교 |
| 로직 변경 없음 | 코드 diff |
| TypeScript 컴파일 성공 | `npx tsc --noEmit` |
| import 구문 정확 | 파일 상단 확인 |
| export 구문 정확 | 파일 하단 확인 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 함수 추출 성공 | LOW | 진행 |
| 함수 의존성 누락 | MEDIUM | 보고 후 진행 |
| 컴파일 오류 | HIGH | 에스컬레이션 |
| 원본 함수 찾기 실패 | HIGH | 에스컬레이션 |
| 순환 의존성 발견 | HIGH | 에스컬레이션 |

---

## 7. 에스컬레이션 조건

```
에스컬레이션 발생 조건:
1. 추출 대상 함수를 원본에서 찾을 수 없음
2. 함수 간 순환 의존성 발생
3. TypeScript 컴파일 오류
4. 필요한 import가 불명확

에스컬레이션 시 전달 정보:
- 문제 함수명
- 오류 메시지
- 원본 파일 위치
- 권장 조치
```

---

## 8. 실행 명령

### 8.1 Gemini Provider (Task 3-1)

```
subagent_type: general-purpose
prompt: |
  lib/api/gemini.ts를 분석하여 lib/ai/providers/gemini.ts를 생성하세요.

  **분석할 원본 파일**: lib/api/gemini.ts

  **생성할 파일**: lib/ai/providers/gemini.ts

  **포함할 내용**:
  1. import 구문 (GoogleGenerativeAI)
  2. 타입 정의:
     - GeminiGenerateOptions { model?, temperature?, maxOutputTokens? }
  3. 함수:
     - getGeminiClient(): GoogleGenerativeAI
     - generateWithGemini(prompt, options?): Promise<string>
     - summarizeWithGemini(description): Promise<string>

  **주의사항**:
  - 기존 summarizeBookDescription의 Gemini 부분만 추출
  - 로직 변경 없이 그대로 이동
  - 기존 파일은 수정하지 않음

  완료 후 결과를 JSON으로 보고하세요.
```

### 8.2 OpenAI Provider (Task 3-2)

```
subagent_type: general-purpose
prompt: |
  lib/api/gemini.ts와 app/api/chat/route.ts를 분석하여 lib/ai/providers/openai.ts를 생성하세요.

  **분석할 원본 파일**:
  - lib/api/gemini.ts (getOpenAIClient)
  - app/api/chat/route.ts (callOpenAI, parseOpenAIStream)

  **생성할 파일**: lib/ai/providers/openai.ts

  **포함할 내용**:
  1. import 구문 (OpenAI)
  2. 타입 정의:
     - OpenAIMessage { role, content }
     - OpenAIGenerateOptions { model?, temperature?, maxTokens?, stream? }
     - StreamCallbacks { onContent, onDone, onError }
  3. 함수:
     - getOpenAIClient(): OpenAI
     - callOpenAI(modelId, systemPrompt, chatHistory, message, settings): Promise<ReadableStream>
     - parseOpenAIStream(stream, callbacks): Promise<void>
     - generateWithOpenAI(prompt, options?): Promise<string> (새로 추가)

  **주의사항**:
  - 로직 변경 없이 그대로 추출
  - 기존 파일들은 수정하지 않음

  완료 후 결과를 JSON으로 보고하세요.
```

### 8.3 Anthropic Provider (Task 3-3)

```
subagent_type: general-purpose
prompt: |
  app/api/chat/route.ts를 분석하여 lib/ai/providers/anthropic.ts를 생성하세요.

  **분석할 원본 파일**: app/api/chat/route.ts

  **생성할 파일**: lib/ai/providers/anthropic.ts

  **포함할 내용**:
  1. import 구문 (Anthropic)
  2. 타입 정의:
     - AnthropicMessage { role, content }
     - AnthropicGenerateOptions { model?, temperature?, maxTokens?, stream? }
     - StreamCallbacks { onContent, onDone, onError }
  3. 함수:
     - getAnthropicClient(): Anthropic (새로 작성)
     - callAnthropic(modelId, systemPrompt, chatHistory, message, settings): Promise<ReadableStream>
     - parseAnthropicStream(stream, callbacks): Promise<void>
     - generateWithAnthropic(prompt, options?): Promise<string> (새로 추가)

  **주의사항**:
  - callAnthropic, parseAnthropicStream은 로직 변경 없이 추출
  - getAnthropicClient는 새로 작성 (다른 provider 참고)
  - 기존 파일은 수정하지 않음

  완료 후 결과를 JSON으로 보고하세요.
```

### 8.4 Index 파일 (Task 3-4)

```
subagent_type: general-purpose
prompt: |
  lib/ai/providers/index.ts를 생성하세요.

  **포함할 내용**:
  1. 공통 타입:
     - AIProviderType = "google" | "openai" | "anthropic"
     - GenerateOptions { model?, temperature?, maxTokens?, stream? }
     - StreamCallbacks { onContent, onDone, onError }
  2. Re-export:
     - export * from './gemini'
     - export * from './openai'
     - export * from './anthropic'
  3. 팩토리 함수:
     - generateText(provider, prompt, options?): Promise<string>

  완료 후 결과를 JSON으로 보고하세요.
```

---

## 9. 검증 명령

```bash
# 파일 생성 확인
ls -la lib/ai/providers/

# TypeScript 컴파일 테스트
npx tsc --noEmit lib/ai/providers/gemini.ts
npx tsc --noEmit lib/ai/providers/openai.ts
npx tsc --noEmit lib/ai/providers/anthropic.ts
npx tsc --noEmit lib/ai/providers/index.ts

# 전체 프로젝트 빌드 테스트
npm run build
```

---

## 10. 생성 파일 템플릿

### lib/ai/providers/gemini.ts
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

// 책 요약 전용 (기존 로직 유지)
export async function summarizeWithGemini(description: string): Promise<string> {
  // 기존 summarizeBookDescription의 Gemini 로직
  // ...
}
```
