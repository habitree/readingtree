# AI Provider 가이드

## 지원 Provider

| Provider | 모델 | 설명 |
|----------|------|------|
| Google Gemini | gemini-2.0-flash | 빠른 응답, 비용 효율적 (기본값) |
| Google Gemini | gemini-1.5-pro | 고급 추론, 긴 컨텍스트 |
| Google Gemini | gemini-2.0-flash-thinking-exp-01-21 | 향상된 추론 능력 |
| OpenAI | gpt-4o | 강력한 멀티모달 모델 |
| OpenAI | gpt-4o-mini | 빠르고 비용 효율적 |
| OpenAI | gpt-4-turbo | 고급 추론, 긴 컨텍스트 |
| OpenAI | gpt-3.5-turbo | 빠른 응답, 간단한 작업 |
| Anthropic | claude-3-5-sonnet-latest | 균형 잡힌 성능 |
| Anthropic | claude-3-opus-latest | 가장 강력한 추론 |
| Anthropic | claude-3-haiku-latest | 빠르고 비용 효율적 |

## 설정 방법

### 1. 환경 변수 설정

```bash
# .env.local
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. 관리자 설정 패널

`/admin` 페이지의 AI 설정 패널에서:

1. **Provider 선택** (Google/OpenAI/Anthropic)
2. **모델 선택**
3. **시스템 프롬프트** 커스터마이징
4. **생성 파라미터** 조정
   - temperature (0.0 ~ 2.0)
   - maxOutputTokens (기본: 2048)
   - topP (0.0 ~ 1.0)
5. **컨텍스트 설정**
   - 이전 메시지 포함 수
   - 페르소나, 최근 책, 기록, 목표 포함 여부
6. **연결 테스트**

## Provider별 특징

### Google Gemini

```typescript
// 기본 설정
const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
```

**장점:**
- 무료 티어 제공 (일일 요청 제한 있음)
- 빠른 응답 속도
- 한국어 지원 우수

**사용 예시:**

```typescript
import { generateWithGemini, createGeminiChatSession, streamGeminiMessage } from '@/lib/ai/providers/gemini';

// 단순 텍스트 생성
const text = await generateWithGemini('프롬프트', {
  temperature: 0.7,
  maxOutputTokens: 1024
});

// 채팅 세션 (스트리밍)
const chat = createGeminiChatSession(
  { model: 'gemini-2.0-flash', temperature: 0.7 },
  systemPrompt,
  history
);

await streamGeminiMessage(chat, message, {
  onContent: (text) => console.log(text),
  onDone: () => console.log('완료'),
  onError: (error) => console.error(error),
});
```

### OpenAI

```typescript
// 기본 설정
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;
```

**장점:**
- 안정적인 API
- 풍부한 문서와 커뮤니티
- 다양한 모델 선택

**사용 예시:**

```typescript
import { callOpenAI, parseOpenAIStream, generateWithOpenAI } from '@/lib/ai/providers/openai';

// 단순 텍스트 생성
const text = await generateWithOpenAI('프롬프트', {
  model: 'gpt-4o-mini',
  temperature: 0.7
});

// 스트리밍 채팅
const stream = await callOpenAI(
  modelId,
  systemPrompt,
  history,
  message,
  { temperature: 0.7, maxOutputTokens: 2048 }
);

await parseOpenAIStream(
  stream,
  (text) => console.log(text),
  () => console.log('완료'),
  (error) => console.error(error)
);
```

### Anthropic

```typescript
// 기본 설정
const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = "2023-06-01";
```

**장점:**
- 긴 컨텍스트 지원
- 안전한 응답
- 우수한 추론 능력

**참고:** Anthropic SDK 대신 fetch API를 직접 사용합니다.

**사용 예시:**

```typescript
import { callAnthropic, parseAnthropicStream, generateWithAnthropic } from '@/lib/ai/providers/anthropic';

// 단순 텍스트 생성
const text = await generateWithAnthropic('프롬프트', {
  model: 'claude-3-5-sonnet-latest',
  temperature: 0.7
});

// 스트리밍 채팅
const stream = await callAnthropic(
  modelId,
  systemPrompt,
  history,
  message,
  { temperature: 0.7, maxOutputTokens: 2048 }
);

await parseAnthropicStream(
  stream,
  (text) => console.log(text),
  () => console.log('완료'),
  (error) => console.error(error)
);
```

## 통합 API 사용

Provider에 관계없이 동일한 인터페이스로 사용:

```typescript
import {
  generateText,
  summarizeBook,
  isProviderAvailable,
  getAvailableProviders,
  type AIProviderType
} from '@/lib/ai/providers';

// Provider 사용 가능 여부 확인
if (isProviderAvailable('google')) {
  const response = await generateText('google', '안녕하세요');
}

// 사용 가능한 Provider 목록
const providers = getAvailableProviders(); // ['google', 'openai', ...]

// 책 요약 (Provider 지정)
const summary = await summarizeBook('google', description);
```

## Fallback 메커니즘

### 책 요약 기능

```typescript
// app/actions/ai/summarization.ts 내부 로직
async function summarizeBookDescription(description: string): Promise<string> {
  try {
    // 1차: Gemini 시도
    return await summarizeWithGemini(description);
  } catch {
    try {
      // 2차: OpenAI 시도
      return await summarizeWithOpenAI(description);
    } catch {
      // 3차: 원본 자르기
      return description.substring(0, 35).trim();
    }
  }
}
```

### 채팅 기능

채팅은 관리자 설정에 따라 단일 Provider만 사용합니다.
Provider 장애 시 에러 메시지를 사용자에게 표시합니다.

## 비용 최적화

1. **기본 모델**: gemini-2.0-flash (무료 티어 제공)
2. **Fallback**: 유료 API는 Gemini 실패 시에만 사용
3. **캐싱**: 책 요약은 DB에 저장하여 재사용
4. **토큰 제한**: maxOutputTokens 설정으로 비용 제어

## 생성 파라미터 가이드

| 파라미터 | 범위 | 기본값 | 설명 |
|---------|------|--------|------|
| temperature | 0.0 ~ 2.0 | 0.7 | 높을수록 창의적, 낮을수록 일관적 |
| maxOutputTokens | 1 ~ 모델별 상한 | 2048 | 최대 출력 길이 |
| topP | 0.0 ~ 1.0 | 1.0 | 누적 확률 샘플링 |
| frequencyPenalty | 0.0 ~ 2.0 | 0.0 | 반복 토큰 페널티 |
| presencePenalty | 0.0 ~ 2.0 | 0.0 | 새 토픽 유도 |

### 권장 설정

| 용도 | temperature | maxOutputTokens |
|------|-------------|-----------------|
| 일반 대화 | 0.7 | 2048 |
| 책 추천 | 0.8 | 1024 |
| 요약 | 0.3 | 512 |
| 분석 | 0.5 | 2048 |

## 타입 정의

```typescript
// types/ai/settings.ts

export type AIProvider = "openai" | "google" | "anthropic";

export interface GenerationSettings {
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ContextSettings {
  maxHistoryMessages: number;
  includePersona: boolean;
  includeRecentBooks: boolean;
  includeRecentNotes: boolean;
  includeReadingGoal: boolean;
  maxRecentBooks: number;
  maxRecentNotes: number;
}
```

## 트러블슈팅

### API 키 오류

```
Error: GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.
```

**해결:** `.env.local` 파일에 API 키 추가 후 서버 재시작

### 스트리밍 오류

```
Error: 스트림 오류
```

**원인:** 네트워크 불안정 또는 API 서버 문제
**해결:** 재시도 또는 다른 Provider로 전환

### 토큰 초과

```
Error: Maximum token limit exceeded
```

**해결:** maxOutputTokens 값 감소 또는 입력 프롬프트 축소
