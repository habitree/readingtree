/**
 * 비즈니스 로직 상수 (매직넘버 중앙 관리)
 *
 * 포인트 earn 금액은 DB RPC(earn_points_atomic)에서 관리되므로 여기에 포함하지 않음.
 * 포인트 spend 비용은 types/points.ts의 POINT_SPEND_COSTS에서 관리.
 */

/** 레퍼럴 관련 */
export const REFERRAL_LIMITS = {
  /** 추천인의 월간 보상 수령 상한 (명) */
  MONTHLY_REWARD_CAP: 10,
} as const;

/** AI 관련 */
export const AI_LIMITS = {
  /** 사용자당 AI 메모리 최대 저장 수 */
  MAX_MEMORIES_PER_USER: 50,
} as const;
