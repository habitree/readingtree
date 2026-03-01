/**
 * 기능별 게이트 설정
 */
export type FeatureKey = "ai_chat" | "ocr" | "ai_report" | "groups_create";

export interface FeatureGate {
  freeLimit: number;       // -1 = 무제한
  premiumLimit: number;    // -1 = 무제한
  pointCostOnExceed: number; // 무료 한도 초과 시 포인트 비용 (0 = 추가 사용 불가)
  countPeriod?: "daily" | "monthly"; // 카운트 기간 (기본: daily)
}

export const FEATURE_GATES: Record<FeatureKey, FeatureGate> = {
  ai_chat: {
    freeLimit: 3,
    premiumLimit: -1,
    pointCostOnExceed: 100,
  },
  ocr: {
    freeLimit: 3,
    premiumLimit: -1,
    pointCostOnExceed: 80,
  },
  ai_report: {
    freeLimit: 2,
    premiumLimit: -1,
    pointCostOnExceed: 150,
    countPeriod: "monthly",
  },
  groups_create: {
    freeLimit: 2,
    premiumLimit: -1,
    pointCostOnExceed: 0,
  },
};
