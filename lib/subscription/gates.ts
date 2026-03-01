/**
 * 3단계 구독 티어 기능별 게이트 설정
 */

export type TierName = "free" | "reader" | "reader_master";

export type FeatureKey =
  | "ai_chat"
  | "ocr"
  | "ai_report"
  | "groups_create"
  | "notes_create"
  | "bookshelf_create"
  | "groups_join"
  | "advanced_stats"
  | "data_export";

export type CountMethod =
  | "point_transactions"
  | "table_count"
  | "membership_count"
  | "boolean";

export interface FeatureGate {
  freeLimit: number;          // -1 = 무제한, 0 = 사용 불가
  readerLimit: number;        // -1 = 무제한
  readerMasterLimit: number;  // -1 = 무제한
  pointCostOnExceed: number;  // 무료 한도 초과 시 포인트 비용 (0 = 추가 사용 불가)
  countPeriod?: "daily" | "monthly";
  countMethod: CountMethod;
}

/**
 * 티어별 한도 조회
 */
export function getLimitForTier(gate: FeatureGate, tier: TierName): number {
  switch (tier) {
    case "reader_master":
      return gate.readerMasterLimit;
    case "reader":
      return gate.readerLimit;
    default:
      return gate.freeLimit;
  }
}

export const FEATURE_GATES: Record<FeatureKey, FeatureGate> = {
  ai_chat: {
    freeLimit: 3,
    readerLimit: 15,
    readerMasterLimit: -1,
    pointCostOnExceed: 100,
    countMethod: "point_transactions",
  },
  ocr: {
    freeLimit: 3,
    readerLimit: 15,
    readerMasterLimit: -1,
    pointCostOnExceed: 80,
    countMethod: "point_transactions",
  },
  ai_report: {
    freeLimit: 0,
    readerLimit: 3,
    readerMasterLimit: -1,
    pointCostOnExceed: 150,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  groups_create: {
    freeLimit: 2,
    readerLimit: -1,
    readerMasterLimit: -1,
    pointCostOnExceed: 0,
    countMethod: "table_count",
  },
  notes_create: {
    freeLimit: 30,
    readerLimit: -1,
    readerMasterLimit: -1,
    pointCostOnExceed: 0,
    countPeriod: "monthly",
    countMethod: "table_count",
  },
  bookshelf_create: {
    freeLimit: 3,
    readerLimit: -1,
    readerMasterLimit: -1,
    pointCostOnExceed: 0,
    countMethod: "table_count",
  },
  groups_join: {
    freeLimit: 1,
    readerLimit: 3,
    readerMasterLimit: -1,
    pointCostOnExceed: 0,
    countMethod: "membership_count",
  },
  advanced_stats: {
    freeLimit: 0,
    readerLimit: 1,
    readerMasterLimit: -1,
    pointCostOnExceed: 0,
    countMethod: "boolean",
  },
  data_export: {
    freeLimit: 0,
    readerLimit: 1,
    readerMasterLimit: -1,
    pointCostOnExceed: 0,
    countMethod: "boolean",
  },
};
