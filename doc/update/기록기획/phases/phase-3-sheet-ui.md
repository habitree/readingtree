# Phase 3 — 통합 시트 UI (RecordSheet)

> 목표: `RecordSheet` (start / end / detail 3 step) + `useRecordSheet` 훅 신설. 진입점은 아직 없음 (Phase 5에서 연결).

## 체크리스트

### 신규 컴포넌트 (7개)
- [ ] `components/records/record-sheet.tsx` — 메인 시트, `mode = 'start' | 'end' | 'detail'`
- [ ] `components/records/record-start-step.tsx` — 책·시작 페이지·시간 옵션
- [ ] `components/records/record-end-step.tsx` — 끝 페이지·메모·북마크·사진 strip
- [ ] `components/records/record-detail-step.tsx` — 종류 분기 (구절/생각/필사)
- [ ] `components/records/record-bookmark-toggle.tsx` — 북마크 토글 + text/page
- [ ] `components/records/record-photo-strip.tsx` — 가로 스와이프 ≤5장
- [ ] `components/records/record-active-pill.tsx` — 인디케이터 (Phase 4가 사용)

### 신규 훅
- [ ] `hooks/use-record-sheet.ts` — Zustand. `useReadingSession`과 결합. `openStart()`, `openEnd()`, `openDetail(sessionId)`, `close()`

### 재사용 (재작성 금지)
- 책 선택 — `getContinueReadingBooks` (`app/actions/books/reading.ts:962`)
- 시간 프리셋 — 음악 시트 패턴 (`components/music/playlist-sheet.tsx`)
- 사진 업로드 — Supabase Storage 패턴 (`components/notes/note-form-new.tsx`)
- 본문 입력 (detail-step) — `components/notes/note-form-new.tsx` 부분 재사용

### i18n (선택, Phase 5에서 일괄 가능)
- [ ] `lib/i18n/dictionaries/ko.ts` — `record.*` 신설 (start, end, detail, bookmark, save, cancel)
- [ ] `lib/i18n/dictionaries/en.ts` — 동일

### 테스트
- [ ] `__tests__/components/record-sheet.test.tsx` — 모드 전환·필수 입력·취소
- [ ] `__tests__/e2e/record-flow.spec.ts` (vitest + RTL — Playwright MCP 끊김 대체)
  - [ ] start → end (행복 경로)
  - [ ] start → cancel (30초 미만)
  - [ ] start → end → detail (상세기록 추가)

### 검증
- [ ] vitest 100% 통과
- [ ] 모바일 viewport (375px) 시각 확인 (Storybook 또는 dev server)
- [ ] 키보드 네비게이션 (Tab/Esc)

---

## 디자인 노트

### 시트 dim·dismiss
- 모바일: 바텀시트, 70vh, drag-to-close.
- 데스크톱: 우측 슬라이드, 480px width.
- Esc·바깥 탭 dismiss = 진행 중 세션 보존 (취소가 아님).

### 시간 프리셋 칩
- 15 / 25 / 45 / ∞ (4개)
- 선택된 칩 = `accent` 배경.

### 사진 strip
- 가로 스크롤, 80×80 thumb.
- `+` 버튼 = 카메라/앨범 선택 모달.
- 5장 도달 시 `+` 비활성.

### 종료 시트 안전
- 끝 페이지 < 시작 페이지 = 인라인 에러.
- 끝 페이지 = 시작 페이지 = 허용 (페이지 변동 없음, 시간만 기록).

---

## 다음 Phase 트리거

✅ **Phase 3 완료 조건**:
- E2E 3 시나리오 통과
- 모바일·데스크톱 시각 검수
- vitest 단위 테스트 통과

→ **Phase 4 시작 가능** (`phase-4-indicator.md`)
