# 결제 시스템 설정 가이드

> **2026-04-09**: 토스페이먼츠 비활성화. Polar가 현재 활성 결제 수단.
> 토스 재활성화: `lib/payment/config.ts`의 `IS_TOSS_ENABLED = true`로 변경

---

## Polar 결제 (현재 활성)

Polar를 통한 국제/한국 결제. 환경변수:
- `POLAR_ACCESS_TOKEN` — Polar 대시보드에서 발급
- `POLAR_WEBHOOK_SECRET` — 웹훅 서명 검증용
- `POLAR_ENVIRONMENT` — `sandbox` 또는 `production`
- `NEXT_PUBLIC_POLAR_PRODUCT_LIGHT` — 라이트 패키지 Product ID
- `NEXT_PUBLIC_POLAR_PRODUCT_STANDARD` — 스탠다드 패키지 Product ID
- `NEXT_PUBLIC_POLAR_PRODUCT_PREMIUM` — 프리미엄 패키지 Product ID

---

## 토스페이먼츠 결제 (비활성 — 사업자 등록 후 재활성화)

### 사전 준비

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) 가입
2. 상점 등록 (사업자등록증 필요 — 테스트 모드는 없이도 가능)
3. 테스트용 클라이언트 키 / 시크릿 키 발급

## 환경변수 설정

### 로컬 개발 (.env.local)

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxx
```

### Vercel 프로덕션

Vercel Dashboard → Settings → Environment Variables:

| 변수명 | 환경 | 값 |
|--------|------|-----|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Production | `live_ck_...` |
| `TOSS_SECRET_KEY` | Production | `live_sk_...` |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Preview/Development | `test_ck_...` |
| `TOSS_SECRET_KEY` | Preview/Development | `test_sk_...` |

## DB 마이그레이션

Supabase SQL Editor에서 실행:

```bash
# 마이그레이션 파일 위치
doc/database/migration-202603051200__payment__create_tables.sql
```

## 테스트 방법

### 테스트 카드 번호

| 카드 번호 | 유효기간 | CVC | 비밀번호 | 결과 |
|-----------|---------|-----|---------|------|
| 4330-0000-0000-0014 | 12/25 | 123 | 00 | 성공 |
| 4330-0000-0000-0022 | 12/25 | 123 | 00 | 실패 |

### 테스트 시나리오

1. **정상 결제**: 라이트/스탠다드/프리미엄 각각 구매 → 포인트 충전 확인
2. **첫 충전 보너스**: 신규 계정에서 첫 결제 → 2배 보너스 확인
3. **금액 위변조**: 브라우저 DevTools에서 amount 수정 후 confirm → 거부 확인
4. **미로그인**: 로그아웃 상태에서 충전 버튼 → /login 리다이렉트 확인
5. **결제 취소**: 결제창에서 취소 → 에러 없이 원래 페이지로 복귀

## 운영 전환 체크리스트

- [ ] 토스페이먼츠에서 운영 키 발급
- [ ] Vercel 환경변수를 운영 키로 교체
- [ ] 웹훅 URL 등록: `https://도메인/api/payment/webhook`
- [ ] 실제 카드로 소액(₩1,900) 테스트 결제
- [ ] 포인트 충전 확인
- [ ] 결제 취소 → 포인트 회수 확인
- [ ] payment_orders, payment_history 데이터 확인

## 웹훅 URL 등록

토스페이먼츠 개발자센터 → 내 상점 → 웹훅 설정:

```
URL: https://your-domain.com/api/payment/webhook
이벤트: DEPOSIT_CALLBACK, PAYMENT_STATUS_CHANGED
```
