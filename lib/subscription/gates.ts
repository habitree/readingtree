/**
 * 기능별 게이트 설정 (구독 중심 + 포인트 소비 모델 v2.0)
 */

import { IS_BETA_MODE } from "./beta";
import type { SubscriptionTierName } from "./pricing-data";

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
  limit: number;          // -1 = 무제한, 0 = 사용 불가
  pointCost: number;      // 한도 초과 시 포인트 비용 (0 = 추가 사용 불가)
  countPeriod?: "daily" | "monthly";
  countMethod: CountMethod;
}

// ─── 무료 (free) 게이트 ──────────────────────────────────

const FREE_GATES: Record<FeatureKey, FeatureGate> = {
  ai_chat: {
    limit: 10,
    pointCost: 40,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ocr: {
    limit: 3,
    pointCost: 25,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ai_report: {
    limit: 1,
    pointCost: 100,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  groups_create: {
    limit: 0,
    pointCost: 300,
    countMethod: "table_count",
  },
  notes_create: {
    limit: 100,
    pointCost: 10,
    countPeriod: "monthly",
    countMethod: "table_count",
  },
  bookshelf_create: {
    limit: 2,
    pointCost: 150,
    countMethod: "table_count",
  },
  groups_join: {
    limit: 5,
    pointCost: 200,
    countMethod: "membership_count",
  },
  advanced_stats: {
    limit: -1,
    pointCost: 0,
    countMethod: "boolean",
  },
  data_export: {
    limit: -1,
    pointCost: 0,
    countMethod: "boolean",
  },
};

// ─── 독서가 (reader_v2) 게이트 ──────────────────────────

const READER_GATES: Record<FeatureKey, FeatureGate> = {
  ...FREE_GATES,
  ai_chat: {
    limit: 50,
    pointCost: 40,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ocr: {
    limit: 20,
    pointCost: 25,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ai_report: {
    limit: 3,
    pointCost: 100,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  groups_create: {
    limit: 5,
    pointCost: 200,
    countMethod: "table_count",
  },
  notes_create: {
    limit: -1,
    pointCost: 0,
    countPeriod: "monthly",
    countMethod: "table_count",
  },
  bookshelf_create: {
    limit: -1,
    pointCost: 0,
    countMethod: "table_count",
  },
  groups_join: {
    limit: -1,
    pointCost: 0,
    countMethod: "membership_count",
  },
};

// ─── 독서마스터 (master_v2) 게이트 ──────────────────────

const MASTER_GATES: Record<FeatureKey, FeatureGate> = {
  ai_chat: {
    limit: -1,
    pointCost: 0,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ocr: {
    limit: -1,
    pointCost: 0,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ai_report: {
    limit: -1,
    pointCost: 0,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  groups_create: {
    limit: -1,
    pointCost: 0,
    countMethod: "table_count",
  },
  notes_create: {
    limit: -1,
    pointCost: 0,
    countPeriod: "monthly",
    countMethod: "table_count",
  },
  bookshelf_create: {
    limit: -1,
    pointCost: 0,
    countMethod: "table_count",
  },
  groups_join: {
    limit: -1,
    pointCost: 0,
    countMethod: "membership_count",
  },
  advanced_stats: {
    limit: -1,
    pointCost: 0,
    countMethod: "boolean",
  },
  data_export: {
    limit: -1,
    pointCost: 0,
    countMethod: "boolean",
  },
};

// ─── 티어별 게이트 매핑 ─────────────────────────────────

const TIER_GATES: Record<SubscriptionTierName, Record<FeatureKey, FeatureGate>> = {
  free: FREE_GATES,
  reader_v2: READER_GATES,
  master_v2: MASTER_GATES,
};

/**
 * 구독 티어에 따른 게이트 설정 반환
 */
export function getGatesForTier(tier: SubscriptionTierName): Record<FeatureKey, FeatureGate> {
  const gates = TIER_GATES[tier] ?? FREE_GATES;

  if (IS_BETA_MODE) {
    return Object.fromEntries(
      Object.entries(gates).map(([key, gate]) =>
        BETA_AI_KEYS.includes(key as FeatureKey)
          ? [key, { ...gate, limit: 9999, pointCost: 0 }]
          : [key, gate]
      )
    ) as Record<FeatureKey, FeatureGate>;
  }

  return gates;
}

// ─── 하위 호환 (기존 코드에서 사용하는 export) ───────────

/** @deprecated getGatesForTier(tier) 사용 권장 */
export const FEATURE_GATES = FREE_GATES;

/** 베타 모드: AI 기능 한도 9999, 포인트 비용 0으로 오버라이드 */
const BETA_AI_KEYS: FeatureKey[] = ["ai_chat", "ocr", "ai_report"];

/** @deprecated getGatesForTier(tier) 사용 권장 */
export const EFFECTIVE_FEATURE_GATES: Record<FeatureKey, FeatureGate> = IS_BETA_MODE
  ? Object.fromEntries(
      Object.entries(FREE_GATES).map(([key, gate]) => [
        key,
        BETA_AI_KEYS.includes(key as FeatureKey)
          ? { ...gate, limit: 9999, pointCost: 0 }
          : gate,
      ])
    ) as Record<FeatureKey, FeatureGate>
  : FREE_GATES;
