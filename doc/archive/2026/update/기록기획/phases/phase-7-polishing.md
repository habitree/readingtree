# Phase 7 — 검증·텔레메트리·폴리싱

> 목표: 통합 뷰 + 텔레메트리 4종 + 통계 페이지 갱신. UX 미세 조정.

## 체크리스트

### 통합 뷰 (선택)
- [ ] `doc/database/migration-202605041000__view__reading_records.sql`
  - [ ] `reading_records_view` — `reading_logs` UNION ALL legacy `notes(photo/progress)`
  - [ ] 컬럼: `id`, `user_id`, `book_id`, `kind` (`record`/`legacy_photo`/`legacy_progress`), `created_at`, `summary` 등
- [ ] 책 상세 타임라인이 view 사용 (선택)

### 텔레메트리
- [ ] `lib/analytics/events.ts` (또는 동등) — 이벤트 4종 정의
  - [ ] `record_started` — `{ has_book, has_target_seconds, source }`
  - [ ] `record_ended` — `{ duration_s, pages_read, has_memo, has_bookmark, photo_count }`
  - [ ] `record_abandoned` — `{ duration_s, source: 'manual' | 'auto_12h' }`
  - [ ] `detail_added` — `{ kind, has_session_link, content_length }`
- [ ] 발송 위치
  - [ ] `app/actions/sessions.ts` 내부에서 서버 이벤트
  - [ ] `components/records/record-end-step.tsx` 내부에서 클라이언트 이벤트

### 통계 페이지
- [ ] `app/(main)/stats/page.tsx`
  - [ ] 총 시간 / 총 페이지 / 평균 페이스 (분/페이지)
  - [ ] 스탬프 비율 (사진 있는 세션 / 전체 세션)
  - [ ] 주간 캘린더 히트맵 (`promoted_at` 또는 `created_at` 기반)
  - [ ] 책별 누적 시간 Top 5
- [ ] `components/stats/*` — 차트 컴포넌트 (recharts 또는 기존 라이브러리)

### UX 폴리싱
- [ ] start-step에 직전 `bookmark_text` prefill 표시 (D1 활용)
- [ ] end-step "끝 페이지" 입력 시 진행률 progress bar
- [ ] 인디케이터 long-press 메뉴 — "+5분 더", "취소"
- [ ] 토스트에 "공유" 버튼 → 기존 `addStampToBlob` 재사용

### 모니터링 대시보드 (Vercel)
- [ ] 4개 이벤트 도달률 ≥ 90%
- [ ] 에러율 < 0.5%
- [ ] LCP/INP 회귀 0
- [ ] 카나리 100% 1주 후 카나리 토글 제거

### 검증
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 통과
- [ ] 통계 페이지 시각 검수
- [ ] 텔레메트리 이벤트 — 디버그 모드에서 4종 모두 발송 확인

---

## 산출물 정리

- [ ] `doc/log/2026-05.md`에 Phase 7 완료 엔트리
- [ ] `doc/log/milestone.md` — "기록 통합 v2 완료" 마일스톤 추가
- [ ] `00-master.md` — 모든 Phase 상태 ✅
- [ ] `MEMORY.md` 업데이트 — "기록 통합 v2 (2026-05)" 메모

---

## 종료 후 Follow-up (별도 PRD 후보)

- 사진 보너스 도입 (D4 확장)
- 책당 N 세션 (D2 완화)
- 북마크 컬렉션 페이지 (D1 확장)
- 음성 메모 (Phase 3+ Wave 6 로드맵)
- 다국어 ja 추가 (Wave 7)

---

## 본 개편 종료 선언 조건

- [ ] Phase 0~7 모두 ✅
- [ ] 사용자 피드백 채널 무이슈 1주
- [ ] DB·코드 모두 새 모델 일관 사용

→ **개편 완료** 🎉
