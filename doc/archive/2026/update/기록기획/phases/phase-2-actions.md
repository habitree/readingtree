# Phase 2 — 세션 액션 + 라이브 훅

> 목표: server actions(`sessions.ts`) + 라이브 타이머 훅(`use-reading-session.ts`) 신설.

## 체크리스트

### 신규 파일
- [ ] `app/actions/sessions.ts`
  - [ ] `startReadingSession(input, user?)` — 멱등(`client_session_id`), `getLastEndPage` 재사용, READTREE_BOOK_ID 폴백
  - [ ] `endReadingSession(input, user?)` — `status='completed'`, `image_urls` upsert, `earnPoints` 1회 (D4)
  - [ ] `getActiveSession(user?)` — `status='in_progress'` 단일 행
  - [ ] `cancelActiveSession(sessionId, user?)` — 30초 미만 DELETE, 이상 abandoned
  - [ ] `addNoteToSession(sessionId|null, input, user?)` — `detail_kind` 라벨링, `reading_log_id` FK
- [ ] `hooks/use-reading-session.ts`
  - [ ] Zustand 스토어 (`activeSession`, `elapsedSeconds`)
  - [ ] SWR로 `getActiveSession` 폴링 (visibilitychange 시 강제 revalidate)
  - [ ] BroadcastChannel("readtree-session") — 다중 탭 동기
  - [ ] 시간 카운트는 `started_at` 기준 클라이언트 계산

### 변경 파일 (위임 wrap)
- [ ] `app/actions/progress.ts`
  - [ ] `saveReadingSession` — `endReadingSession` 위임 (시그니처 보존, JSDoc `@deprecated`)
  - [ ] `createReadingStamp` — `endReadingSession` 위임 (image_urls=[image_url])
  - [ ] `createProgressLog` — `endReadingSession` 위임 (즉석 완결 세션)
  - [ ] `getLastEndPage` — 변경 없음 (sessions.ts에서 재사용)
  - [ ] `attachStampToLog` — `image_urls`도 함께 갱신하도록 내부 수정 (스탬프 정의 호환)

### 테스트
- [ ] `__tests__/actions/sessions.test.ts` (vitest)
  - [ ] 멱등성: 동일 `client_session_id` 2회 호출 = 첫 결과 반환, DB INSERT 1회만
  - [ ] D2 위반: 같은 사용자 2회 시작 = 명확한 에러 메시지 (unique violation 매핑)
  - [ ] cancel 30초 미만 = DELETE
  - [ ] cancel 30초 이상 = `status='abandoned'`, 행 보존
  - [ ] 포인트 1회 적립 (D4)
- [ ] `__tests__/actions/progress-deprecation.test.ts` — 기존 시그니처 회귀 0

### 검증
- [ ] vitest 100% 통과
- [ ] `npm run type-check` 통과
- [ ] grep — 새 import 정상 (`from "@/app/actions/sessions"`)

---

## 시그니처 (요약)

```ts
// app/actions/sessions.ts — 본 plan §8 또는 plan 파일 참조

startReadingSession(input, user?): { sessionId, startedAt, isResumed }
endReadingSession(input, user?): { sessionId, durationSeconds, pointsEarned, reachedEnd, promotedToStamp }
getActiveSession(user?): ReadingLogActive | null
cancelActiveSession(sessionId, user?): { deleted, abandoned }
addNoteToSession(sessionId|null, input, user?): { noteId, pointsEarned }
```

---

## 다음 Phase 트리거

✅ **Phase 2 완료 조건**:
- vitest 단위테스트 100%
- legacy wrap 회귀 0
- type-check / build 통과

→ **Phase 3 시작 가능** (`phase-3-sheet-ui.md`)
