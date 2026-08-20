# Claude Context 처리 자료 검토 결과

**작성일:** 2026-01-24  
**검토 대상:** `doc/question/claude context capture.md`  
**프로젝트:** Habitree Reading Hub v4.0.0

---

## 1. Claude Desktop Context 구조 분석

### 1.1 Context 구성 요소

Claude Desktop의 context는 다음과 같이 구성되어 있습니다:

| 구성 요소 | 토큰 수 | 비율 | 설명 |
|---------|--------|------|------|
| **System prompt** | 3.3k | 1.6% | 시스템 프롬프트 |
| **System tools** | 16.8k | 8.4% | 시스템 도구 정의 |
| **MCP tools** | 9.8k | 4.9% | MCP (Model Context Protocol) 도구 |
| **Memory files** | 570 | 0.3% | 메모리 파일 (CLAUDE.md) |
| **Skills** | 11 | 0.0% | 사용자 정의 스킬 |
| **Messages** | 12.8k | 6.4% | 대화 메시지 |
| **Free space** | 112k | 55.9% | 사용 가능한 공간 |
| **Autocompact buffer** | 45.0k | 22.5% | 자동 압축 버퍼 |

**총 사용량:** 43k / 200k tokens (22%)

### 1.2 MCP Tools 상세

Claude Desktop은 MCP (Model Context Protocol)를 통해 다양한 도구에 접근합니다:

**Supabase 관련 도구 (약 2.5k tokens):**
- 문서 검색, 테이블/마이그레이션 조회
- SQL 실행, 로그 조회, 어드바이저 확인
- Edge Functions 관리, 브랜치 관리

**Linear 관련 도구 (약 4.5k tokens):**
- 이슈/프로젝트/팀 관리
- 문서 생성/수정
- 댓글, 사이클, 라벨 관리

### 1.3 Context 관리 특징

1. **자동 압축**: Autocompact buffer (22.5%)로 오래된 메시지 자동 압축
2. **도구 기반 접근**: MCP를 통한 외부 시스템 통합
3. **메모리 파일**: 영구 메모리로 프로젝트 컨텍스트 유지
4. **실시간 모니터링**: 토큰 사용량 실시간 표시

---

## 2. 프로젝트 AI Context 구조 비교

### 2.1 현재 프로젝트 Context 구성

프로젝트의 AI 챗봇은 다음과 같은 context를 사용합니다:

**구성 요소:**
1. **System Prompt (동적 생성)**
   - 기본 템플릿 (관리자 설정)
   - 사용자 페르소나 정보
   - 최근 읽은 책 (최대 5권)
   - 최근 기록 (최대 10개)
   - 독서 목표

2. **Chat History**
   - 이전 메시지 (기본: 최대 10개)
   - `maxHistoryMessages` 설정으로 조절 가능

3. **현재 메시지**
   - 사용자 입력

### 2.2 Context 관리 방식

**파일 위치:**
- `app/actions/ai/chat.ts` - `getChatContext()` 함수
- `lib/ai/prompts/chat-prompts.ts` - `generateDynamicSystemPrompt()` 함수
- `app/api/ai/chat/route.ts` - Context 조합 및 전달

**관리 방식:**
```typescript
// 1. 컨텍스트 조회
const context = await getChatContext();

// 2. 동적 프롬프트 생성
const systemPrompt = generateDynamicSystemPrompt(
  aiSettings.systemPromptTemplate,
  context,
  aiSettings.contextSettings
);

// 3. 대화 기록 조회
const previousMessages = await supabase
  .from("chat_messages")
  .select("role, content")
  .eq("session_id", sessionId)
  .order("created_at", { ascending: false })
  .limit(aiSettings.contextSettings.maxHistoryMessages);
```

### 2.3 토큰 관리

**토큰 카운터 유틸리티:**
- `lib/ai/utils/token-counter.ts`
- 토큰 추정 기능 제공
- 모델별 컨텍스트 윈도우 크기 정의

**현재 구현:**
- ✅ 토큰 추정 기능
- ✅ 모델별 컨텍스트 윈도우 크기
- ❌ 실시간 토큰 사용량 모니터링 (미구현)
- ❌ 자동 압축 기능 (미구현)

---

## 3. 비교 분석 및 개선 제안

### 3.1 차이점 분석

| 항목 | Claude Desktop | 프로젝트 | 차이점 |
|------|---------------|---------|--------|
| **Context 구성** | System prompt + Tools + Memory + Messages | System prompt + Chat history | Tools/Memory 없음 |
| **자동 압축** | ✅ Autocompact buffer | ❌ 없음 | 수동 관리 필요 |
| **토큰 모니터링** | ✅ 실시간 표시 | ❌ 추정만 가능 | 실제 사용량 추적 불가 |
| **도구 통합** | ✅ MCP 기반 | ❌ 없음 | 외부 시스템 직접 호출 |
| **메모리 관리** | ✅ Memory files | ⚠️ DB 기반 | 영구 메모리 개념 다름 |
| **Context 제한** | 동적 관리 | 고정 제한 (maxHistoryMessages) | 유연성 부족 |

### 3.2 개선 제안

#### 3.2.1 토큰 사용량 모니터링 추가

**현재 문제:**
- 실제 토큰 사용량을 알 수 없음
- 컨텍스트 윈도우 초과 위험

**개선 방안:**
```typescript
// lib/ai/utils/token-counter.ts에 추가
export async function estimateContextTokens(
  systemPrompt: string,
  chatHistory: Message[],
  context: ChatContext
): Promise<{
  systemPromptTokens: number;
  contextTokens: number;
  historyTokens: number;
  totalTokens: number;
  usageRate: number; // 사용률 (0-1)
}> {
  // 실제 토큰 수 추정
  // 모델별 컨텍스트 윈도우와 비교
}
```

**적용 위치:**
- `app/api/ai/chat/route.ts`에서 API 호출 전 토큰 추정
- 경고 로그 출력 또는 사용자에게 알림

#### 3.2.2 자동 압축 기능 추가

**현재 문제:**
- 대화가 길어지면 컨텍스트 윈도우 초과
- 오래된 메시지가 계속 포함됨

**개선 방안:**
```typescript
// lib/ai/utils/context-compressor.ts (신규)
export function compressChatHistory(
  messages: Message[],
  maxTokens: number,
  modelId: string
): Message[] {
  // 1. 최신 메시지 우선 유지
  // 2. 오래된 메시지 요약 또는 제거
  // 3. 토큰 제한 내로 조정
}
```

**적용 위치:**
- `app/api/ai/chat/route.ts`에서 메시지 조회 후 압축

#### 3.2.3 Context 우선순위 관리

**현재 문제:**
- 모든 컨텍스트를 항상 포함
- 중요도에 따른 선택적 포함 불가

**개선 방안:**
```typescript
// types/ai/settings.ts에 추가
export interface ContextSettings {
  // 기존 설정...
  
  // 우선순위 기반 포함
  contextPriority: {
    persona: number;      // 0-10 (높을수록 우선)
    recentBooks: number;
    recentNotes: number;
    readingGoal: number;
  };
  
  // 토큰 제한
  maxContextTokens: number; // 컨텍스트 최대 토큰 수
}
```

**적용 위치:**
- `lib/ai/prompts/chat-prompts.ts`에서 우선순위 기반 선택적 포함

#### 3.2.4 실시간 토큰 사용량 표시 (UI)

**개선 방안:**
- 채팅 인터페이스에 토큰 사용량 표시
- 컨텍스트 윈도우 사용률 프로그레스 바

**적용 위치:**
- `components/ai/chat/chat-interface.tsx`

#### 3.2.5 장기 메모리 시스템 강화

**현재:**
- `user_ai_memories`` 테이블 존재하나 활용 미흡

**개선 방안:**
```typescript
// app/actions/ai/memory.ts (신규)
export async function getRelevantMemories(
  userId: string,
  currentMessage: string,
  maxMemories: number = 5
): Promise<Memory[]> {
  // 1. 현재 메시지와 관련된 메모리 검색
  // 2. 중요도/관련도 순으로 정렬
  // 3. 최대 개수만큼 반환
}
```

**적용 위치:**
- `getChatContext()`에서 관련 메모리 포함

---

## 4. 우선순위별 개선 계획

### Phase 1: 기본 모니터링 (즉시 적용 가능)

1. ✅ **토큰 사용량 추정 및 로깅**
   - API 호출 전 토큰 추정
   - 경고 로그 출력
   - 예상 비용 계산

2. ✅ **Context 크기 제한**
   - `maxContextTokens` 설정 추가
   - 초과 시 자동 축소

### Phase 2: 자동화 기능 (1-2주)

3. ✅ **자동 압축 기능**
   - 오래된 메시지 요약
   - 중요 메시지 우선 유지

4. ✅ **우선순위 기반 Context 선택**
   - 중요도에 따른 선택적 포함
   - 토큰 제한 내 최적화

### Phase 3: 고급 기능 (향후)

5. ✅ **실시간 토큰 모니터링 UI**
   - 사용자에게 토큰 사용량 표시
   - 컨텍스트 윈도우 사용률 표시

6. ✅ **장기 메모리 시스템 강화**
   - 관련 메모리 자동 검색
   - 컨텍스트에 포함

---

## 5. 참고 사항

### 5.1 Claude Desktop의 장점

1. **자동 관리**: Autocompact buffer로 자동 압축
2. **도구 통합**: MCP를 통한 외부 시스템 통합
3. **실시간 모니터링**: 토큰 사용량 실시간 표시
4. **유연한 Context**: 동적으로 Context 조정

### 5.2 프로젝트의 장점

1. **도메인 특화**: 독서 관련 컨텍스트에 최적화
2. **관리자 제어**: 설정을 통한 유연한 조정
3. **DB 기반**: 영구 저장 및 검색 가능
4. **다중 Provider**: Gemini, OpenAI, Anthropic 지원

### 5.3 학습 포인트

1. **Context 최적화**: 필요한 정보만 포함하여 토큰 절약
2. **자동화**: 수동 관리보다 자동 압축이 효율적
3. **모니터링**: 실시간 토큰 사용량 추적 중요
4. **우선순위**: 모든 정보를 포함하기보다 중요도 기반 선택

---

## 6. 결론

Claude Desktop의 context 처리 방식을 참고하여 다음과 같은 개선이 필요합니다:

1. **즉시 적용**: 토큰 사용량 모니터링 및 로깅
2. **단기 개선**: 자동 압축 및 우선순위 기반 Context 선택
3. **장기 개선**: 실시간 UI 표시 및 장기 메모리 시스템 강화

이러한 개선을 통해 더 효율적이고 안정적인 AI 챗봇 서비스를 제공할 수 있습니다.

---

**관련 파일:**
- `doc/question/claude context capture.md` - Claude Desktop context 구조
- `lib/ai/utils/token-counter.ts` - 토큰 카운터 유틸리티
- `app/actions/ai/chat.ts` - Context 조회 로직
- `lib/ai/prompts/chat-prompts.ts` - 프롬프트 생성 로직
- `app/api/ai/chat/route.ts` - API 라우트
