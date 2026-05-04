# 기록(Record) 기능 전면 개편 — 마스터

> 작성일: 2026-05-04 · 버전: v1.0 · 담당: Habitree Reading Hub

## 한 줄 비전

**"누르면 시작, 다시 누르면 종료. 기록은 한 가지, 깊이는 선택."**

흩어진 5종 노트 + 진행 로그 + 음악 자동 저장 + 빠른 캡처를 **세션 기반 단일 모델**로 통합한다. UI 분류는 단 2가지 — `기록`(시간/페이지/메모/북마크/사진들)과 `상세기록`(필사·구절·긴 생각).

---

## Phase 게이트

| Phase | 상태 | 목표 | 트리거 |
|---|---|---|---|
| **0** | 🚧 진행 중 | 기획 합의·문서화 | 사용자 승인 |
| 1 | ⏳ 대기 | 데이터 모델 (마이그레이션 4종 + 타입) | Phase 0 승인 |
| 2 | ⏳ | 세션 액션 + 라이브 훅 | Phase 1 회귀 0 |
| 3 | ⏳ | 통합 시트 UI (RecordSheet 3 step) | Phase 2 단위테스트 통과 |
| 4 | ⏳ | 진행 중 인디케이터 (FAB·헤더) | Phase 3 E2E 통과 |
| 5 | ⏳ | 진입점 통합 (음악·notes·책상세) | Phase 4 다중탭 검증 |
| 6 | ⏳ | 호환 정리·legacy 차단 | Phase 5 카나리 1주 |
| 7 | ⏳ | 검증·텔레메트리·폴리싱 | Phase 6 신규 photo/progress 0건 |

---

## 결정 요약 (ADR — `05-decisions.md` 참조)

| ID | 결정 | 답 | 영향 |
|---|---|---|---|
| **D1** | "북마크"의 정의 | **다음 시작점 한 줄 메모** (`bookmark_text` + `bookmark_page`) | reading_logs에 컬럼 2개 |
| **D2** | 동시 진행 세션 | **사용자당 1개만** (DB unique 부분 인덱스) | UX·DB 강제 |
| **D3** | 자유 상세기록 (책 없음) | **허용** (현행 `/notes/free` 유지, `reading_log_id NULL`) | createNote 보존 |
| **D4** | 포인트 적립 시점 | **세션 종료 1회만** (현행 유지) | 정책 변경 없음 |
| **D5** | 음악·세션 인디케이터 | **별도 영역** (충돌 회피) | 모바일 좌표·z-index 검토 |

---

## 핵심 모델 (요약)

```
[기록 시작] → reading_logs INSERT (status='in_progress')
   ↓ (FAB가 "12:34 + 표지"로 변형)
[기록 종료] → reading_logs UPDATE (status='completed', end_page, memo, bookmark, image_urls)
   ↓ (선택)
[상세 기록] → notes INSERT (reading_log_id FK, detail_kind={quote|memo|transcription})
```

- **스탬프 = `image_url IS NOT NULL AND promoted_at IS NOT NULL`** (불변)
- **자유 상세 = `reading_log_id IS NULL`** (`/notes/free` 호환)

---

## 디렉토리 구성

```
doc/update/기록기획/
├── 00-master.md            ← 본 문서
├── 01-data-model.md        ← 컬럼·트리거·ERD
├── 02-migration.md         ← 마이그 5종·dry-run·롤백
├── 03-ux-flow.md           ← 시작→진행→종료 플로우
├── 04-rollout.md           ← Phase별 PR 템플릿·카나리
├── 05-decisions.md         ← ADR (D1~D5)
├── 06-rollback.md          ← 롤백 카탈로그
└── phases/
    ├── phase-1-data-model.md
    ├── phase-2-actions.md
    ├── phase-3-sheet-ui.md
    ├── phase-4-indicator.md
    ├── phase-5-integration.md
    ├── phase-6-cleanup.md
    └── phase-7-polishing.md
```

각 phase 문서는 **체크리스트 + 검증 + 다음 단계 트리거**를 포함한다.

---

## 미해결 위험

| 위험 | 완화 |
|---|---|
| 마이그레이션 중 reading_logs 손상 | 모두 `ADD COLUMN IF NOT EXISTS` — 컬럼 단독 DROP으로 즉시 롤백 |
| 다중 탭 동시 시작 race | `client_session_id` 멱등 + DB unique 인덱스 + 명확한 에러 토스트 |
| in_progress orphan (사용자가 종료 안 누름) | Phase 6 — 12시간 임계값으로 `abandoned` 자동 전환 (cron 후보) |
| 음악 자동 종료 → 사용자 부재 시 안내 누락 | Phase 4 인디케이터 + Phase 7 push notification 검토 |
| 포인트 정책 사용자 혼란 | Phase 0 ADR 명시 — 기록 종료 1회만 적립 (사진 보너스 없음) |

---

## 참고 문서

- 본 개편의 전제 — `doc/update/stamp-feature-guide.html` (Phase 1 스탬프)
- 본 개편의 직접 선행 — `doc/update/stamp-integration-plan.html` (Phase 2 통합)
- 데이터 모델 표준 — `doc/database/DATA_MODEL.md`
- 데이터베이스 규칙 — `doc/claude/RULES.md`
- 프롬프트 로그 — `doc/log/2026-05.md` (본 개편 진행 추적)

---

## Plan 파일

`C:\Users\N100274\.claude\plans\foamy-frolicking-lightning.md` — 본 작업의 원본 plan.
