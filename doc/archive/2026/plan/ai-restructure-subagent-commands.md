# AI 구조화 - Subagent 실행 명령 Quick Reference

**목적:** Claude Code Task 도구로 병렬/순차 실행할 명령 목록

---

## 실행 순서 요약

```
[Phase 1] 디렉토리 생성 (6개 병렬)
    ↓
[Phase 2] 타입 이동 (3개 병렬 → 1개 순차)
    ↓
[Phase 3] Provider 분리 (3개 병렬 → 1개 순차) ★핵심
    ↓
[Phase 4] Prompts 이동 (2개 병렬)
    ↓
[Phase 5] Actions 이동 (5개 병렬 → 1개 순차)
    ↓
[Phase 6] API 이동 (1개)
    ↓
[Phase 7] Components 이동 (2개 병렬)
    ↓
[Phase 8] 문서화 (3개 병렬)
    ↓
[Phase 9] 검증 (3개 순차)
```

---

## Phase 1: 디렉토리 생성 (병렬 6개)

### 실행 명령 (Task 도구)
```
동시에 6개 Task를 실행:

Task 1-1:
subagent_type: Bash
prompt: "mkdir -p lib/ai/providers lib/ai/prompts lib/ai/utils && echo '// AI Library' > lib/ai/index.ts"

Task 1-2:
subagent_type: Bash
prompt: "mkdir -p app/actions/ai && echo '// AI Actions' > app/actions/ai/index.ts"

Task 1-3:
subagent_type: Bash
prompt: "mkdir -p app/api/ai/chat"

Task 1-4:
subagent_type: Bash
prompt: "mkdir -p components/ai/chat components/ai/admin"

Task 1-5:
subagent_type: Bash
prompt: "mkdir -p types/ai && echo '// AI Types' > types/ai/index.ts"

Task 1-6:
subagent_type: Bash
prompt: "mkdir -p doc/ai"
```

---

## Phase 2: 타입 이동 (병렬 3개 → 순차 1개)

### Step 2-1: 병렬 실행 (3개)
```
Task 2-1:
subagent_type: general-purpose
prompt: "types/chat.ts 파일을 읽고 types/ai/chat.ts로 복사하세요. 기존 types/chat.ts는 'export * from \"./ai/chat\";'로 변경하세요."

Task 2-2:
subagent_type: general-purpose
prompt: "types/persona.ts 파일을 읽고 types/ai/persona.ts로 복사하세요. 기존 types/persona.ts는 'export * from \"./ai/persona\";'로 변경하세요."

Task 2-3:
subagent_type: general-purpose
prompt: "types/ai-settings.ts 파일을 읽고 types/ai/settings.ts로 복사하세요. 기존 types/ai-settings.ts는 'export * from \"./ai/settings\";'로 변경하세요."
```

### Step 2-2: 순차 실행 (1개)
```
Task 2-4:
subagent_type: general-purpose
prompt: "types/ai/index.ts를 수정하여 다음 내용으로 작성하세요:
export * from './chat';
export * from './persona';
export * from './settings';"
```

---

## Phase 3: Provider 분리 (병렬 3개 → 순차 1개) ★핵심

### Step 3-1: 병렬 실행 (3개)
```
Task 3-1 (Gemini):
subagent_type: general-purpose
prompt: "lib/api/gemini.ts를 분석하여 lib/ai/providers/gemini.ts를 새로 생성하세요.
포함할 내용:
1. getGeminiClient() 함수
2. generateWithGemini(prompt, options) 함수
3. summarizeWithGemini(description) 함수
기존 파일은 수정하지 마세요."

Task 3-2 (OpenAI):
subagent_type: general-purpose
prompt: "lib/api/gemini.ts의 getOpenAIClient()와 app/api/chat/route.ts의 callOpenAI(), parseOpenAIStream()을 분석하여 lib/ai/providers/openai.ts를 새로 생성하세요.
포함할 내용:
1. getOpenAIClient() 함수
2. callOpenAI() 함수
3. parseOpenAIStream() 함수
4. generateWithOpenAI(prompt, options) 함수
기존 파일들은 수정하지 마세요."

Task 3-3 (Anthropic):
subagent_type: general-purpose
prompt: "app/api/chat/route.ts의 callAnthropic(), parseAnthropicStream()을 분석하여 lib/ai/providers/anthropic.ts를 새로 생성하세요.
포함할 내용:
1. getAnthropicClient() 함수 (새로 작성)
2. callAnthropic() 함수
3. parseAnthropicStream() 함수
4. generateWithAnthropic(prompt, options) 함수
기존 파일은 수정하지 마세요."
```

### Step 3-2: 순차 실행 (1개)
```
Task 3-4 (Index):
subagent_type: general-purpose
prompt: "lib/ai/providers/index.ts를 생성하세요.
포함할 내용:
1. AIProviderType 타입 정의 ('google' | 'openai' | 'anthropic')
2. 공통 인터페이스 (GenerateOptions, StreamCallbacks)
3. 모든 provider re-export (gemini, openai, anthropic)
4. generateText(provider, prompt, options) 팩토리 함수"
```

---

## Phase 4: Prompts 이동 (병렬 2개)

```
Task 4-1:
subagent_type: general-purpose
prompt: "lib/api/chat-prompts.ts를 lib/ai/prompts/chat-prompts.ts로 복사하세요.
기존 lib/api/chat-prompts.ts는 'export * from \"../ai/prompts/chat-prompts\";'로 변경하세요."

Task 4-2:
subagent_type: general-purpose
prompt: "lib/api/gemini.ts의 summarizeBookDescription() 내 프롬프트 텍스트를 추출하여 lib/ai/prompts/summarization-prompts.ts를 새로 생성하세요.
BOOK_SUMMARY_PROMPT 상수와 generateSummaryPrompt(description) 함수를 포함하세요."
```

---

## Phase 5: Actions 이동 (병렬 5개 → 순차 1개)

### Step 5-1: 병렬 실행 (5개)
```
Task 5-1:
subagent_type: general-purpose
prompt: "app/actions/chat.ts를 app/actions/ai/chat.ts로 복사하세요.
import 경로를 @/types/ai/로 업데이트하세요.
기존 파일은 새 경로를 re-export하도록 수정하세요."

Task 5-2:
subagent_type: general-purpose
prompt: "app/actions/ai-settings.ts를 app/actions/ai/settings.ts로 복사하세요.
import 경로를 @/types/ai/로 업데이트하세요.
기존 파일은 새 경로를 re-export하도록 수정하세요."

Task 5-3:
subagent_type: general-purpose
prompt: "app/actions/persona.ts를 app/actions/ai/persona.ts로 복사하세요.
import 경로를 @/types/ai/로 업데이트하세요.
기존 파일은 새 경로를 re-export하도록 수정하세요."

Task 5-4:
subagent_type: general-purpose
prompt: "app/actions/books.ts에서 getBookDescriptionSummary() 함수와 관련 import를 추출하여 app/actions/ai/summarization.ts를 새로 생성하세요.
books.ts의 해당 함수는 새 파일에서 import하여 re-export하도록 수정하세요."

Task 5-5:
subagent_type: general-purpose
prompt: "app/actions/ocr.ts를 app/actions/ai/ocr.ts로 복사하세요.
기존 파일은 새 경로를 re-export하도록 수정하세요."
```

### Step 5-2: 순차 실행 (1개)
```
Task 5-6:
subagent_type: general-purpose
prompt: "app/actions/ai/index.ts를 수정하여 모든 AI 액션을 re-export하세요:
export * from './chat';
export * from './settings';
export * from './persona';
export * from './summarization';
export * from './ocr';"
```

---

## Phase 6: API 이동 (1개)

```
Task 6-1:
subagent_type: general-purpose
prompt: "app/api/chat/route.ts를 app/api/ai/chat/route.ts로 복사하세요.
다음 수정을 적용하세요:
1. callOpenAI, parseOpenAIStream을 @/lib/ai/providers/openai에서 import
2. callAnthropic, parseAnthropicStream을 @/lib/ai/providers/anthropic에서 import
3. 인라인 함수 정의 제거
기존 app/api/chat/route.ts는 새 경로로 redirect하는 코드로 교체하세요:
import { POST } from './ai/chat/route'; export { POST };"
```

---

## Phase 7: Components 이동 (병렬 2개)

```
Task 7-1:
subagent_type: general-purpose
prompt: "components/chat/ 폴더의 모든 파일을 components/ai/chat/로 복사하세요.
각 파일의 import 경로를 업데이트하세요:
- @/types/chat → @/types/ai
- @/app/actions/chat → @/app/actions/ai
기존 components/chat/ 파일들은 새 경로를 re-export하도록 수정하세요."

Task 7-2:
subagent_type: general-purpose
prompt: "components/admin/ai-settings-panel.tsx를 components/ai/admin/ai-settings-panel.tsx로 복사하세요.
import 경로를 업데이트하세요.
기존 파일은 새 경로를 re-export하도록 수정하세요."
```

---

## Phase 8: 문서화 (병렬 3개)

```
Task 8-1:
subagent_type: general-purpose
prompt: "doc/ai/README.md를 작성하세요. AI 기능 개요, 디렉토리 구조, 환경 변수 설정 방법을 포함하세요."

Task 8-2:
subagent_type: general-purpose
prompt: "doc/ai/architecture.md를 작성하세요. Mermaid 다이어그램으로 AI 아키텍처, 레이어별 역할, 데이터 흐름을 설명하세요."

Task 8-3:
subagent_type: general-purpose
prompt: "doc/ai/providers.md를 작성하세요. Gemini, OpenAI, Anthropic 각 제공자별 설정 방법, 모델 목록, fallback 메커니즘을 설명하세요."
```

---

## Phase 9: 검증 (순차 3개)

```
Task 9-1:
subagent_type: Bash
prompt: "npm run build를 실행하고 결과를 보고하세요. 오류가 있으면 오류 내용을 보고하세요."

Task 9-2:
subagent_type: Bash
prompt: "프로젝트에서 기존 경로(lib/api/gemini, types/chat 등)를 직접 import하는 파일을 검색하세요. grep 또는 rg 사용."

Task 9-3:
subagent_type: general-purpose
prompt: "다음 기능 테스트 체크리스트를 작성하세요:
1. 채팅 기능 (/chat)
2. 책 설명 요약 (책 목록)
3. 페르소나 분석 (/profile)
4. AI 설정 관리 (/admin)
각 기능의 테스트 방법을 설명하세요."
```

---

## 병렬 실행 그룹 요약

| 그룹 | Phase | 병렬 Task 수 | 예상 시간 |
|------|-------|------------|----------|
| A | 1 | 6 | 1분 |
| B-1 | 2 (1st) | 3 | 3분 |
| B-2 | 2 (2nd) | 1 | 1분 |
| C-1 | 3 (1st) | 3 | 10분 |
| C-2 | 3 (2nd) | 1 | 2분 |
| D | 4 | 2 | 3분 |
| E-1 | 5 (1st) | 5 | 8분 |
| E-2 | 5 (2nd) | 1 | 1분 |
| F | 6 | 1 | 5분 |
| G | 7 | 2 | 5분 |
| H | 8 | 3 | 5분 |
| I | 9 | 3 (순차) | 5분 |

**총 예상 시간:** ~50분 (병렬 실행 시)

---

## 롤백 명령

```bash
# 모든 변경 사항 취소
git checkout -- .

# 새로 생성된 파일/폴더 삭제
rm -rf lib/ai app/actions/ai app/api/ai components/ai types/ai doc/ai
```
