# 고도화 Phase 2 — 진행 상황 문서

> 작성일: 2026-02-19
> 상태: **대기 (일시 중단)**

---

## 실행 순서: #11 → #12 → #9 → #8 → #7 → #10

---

## ✅ #11: 거대 액션 파일 분리 — 완료

| 원본 파일 | 줄수 | 분리 결과 |
|-----------|------|-----------|
| `groups.ts` | 2,814 | → `app/actions/groups/` (8파일) |
| `books.ts` | 2,233 | → `app/actions/books/` (5파일) |
| `admin.ts` | 1,494 | → `app/actions/admin/` (4파일) |

### 생성된 파일

**groups/ (8개)**
- `_shared.ts` — checkGroupAccess, updateGroupActivityStats, getWeekStart, 타입
- `core.ts` — createGroup, getGroups, getPublicGroups, getGroupDetail, updateGroup, deleteGroup, getGroupForSettings
- `members.ts` — joinGroup, approveMember 등 10개 함수
- `books.ts` — addGroupBook 등 8개 함수
- `notes.ts` — shareNoteToGroup 등 6개 함수
- `analytics.ts` — getMemberProgress 등 3개 함수
- `invites.ts` — createInviteToken 등 5개 함수
- `index.ts` — barrel re-export

**books/ (5개)**
- `_shared.ts` — normalizePublishedDate, 상수, AddBookInput
- `core.ts` — getBook, addBook, ensureBook 등 6개 함수
- `reading.ts` — getUserBooks 등 6개 함수
- `progress.ts` — updateBookStatus 등 7개 함수
- `index.ts` — barrel re-export

**admin/ (4개)**
- `_shared.ts` — requireAdmin 헬퍼
- `stats.ts` — getAdminStats 등 4개 함수
- `ocr.ts` — OCR 관련 8개 함수 + 2개 타입
- `index.ts` — barrel re-export

원본 3개 파일 삭제 완료. 기존 import 경로 호환 (barrel index.ts).

---

## 🔶 #12: 유닛 테스트 기반 구축 — 파일 생성 완료, 검증 필요

### 생성된 파일
- `vitest.config.ts` — happy-dom env, path alias, v8 coverage
- `__tests__/setup.ts` — Supabase mock factory
- `__tests__/actions/points.test.ts` — earnPoints 4개 테스트
- `__tests__/actions/auth.test.ts` — getCurrentUser/isAdmin 5개 테스트
- `__tests__/actions/books-progress.test.ts` — updateBookStatus 2개 테스트

### package.json 변경
- devDependencies: vitest, @vitest/coverage-v8, happy-dom 추가
- scripts: test, test:watch, test:coverage 추가

### 남은 작업
- [ ] `npm run test` 실행하여 전체 통과 확인

---

## 🔶 #9: 포인트 소비처 연결 — 핵심 로직 완료, API 연동 필요

### 완료된 파일
- `doc/database/migration-202602200001__points__add_spend_types.sql` — ENUM 추가 (ai_chat_spend, ocr_spend, point_refund)
- `types/points.ts` — PointSpendType, POINT_SPEND_COSTS, SpendPointsResult, CheckPointBalanceResult 추가
- `app/actions/points.ts` — spendPoints, refundPoints, checkPointBalance 함수 추가
- `components/points/insufficient-points-prompt.tsx` — 잔액 부족 다이얼로그
- `lib/i18n/dictionaries/ko.ts` — points 관련 i18n 키 추가
- `lib/i18n/dictionaries/en.ts` — points 관련 i18n 키 추가

### 남은 작업
- [ ] `app/api/ai/chat/route.ts` 수정 — checkPointBalance → spendPoints → catch 시 refundPoints
- [ ] `app/api/ocr/route.ts` 수정 — 동일 패턴
- [ ] AI 채팅 입력 옆 "500P" 뱃지 UI
- [ ] OCR 버튼 옆 "300P" 뱃지 UI

---

## 🔶 #8: 프리미엄 구독 기능 분리 (MVP) — 서버 로직 완료, UI/API 연동 필요

### 완료된 파일
- `doc/database/migration-202602200002__subscription__create_tables.sql` — subscription_tiers + user_subscriptions 테이블
- `lib/subscription/gates.ts` — FeatureKey, FEATURE_GATES (freeLimit/premiumLimit/pointCostOnExceed)
- `app/actions/subscription.ts` — getUserTier, checkFeatureAccess

### 남은 작업
- [ ] `components/subscription/upgrade-prompt.tsx` 생성 — "무료 횟수 소진" 안내 모달
- [ ] `app/api/ai/chat/route.ts` 수정 — checkFeatureAccess 통합 (#9와 결합)
- [ ] `app/api/ocr/route.ts` 수정 — 동일 패턴 (#9와 결합)
- [ ] `types/database.ts` 업데이트 — subscription 테이블 타입 추가

---

## ⬜ #7: 완독 축하 카드 + SNS 공유 — 미착수 (i18n 키만 추가)

### 완료된 파일
- `lib/i18n/dictionaries/ko.ts` — share 관련 i18n 키 추가 (twitterShare, nativeShare 등)
- `lib/i18n/dictionaries/en.ts` — share 관련 i18n 키 추가

### 남은 작업
- [ ] `components/books/book-status-selector.tsx` 수정 — bookTitle/bookAuthor props, 완독 시 다이얼로그 트리거
- [ ] `app/(main)/books/[id]/page.tsx` 수정 — bookTitle/bookAuthor 전달
- [ ] `components/share/completion-share-card.tsx` 생성 — 축하 카드 UI
- [ ] `components/share/simple-share-dialog.tsx` 수정 — Twitter/X + Web Share API 버튼 추가

---

## ⬜ #10: 카카오톡 공유 개선 — 미착수

### 남은 작업
- [ ] `components/share/simple-share-dialog.tsx` — handleKakaoShare 성공 시 earnPoints 호출 (2줄 추가)

---

## 전체 검증 (모든 작업 완료 후)
- [ ] `npm run type-check` 통과
- [ ] `npm run build` 성공
- [ ] `npm run test` 전체 통과
- [ ] Supabase MCP로 마이그레이션 2개 적용
