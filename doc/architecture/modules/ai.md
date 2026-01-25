# AI Module (AI)

> **Module Key**: `ai`
> **Layer**: B. 플랫폼/지원 모듈
> **Last Updated**: 2025-01-25

---

## 1. 개요

AI 기반 채팅, 요약, 추천 등의 기능을 담당하는 플랫폼 모듈입니다.

### 1.1 주요 기능

- AI 채팅 (독서 도우미)
- 독서 페르소나 관리
- 노트 요약
- AI 설정 관리
- 사용자 AI 메모리

---

## 2. 파일 구조

```
app/
├── (main)/
│   ├── chat/page.tsx
│   └── persona/page.tsx
├── actions/
│   ├── ai/
│   │   ├── chat.ts
│   │   ├── persona.ts
│   │   ├── settings.ts
│   │   ├── summarization.ts
│   │   └── index.ts
│   └── chat.ts
└── api/
    ├── ai/
    └── chat/

components/
├── ai/
│   ├── chat/
│   │   ├── chat-message.tsx
│   │   └── chat-sidebar.tsx
│   └── admin/
│       └── ai-settings-panel.tsx
├── chat/
│   ├── chat-interface.tsx
│   ├── chat-input.tsx
│   ├── chat-message.tsx
│   └── chat-sidebar.tsx
└── persona/
    ├── persona-card.tsx
    └── reading-stats.tsx

lib/
├── ai/
│   ├── providers/
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── index.ts
│   ├── prompts/
│   │   ├── chat-prompts.ts
│   │   ├── summarization-prompts.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── stream-parser.ts
│   │   ├── token-counter.ts
│   │   └── index.ts
│   └── index.ts
└── api/
    ├── chat-prompts.ts
    └── gemini.ts

types/
├── ai/
│   ├── chat.ts
│   ├── persona.ts
│   ├── settings.ts
│   ├── providers.ts
│   └── index.ts
├── chat.ts
├── persona.ts
└── ai-settings.ts
```

---

## 3. 데이터 모델

### 3.1 테이블

| 테이블 | 설명 |
|--------|------|
| `chat_sessions` | 채팅 세션 |
| `chat_messages` | 채팅 메시지 |
| `user_personas` | 사용자 페르소나 |
| `ai_settings` | AI 전역 설정 |
| `user_ai_memories` | 사용자별 AI 메모리 |

### 3.2 주요 타입

```typescript
interface ChatSession {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface UserPersona {
  id: string
  user_id: string
  name: string
  description: string | null
  reading_preferences: Record<string, unknown> | null
}

interface AISettings {
  id: string
  provider: 'gemini' | 'openai' | 'anthropic'
  model: string
  temperature: number
  max_tokens: number
}
```

---

## 4. 핵심 함수

### 4.1 Server Actions

| 함수 | 파일 | 설명 |
|------|------|------|
| `getChatSessions()` | `app/actions/ai/chat.ts` | 채팅 세션 목록 |
| `createChatSession()` | `app/actions/ai/chat.ts` | 세션 생성 |
| `sendMessage()` | `app/actions/ai/chat.ts` | 메시지 전송 |
| `getPersonas()` | `app/actions/ai/persona.ts` | 페르소나 목록 |
| `updatePersona()` | `app/actions/ai/persona.ts` | 페르소나 수정 |
| `getAISettings()` | `app/actions/ai/settings.ts` | AI 설정 조회 |
| `summarizeNotes()` | `app/actions/ai/summarization.ts` | 노트 요약 |

### 4.2 AI Providers

| Provider | 파일 | 설명 |
|----------|------|------|
| Gemini | `lib/ai/providers/gemini.ts` | Google Gemini |
| OpenAI | `lib/ai/providers/openai.ts` | GPT-4 등 |
| Anthropic | `lib/ai/providers/anthropic.ts` | Claude |

---

## 5. 의존성

### 5.1 이 모듈이 사용하는 것

- `identity`: 사용자 확인
- `library`: 책 컨텍스트
- `records`: 노트 컨텍스트
- `shared`: UI 컴포넌트, 유틸리티

### 5.2 이 모듈을 사용하는 것

- `admin`: AI 설정 관리
- `home`: AI 기능 바로가기 (선택적)

---

## 6. AI Provider 추상화

```typescript
// lib/ai/providers/index.ts
interface AIProvider {
  chat(messages: Message[]): Promise<string>
  stream(messages: Message[]): AsyncIterable<string>
}

export function getProvider(name: ProviderName): AIProvider {
  switch (name) {
    case 'gemini': return new GeminiProvider()
    case 'openai': return new OpenAIProvider()
    case 'anthropic': return new AnthropicProvider()
  }
}
```

---

## 7. 환경 변수

```env
# AI Provider Keys
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Default Provider
AI_DEFAULT_PROVIDER=gemini
```

---

## 8. 스트리밍 응답

AI 응답은 스트리밍으로 처리하여 UX를 개선합니다:

```typescript
// Streaming response example
async function* streamChat(messages: Message[]) {
  const provider = getProvider('gemini')
  for await (const chunk of provider.stream(messages)) {
    yield chunk
  }
}
```

---

## 9. 참고 문서

- [AI 설정 가이드](../../question/ai-settings.md) (있을 경우)
- [lib/ai/README.md](../../../lib/ai/README.md) (있을 경우)
