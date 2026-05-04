# Phase 6 — 호환 정리·legacy 차단

> 목표: deprecation 함수들 thin wrapper로 축소. 신규 `notes.type IN ('photo','progress')` 차단. orphan 세션 자동 정리.

## 체크리스트

### 신규 마이그레이션
- [ ] `doc/database/migration-202605040500__data__close_orphan_in_progress.sql`
  - [ ] 12시간 이상 in_progress → abandoned
  - [ ] (선택) Supabase Cron으로 daily 자동 실행

### 변경 파일
- [ ] `app/actions/progress.ts`
  - [ ] `saveReadingSession` — thin wrapper 또는 export 제거 후 호출처 정리
  - [ ] `createReadingStamp` — 동일
  - [ ] `createProgressLog` — 동일
  - [ ] `attachStampToLog` — **유지** (사후 첨부 핵심), `image_urls` 갱신 로직 검증
- [ ] `app/actions/notes.ts::createNote`
  - [ ] `data.type === 'photo' | 'progress'` 시 throw
  - [ ] 에러 메시지: "사진은 '+ 기록'에서, 진행은 세션으로 통합되었습니다."
- [ ] `hooks/use-quick-capture.ts` — 상세기록 전용 시그니처로 정리
- [ ] `hooks/use-stamp-capture.ts` — `useRecordSheet`로 완전 위임 (shim 제거 또는 alias만)
- [ ] `components/stamps/stamp-capture-sheet.tsx` — Phase 6에서 thin shim 또는 제거 + RecordSheet alias

### 모니터링 (1주)
- [ ] DB 쿼리 (daily)
  ```sql
  SELECT count(*) FROM notes
  WHERE type IN ('photo','progress')
    AND created_at > '<phase-6-deploy-date>';
  ```
  → **0건이어야 함**
- [ ] DB 쿼리 (daily)
  ```sql
  SELECT user_id, count(*) FROM reading_logs
  WHERE status = 'in_progress'
  GROUP BY user_id HAVING count(*) > 1;
  ```
  → **빈 결과여야 함**
- [ ] errors 테이블 — `createNote photo/progress blocked` 에러 발생 빈도

### 검증
- [ ] `npm run type-check` 통과
- [ ] grep — `saveReadingSession` 호출 0건 (테스트 외)
- [ ] grep — `createReadingStamp` 호출 0건 (테스트 외)
- [ ] grep — `createNote({type: 'photo'...})` 0건

---

## 위험·완화

| 위험 | 완화 |
|---|---|
| 외부 통합/공유 링크가 photo/progress notes 생성 | Phase 6 배포 전 통합자 통보, 차단 후 1주 hotfix 윈도우 |
| 사용자가 legacy URL 접근 (북마크) | URL은 그대로 동작, 내부적으로 새 진입점 라우팅 |
| Cron 실패 → orphan 누적 | Phase 7 모니터링 + 수동 SQL 가능 |

---

## 다음 Phase 트리거

✅ **Phase 6 완료 조건**:
- 1주 photo/progress 신규 0건
- in_progress orphan ≤ 임계
- 사용자 차단 에러 보고 0건

→ **Phase 7 시작 가능** (`phase-7-polishing.md`)
