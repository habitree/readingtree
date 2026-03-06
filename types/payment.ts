/**
 * 결제 시스템 타입 정의
 * 토스페이먼츠 연동
 */

/** 결제 주문 상태 */
export type PaymentOrderStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "cancelled"
  | "expired";

/** 결제 이벤트 타입 */
export type PaymentEventType =
  | "order_created"
  | "payment_confirmed"
  | "payment_failed"
  | "points_charged"
  | "payment_cancelled"
  | "order_expired"
  | "webhook_received";

/** 결제 주문 DB row */
export interface PaymentOrder {
  id: string;
  user_id: string;
  order_id: string;
  package_id: string;
  amount: number;
  points: number;
  bonus_points: number;
  first_purchase_bonus: number;
  status: PaymentOrderStatus;
  payment_key: string | null;
  payment_method: string | null;
  failure_code: string | null;
  failure_message: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 결제 이력 DB row */
export interface PaymentHistory {
  id: string;
  order_id: string;
  user_id: string;
  event_type: PaymentEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

/** 주문 생성 결과 */
export interface CreatePaymentOrderResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  orderName?: string;
  customerName?: string;
  error?: string;
}

/** 결제 승인 요청 */
export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/** 결제 승인 결과 */
export interface ConfirmPaymentResult {
  success: boolean;
  pointsCharged?: number;
  newBalance?: number;
  basePoints?: number;
  bonusPoints?: number;
  firstPurchaseBonus?: number;
  error?: string;
}

/** 토스 결제 승인 API 응답 */
export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
  requestedAt: string;
  card?: {
    issuerCode: string;
    number: string;
    installmentPlanMonths: number;
  };
  virtualAccount?: {
    accountNumber: string;
    bankCode: string;
    dueDate: string;
  };
  easyPay?: {
    provider: string;
  };
  failure?: {
    code: string;
    message: string;
  };
}

/** 토스 웹훅 페이로드 */
export interface TossWebhookPayload {
  eventType: string;
  data: TossPaymentResponse;
}
