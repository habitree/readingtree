# Phase 5 — 진입점 통합

> 목표: 모든 진입점이 `RecordSheet`/`useRecordSheet`를 사용. 기존 액션은 deprecation 라벨만 (Phase 6에서 차단).

## 체크리스트

### 카나리 토글
- [ ] `NEXT_PUBLIC_RECORD_V2` 환경변수 도입
- [ ] `lib/feature-flags.ts` (또는 동등) 추가 — `useRecordV2()` 훅
- [ ] 모든 진입점 변경에 토글 체크 적용

### 진입점 변경 (8개)
- [ ] `components/layout/mobile-nav.tsx`
  - [ ] `handleNoteAction` → `useRecordSheet().openStart()`
- [ ] `components/dashboard/sections/mobile-quick-actions.tsx`
  - [ ] `openStampCapture` → `openRecordStart`
- [ ] `components/notes/note-creation-flow.tsx`
  - [ ] 책 선택 → `RecordSheet (start)` 라우팅
  - [ ] 자유 상세 = detail-step 직진 (D3)
- [ ] `app/(main)/notes/new/page.tsx`
  - [ ] `quickstart=true` → detail-step 직진 (자유 상세)
  - [ ] 기본 = `RecordSheet (start)`
  - [ ] `?session=<id>` → detail-step 직진 (특정 세션 연결)
  - [ ] `?bookId=<id>` → start-step prefill
- [ ] `components/music/reading-complete-dialog.tsx`
  - [ ] 진행 중 세션 발견 시 end-step 자동 진입
  - [ ] `saveReadingSession` 직호출 제거 → `endReadingSession` 사용
- [ ] `components/books/reading-time-tab.tsx`
  - [ ] 진행 중 세션 행 추가 표시
  - [ ] 사후 사진 첨부는 `attachStampToLog` 유지 (변경 없음)
- [ ] `components/notes/quick-capture-*` — "상세기록" 라벨/UX 재정의 (사진/페이지 입력 제거)
- [ ] `hooks/use-stamp-capture.ts` — `useRecordSheet`로 위임 thin shim

### Deprecation 표시
- [ ] `app/actions/progress.ts::saveReadingSession` — `@deprecated use endReadingSession`
- [ ] `app/actions/progress.ts::createReadingStamp` — `@deprecated use endReadingSession`
- [ ] `app/actions/progress.ts::createProgressLog` — `@deprecated use endReadingSession`
- [ ] `app/actions/notes.ts::createQuickNote` — `@deprecated use addNoteToSession or createNote`

### i18n (Phase 3에서 미진 시 여기서)
- [ ] `lib/i18n/dictionaries/ko.ts` — `record.*` 30+ 키
- [ ] `lib/i18n/dictionaries/en.ts` — 동일

### 카나리 단계
- [ ] 내부 사용자 3명 활성화 (env override)
- [ ] 24시간 무에러 → 신규 가입자 10%
- [ ] 3일 에러율 < 0.5% → 100%

### 검증
- [ ] grep 검증
  - [ ] 신규 액션 호출 100% 사용
  - [ ] legacy 액션 직호출 0건 (테스트·shim 제외)
- [ ] 사용자 시나리오 7개 (`plan §종합 검증` 참조) 수동 통과
- [ ] Vercel logs — 새 진입점 에러 패턴 없음

---

## 다음 Phase 트리거

✅ **Phase 5 완료 조건**:
- 100% 카나리 1주 안정
- legacy 호출 0건
- 사용자 피드백 채널 무이슈

→ **Phase 6 시작 가능** (`phase-6-cleanup.md`)
