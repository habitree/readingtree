# SA-06: API Migration Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-06 |
| **이름** | API Migration Agent |
| **역할** | AI API 라우트를 app/api/ai/로 이동 |
| **판단 범위** | 파일 이동, import 경로 수정, Provider 사용으로 전환 |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- chat/route.ts를 ai/chat/route.ts로 이동
- 인라인 함수를 lib/ai/providers import로 변경
- 기존 경로에서 redirect 설정

### 하지 않는 것
- API 로직 수정
- 새로운 API 추가
- 인증/권한 로직 변경

---

## 3. 입력 스키마

```typescript
interface SA06Input {
  migration: {
    source: string;
    target: string;
    providerImports: {
      provider: string;
      functions: string[];
      importPath: string;
    }[];
    removeInlineFunctions: string[];
  };
}
```

### 입력 예시
```json
{
  "migration": {
    "source": "app/api/chat/route.ts",
    "target": "app/api/ai/chat/route.ts",
    "providerImports": [
      {
        "provider": "openai",
        "functions": ["callOpenAI", "parseOpenAIStream"],
        "importPath": "@/lib/ai/providers/openai"
      },
      {
        "provider": "anthropic",
        "functions": ["callAnthropic", "parseAnthropicStream"],
        "importPath": "@/lib/ai/providers/anthropic"
      }
    ],
    "removeInlineFunctions": ["callOpenAI", "parseOpenAIStream", "callAnthropic", "parseAnthropicStream"]
  }
}
```

---

## 4. 출력 스키마

```typescript
interface SA06Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  migration: {
    source: string;
    target: string;
    completed: boolean;
    inlineFunctionsRemoved: number;
    importsAdded: number;
  };

  redirectSetup: boolean;

  compileResult: {
    success: boolean;
    errors?: string[];
  };

  uncertainty: {
    level: "LOW" | "MEDIUM" | "HIGH";
    type?: string;
    message?: string;
  };

  nextStepReady: boolean;
}
```

---

## 5. 품질 기준

| 기준 | 검증 방법 |
|------|----------|
| API 동작 유지 | 기능 테스트 |
| import 경로 정확 | 빌드 테스트 |
| 스트리밍 동작 | /chat 페이지 테스트 |
| 기존 경로 호환 | redirect 테스트 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 이동 및 수정 성공 | LOW | 진행 |
| import 오류 | MEDIUM | 수정 후 재시도 |
| 스트리밍 동작 실패 | HIGH | 에스컬레이션 |
| Provider 함수 누락 | HIGH | 에스컬레이션 |

---

## 7. 실행 명령

### Task 6-1: route.ts 이동 및 수정
```
subagent_type: general-purpose
prompt: |
  app/api/chat/route.ts를 app/api/ai/chat/route.ts로 이동하고 수정하세요.

  **작업 내용**:

  1. 원본 파일 읽기

  2. 다음 import 추가:
     ```typescript
     import { callOpenAI, parseOpenAIStream } from "@/lib/ai/providers/openai";
     import { callAnthropic, parseAnthropicStream } from "@/lib/ai/providers/anthropic";
     ```

  3. 인라인 함수 정의 제거:
     - callOpenAI 함수 정의 제거
     - parseOpenAIStream 함수 정의 제거
     - callAnthropic 함수 정의 제거
     - parseAnthropicStream 함수 정의 제거

  4. 새 위치에 수정된 내용 작성

  5. 기존 파일 redirect 설정:
     ```typescript
     // app/api/chat/route.ts
     // @deprecated app/api/ai/chat/route.ts로 이동됨
     export { POST } from './ai/chat/route';
     ```

  결과를 JSON으로 보고하세요.
```

---

## 8. 검증 명령

```bash
# 파일 확인
ls -la app/api/ai/chat/
cat app/api/ai/chat/route.ts | head -30

# redirect 확인
cat app/api/chat/route.ts

# 빌드 테스트
npm run build

# 기능 테스트 (수동)
# /chat 페이지에서 채팅 테스트
```
