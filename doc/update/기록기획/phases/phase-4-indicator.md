# Phase 4 — 진행 중 인디케이터 (FAB·헤더)

> 목표: 진행 중 세션을 모바일 FAB·데스크톱 헤더에 표시. 다중 탭·새로고침 복원.

## 체크리스트

### 신규 컴포넌트
- [ ] `components/layout/active-session-indicator.tsx`
  - [ ] `useReadingSession` 구독
  - [ ] `idle` → 표시 안 함
  - [ ] `in_progress` → `MM:SS + 책 표지(32×32)`
  - [ ] 클릭 → `useRecordSheet().openEnd()`
  - [ ] long-press (모바일) → 취소 메뉴

### 변경 파일
- [ ] `components/layout/mobile-nav.tsx` — FAB 영역에 인디케이터 결합
  - [ ] `idle` 시 기존 "+ 기록" 버튼
  - [ ] `in_progress` 시 인디케이터로 변형
  - [ ] `handleNoteAction` → `useRecordSheet().openStart()` (Phase 5에서 완결)
- [ ] `components/layout/header.tsx` (또는 동등) — 데스크톱 우측 상단 inline pill
- [ ] `components/music/music-mini-player.tsx` — D5 별도 영역 좌표 검토
  - [ ] 모바일 — 인디케이터(FAB)와 미니플레이어(상단) 비충돌 확인
  - [ ] z-index 검토 (인디케이터 > 미니플레이어 안전)

### 색·애니메이션
- [ ] 기본: `accent` 배경
- [ ] 종료 5분 전: `warning` 페이드
- [ ] 만료 후: `destructive` 펄스 (1초 주기)
- [ ] `prefers-reduced-motion` 시 텍스트만

### 접근성
- [ ] `aria-live="polite"` 시간 변화 안내 (1분 단위)
- [ ] 인디케이터 button role + label "독서 기록 진행 중, 12분 34초"
- [ ] 키보드 포커스 시 outline 명확

### 테스트 시나리오 (수동)
- [ ] FAB 탭 → start-step 표시
- [ ] start 후 FAB가 인디케이터로 변형
- [ ] 새로고침 → 30초 안에 인디케이터 복원
- [ ] 두 번째 탭 열기 → 두 탭 모두 인디케이터 표시
- [ ] 한 탭에서 종료 → 다른 탭에서도 즉시 사라짐 (BroadcastChannel)
- [ ] 음악 재생 + 진행 중 = 두 컴포넌트 충돌 없음

### 검증
- [ ] `npm run type-check` 통과
- [ ] 모바일 Safari 다중 탭 (PWA 시뮬레이터)
- [ ] 데스크톱 Chrome/Firefox

---

## 다음 Phase 트리거

✅ **Phase 4 완료 조건**:
- 다중 탭 동기화 통과
- 새로고침 복원 30초 이내
- 음악 미니플레이어와 시각 충돌 없음

→ **Phase 5 시작 가능** (`phase-5-integration.md`)
