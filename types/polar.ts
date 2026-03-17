/**
 * Polar 결제 연동 타입 정의
 */

/** Polar 체크아웃 생성 요청 */
export interface PolarCheckoutRequest {
  packageId: string;
}

/** Polar 체크아웃 생성 응답 */
export interface PolarCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  checkoutId?: string;
  orderId?: string;
  error?: string;
}

/** Polar 결제 확인 결과 */
export interface PolarConfirmResult {
  success: boolean;
  pointsCharged?: number;
  newBalance?: number;
  basePoints?: number;
  bonusPoints?: number;
  firstPurchaseBonus?: number;
  error?: string;
}

/** Polar 웹훅 Order 데이터 (필요한 필드만) */
export interface PolarWebhookOrder {
  id: string;
  metadata: Record<string, string>;
  amount: number;
  currency: string;
  product_id: string;
  customer_email?: string;
}
