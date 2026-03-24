# Phase 1 변경 로그 — 행동과학 기반 UX 개편

> **실행일**: 2026-03-24
> **기획 문서**: `doc/UX/behavioral-ux-audit.md`
> **상태**: Phase 1 완료 (8개 항목 중 8개 적용)

---

## 적용된 개선안 체크리스트

- [x] **1-1** 노트 저장 후 스트릭/포인트 인라인 피드백 강화
- [x] **1-2** 선택 필드 "태그·공개 설정 (선택)" 명시 — 안 채워도 됨 뉘앙스
- [x] **2-1** 스트릭 at_risk 손실회피 프레이밍 전환
- [x] **2-2** 대시보드 상단 스트릭 경고 배너 추가
- [x] **2-3** 웰컴 보너스 시각적 강조 (신규 사용자)
- [x] **3-1** 온보딩 Endowed Progress (3개→5개, 2/5 완료 시작)
- [x] **4-1** 책 추가 CTA "추가" → "읽기 시작" 변경
- [x] **4-2** 추가 성공 toast에 "기록하기" 액션 버튼 추가

---

## 변경 파일 상세

### `components/notes/quick-note.tsx`
- `todayNoteCount` 상태 추가 — 저장 성공 시 카운트 증가
- 성공 오버레이: "저장 완료" → "저장 완료! · 오늘 N번째 기록"
- 칭찬 toast: "{칭찬 메시지} +P 획득!" 포인트 안내 추가

### `components/notes/note-form-new.tsx`
- 추가 옵션 토글 텍스트: "태그·공개 설정 (선택)"
- 설명 텍스트: "안 채워도 저장돼요"

### `components/dashboard/sections/weekly-progress-bar.tsx`
- at_risk 배경: `bg-rose-50 dark:bg-rose-950/30`
- at_risk 텍스트: `text-rose-600 dark:text-rose-400`
- 서브 메시지 추가: "지금 기록하면 유지할 수 있어요"
- 기존 scale 애니메이션 유지

### `components/dashboard/sections/home-hero-section.tsx`
- 스트릭 경고 배너: at_risk && streak >= 3 조건, "기록하기 →" 링크
- 웰컴 보너스 힌트: !hasFirstNote && totalPoints >= 200 조건, 앰버 하이라이트

### `components/onboarding/onboarding-checklist.tsx`
- ONBOARDING_ENDOWED 배열: signup_complete, consent_complete (항상 완료)
- 프로그레스 바에 "{completed}/{total} 완료" 텍스트 추가
- reward === 0 항목은 보상 표시 숨김
- href 없는 항목은 클릭 불가 처리

### `components/books/book-search.tsx`
- "추가" 버튼 → "읽기 시작" + BookOpen 아이콘
- toast.success에 action 버튼: "기록하기" → `/notes/new?bookId={id}`

### `lib/i18n/dictionaries/ko.ts` / `en.ts`
- 추가 키: `streakAtRiskSub`, `streakBreakWarning`, `recordNow`, `welcomeBonusHint`
- 추가 키: `signupComplete`, `consentComplete`, `progressText`
- 추가 키: `bookAddedWithAction`, `bookAddedActionDesc`, `writeFirstNote`
- 변경 키: `streakAtRisk` (손실회피 프레이밍), `addButton` ("읽기 시작")
- 추가 키: `noteForm.optionalFieldsToggle`, `noteForm.optionalFieldsDesc`
- 추가 키: `notes.todayNthNote`, `notes.pointsEarned`

---

## 적용된 행동과학 원칙 매핑

| 변경 | 원칙 | 효과 |
|------|------|------|
| 노트 저장 피드백 강화 | 현재 편향 (즉각 보상) | 기록 후 즉시 성취감 |
| 선택 필드 "안 해도 됨" | 최소 노력 | 폼 이탈률 감소 |
| 스트릭 손실 프레이밍 | 손실회피 | 스트릭 유지율 증가 |
| 경고 배너 + 기록 링크 | 손실회피 + 최소 노력 | 즉각 행동 전환 |
| 웰컴 보너스 강조 | 기본값 + Endowment | 첫날 행동 전환율 |
| Endowed Progress 2/5 | 기본값 (Endowed Progress) | 체크리스트 완료율 |
| "읽기 시작" CTA | 최소 노력 (행동 유도) | 책 추가 전환율 |
| 기록 유도 toast | 최소 노력 (다음 행동) | 기록↔서재 연결 |

---

## 다음 단계: Phase 2 (1-2주)

- [ ] "한 줄 메모" 울트라 라이트 모드 추가
- [ ] OCR 일일 3회 무료 티어 도입
- [ ] 일일 미션 손실회피 프레이밍 적용
- [ ] 대시보드 마이크로 통계 상시 노출
- [ ] "어제 어디까지 읽었나요?" 푸시형 입력
