# 결제 트러블슈팅 가이드

## 자주 발생하는 에러

### INVALID_CARD_COMPANY
- **원인**: 지원하지 않는 카드사
- **해결**: 다른 카드로 재시도 안내

### EXCEED_MAX_CARD_INSTALLMENT_PLAN
- **원인**: 할부 개월 수 초과
- **해결**: 일시불 또는 낮은 할부로 재시도

### INVALID_STOPPED_CARD
- **원인**: 정지된 카드
- **해결**: 카드사에 문의 안내

### REJECT_CARD_COMPANY
- **원인**: 카드사 거절 (한도 초과 등)
- **해결**: 다른 카드 또는 결제 수단 사용 안내

### PAY_PROCESS_CANCELED
- **원인**: 사용자가 결제창에서 취소
- **해결**: 정상 동작, 에러 메시지 없이 처리

### AMOUNT_MISMATCH (자체 에러)
- **원인**: 클라이언트 전달 금액과 DB 주문 금액 불일치
- **해결**: 위변조 시도로 판단, 주문 failed 처리

## 결제 승인 성공 but 포인트 미충전

1. `payment_orders` 테이블에서 해당 주문 확인
   - status가 `confirmed`인지 확인
2. `payment_history` 테이블에서 `points_charged` 이벤트 확인
3. `point_transactions` 테이블에서 `point_purchase` 내역 확인
4. `user_points` 테이블에서 잔액 확인

### 수동 복구 (관리자)
```sql
-- 1. 주문 확인
SELECT * FROM payment_orders WHERE order_id = 'RT_xxx';

-- 2. 포인트 수동 충전
UPDATE user_points
SET total_points = total_points + {충전량},
    lifetime_points = lifetime_points + {충전량},
    updated_at = now()
WHERE user_id = '{사용자ID}';

-- 3. 트랜잭션 기록
INSERT INTO point_transactions (user_id, action_type, points, final_points, description, reference_id, reference_type, balance_after)
VALUES ('{사용자ID}', 'point_purchase', {충전량}, {충전량}, '수동 복구', 'RT_xxx', 'payment', {새잔액});
```

## 환불 처리

토스페이먼츠 대시보드에서 직접 취소:
1. 토스페이먼츠 대시보드 → 결제 내역 → 해당 건 선택 → 취소
2. 웹훅이 `PAYMENT_STATUS_CHANGED` (CANCELED) 이벤트 전송
3. 자동으로 포인트 회수 처리

### 수동 환불
```sql
-- 주문 상태 변경
UPDATE payment_orders SET status = 'cancelled' WHERE order_id = 'RT_xxx';

-- 포인트 회수
UPDATE user_points
SET total_points = total_points - {충전량},
    updated_at = now()
WHERE user_id = '{사용자ID}';
```

## 가상계좌 입금 미확인

1. 웹훅 수신 확인: `payment_history`에서 `webhook_received` 이벤트 검색
2. 웹훅 URL이 올바르게 등록되었는지 확인
3. Vercel Function Logs에서 에러 확인
4. 토스페이먼츠 대시보드에서 입금 상태 확인
