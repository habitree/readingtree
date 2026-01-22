# AI 기능 모듈

Habitree Reading Hub의 AI 기능을 담당하는 모듈입니다.

## 개요

이 모듈은 AI 기반 기능들을 제공합니다:
- **챗봇**: 독서친구 AI 챗봇 (GPT/Gemini/Claude 지원)
- **책 요약**: 책소개 자동 요약 (25-35자)
- **페르소나 분석**: 사용자 독서 성향 분석
- **OCR**: 이미지에서 텍스트 추출

## 디렉토리 구조

```
lib/ai/
├── providers/              # AI 제공자별 클라이언트
│   ├── gemini.ts           # Google Gemini API
│   ├── openai.ts           # OpenAI API
│   ├── anthropic.ts        # Anthropic API
│   └── index.ts            # 통합 진입점
├── prompts/                # 프롬프트 관리
│   ├── chat-prompts.ts     # 채팅 프롬프트
│   ├── summarization-prompts.ts # 요약 프롬프트
│   └── index.ts            # 통합 진입점
├── utils/                  # 유틸리티 모듈
│   ├── stream-parser.ts    # SSE 스트림 파서
│   ├── token-counter.ts    # 토큰 카운터/비용 추정
│   └── index.ts            # 통합 진입점
└── index.ts                # 라이브러리 진입점

app/actions/ai/             # Server Actions
├── chat.ts                 # 채팅 관련 액션
├── settings.ts             # AI 설정 관리
├── persona.ts              # 페르소나 분석
├── ocr.ts                  # OCR 관련 액션
├── summarization.ts        # 책 요약
└── index.ts                # 통합 진입점

app/api/ai/                 # API 라우트
├── chat/
│   └── route.ts            # 채팅 API (스트리밍 SSE)
└── summarize/
    └── route.ts            # 요약 API

components/ai/              # UI 컴포넌트
├── chat/                   # 채팅 관련 컴포넌트
│   ├── chat-message.tsx    # 메시지 표시
│   ├── chat-input.tsx      # 입력 컴포넌트
│   ├── chat-sidebar.tsx    # 사이드바
│   └── chat-interface.tsx  # 메인 인터페이스
└── admin/                  # 관리자 설정 패널
    └── ai-settings-panel.tsx

types/ai/                   # 타입 정의
├── chat.ts                 # 채팅 타입
├── persona.ts              # 페르소나 타입
├── settings.ts             # AI 설정 타입
├── providers.ts            # Provider 타입
└── index.ts                # 통합 진입점
```

## 빠른 시작

### 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 사용 예시

```typescript
// 텍스트 생성 (통합 API)
import { generateText } from '@/lib/ai/providers';

const response = await generateText('google', '안녕하세요');

// 책 요약
import { getBookDescriptionSummary } from '@/app/actions/ai';

const summary = await getBookDescriptionSummary(bookId, isbn, title);

// Provider 사용 가능 여부 확인
import { isProviderAvailable, getAvailableProviders } from '@/lib/ai/providers';

if (isProviderAvailable('google')) {
  // Gemini API 사용 가능
}

const providers = getAvailableProviders(); // ['google', 'openai', ...]

// 토큰 추정 및 비용 계산
import { estimateTokens, estimateCost } from '@/lib/ai/utils';

const tokens = estimateTokens('안녕하세요');
const cost = estimateCost('gpt-4o-mini', tokens.totalTokens, 100);
console.log(`예상 비용: $${cost.totalCost.toFixed(6)}`);

// 스트림 파싱
import { parseProviderStream } from '@/lib/ai/utils';

await parseProviderStream(stream, 'openai', {
  onContent: (text) => console.log(text),
  onDone: () => console.log('완료'),
  onError: (err) => console.error(err),
});
```

## API 엔드포인트

### POST /api/ai/chat
채팅 메시지 전송 및 스트리밍 응답

### POST /api/ai/summarize
텍스트 요약 API

```typescript
// 요청
{
  text: string;           // 요약할 텍스트
  provider?: 'gemini' | 'openai' | 'auto';  // Provider 선택 (기본: auto)
  maxLength?: number;     // 최대 길이 (기본: 35)
}

// 응답
{
  success: boolean;
  summary?: string;
  provider?: string;      // 실제 사용된 Provider
  inputLength?: number;
  outputLength?: number;
  error?: string;
}
```

## 유틸리티

### 토큰 카운터 (`lib/ai/utils/token-counter.ts`)

```typescript
// 토큰 수 추정
estimateTokens(text) → TokenEstimate

// 메시지 배열 토큰 추정
estimateMessagesTokens(messages) → number

// 비용 추정
estimateCost(modelId, inputTokens, outputTokens) → CostEstimate

// 토큰 제한에 맞게 텍스트 자르기
truncateToTokenLimit(text, maxTokens) → string

// 컨텍스트 윈도우 크기 조회
getContextWindowSize(modelId) → number
```

### 스트림 파서 (`lib/ai/utils/stream-parser.ts`)

```typescript
// SSE 스트림 파싱
parseSSEStream(stream, onEvent, onError)

// Provider별 스트림 파싱
parseProviderStream(stream, provider, callbacks)

// SSE 인코딩
encodeSSE(text) → string
encodeSSEDone() → string
encodeSSEError(error) → string
```

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| GEMINI_API_KEY | Google Gemini API 키 | O |
| OPENAI_API_KEY | OpenAI API 키 | - |
| ANTHROPIC_API_KEY | Anthropic API 키 | - |

- O: 필수 (기본 Provider)
- -: 선택 (해당 Provider 사용 시 필요)

## 관련 문서

- [아키텍처](./architecture.md) - 전체 구조 및 데이터 흐름
- [Provider 가이드](./providers.md) - AI Provider별 설정 및 사용법
