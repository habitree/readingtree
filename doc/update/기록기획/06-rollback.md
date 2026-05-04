# 06 — 롤백 카탈로그

> 모든 변경은 단독 롤백 가능. 본 문서는 절차·SQL·검증 방법을 모은 카탈로그.

---

## 1. 마이그레이션 롤백 (DB)

| Migration | 롤백 SQL 위치 | 데이터 손실 |
|---|---|---|
| M1 — `add_session_columns` | `02-migration.md §M1 롤백` | **컬럼 데이터 손실** (status, bookmark_*, image_urls 등 사용자 입력 분 사라짐) — Phase 1 직후라면 데이터 없음 |
| M2 — `image_urls_sync_trigger` | `DROP TRIGGER` + `DROP FUNCTION` | 없음 (트리거만 제거) |
| M3 — `notes__add_reading_log_link` | `02-migration.md §M3 롤백` | 컬럼 데이터 손실 (reading_log_id, detail_kind) — Phase 2 이후 사용 전이면 NULL뿐 |
| M4 — `backfill_status_and_image_urls` | 비파괴, 롤백 불필요 | 없음 |
| M5 — `close_orphan_in_progress` | 필요 시 reverse UPDATE | 없음 (abandoned ↔ in_progress 토글 가능) |

### 일반 절차
```bash
# 1. 적용 시각 기록
psql $DATABASE_URL -c "SELECT NOW();"

# 2. 롤백 SQL 실행
psql $DATABASE_URL -f rollback-MX.sql

# 3. 검증
psql $DATABASE_URL -c "\d reading_logs"
```

### 데이터 백업 (Phase 6 이후 필수)
```sql
CREATE TABLE reading_logs_backup_20260504 AS SELECT * FROM reading_logs;
CREATE TABLE notes_backup_20260504 AS SELECT * FROM notes;
```

---

## 2. 코드 롤백 (Vercel)

### 2.1 단일 PR revert
```bash
git revert <commit-hash>
git push origin main
# Vercel 자동 배포 (~2분)
```

### 2.2 Vercel 즉시 롤백 (배포 단위)
```bash
vercel rollback <deployment-url>
# 또는 Vercel 대시보드 → Promote to Production
```

### 2.3 카나리 토글 OFF
```bash
vercel env rm NEXT_PUBLIC_RECORD_V2 production
# 또는 값을 '0'으로 변경
vercel env add NEXT_PUBLIC_RECORD_V2 production
> 0
```
→ 새 진입점 비활성화, legacy 동작 즉시 복원.

---

## 3. Phase별 롤백 시나리오

### 3.1 Phase 1 (DB) — 마이그레이션 후 회귀 발견
1. 신규 코드 미배포 상태 확인.
2. M4 → M3 → M2 → M1 역순 롤백.
3. `npm run type-check` 통과 확인 (기존 코드 무회귀).
4. 원인 분석 → 수정된 마이그 재작성 → 재적용.

### 3.2 Phase 2~4 (코드 신설) — 단위 테스트 실패
- 미사용 신규 파일 → main에서 단순 revert.
- DB 영향 없음.

### 3.3 Phase 5 (진입점 통합) — 사용자 에러 급증
1. 즉시 `NEXT_PUBLIC_RECORD_V2=0` 토글 OFF.
2. 사용자는 legacy 진입점으로 자동 복귀.
3. 24시간 안정화 → 원인 분석.
4. Hotfix → 카나리 다시 시작.

### 3.4 Phase 6 (legacy 차단) — 외부 통합 깨짐
1. `createNote`의 `type='photo'|'progress'` throw 제거 PR revert.
2. 외부 통합 영향 확인.
3. 안내 후 다시 차단 (alpha API consumer 통보).

### 3.5 Phase 7 (텔레메트리·뷰) — 통계 불일치
- view 단독 DROP.
- analytics 이벤트는 단순 revert.

---

## 4. 데이터 복구 절차 (긴급)

### 4.1 in_progress가 잘못 abandoned 됨
```sql
-- 예: M5 적용 후 잘못 abandoned된 행 복구
UPDATE reading_logs
SET status = 'in_progress',
    ended_at = NULL,
    updated_at = NOW()
WHERE status = 'abandoned'
  AND updated_at >= '<M5 적용 시각>'
  AND ended_at = started_at + INTERVAL '12 hours';
```

### 4.2 notes(photo/progress) 차단 후 사용자 신규 시도 실패
- 임시: `app/actions/notes.ts::createNote`의 throw 비활성화 PR revert.
- 사용자 안내: "사진 기록은 '+ 기록' 버튼에서 시작해주세요" (인앱 토스트).

### 4.3 image_urls 손상 (트리거 버그)
```sql
-- image_url 있고 image_urls 비어있는 행 재동기
UPDATE reading_logs
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR jsonb_array_length(image_urls) = 0);
```

---

## 5. 롤백 후 체크리스트

- [ ] `npm run build` 통과
- [ ] 카나리 토글 상태 확인 (0/1)
- [ ] 24시간 모니터링: 에러율 베이스라인 복귀
- [ ] 사용자 문의 채널 모니터링 (Discord/이메일)
- [ ] `doc/log/2026-05.md`에 롤백 사유·시각·영향 기록
- [ ] `00-master.md` Phase 게이트 상태 되돌림

---

## 6. 관련 문서

- 마이그 SQL 원본: `doc/database/migration-2026050401~05.sql`
- 코드 변경 카탈로그: 본 plan `Critical Files` 섹션
- 카나리·환경변수: `04-rollout.md §6`
