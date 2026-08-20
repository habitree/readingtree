# SA-04: Prompt Migration Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-04 |
| **이름** | Prompt Migration Agent |
| **역할** | AI 프롬프트 파일을 lib/ai/prompts/로 이동 |
| **판단 범위** | 파일 복사 및 프롬프트 추출 (내용 판단 없음) |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- chat-prompts.ts 이동
- summarization-prompts.ts 추출 생성
- 기존 파일 re-export 설정

### 하지 않는 것
- 프롬프트 내용 수정
- 프롬프트 품질 평가
- 새로운 프롬프트 작성

---

## 3. 입력 스키마

```typescript
interface SA04Input {
  migrations: {
    source: string;
    target: string;
    reExportPath: string;
  }[];

  extractions: {
    sourceFile: string;
    targetFile: string;
    promptNames: string[];
  }[];
}
```

### 입력 예시
```json
{
  "migrations": [
    {
      "source": "lib/api/chat-prompts.ts",
      "target": "lib/ai/prompts/chat-prompts.ts",
      "reExportPath": "../ai/prompts/chat-prompts"
    }
  ],
  "extractions": [
    {
      "sourceFile": "lib/api/gemini.ts",
      "targetFile": "lib/ai/prompts/summarization-prompts.ts",
      "promptNames": ["BOOK_SUMMARY_PROMPT"]
    }
  ]
}
```

---

## 4. 출력 스키마

```typescript
interface SA04Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  migrated: {
    source: string;
    target: string;
    reExportSet: boolean;
  }[];

  extracted: {
    promptName: string;
    targetFile: string;
    extracted: boolean;
  }[];

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
| 프롬프트 내용 보존 | 문자열 비교 |
| re-export 동작 | import 테스트 |
| 프롬프트 구조 유지 | 타입 체크 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 파일 이동 성공 | LOW | 진행 |
| 프롬프트 추출 실패 | MEDIUM | 보고 후 진행 |
| 원본 파일 없음 | HIGH | 에스컬레이션 |

---

## 7. 실행 명령

### Task 4-1: chat-prompts.ts 이동
```
subagent_type: general-purpose
prompt: |
  lib/api/chat-prompts.ts를 lib/ai/prompts/chat-prompts.ts로 복사하세요.

  1. 원본 파일 읽기
  2. 새 위치에 동일 내용 작성
  3. 기존 파일을 re-export로 변경:
     ```typescript
     // @deprecated lib/ai/prompts/chat-prompts.ts로 이동됨
     export * from '../ai/prompts/chat-prompts';
     ```

  결과를 JSON으로 보고하세요.
```

### Task 4-2: summarization-prompts.ts 생성
```
subagent_type: general-purpose
prompt: |
  lib/api/gemini.ts의 summarizeBookDescription() 함수 내 프롬프트를 추출하여
  lib/ai/prompts/summarization-prompts.ts를 생성하세요.

  **추출할 내용**: 책 요약 프롬프트 텍스트

  **생성할 파일 구조**:
  ```typescript
  /**
   * 책 요약 프롬프트
   */

  export const BOOK_SUMMARY_PROMPT_TEMPLATE = `
  다음 책소개를 다음 조건에 정확히 맞게 요약해주세요:
  ... (기존 프롬프트 내용)
  `;

  export function generateSummaryPrompt(description: string): string {
    return BOOK_SUMMARY_PROMPT_TEMPLATE + `\n\n책소개:\n${description}`;
  }
  ```

  결과를 JSON으로 보고하세요.
```

---

## 8. 검증 명령

```bash
# 파일 확인
ls -la lib/ai/prompts/
cat lib/ai/prompts/chat-prompts.ts | head -20
cat lib/ai/prompts/summarization-prompts.ts

# re-export 확인
cat lib/api/chat-prompts.ts
```
