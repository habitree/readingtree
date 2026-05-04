# Phase 1 — 데이터 모델

> 목표: 새 컬럼·트리거·타입을 도입한다. **코드는 아직 사용하지 않음** — 읽기 안전·기존 빌드 무회귀.

## 체크리스트

### 마이그레이션 (4개)
- [ ] `doc/database/migration-202605040100__reading_logs__add_session_columns.sql` 작성
- [ ] `doc/database/migration-202605040200__reading_logs__image_urls_sync_trigger.sql` 작성
- [ ] `doc/database/migration-202605040300__notes__add_reading_log_link.sql` 작성
- [ ] `doc/database/migration-202605040400__data__backfill_status_and_image_urls.sql` 작성

### 타입 (2개)
- [ ] `types/progress.ts` — `ReadingLog` 확장 + `SessionStatus`·`StartSessionInput`·`EndSessionInput`·`ReadingLogActive` 신설
- [ ] `types/note.ts` — `Note` 확장 + `DetailKind`·`AddDetailInput` 신설

### Supabase 타입 동기화
- [ ] `supabase__generate_typescript_types` 또는 `supabase gen types` 실행 → `types/database.ts` 갱신
- [ ] 충돌 해결 (수기 타입 vs 자동 생성)

### 적용
- [ ] staging Supabase에 마이그 4개 적용 (`supabase migration up --linked`)
- [ ] `\d+ reading_logs`, `\d+ notes`로 컬럼·인덱스·트리거 확인
- [ ] 회귀 SQL 실행 (`02-migration.md §일괄 검증 SQL`)
- [ ] production 적용 (배포 윈도우 외, 코드 배포 전)

### 검증
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 통과
- [ ] `npm run test` 회귀 없음
- [ ] `SELECT count(*) FROM reading_logs WHERE status IS NULL` = 0
- [ ] `SELECT count(*) FROM reading_logs WHERE image_url IS NOT NULL AND jsonb_array_length(image_urls) = 0` = 0
- [ ] 트리거 동작 테스트 (image_urls만 set → image_url 자동 set)

---

## 신규/변경 파일 목록

```
NEW  doc/database/migration-202605040100__reading_logs__add_session_columns.sql
NEW  doc/database/migration-202605040200__reading_logs__image_urls_sync_trigger.sql
NEW  doc/database/migration-202605040300__notes__add_reading_log_link.sql
NEW  doc/database/migration-202605040400__data__backfill_status_and_image_urls.sql
EDIT types/progress.ts
EDIT types/note.ts
EDIT types/database.ts (자동 생성)
```

---

## 다음 Phase 트리거

✅ **Phase 1 완료 조건**:
- 4개 마이그 prod 적용 완료
- 24시간 무회귀 모니터링
- type-check / build / test 모두 통과

→ **Phase 2 시작 가능** (`phase-2-actions.md`)
