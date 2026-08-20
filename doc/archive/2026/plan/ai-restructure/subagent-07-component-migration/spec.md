# SA-07: Component Migration Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-07 |
| **이름** | Component Migration Agent |
| **역할** | AI 관련 컴포넌트를 components/ai/로 이동 |
| **판단 범위** | 파일 복사, import 경로 수정, re-export 설정 |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- chat/ 폴더 전체 이동
- ai-settings-panel.tsx 이동
- import 경로 업데이트
- 기존 위치 re-export 설정

### 하지 않는 것
- UI 수정
- 스타일 변경
- 컴포넌트 로직 수정

---

## 3. 입력 스키마

```typescript
interface SA07Input {
  folderMigrations: {
    source: string;
    target: string;
    updateImports: {
      from: string;
      to: string;
    }[];
  }[];

  fileMigrations: {
    source: string;
    target: string;
    updateImports: {
      from: string;
      to: string;
    }[];
  }[];
}
```

### 입력 예시
```json
{
  "folderMigrations": [
    {
      "source": "components/chat",
      "target": "components/ai/chat",
      "updateImports": [
        { "from": "@/types/chat", "to": "@/types/ai" },
        { "from": "@/app/actions/chat", "to": "@/app/actions/ai" }
      ]
    }
  ],
  "fileMigrations": [
    {
      "source": "components/admin/ai-settings-panel.tsx",
      "target": "components/ai/admin/ai-settings-panel.tsx",
      "updateImports": [
        { "from": "@/types/ai-settings", "to": "@/types/ai" },
        { "from": "@/app/actions/ai-settings", "to": "@/app/actions/ai" }
      ]
    }
  ]
}
```

---

## 4. 출력 스키마

```typescript
interface SA07Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  foldersMigrated: {
    source: string;
    target: string;
    filesCount: number;
    reExportSet: boolean;
  }[];

  filesMigrated: {
    source: string;
    target: string;
    importsUpdated: number;
    reExportSet: boolean;
  }[];

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
| 컴포넌트 렌더링 | 페이지 테스트 |
| import 경로 정확 | 빌드 테스트 |
| 스타일 유지 | 시각적 확인 |
| props 타입 유지 | TypeScript 체크 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 파일 이동 성공 | LOW | 진행 |
| import 경로 오류 | MEDIUM | 수정 후 재시도 |
| 컴포넌트 렌더링 실패 | HIGH | 에스컬레이션 |

---

## 7. 실행 명령

### Task 7-1: chat/ 폴더 이동
```
subagent_type: general-purpose
prompt: |
  components/chat/ 폴더 전체를 components/ai/chat/로 이동하세요.

  **작업 내용**:

  1. components/chat/ 내 모든 파일 목록 확인

  2. 각 파일에서 import 경로 변경:
     - @/types/chat → @/types/ai
     - @/app/actions/chat → @/app/actions/ai

  3. 수정된 파일들을 components/ai/chat/에 작성

  4. 기존 components/chat/ 파일들을 re-export로 변경:
     ```typescript
     // components/chat/chat-interface.tsx
     export * from '../ai/chat/chat-interface';
     ```

  5. 각 파일에 대해 동일하게 처리

  결과를 JSON으로 보고하세요.
```

### Task 7-2: ai-settings-panel.tsx 이동
```
subagent_type: general-purpose
prompt: |
  components/admin/ai-settings-panel.tsx를 components/ai/admin/ai-settings-panel.tsx로 이동하세요.

  **작업 내용**:

  1. 원본 파일 읽기

  2. import 경로 변경:
     - @/types/ai-settings → @/types/ai
     - @/app/actions/ai-settings → @/app/actions/ai

  3. 새 위치에 수정된 내용 작성

  4. 기존 파일 re-export:
     ```typescript
     export * from '../ai/admin/ai-settings-panel';
     ```

  결과를 JSON으로 보고하세요.
```

---

## 8. 검증 명령

```bash
# 파일 확인
ls -la components/ai/chat/
ls -la components/ai/admin/

# re-export 확인
cat components/chat/chat-interface.tsx
cat components/admin/ai-settings-panel.tsx

# 빌드 테스트
npm run build

# 페이지 테스트 (수동)
# /chat 페이지 동작 확인
# /admin 페이지 AI 설정 패널 확인
```
