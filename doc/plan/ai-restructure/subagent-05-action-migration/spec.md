# SA-05: Action Migration Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-05 |
| **이름** | Action Migration Agent |
| **역할** | AI Server Actions를 app/actions/ai/로 이동 |
| **판단 범위** | 파일 복사, import 경로 수정, re-export 설정 |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- 지정된 Action 파일 이동
- import 경로 업데이트 (@/types/ai/ 사용)
- 기존 파일 re-export 설정
- index.ts 통합 export

### 하지 않는 것
- 비즈니스 로직 수정
- 새로운 함수 추가
- 데이터베이스 스키마 변경

---

## 3. 입력 스키마

```typescript
interface SA05Input {
  migrations: {
    source: string;
    target: string;
    updateImports: {
      from: string;
      to: string;
    }[];
  }[];

  extractions: {
    sourceFile: string;
    targetFile: string;
    functionNames: string[];
  }[];

  indexFile: {
    path: string;
    exports: string[];
  };
}
```

### 입력 예시
```json
{
  "migrations": [
    {
      "source": "app/actions/chat.ts",
      "target": "app/actions/ai/chat.ts",
      "updateImports": [
        { "from": "@/types/chat", "to": "@/types/ai" }
      ]
    },
    {
      "source": "app/actions/ai-settings.ts",
      "target": "app/actions/ai/settings.ts",
      "updateImports": [
        { "from": "@/types/ai-settings", "to": "@/types/ai" }
      ]
    },
    {
      "source": "app/actions/persona.ts",
      "target": "app/actions/ai/persona.ts",
      "updateImports": [
        { "from": "@/types/persona", "to": "@/types/ai" }
      ]
    },
    {
      "source": "app/actions/ocr.ts",
      "target": "app/actions/ai/ocr.ts",
      "updateImports": []
    }
  ],
  "extractions": [
    {
      "sourceFile": "app/actions/books.ts",
      "targetFile": "app/actions/ai/summarization.ts",
      "functionNames": ["getBookDescriptionSummary"]
    }
  ],
  "indexFile": {
    "path": "app/actions/ai/index.ts",
    "exports": ["./chat", "./settings", "./persona", "./summarization", "./ocr"]
  }
}
```

---

## 4. 출력 스키마

```typescript
interface SA05Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  migrated: {
    source: string;
    target: string;
    importsUpdated: number;
    reExportSet: boolean;
  }[];

  extracted: {
    functionName: string;
    sourceFile: string;
    targetFile: string;
    success: boolean;
  }[];

  indexCreated: boolean;

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
| 함수 시그니처 유지 | 타입 체크 |
| import 경로 정확 | 빌드 테스트 |
| re-export 동작 | import 테스트 |
| 기존 호출 코드 호환 | 전체 빌드 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 파일 이동 성공 | LOW | 진행 |
| import 경로 충돌 | MEDIUM | 보고 후 진행 |
| 함수 추출 실패 | HIGH | 에스컬레이션 |
| 순환 의존성 | HIGH | 에스컬레이션 |

---

## 7. 실행 명령

### Task 5-1: chat.ts 이동
```
subagent_type: general-purpose
prompt: |
  app/actions/chat.ts를 app/actions/ai/chat.ts로 이동하세요.

  1. 원본 파일 읽기
  2. import 경로 변경: @/types/chat → @/types/ai
  3. 새 위치에 수정된 내용 작성
  4. 기존 파일 re-export:
     ```typescript
     export * from './ai/chat';
     ```

  결과를 JSON으로 보고하세요.
```

### Task 5-2: ai-settings.ts → settings.ts
```
subagent_type: general-purpose
prompt: |
  app/actions/ai-settings.ts를 app/actions/ai/settings.ts로 이동하세요.

  1. 원본 파일 읽기
  2. import 경로 변경: @/types/ai-settings → @/types/ai
  3. 새 위치에 수정된 내용 작성
  4. 기존 파일 re-export:
     ```typescript
     export * from './ai/settings';
     ```

  결과를 JSON으로 보고하세요.
```

### Task 5-3: persona.ts 이동
```
subagent_type: general-purpose
prompt: |
  app/actions/persona.ts를 app/actions/ai/persona.ts로 이동하세요.

  1. 원본 파일 읽기
  2. import 경로 변경: @/types/persona → @/types/ai
  3. 새 위치에 수정된 내용 작성
  4. 기존 파일 re-export:
     ```typescript
     export * from './ai/persona';
     ```

  결과를 JSON으로 보고하세요.
```

### Task 5-4: summarization.ts 추출 생성
```
subagent_type: general-purpose
prompt: |
  app/actions/books.ts에서 getBookDescriptionSummary() 함수를 추출하여
  app/actions/ai/summarization.ts를 생성하세요.

  **추출 대상**: getBookDescriptionSummary() 함수 및 관련 import

  **books.ts 수정**:
  - 해당 함수 제거
  - 새 파일에서 import하여 re-export 추가:
    ```typescript
    export { getBookDescriptionSummary } from './ai/summarization';
    ```

  결과를 JSON으로 보고하세요.
```

### Task 5-5: ocr.ts 이동
```
subagent_type: general-purpose
prompt: |
  app/actions/ocr.ts를 app/actions/ai/ocr.ts로 이동하세요.

  1. 원본 파일 읽기
  2. 새 위치에 동일 내용 작성
  3. 기존 파일 re-export:
     ```typescript
     export * from './ai/ocr';
     ```

  결과를 JSON으로 보고하세요.
```

### Task 5-6: index.ts 작성
```
subagent_type: general-purpose
prompt: |
  app/actions/ai/index.ts를 작성하세요:

  ```typescript
  // AI Server Actions 통합 진입점
  export * from './chat';
  export * from './settings';
  export * from './persona';
  export * from './summarization';
  export * from './ocr';
  ```

  결과를 JSON으로 보고하세요.
```

---

## 8. 검증 명령

```bash
# 파일 확인
ls -la app/actions/ai/

# re-export 확인
cat app/actions/chat.ts
cat app/actions/ai-settings.ts
cat app/actions/persona.ts
cat app/actions/ocr.ts

# 빌드 테스트
npm run build
```
