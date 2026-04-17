# ReadTree Launch Checklist (Wave 1)

> **작성일**: 2026-04-17 | **대상**: D-14 ~ D0 런칭 준비 단계 검증 가이드
> 플랜: `C:\Users\N100274\.claude\plans\reactive-watching-dusk.md`

## 1. 환경 변수 (Vercel Production)

`.env.example` 기준으로 다음 키가 Vercel 대시보드 → Settings → Environment Variables에 등록되어야 한다.

### 필수

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — 완독 OG 이미지·레퍼럴 admin 조회에 필요
- [ ] `NEXT_PUBLIC_APP_URL` — 프로덕션 도메인 (https 포함, 마지막 슬래시 제외)
- [ ] `NEXT_PUBLIC_KAKAO_APP_KEY` — 카카오톡 공유 JavaScript 키
- [ ] `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` — 도서 검색
- [ ] `GEMINI_API_KEY` — OCR
- [ ] `OPENAI_API_KEY` — AI 채팅/리포트/자동 태그

### 결제 (Polar)

- [ ] `POLAR_ACCESS_TOKEN`
- [ ] `POLAR_WEBHOOK_SECRET`
- [ ] `POLAR_ENVIRONMENT=production` (런칭 시)

### 선택 / 고도화

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics
- [ ] `NL_SEOJI_CERT_KEY` / `ALADIN_TTB_KEY` / `GOOGLE_BOOKS_API_KEY` — 페이지 수 조회

## 2. Kakao Developers 도메인 등록

- [ ] 카카오 개발자 센터 → 내 애플리케이션 → 앱 설정 → 플랫폼 → Web
- [ ] `https://readingtree-tan.vercel.app` (또는 실제 프로덕션 도메인) 등록
- [ ] "Kakao Share" 활성화 확인
- [ ] OG 이미지 URL이 공개 접근 가능한지 (`/share/completions/{id}/opengraph-image`) 브라우저에서 확인

## 3. Supabase 마이그레이션 적용

다음 마이그레이션을 순서대로 실행 (SQL Editor 또는 CLI).

- [ ] `migration-202604170010__tracking__share_events.sql`
- [ ] `migration-202604170020__points__referral_milestone_actions.sql`

적용 후 확인:

```sql
-- share_events 테이블
SELECT EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name='share_events');

-- referrals 테이블에 milestone 컬럼 추가됨
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='referrals'
   AND column_name IN ('book_milestone_granted','note_milestone_granted');

-- 3단계 보상 액션 등록됨
SELECT action_type, base_points FROM point_action_configs
 WHERE action_type IN ('referral_bonus','referral_book_referrer',
                        'referral_book_referred','referral_success','referral_note_referred');
```

## 4. 테스트 스모크 (수동 E2E)

### 4-1. 비밀번호 재설정
1. [ ] `/login` → "비밀번호를 잊으셨나요?" 클릭 → `/reset-password` 이동 확인
2. [ ] 가입된 이메일 입력 → 재설정 이메일 수신
3. [ ] 이메일 링크 클릭 → `/update-password` 도착
4. [ ] 새 비밀번호 저장 → `/login` 리다이렉트 → 새 비밀번호로 로그인 성공

### 4-2. 완독 축하 카드 + 공유
1. [ ] 임의의 책을 `reading` 상태로 추가 → 진행률 100%로 맞추기 → 완독 다이얼로그 노출
2. [ ] "네, 완독했어요!" 클릭 → confetti + **완독 축하 카드** 노출
3. [ ] "링크" 버튼 → 클립보드에 `?ref={userId}&src=completion` 포함 URL 복사됨
4. [ ] "카카오" 버튼 → 카카오톡 공유창 열림 → OG 이미지 미리보기 표시
5. [ ] "X" 버튼 → Twitter intent URL 새 창 열림
6. [ ] `share_events` 테이블에 이벤트 3건 insert 확인

### 4-3. 공유 링크 랜딩
1. [ ] 시크릿 브라우저에서 복사한 링크 접속 → `/share/completions/{id}` 랜딩
2. [ ] OG 이미지 200 OK + "완독 축하" 카드 렌더 확인
3. [ ] "무료로 시작하기" 클릭 → `/signup` 이동, `rt_ref` 쿠키 저장 확인 (DevTools → Application → Cookies)

### 4-4. 레퍼럴 3단계 보상
테스트 계정 2개 (A=추천인, B=피추천인).
1. [ ] A의 완독 카드에서 링크 복사
2. [ ] 시크릿 브라우저로 링크 열고 B로 가입 → `referrals` 테이블에 `pending` 레코드 생성 확인
3. [ ] B가 첫 책 등록 → `point_transactions`에 `referral_book_referrer`(A, +100) + `referral_book_referred`(B, +100) 확인
4. [ ] B가 첫 노트 작성 → `referral_success`(A, +200) + `referral_note_referred`(B, +100) 확인
5. [ ] `referrals.status = 'completed'`, `book_milestone_granted = true`, `note_milestone_granted = true` 확인

### 4-5. 결제 퍼널
1. [ ] `/profile` 접속 → 상단에 SubscriptionCtaCard (프리미엄 업그레이드 CTA) 노출
2. [ ] 베타 모드 해제 후 AI 채팅 한도 에러 재현 → 업그레이드 모달 노출 → "AI 채팅을 계속 이어가세요" 헤드라인
3. [ ] "나중에 하기" 클릭 → 4시간 동안 같은 기능 키로 재노출 안 됨
4. [ ] `/pricing` → Polar 샌드박스 결제 → `/payment/success` → confetti + 충전 내역 카드

### 4-6. 토스트 표준 (내부 점검)
- [ ] W1에서 신규 작성한 파일은 모두 `notify.*` 사용 (grep으로 검증)

## 5. 알려진 제약

- **`is_public_completion` 컬럼 미구현**: 완독 카드는 기본적으로 누구나 접근 가능. Wave 3에서 비공개 토글 추가.
- **Native Share API**: 모바일 일부 브라우저(iOS Safari 15+)에서만 동작. fallback으로 카카오/링크/X 유지.
- **OG 이미지 초기 로딩**: Vercel Function 콜드 스타트 시 1~2초 소요. 공유 직후 첫 미리보기가 늦을 수 있음.

## 6. 런칭 주간 (D-7~D0) 남은 작업

- [ ] Playwright E2E 1종 자동화 (가입 → 책 추가 → 노트 → 완독 → 공유)
- [ ] `npm run test` 실행 후 스냅샷 기록
- [ ] Supabase Auth 이메일 템플릿 한국어 커스터마이즈 (선택)
- [ ] Polar 프로덕션 상품 등록 + Webhook URL 설정
