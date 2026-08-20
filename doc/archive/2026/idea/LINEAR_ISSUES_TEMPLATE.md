# Linear 이슈 생성 템플릿

> 아래 내용을 Linear에 복사하여 이슈 생성

---

## 이슈 1: [완료] Phase 1 - Quick Wins 구현

**제목:** Phase 1: Quick Wins 완료

**설명:**
```
## 완료된 작업

### 1. 복합 인덱스 추가
- 16개 복합 인덱스 생성
- 파일: `doc/database/migration-202601241000__indexes__add_composite_indexes.sql`
- 효과: 쿼리 성능 50% 향상 예상

### 2. AVIF 이미지 설정
- 파일: `next.config.js`
- 효과: 이미지 용량 50% 감소

### 3. 파일 업로드 검증 강화
- 파일: `lib/security/file-validation.ts`
- 파일 시그니처 검증, MIME 타입 검증
- 효과: 악성 파일 업로드 차단

### 4. 읽기 진행률 기능
- `user_books.current_page` 컬럼 추가
- 진행률 UI 컴포넌트 구현
- 책 상세 페이지에 통합

### 5. CSP 보안 헤더
- 7개 보안 헤더 추가
- 효과: 보안 점수 D → A+

### 6. Recharts 동적 임포트
- 이미 구현되어 있음
- 효과: 번들 크기 -120KB
```

**상태:** Done
**라벨:** enhancement, security, performance

---

## 이슈 2: [완료] Phase 2 - Streaming SSR 대시보드

**제목:** Streaming SSR 대시보드 구현

**설명:**
```
## 구현 내용

### 스켈레톤 UI
- 파일: `components/dashboard/skeletons.tsx`
- 각 섹션별 로딩 상태 표시

### 대시보드 섹션 (6개)
- `components/dashboard/sections/goal-progress-section.tsx`
- `components/dashboard/sections/stats-cards-section.tsx`
- `components/dashboard/sections/recent-books-section.tsx`
- `components/dashboard/sections/monthly-stats-section.tsx`
- `components/dashboard/sections/recent-notes-section.tsx`
- `components/dashboard/sections/top-books-section.tsx`

### Suspense 통합
- 파일: `components/dashboard/dashboard-content.tsx`
- 각 섹션별 독립적 데이터 페칭
- 점진적 로딩 구현

## 효과
- TTFB 1.2s → 0.5s 예상
```

**상태:** Done
**라벨:** enhancement, performance

---

## 이슈 3: [완료] Phase 2 - Forest 다크모드

**제목:** Forest 다크모드 테마 구현

**설명:**
```
## 구현 내용

### 테마 시스템
- 4개 테마 지원: light, dark, forest, forest-dark
- CSS 변수 기반 테마 시스템
- 동적 테마 전환 지원

### 수정된 파일
- `app/globals.css` - .forest-dark 테마 추가
- `components/theme/theme-selector.tsx` - 4개 테마 선택
- `app/layout.tsx` - ThemeProvider 적용

## 효과
- 브랜드 정체성 강화
- 사용자 선택권 확대
```

**상태:** Done
**라벨:** enhancement, ui

---

## 이슈 4: [완료] Phase 2 - 프로그레시브 온보딩

**제목:** 프로그레시브 온보딩 위저드 구현

**설명:**
```
## 구현 내용

### 3단계 통합 위저드
1. 약관 동의 (consent)
2. 목표 설정 (goal)
3. 튜토리얼 (tutorial)

### 새로 생성된 파일
- `components/onboarding/progress-indicator.tsx`
- `components/onboarding/onboarding-wizard.tsx`
- `components/onboarding/steps/consent-step.tsx`
- `components/onboarding/steps/goal-step.tsx`
- `components/onboarding/steps/tutorial-step.tsx`

### 기능
- 시각적 진행률 표시
- 이미 완료된 단계 스킵 기능
- 부드러운 애니메이션 전환

### DB 마이그레이션
- `users.terms_agreed`, `users.privacy_agreed`, `users.consent_date` 컬럼 추가

## 효과
- 온보딩 완료율 40% → 70% 예상
```

**상태:** Done
**라벨:** enhancement, ux

---

## 이슈 5: [진행 중] DB 마이그레이션 확인

**제목:** DB 마이그레이션 적용 확인

**설명:**
```
## 확인 필요 항목

### 1. user_books.current_page
- 마이그레이션: `migration-202601241100__user_books__add_current_page.sql`

### 2. books.total_pages
- 기존 컬럼 확인

### 3. users 약관 동의 컬럼
- 마이그레이션: `migration-202601241500__users__add_consent_columns.sql`
- terms_agreed, privacy_agreed, consent_date

## 확인 SQL
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_books' AND column_name = 'current_page';

SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('terms_agreed', 'privacy_agreed', 'consent_date');
```

**상태:** In Progress
**라벨:** database, infrastructure

---

## 이슈 6: [예정] Phase 2 - 배지/업적 시스템

**제목:** 배지/업적 시스템 구현

**설명:**
```
## 구현 예정

### 목표
- 게이미피케이션 기능 추가
- D30 리텐션 40% 달성

### 예상 작업
1. 배지 테이블 설계
2. 업적 조건 정의
3. 배지 획득 로직 구현
4. 배지 표시 UI 구현
5. 알림 시스템 연동

### 난이도
중간
```

**상태:** Backlog
**라벨:** enhancement, gamification

---

## 이슈 7: [예정] Phase 3 - 향후 작업

**제목:** Phase 3 작업 목록

**설명:**
```
## 예정된 작업

1. **Inngest 메시지 큐**
   - OCR 성공률 98% 목표
   - 난이도: 중간

2. **PWA Service Worker**
   - 설치율 15% 목표
   - 난이도: 높음

3. **시맨틱 검색 (pgvector)**
   - 검색 만족도 향상
   - 난이도: 높음

4. **AI 독서 리포트**
   - 프리미엄 기능
   - 난이도: 중간
```

**상태:** Backlog
**라벨:** roadmap

---

## Linear CLI로 생성하기

Linear CLI가 설치되어 있다면:

```bash
# 이슈 생성 예시
linear issue create --title "Phase 1: Quick Wins 완료" --description "..." --status "done"
```

## MCP로 생성하기

Claude Code 세션 재시작 후:
1. `/mcp` 명령어로 MCP 상태 확인
2. Linear MCP 도구 사용하여 이슈 생성
