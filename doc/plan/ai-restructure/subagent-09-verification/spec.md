# SA-09: Verification Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-09 |
| **이름** | Verification Agent |
| **역할** | 전체 마이그레이션 검증 및 결과 보고 |
| **판단 범위** | 검증 실행 및 결과 수집 (합격/불합격 판단 없음) |
| **에스컬레이션 대상** | 오케스트레이터 (최종 판단 위임) |

---

## 2. 역할/책임 경계

### 하는 것
- 빌드 테스트 실행
- import 경로 검증
- 기능 테스트 체크리스트 생성
- 검증 결과 보고서 작성

### 하지 않는 것
- 합격/불합격 최종 판단
- 오류 수정
- 롤백 결정

> **중요**: 이 Agent는 검증 "결과"만 보고하고,
> "결정"은 오케스트레이터가 수행합니다.

---

## 3. 입력 스키마

```typescript
interface SA09Input {
  verifications: {
    type: "build" | "import" | "function" | "manual";
    name: string;
    command?: string;      // build, import 타입용
    testPath?: string;     // function 타입용
    checklist?: string[];  // manual 타입용
  }[];

  expectedStructure: {
    directories: string[];
    files: string[];
  };
}
```

### 입력 예시
```json
{
  "verifications": [
    {
      "type": "build",
      "name": "TypeScript 빌드",
      "command": "npm run build"
    },
    {
      "type": "import",
      "name": "구 경로 import 검색",
      "command": "grep -r 'from.*lib/api/gemini' --include='*.ts' --include='*.tsx'"
    },
    {
      "type": "manual",
      "name": "기능 테스트",
      "checklist": [
        "/chat 페이지 챗봇 동작",
        "/books 페이지 책 설명 요약",
        "/profile 페이지 페르소나 분석",
        "/admin AI 설정 관리"
      ]
    }
  ],
  "expectedStructure": {
    "directories": [
      "lib/ai/providers",
      "lib/ai/prompts",
      "app/actions/ai",
      "app/api/ai/chat",
      "components/ai/chat",
      "components/ai/admin",
      "types/ai",
      "doc/ai"
    ],
    "files": [
      "lib/ai/providers/gemini.ts",
      "lib/ai/providers/openai.ts",
      "lib/ai/providers/anthropic.ts",
      "lib/ai/providers/index.ts",
      "lib/ai/prompts/chat-prompts.ts",
      "app/actions/ai/index.ts",
      "types/ai/index.ts"
    ]
  }
}
```

---

## 4. 출력 스키마

```typescript
interface SA09Output {
  status: "PASS" | "FAIL" | "PARTIAL";

  // 빌드 검증 결과
  buildResult: {
    success: boolean;
    output: string;
    errors?: string[];
  };

  // 구조 검증 결과
  structureResult: {
    directoriesOk: boolean;
    filesOk: boolean;
    missingDirectories: string[];
    missingFiles: string[];
  };

  // Import 검증 결과
  importResult: {
    oldImportsFound: number;
    locations: {
      file: string;
      line: number;
      import: string;
    }[];
  };

  // 기능 테스트 체크리스트
  manualTestChecklist: {
    item: string;
    testMethod: string;
    expectedResult: string;
  }[];

  // 종합 보고서
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };

  // 불확실성 (검증 자체의 불확실성)
  uncertainty: {
    level: "LOW" | "MEDIUM" | "HIGH";
    type?: string;
    message?: string;
  };

  // 오케스트레이터에게 전달할 정보
  recommendedAction: "COMPLETE" | "FIX_REQUIRED" | "ROLLBACK_RECOMMENDED";
  fixRequired?: string[];
}
```

### 출력 예시 (성공)
```json
{
  "status": "PASS",
  "buildResult": {
    "success": true,
    "output": "Build completed successfully"
  },
  "structureResult": {
    "directoriesOk": true,
    "filesOk": true,
    "missingDirectories": [],
    "missingFiles": []
  },
  "importResult": {
    "oldImportsFound": 0,
    "locations": []
  },
  "manualTestChecklist": [
    {
      "item": "/chat 페이지 챗봇 동작",
      "testMethod": "페이지 접속 후 메시지 전송",
      "expectedResult": "AI 응답이 스트리밍으로 표시됨"
    },
    {
      "item": "/books 페이지 책 설명 요약",
      "testMethod": "책 목록에서 책소개 컬럼 확인",
      "expectedResult": "25~35자 요약이 표시됨"
    },
    {
      "item": "/profile 페이지 페르소나 분석",
      "testMethod": "프로필 페이지 접속",
      "expectedResult": "페르소나 정보가 표시됨"
    },
    {
      "item": "/admin AI 설정 관리",
      "testMethod": "관리자 페이지 AI 설정 패널 확인",
      "expectedResult": "AI 설정 폼이 정상 렌더링됨"
    }
  ],
  "summary": {
    "totalChecks": 10,
    "passed": 10,
    "failed": 0,
    "warnings": 0
  },
  "uncertainty": { "level": "LOW" },
  "recommendedAction": "COMPLETE"
}
```

### 출력 예시 (일부 실패)
```json
{
  "status": "PARTIAL",
  "buildResult": {
    "success": false,
    "output": "...",
    "errors": ["TS2307: Cannot find module '@/lib/ai/providers/gemini'"]
  },
  "structureResult": {
    "directoriesOk": true,
    "filesOk": false,
    "missingDirectories": [],
    "missingFiles": ["lib/ai/providers/gemini.ts"]
  },
  "importResult": {
    "oldImportsFound": 3,
    "locations": [
      { "file": "app/actions/books.ts", "line": 6, "import": "from '@/lib/api/gemini'" }
    ]
  },
  "summary": {
    "totalChecks": 10,
    "passed": 7,
    "failed": 3,
    "warnings": 0
  },
  "uncertainty": { "level": "MEDIUM" },
  "recommendedAction": "FIX_REQUIRED",
  "fixRequired": [
    "lib/ai/providers/gemini.ts 파일 생성 필요",
    "app/actions/books.ts의 import 경로 수정 필요"
  ]
}
```

---

## 5. 품질 기준

| 기준 | 검증 방법 |
|------|----------|
| 모든 검증 항목 실행 | 체크리스트 완료 |
| 결과 정확성 | 재현 가능한 명령 |
| 보고서 완전성 | 모든 필드 채워짐 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 검증 완료 | LOW | 결과 보고 |
| 일부 검증 실패 | MEDIUM | 실패 항목 상세 보고 |
| 검증 자체 실행 불가 | HIGH | 에스컬레이션 |

---

## 7. 실행 명령

### Task 9-1: 빌드 검증
```
subagent_type: Bash
prompt: |
  npm run build를 실행하고 결과를 보고하세요.

  **보고 형식**:
  - 성공/실패 여부
  - 오류 메시지 (있을 경우)
  - 경고 메시지 (있을 경우)
```

### Task 9-2: 구조 검증
```
subagent_type: Bash
prompt: |
  다음 디렉토리와 파일이 존재하는지 확인하세요:

  **디렉토리**:
  - lib/ai/providers
  - lib/ai/prompts
  - app/actions/ai
  - app/api/ai/chat
  - components/ai/chat
  - components/ai/admin
  - types/ai
  - doc/ai

  **파일**:
  - lib/ai/providers/gemini.ts
  - lib/ai/providers/openai.ts
  - lib/ai/providers/anthropic.ts
  - lib/ai/providers/index.ts
  - app/actions/ai/index.ts
  - types/ai/index.ts

  결과를 JSON으로 보고하세요.
```

### Task 9-3: Import 검증
```
subagent_type: Bash
prompt: |
  프로젝트에서 구 경로를 직접 import하는 파일을 검색하세요:

  **검색할 패턴**:
  - "from '@/lib/api/gemini'"
  - "from '@/types/chat'" (re-export가 아닌 직접 import)
  - "from '@/app/actions/chat'" (re-export가 아닌 직접 import)

  **검색 명령**:
  grep -rn "from.*@/lib/api/gemini" --include="*.ts" --include="*.tsx" .
  grep -rn "from.*@/types/chat" --include="*.ts" --include="*.tsx" . | grep -v "re-export"

  결과를 JSON으로 보고하세요.
```

### Task 9-4: 기능 테스트 체크리스트 생성
```
subagent_type: general-purpose
prompt: |
  AI 기능 수동 테스트를 위한 상세 체크리스트를 작성하세요.

  **포함할 기능**:
  1. 채팅 기능 (/chat)
     - 새 세션 생성
     - 메시지 전송 및 스트리밍 응답
     - 세션 목록 조회

  2. 책 요약 기능 (/books)
     - 책 목록에서 책소개 표시
     - 새 책 추가 시 요약 생성

  3. 페르소나 분석 (/profile)
     - 페르소나 정보 표시
     - 분석 업데이트

  4. AI 설정 관리 (/admin)
     - 설정 목록 조회
     - 설정 수정
     - Provider 연결 테스트

  각 항목에 대해 테스트 방법과 예상 결과를 명시하세요.
```

---

## 8. 검증 보고서 템플릿

```markdown
# AI 구조화 검증 보고서

## 실행 일시
YYYY-MM-DD HH:mm

## 빌드 검증
- 결과: PASS / FAIL
- 오류: (있을 경우)

## 구조 검증
- 디렉토리: OK / 누락 N개
- 파일: OK / 누락 N개

## Import 검증
- 구 경로 import: N개 발견
- 위치: (있을 경우)

## 수동 테스트 체크리스트
- [ ] /chat 페이지 동작
- [ ] /books 페이지 요약 표시
- [ ] /profile 페이지 페르소나
- [ ] /admin AI 설정

## 종합 판단
- 권장 조치: COMPLETE / FIX_REQUIRED / ROLLBACK
- 수정 필요 항목: (있을 경우)
```
