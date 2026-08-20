# SA-01: Directory Setup Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-01 |
| **이름** | Directory Setup Agent |
| **역할** | AI 모듈화를 위한 디렉토리 구조 생성 |
| **판단 범위** | 폴더 생성 여부 확인만 (판단 없음) |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- 지정된 디렉토리 구조 생성
- 기본 index.ts 파일 생성 (빈 export)
- 생성 결과 보고

### 하지 않는 것
- 기존 파일/폴더 수정
- 생성할 폴더 목록 결정
- 파일 내용 작성 (기본 템플릿 외)

---

## 3. 입력 스키마

```typescript
interface SA01Input {
  // 생성할 디렉토리 목록
  directories: {
    path: string;           // 절대 경로 또는 프로젝트 루트 기준 상대 경로
    createIndex: boolean;   // index.ts 생성 여부
    indexContent?: string;  // index.ts 내용 (선택)
  }[];

  // 프로젝트 루트 경로
  projectRoot: string;
}
```

### 입력 예시
```json
{
  "projectRoot": "C:/Users/N100274/OneDrive/2.PJT/readingtree_v4.0.0",
  "directories": [
    { "path": "lib/ai", "createIndex": true },
    { "path": "lib/ai/providers", "createIndex": false },
    { "path": "lib/ai/prompts", "createIndex": false },
    { "path": "lib/ai/utils", "createIndex": false },
    { "path": "app/actions/ai", "createIndex": true },
    { "path": "app/api/ai/chat", "createIndex": false },
    { "path": "components/ai/chat", "createIndex": false },
    { "path": "components/ai/admin", "createIndex": false },
    { "path": "types/ai", "createIndex": true },
    { "path": "doc/ai", "createIndex": false }
  ]
}
```

---

## 4. 출력 스키마

```typescript
interface SA01Output {
  // 실행 결과
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  // 생성된 항목
  created: {
    path: string;
    type: "directory" | "file";
  }[];

  // 실패한 항목
  failed: {
    path: string;
    reason: string;
  }[];

  // 불확실성
  uncertainty: {
    level: "LOW" | "MEDIUM" | "HIGH";
    type?: "INSUFFICIENT_INFO" | "CONFLICTING_SIGNALS" | "OUT_OF_SCOPE";
    message?: string;
  };

  // 다음 단계 조건
  nextStepReady: boolean;
}
```

### 출력 예시 (성공)
```json
{
  "status": "SUCCESS",
  "created": [
    { "path": "lib/ai", "type": "directory" },
    { "path": "lib/ai/index.ts", "type": "file" },
    { "path": "lib/ai/providers", "type": "directory" },
    { "path": "lib/ai/prompts", "type": "directory" },
    { "path": "lib/ai/utils", "type": "directory" },
    { "path": "app/actions/ai", "type": "directory" },
    { "path": "app/actions/ai/index.ts", "type": "file" },
    { "path": "app/api/ai/chat", "type": "directory" },
    { "path": "components/ai/chat", "type": "directory" },
    { "path": "components/ai/admin", "type": "directory" },
    { "path": "types/ai", "type": "directory" },
    { "path": "types/ai/index.ts", "type": "file" },
    { "path": "doc/ai", "type": "directory" }
  ],
  "failed": [],
  "uncertainty": {
    "level": "LOW"
  },
  "nextStepReady": true
}
```

---

## 5. 품질 기준

| 기준 | 검증 방법 |
|------|----------|
| 모든 지정 디렉토리 생성됨 | `ls` 또는 `dir` 명령으로 확인 |
| index.ts 파일 생성됨 | 파일 존재 및 내용 확인 |
| 기존 파일 손상 없음 | git status로 변경 사항 확인 |
| 출력 스키마 준수 | JSON 구조 검증 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 디렉토리 생성 성공 | LOW | 진행 |
| 일부 디렉토리 이미 존재 | LOW | 진행 (skip) |
| 권한 오류 | HIGH | 에스컬레이션 |
| 경로 오류 | MEDIUM | 에스컬레이션 |

---

## 7. 에스컬레이션 조건

```
에스컬레이션 발생 조건:
1. 파일 시스템 권한 오류
2. 잘못된 경로 지정
3. 디스크 공간 부족

에스컬레이션 시 전달 정보:
- 실패한 경로
- 오류 메시지
- 시도한 명령어
```

---

## 8. 실행 명령

### Claude Code Task 명령
```
subagent_type: Bash
prompt: |
  다음 디렉토리 구조를 생성하세요:

  1. 디렉토리 생성:
  mkdir -p lib/ai/providers lib/ai/prompts lib/ai/utils
  mkdir -p app/actions/ai
  mkdir -p app/api/ai/chat
  mkdir -p components/ai/chat components/ai/admin
  mkdir -p types/ai
  mkdir -p doc/ai

  2. index.ts 파일 생성:
  - lib/ai/index.ts: "// AI Library Entry Point\nexport {};"
  - app/actions/ai/index.ts: "// AI Actions Entry Point\nexport {};"
  - types/ai/index.ts: "// AI Types Entry Point\nexport {};"

  3. 생성 결과를 JSON 형식으로 보고하세요.
```

---

## 9. 검증 명령

```bash
# 디렉토리 존재 확인
ls -la lib/ai/
ls -la app/actions/ai/
ls -la app/api/ai/
ls -la components/ai/
ls -la types/ai/
ls -la doc/ai/

# index.ts 파일 확인
cat lib/ai/index.ts
cat app/actions/ai/index.ts
cat types/ai/index.ts
```
