# 05 — 결정 기록 (ADR)

> Architecture Decision Records. 결정 시점·근거·대안·영향 명시.

---

## ADR-D1 — 북마크의 정의

**일시**: 2026-05-04
**상태**: ✅ Accepted

### 결정
북마크는 **다음 시작점 한 줄 메모**로 정의. `reading_logs.bookmark_text TEXT(200)` + `reading_logs.bookmark_page INTEGER` 컬럼으로 구현.

### 맥락
사용자 요구사항에 "북마크를 선택적으로 입력할수있고"라는 표현은 모호. 옵션:
- (a) 다음 시작점 한 줄 메모
- (b) 별도 북마크 컬렉션 테이블
- (c) 기존 태그 시스템 재활용

### 근거
- 사용자 답변: (a) 채택.
- (a)는 1:1 관계 → 별도 테이블 오버엔지니어링 회피.
- 다음 세션 시작 시 prefill로 활용 가능 (UX 가치 명확).
- (b)는 미래에 사용자 요청이 누적되면 별도 테이블로 이전 가능 (데이터 손실 없이).

### 영향
- M1 마이그에서 컬럼 2개 추가.
- end-step UI에 "북마크 추가" 토글.
- 다음 세션 start-step에서 직전 `bookmark_page` 우선 prefill 검토 (Phase 3 폴리싱).

---

## ADR-D2 — 동시 진행 세션 정책

**일시**: 2026-05-04
**상태**: ✅ Accepted

### 결정
사용자당 진행 중(`status='in_progress'`) 세션은 **1개만** 허용. DB unique 부분 인덱스로 강제.

```sql
CREATE UNIQUE INDEX idx_reading_logs_one_active
  ON reading_logs (user_id) WHERE status = 'in_progress';
```

### 맥락
"FAB가 진행 중일 때 인디케이터로 변형"이라는 요구는 단일 액티브 상태를 전제.

### 대안
- (b) 책당 1개·사용자당 N개 — 동시 다독서 사용자 친화이나 인디케이터 UX 복잡.
- (c) 무제한 — 데이터 정합성 위험.

### 근거
- 사용자 답변: (a) 채택.
- 단순한 UX > 다독서 사용자 (소수) 편의.
- 다중 탭 race는 `client_session_id` 멱등키로 처리.
- 미래에 (b)로 확장 가능 (인덱스 조건 변경).

### 영향
- M1 unique 부분 인덱스.
- 새 시작 시 기존 세션 발견 → end-step 자동 진입(03-ux-flow.md §4.1).
- 멱등키 충돌 시 명확한 에러 토스트.

---

## ADR-D3 — 자유 상세기록 (책 없는 상세) 허용

**일시**: 2026-05-04
**상태**: ✅ Accepted (Default)

### 결정
상세기록(`notes.detail_kind IN ('quote','memo','transcription')`)은 책 연결 없이도 작성 가능. `notes.reading_log_id NULL` 허용.

### 맥락
현재 `/notes/free` (`book_id = READTREE_BOOK_ID`) 사용자가 적극 활용 중. 차단 시 마이그레이션·UX 충격.

### 대안
- (a) 항상 책 필수 → 기존 자유 노트 사용자 박탈
- (c) 세션 진행 중일 때만 허용 → /notes/free 폐기 (충격)

### 근거
- (b) 자유 허용 채택 — 호환성 우선.
- 책 없는 글쓰기는 사용자의 정당한 사용 패턴.
- `reading_log_id NULL` 의미 = 자유 상세, 명확한 분리.

### 영향
- `addNoteToSession(null, ...)` 시그니처 허용.
- `/notes/free` 페이지 그대로 유지.
- detail-step에서 세션 컨텍스트 없이도 진입 가능.

---

## ADR-D4 — 포인트 적립 시점

**일시**: 2026-05-04
**상태**: ✅ Accepted (Default)

### 결정
포인트는 **세션 종료 시 1회만** 적립 (`endReadingSession` 내부에서 `earnPoints("note_create")`). 사진·상세기록 추가 시 추가 적립 없음.

### 맥락
기존 `createReadingStamp` / `createNote` / `createQuickNote`가 각각 적립 → 중복 우려. 통합 모델에서 명확화 필요.

### 대안
- (b) 세션 + 상세기록 각각 적립 → 사용자에게 좋지만 인플레이션
- (c) 사진 보너스 → 게임화 강화

### 근거
- (a) 1회 적립 채택 — 현행 정책 유지, 정책 변경 리스크 회피.
- (b),(c)는 별도 PRD로 분리 가능 (미래 확장).
- 사용자가 기록 1건당 받는 보상은 일관성 있게 1회.

### 영향
- `endReadingSession` 내 `earnPoints` 단일 호출.
- `addNoteToSession`은 별도 적립 안 함 (일관성).
- `attachStampToLog` (사후 사진 첨부) — 기존대로 적립 없음.

---

## ADR-D5 — 음악·세션 인디케이터 동시 표시

**일시**: 2026-05-04
**상태**: ✅ Accepted

### 결정
음악 미니플레이어와 세션 인디케이터는 **별도 영역**에 표시. 통합·자동 전환 안 함.

### 맥락
사용자가 음악만, 세션만, 둘 다, 아무것도 — 4가지 조합. 통합은 상태 폭발.

### 대안
- (b) 단일 pill 통합 → 4가지 상태 디자인 부담
- (c) 음악 종료 시 세션으로 자동 전환 → 음악 정지 ≠ 독서 종료라 혼란

### 근거
- 사용자 답변: (a) 채택.
- 음악·독서 = 독립 도메인 (사용자가 음악 없이 기록 가능).
- 모바일에서 좌표·z-index 검토 필요 (Phase 4).

### 영향
- `music-mini-player.tsx` 위치 조정 가능성 (Phase 4).
- `active-session-indicator.tsx` 별도 컴포넌트.
- 두 컴포넌트의 height/spacing 충돌 검토 필요.

---

## 부록: 미정 사안 (향후 ADR 후보)

| 주제 | 트리거 |
|---|---|
| 사진 보너스 도입 | 사용자 피드백 / 게임화 캠페인 결정 시 |
| 책당 N 세션 (D2 완화) | 다독서 사용자 베타 요청 누적 시 |
| 북마크 컬렉션 페이지 (D1 확장) | 북마크 활용 데이터 분석 후 |
| in_progress orphan 임계값 (12h) 조정 | Phase 6 모니터링 결과 |
