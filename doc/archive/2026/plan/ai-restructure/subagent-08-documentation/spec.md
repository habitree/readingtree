# SA-08: Documentation Agent

## 1. 기본 정보

| 항목 | 내용 |
|------|------|
| **Subagent ID** | SA-08 |
| **이름** | Documentation Agent |
| **역할** | AI 모듈 문서화 (doc/ai/) |
| **판단 범위** | 문서 생성 (내용 구조화만, 기술적 판단 없음) |
| **에스컬레이션 대상** | 오케스트레이터 |

---

## 2. 역할/책임 경계

### 하는 것
- README.md 작성 (개요)
- architecture.md 작성 (구조)
- providers.md 작성 (Provider 가이드)

### 하지 않는 것
- 코드 품질 평가
- 아키텍처 결정
- 기술 선택 판단

---

## 3. 입력 스키마

```typescript
interface SA08Input {
  documents: {
    path: string;
    type: "readme" | "architecture" | "providers";
    sections: string[];
  }[];

  projectInfo: {
    name: string;
    aiFeatures: string[];
    providers: string[];
    envVariables: string[];
  };
}
```

### 입력 예시
```json
{
  "documents": [
    {
      "path": "doc/ai/README.md",
      "type": "readme",
      "sections": ["개요", "디렉토리 구조", "빠른 시작", "환경 변수"]
    },
    {
      "path": "doc/ai/architecture.md",
      "type": "architecture",
      "sections": ["레이어 구조", "데이터 흐름", "주요 컴포넌트"]
    },
    {
      "path": "doc/ai/providers.md",
      "type": "providers",
      "sections": ["지원 Provider", "설정 방법", "Fallback"]
    }
  ],
  "projectInfo": {
    "name": "Habitree Reading Hub",
    "aiFeatures": ["챗봇", "책 요약", "페르소나 분석", "OCR"],
    "providers": ["Google Gemini", "OpenAI", "Anthropic"],
    "envVariables": ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
  }
}
```

---

## 4. 출력 스키마

```typescript
interface SA08Output {
  status: "SUCCESS" | "PARTIAL" | "FAILED";

  documentsCreated: {
    path: string;
    sections: number;
    linesOfContent: number;
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
| 필수 섹션 포함 | 목차 확인 |
| 마크다운 문법 정확 | 렌더링 확인 |
| 코드 예시 정확 | 문법 확인 |
| 다이어그램 렌더링 | Mermaid 확인 |

---

## 6. 불확실성 라벨

| 상황 | 레벨 | 처리 |
|------|------|------|
| 모든 문서 생성 성공 | LOW | 진행 |
| 일부 섹션 누락 | MEDIUM | 보고 후 진행 |
| 정보 부족 | HIGH | 에스컬레이션 |

---

## 7. 실행 명령

### Task 8-1: README.md
```
subagent_type: general-purpose
prompt: |
  doc/ai/README.md를 작성하세요.

  **포함할 섹션**:

  # AI 기능 모듈

  ## 개요
  - Habitree Reading Hub의 AI 기능 설명
  - 주요 기능: 챗봇, 책 요약, 페르소나 분석, OCR

  ## 디렉토리 구조
  ```
  lib/ai/
  ├── providers/    # AI 제공자별 클라이언트
  ├── prompts/      # 프롬프트 관리
  └── utils/        # 유틸리티

  app/actions/ai/   # Server Actions
  app/api/ai/       # API 라우트
  components/ai/    # UI 컴포넌트
  types/ai/         # 타입 정의
  ```

  ## 빠른 시작
  - 환경 변수 설정 방법
  - 기본 사용 예시

  ## 환경 변수
  - GEMINI_API_KEY
  - OPENAI_API_KEY
  - ANTHROPIC_API_KEY

  결과를 JSON으로 보고하세요.
```

### Task 8-2: architecture.md
```
subagent_type: general-purpose
prompt: |
  doc/ai/architecture.md를 작성하세요.

  **포함할 내용**:

  # AI 아키텍처

  ## 레이어 구조
  Mermaid 다이어그램으로 레이어 설명

  ## 데이터 흐름
  - 사용자 입력 → API → Provider → 응답
  - 스트리밍 처리 흐름

  ## 주요 컴포넌트
  - Provider (Gemini, OpenAI, Anthropic)
  - Prompts
  - Actions
  - Components

  결과를 JSON으로 보고하세요.
```

### Task 8-3: providers.md
```
subagent_type: general-purpose
prompt: |
  doc/ai/providers.md를 작성하세요.

  **포함할 내용**:

  # AI Provider 가이드

  ## 지원 Provider
  - Google Gemini (gemini-2.0-flash)
  - OpenAI (gpt-4o, gpt-4o-mini)
  - Anthropic (claude-3-5-sonnet)

  ## 설정 방법
  - 환경 변수 설정
  - 관리자 설정 패널

  ## Fallback 메커니즘
  - Gemini 실패 시 → OpenAI
  - 모두 실패 시 → 기본 처리

  결과를 JSON으로 보고하세요.
```

---

## 8. 검증 명령

```bash
# 파일 확인
ls -la doc/ai/

# 내용 확인
cat doc/ai/README.md
cat doc/ai/architecture.md
cat doc/ai/providers.md

# 마크다운 렌더링 확인 (VS Code 또는 GitHub)
```
