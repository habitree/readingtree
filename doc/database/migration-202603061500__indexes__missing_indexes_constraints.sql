-- B-2: 누락된 인덱스 추가

-- 포인트 일일 한도 체크 최적화 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_action_created
ON point_transactions(user_id, action_type, created_at);

-- 결제 주문 복합 조회
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_status
ON payment_orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_orders_order_user
ON payment_orders(order_id, user_id);
