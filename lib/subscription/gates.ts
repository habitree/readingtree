/**
 * 기능별 게이트 설정 (포인트 소비 모델)
 */

import { IS_BETA_MODE } from "./beta";

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

export const FEATURE_GATES: Record<FeatureKey, FeatureGate> = {
  ai_chat: {
    limit: 10,
    pointCost: 40,
    countPeriod: "monthly",
    countMethod: "point_transactions",
  },
  ocr: {
    limit: 5,
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
    limit: 5,
    pointCost: 0,
    countMethod: "table_count",
  },
  notes_create: {
    limit: 100,
    pointCost: 0,
    countPeriod: "monthly",
    countMethod: "table_count",
  },
  bookshelf_create: {
    limit: 10,
    pointCost: 0,
    countMethod: "table_count",
  },
  groups_join: {
    limit: 5,
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

/** 베타 모드: AI 기능 한도 9999, 포인트 비용 0으로 오버라이드 */
const BETA_AI_KEYS: FeatureKey[] = ["ai_chat", "ocr", "ai_report"];

export const EFFECTIVE_FEATURE_GATES: Record<FeatureKey, FeatureGate> = IS_BETA_MODE
  ? Object.fromEntries(
      Object.entries(FEATURE_GATES).map(([key, gate]) => [
        key,
        BETA_AI_KEYS.includes(key as FeatureKey)
          ? { ...gate, limit: 9999, pointCost: 0 }
          : gate,
      ])
    ) as Record<FeatureKey, FeatureGate>
  : FEATURE_GATES;
