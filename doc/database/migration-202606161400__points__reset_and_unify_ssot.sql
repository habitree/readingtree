-- 포인트 시스템 완전 초기화 + 적립/차감 규칙(SSoT) 통일
--
-- 배경: 과거 결제 후 실제 충전된 사용자 0명(payment_orders 테스트 주문만, point_purchase 0건).
--       런칭 전 클린 스타트를 위해 포인트/결제 테스트 데이터를 전부 비우고,
--       제각각이던 적립/차감 금액을 단일 기준(코드 types/points.ts)으로 정합화한다.
-- 선행: migration-202606161200(잔액 이중관리 트리거 제거 + 레벨 트리거 정상화)이 먼저 적용되어 있어야 함.
-- 점검 근거: doc/planning/point-settlement-audit-2026-06-16.md

-- =====================================================
-- 1) 데이터 완전 초기화  ★비가역★ (일회성 수동 실행)
--    재실행 시 현재 포인트/결제 데이터가 모두 삭제되므로 주의.
--    referrals(추천 관계), 구독 테이블은 포인트와 별개라 보존.
-- =====================================================
-- BEGIN;
-- DELETE FROM point_transactions;
-- DELETE FROM daily_missions;
-- DELETE FROM user_points;
-- DELETE FROM payment_history;
-- DELETE FROM payment_orders;
-- COMMIT;

-- =====================================================
-- 2) 적립값 SSoT 통일 (idempotent)
--    정답 = 코드 types/points.ts POINT_ACTION_DEFAULTS.
--    earn_points_atomic 이 읽는 point_action_configs.base_points = 코드 표시값 = 실제 적립값.
-- =====================================================
UPDATE point_action_configs SET base_points = 60  WHERE action_type = 'book_complete'        AND base_points <> 60;
UPDATE point_action_configs SET base_points = 8   WHERE action_type = 'book_add'              AND base_points <> 8;
UPDATE point_action_configs SET base_points = 8   WHERE action_type = 'daily_first_activity'  AND base_points <> 8;
UPDATE point_action_configs SET base_points = 12  WHERE action_type = 'mission_complete'      AND base_points <> 12;
UPDATE point_action_configs SET base_points = 40  WHERE action_type = 'all_missions_complete' AND base_points <> 40;
UPDATE point_action_configs SET base_points = 8   WHERE action_type = 'note_share'            AND base_points <> 8;
UPDATE point_action_configs SET base_points = 35  WHERE action_type = 'first_book'            AND base_points <> 35;
UPDATE point_action_configs SET base_points = 50  WHERE action_type = 'first_note'            AND base_points <> 50;
UPDATE point_action_configs SET base_points = 15  WHERE action_type = 'note_transcription'    AND base_points <> 15;
UPDATE point_action_configs SET base_points = 200 WHERE action_type = 'welcome_bonus'         AND base_points <> 200;

-- =====================================================
-- 3) 죽은 음수 spend config 정리 (idempotent)
--    실제 차감 단가는 코드 POINT_SPEND_COSTS 가 단일 보유.
--    config 의 *_spend 행 base_points 는 '적립값'이므로 0이어야 함(미사용 음수값 -100/-80/-150 제거).
-- =====================================================
UPDATE point_action_configs SET base_points = 0
WHERE action_type IN ('ai_chat_spend','ocr_spend','ai_report_spend') AND base_points <> 0;

-- =====================================================
-- 검증(수동): 음수 config 0, 활성 적립값이 코드와 일치
-- =====================================================
-- SELECT COUNT(*) FROM point_action_configs WHERE base_points < 0;  -- 0 이어야 정상
-- SELECT action_type, base_points FROM point_action_configs WHERE is_active ORDER BY category, base_points DESC;
