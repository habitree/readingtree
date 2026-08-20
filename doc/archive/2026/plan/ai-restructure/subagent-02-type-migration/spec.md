# SA-02: Type Migration Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-02 |
| **이름** | Type Migration Agent |
| **역할** | AI 관련 타입 파일을 types/ai/로 이동 및 re-export 설정 |
| **판단 범위** | 파일 복사 및 경로 수정만 (내용 판단 없음) |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- 지정된 타입 파일을 새 위치로 복사
- 기존 파일을 re-export로 변경
- index.ts에 통합 export 작성

### 하지 않는 것
- 타입 내용 수정
- 새로운 타입 추가
- 타입 오류 수정

---

## 3. 입력 스키마

```typescript
interface SA02Input {
  // 이동할 타입 파일 목록
  migrations: {
    source: string;      // 원본 파일 경로
    target: string;      // 대상 파일 경로
    reExportPath: string; // 기존 파일에서 re-export할 경로
  }[];

  // index.ts 설정
  indexFile: {
    path: string;        // types/ai/index.ts 경로
    exports: string[];   // export할 모듈 목록
  };
}
```

### 입력 예시
```json
{
  "migrations": [
    {
      "source": "types/chat.ts",
      "target": "types/ai/chat.ts",
      "reExportPath": "./ai/chat"
    },
    {
      "source": "types/persona.ts",
      "target": "types/ai/persona.ts",
      "reExportPath": "./ai/persona"
    },
    {
      "source": "types/ai-settings.ts",
      "target": "types/ai/settings.ts",
      "reExportPath": "./ai/settings"
    }
  ],
  "indexFile": {
    "path": "types/ai/index.ts",
    "exports": ["./chat", "./persona", "./settings"]
  }
}
```

---

## 4. 출력 스키마

```typescript
interface SA02Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  // 이동 완료된 파일
  migrated: {
    source: string;
    target: string;
    reExportSet: boolean;
  }[];

  // 실패 항목
  failed: {
    source: string;
    reason: string;
  }[];

  // index.ts 생성 결과
  indexCreated: boolean;

  // 불확실성
  uncertainty: {
    level: "LOW" | "MEDIUM" | "HIGH";
    type?: "INSUFFICIENT_INFO" | "CONFLICTING_SIGNALS" | "OUT_OF_SCOPE";
    message?: string;
  };

  nextStepReady: boolean;
}
```

### 출력 예시 (성공)
```json
{
  "status": "SUCCESS",
  "migrated": [
    { "source": "types/chat.ts", "target": "types/ai/chat.ts", "reExportSet": true },
    { "source": "types/persona.ts", "target": "types/ai/persona.ts", "reExportSet": true },
    { "source": "types/ai-settings.ts", "target": "types/ai/settings.ts", "reExportSet": true }
  ],
  "failed": [],
  "indexCreated": true,
  "uncertainty": { "level": "LOW" },
  "nextStepReady": true
}
```

---

## 5. 품질 기준

| 기준 | 검증 방법 |
|------|----------|
| 원본 파일 내용 보존 | diff 비교 |
| re-export 정상 동작 | TypeScript import 테스트 |
| index.ts export 정상 | `import * from '@/types/ai'` 테스트 |
| 기존 import 경로 호환 | 빌드 오류 없음 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 파일 이동 성공 | LOW | 진행 |
| 대상 파일 이미 존재 | MEDIUM | 에스컬레이션 (덮어쓰기 여부) |
| 원본 파일 없음 | HIGH | 에스컬레이션 |
| 타입 오류 발생 | MEDIUM | 보고 후 진행 |

---

## 7. 에스컬레이션 조건

```
에스컬레이션 발생 조건:
1. 원본 파일이 존재하지 않음
2. 대상 위치에 다른 파일이 이미 존재
3. re-export 설정 후 import 오류 발생

에스컬레이션 시 전달 정보:
- 문제 파일 경로
- 오류 유형
- 권장 조치 (덮어쓰기/병합/건너뛰기)
```

---

## 8. 실행 명령

### Claude Code Task 명령
```
subagent_type: general-purpose
prompt: |
  다음 타입 파일들을 이동하고 re-export를 설정하세요:

  **Task 1: types/chat.ts → types/ai/chat.ts**
  1. types/chat.ts 파일 내용을 읽으세요
  2. types/ai/chat.ts 파일을 생성하고 동일한 내용을 작성하세요
  3. types/chat.ts를 다음으로 교체하세요:
     ```typescript
     // @deprecated types/ai/chat.ts로 이동됨. 하위 호환성 유지.
     export * from './ai/chat';
     ```

  **Task 2: types/persona.ts → types/ai/persona.ts**
  동일한 방식으로 처리

  **Task 3: types/ai-settings.ts → types/ai/settings.ts**
  동일한 방식으로 처리

  **Task 4: types/ai/index.ts 작성**
  ```typescript
  // AI 타입 통합 진입점
  export * from './chat';
  export * from './persona';
  export * from './settings';
  ```

  완료 후 결과를 JSON 형식으로 보고하세요.
```

---

## 9. 검증 명령

```bash
# 파일 존재 확인
ls -la types/ai/

# re-export 확인
cat types/chat.ts
cat types/persona.ts
cat types/ai-settings.ts

# TypeScript 컴파일 테스트
npx tsc --noEmit types/ai/index.ts
```
