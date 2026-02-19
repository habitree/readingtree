/**
 * 기능별 게이트 설정
 */
export type FeatureKey = "ai_chat" | "ocr" | "groups_create";

export interface FeatureGate {
  freeLimit: number;       // -1 = 무제한
  premiumLimit: number;    // -1 = 무제한
  pointCostOnExceed: number; // 무료 한도 초과 시 포인트 비용 (0 = 추가 사용 불가)
}

export const FEATURE_GATES: Record<FeatureKey, FeatureGate> = {
  ai_chat: {
    freeLimit: 3,
    premiumLimit: -1,
    pointCostOnExceed: 500,
  },
  ocr: {
    freeLimit: 5,
    premiumLimit: -1,
    pointCostOnExceed: 300,
  },
  groups_create: {
    freeLimit: 2,
    premiumLimit: -1,
    pointCostOnExceed: 0,
  },
};
