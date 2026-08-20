# 04 — 롤아웃 (Phase별 PR·카나리·배포)

## 1. PR 분할 전략

| Phase | PR 개수 | PR 크기 | 머지 전 검증 |
|---|---|---|---|
| 0 | 1 | 문서 13개 (~200KB) | 사용자 승인 |
| 1 | 4 (마이그 분리) | 각 ≤30 lines | type-check, build, 회귀 SQL |
| 2 | 1 | sessions.ts + 훅 + 테스트 | vitest 100% |
| 3 | 1 | RecordSheet 7개 + 훅 | E2E 3 시나리오 |
| 4 | 1 | 인디케이터 + nav/header 수정 | 다중탭·새로고침 |
| 5 | 3-4 (영역별) | 음악 / notes / 책상세 / quick action | grep 검증 |
| 6 | 1 | 마이그 1 + deprecation cleanup | 1주 카나리 |
| 7 | 2 | view + analytics, stats 페이지 | 이벤트 도달률 |

총 ~13개 PR, 평균 lifecycle 1~3일.

---

## 2. PR 템플릿

```markdown
## What
(Phase X — 변경 요약)

## Why
- 본 개편 plan: `~/.claude/plans/foamy-frolicking-lightning.md`
- 기획 문서: `doc/update/기록기획/00-master.md`
- 직접 참조: `doc/update/기록기획/phases/phase-X-*.md`

## Changes
- file1.ts (+X -Y)
- migration-XXX.sql (NEW)

## Verification
- [ ] npm run type-check
- [ ] npm run build
- [ ] npm run test
- [ ] Phase 게이트 조건 충족: ___

## Rollback
- 단독 revert 가능: Y
- DB 변경 시 롤백 SQL: `doc/update/기록기획/02-migration.md` MX 참조

## Phase 게이트
다음 Phase로 넘어가기 위한 조건:
- ___
```

---

## 3. 배포 순서 (안전)

### 3.1 Phase 1 (DB)
1. **staging** 적용 → 회귀 SQL 통과 확인
2. **production** 적용 (배포 윈도우 외, 코드 배포 전)
3. 24시간 모니터링: 기존 코드 동작 정상
4. Phase 2 코드 배포 가능 알림

### 3.2 Phase 2~4 (코드 신설, 노출 없음)
- main 머지 = 즉시 배포 (Vercel)
- 프로덕션 노출 없음 (FAB·진입점 미수정)

### 3.3 Phase 5 (진입점 통합)
1. **카나리 토글**: `NEXT_PUBLIC_RECORD_V2=1` 환경변수로 분기
2. 내부 사용자 (3명) → 1주
3. 신규 가입자 10% → 3일
4. 전체 → 1주 후

### 3.4 Phase 6~7 (legacy 차단·폴리싱)
- 카나리 100% 도달 후 1주 추가 모니터링.
- `notes.type IN ('photo','progress')` 신규 = 0 확인 후 차단 PR 머지.

---

## 4. 카나리 게이트 조건

| 단계 | 트리거 | 모니터링 |
|---|---|---|
| 내부 → 10% | 24시간 에러 0건 | Vercel logs, errors 테이블 |
| 10% → 100% | 3일 에러율 < 0.5% | 동일 + 사용자 피드백 채널 |
| 100% → 차단 | 1주 photo/progress 신규 0건 | DB 쿼리 |

---

## 5. 프롬프트 로그 (`doc/log/2026-05.md`)

각 Phase 완료 시 엔트리 추가. 형식:

```markdown
## 2026-05-04 · 기록 개편 Phase 0 완료
- 기획 문서 13개 (`doc/update/기록기획/`)
- 결정 5개 확정 (D1~D5 — `05-decisions.md`)
- 다음: Phase 1 마이그 4종
- P0 milestone 반영: ✅ (`doc/log/milestone.md`)
```

---

## 6. 환경변수 (Phase 5+)

| 키 | 기본 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_RECORD_V2` | `0` | 새 진입점 카나리 토글 |
| `RECORD_ABANDON_HOURS` | `12` | orphan 자동 종료 임계 (Phase 6) |

---

## 7. 외부 종속

| 항목 | 영향 |
|---|---|
| Supabase Storage `note-uploads` 버킷 | 사진 다중 업로드 — 기존 버킷 재사용, 정책 검토 |
| 포인트 시스템 (`app/actions/points.ts`) | 변경 없음 (D4) |
| 음악 플레이어 | Phase 5에서 통합, 별도 영역 유지 (D5) |
| `/stamps` 쿼리 | 변경 없음 (`image_url IS NOT NULL` 그대로) |
