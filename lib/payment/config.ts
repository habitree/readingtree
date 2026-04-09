/**
 * 결제 시스템 설정
 */

/**
 * 토스페이먼츠 활성화 여부
 * 한국 사업자 등록 완료 후 true로 전환하면 토스 결제가 재활성화됩니다.
 * 관련 파일: hooks/use-toss-payment.ts, app/api/payment/confirm, app/api/payment/webhook
 */
export const IS_TOSS_ENABLED = false;
