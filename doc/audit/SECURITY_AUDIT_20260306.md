# Security Audit Report - 2026-03-06

## 감사 범위

인증/세션 관리 전반 - "프론트엔드 이메일 파라미터 조작으로 타인 계정 접근" 취약점 점검

---

## 1. 점검 결과 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 프론트 이메일/userId 조작 공격 | 안전 | 클라이언트가 user_id를 전송하지 않음 |
| Server Action 인증 검증 | 안전 | 모든 액션에서 `getCurrentUser()` / `getUser()` 사용 |
| API 라우트 인증 검증 | 안전 | `supabase.auth.getUser()`로 JWT 쿠키 검증 |
| RLS 정책 | 안전 | `auth.uid() = user_id` 패턴 일관 적용 |
| Admin 클라이언트 노출 | 안전 | 서버사이드만 사용 |
| **결제 웹훅 서명 검증** | **취약 (수정됨)** | HMAC 서명 검증 추가 완료 |
| 로그인 브루트포스 방어 | 주의 | Supabase Auth 기본 rate limit에 의존 |

---

## 2. 인증 아키텍처 분석

### 인증 흐름

```
사용자 입력 → Supabase Auth (signIn) → JWT 세션 쿠키 생성
→ proxy.ts (미들웨어) → updateSession() → JWT 자동 검증/갱신
→ Server Action / API Route → getUser() → auth.uid() 추출
→ RLS 정책으로 데이터 접근 제어
```

### 핵심 보안 원칙

1. **서버 신뢰 원칙**: 사용자 식별은 반드시 `supabase.auth.getUser()`로만 수행
2. **클라이언트 불신 원칙**: request body의 userId/email을 인증 목적으로 사용하지 않음
3. **이중 보호**: Server Action 레벨 인증 + DB RLS 정책

### 검증 패턴 (모든 Server Action 공통)

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("로그인이 필요합니다.");
// user.id는 JWT 토큰에서 추출 → 조작 불가
```

---

## 3. 발견된 취약점 및 조치

### [Critical] 결제 웹훅 서명 검증 미비

**파일**: `app/api/payment/webhook/route.ts`

**취약점**: 토스페이먼츠 웹훅 엔드포인트가 요청 출처를 검증하지 않음. 공격자가 POST 요청을 조작하여 임의 주문에 대해 포인트 충전/취소 가능.

**공격 시나리오**:
1. 공격자가 `/api/payment/webhook`에 조작된 DEPOSIT_CALLBACK payload 전송
2. 존재하는 orderId가 포함되면 해당 주문의 포인트가 충전됨
3. Admin 클라이언트 사용으로 RLS도 우회됨

**조치 (완료)**:
- HMAC-SHA256 서명 검증 추가 (`x-toss-signature` 헤더)
- Fail-closed 정책: 시크릿 미설정 또는 서명 불일치 시 401 거부
- 환경변수 `TOSS_WEBHOOK_SECRET` 추가

**필요 작업**:
- [ ] 토스 개발자센터에서 웹훅 시크릿 발급
- [ ] 운영/스테이징 환경변수에 `TOSS_WEBHOOK_SECRET` 설정

### [Low] 로그인 브루트포스 방어

**현황**: Supabase Auth 기본 rate limiting에 의존 (GoTrue 서버 레벨).

**권고**: 현재 수준으로 충분하나, 추가 방어가 필요한 경우:
- 커스텀 IP 기반 rate limiting (분당 5회 실패 시 차단)
- 계정 잠금 정책 (연속 10회 실패 시 15분 잠금)

---

## 4. 안전 확인된 주요 엔드포인트

### Server Actions (app/actions/)

| 파일 | 함수 | 인증 | 소유권 검증 |
|------|------|------|-----------|
| auth.ts | deleteAccount | getCurrentUser() | user.id 필터 |
| profile.ts | updateProfile | getUser() | user.id 필터 |
| notes.ts | createNote | getCurrentUser() | user_id = currentUser.id |
| notes.ts | updateNote | getCurrentUser() | eq("user_id", currentUser.id) |
| notes.ts | deleteNote | getCurrentUser() | eq("user_id", currentUser.id) |
| books/core.ts | addBook | getCurrentUser() | user_id 자동 설정 |
| groups/core.ts | createGroup | getUser() | leader_id = user.id |
| points.ts | earnPoints | getCurrentUser() | user_id = currentUser.id |

### API Routes (app/api/)

| 엔드포인트 | 인증 | 비고 |
|-----------|------|------|
| POST /api/payment/confirm | getUser() + rate limit | 금액 위변조 검증 포함 |
| POST /api/payment/webhook | HMAC 서명 검증 (수정 후) | Admin 클라이언트 사용 |
| POST /api/upload | getUser() | user.id로 경로 생성 |

---

## 5. RLS 정책 현황

모든 사용자 데이터 테이블에 `auth.uid() = user_id` 패턴 적용:

- users: 자신의 프로필만 조회/수정
- notes: 자신의 노트 + 공개 노트 읽기
- user_books: 자신의 책만 CRUD
- user_points: 자신의 포인트만 조회
- group_members: 리더만 멤버 관리

---

## 6. 결론

"프론트에서 이메일 파라미터를 조작해서 남의 계정에 접근"하는 취약점은 **존재하지 않습니다**.

이 프로젝트는 Supabase Auth의 JWT 기반 세션 관리를 올바르게 사용하고 있으며,
클라이언트가 제공하는 사용자 식별 정보를 신뢰하지 않습니다.

유일하게 발견된 실질적 취약점인 **결제 웹훅 서명 검증 미비**는 본 감사에서 수정 완료되었습니다.
