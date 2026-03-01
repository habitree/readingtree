/**
 * 구독 가격/티어 표시용 SSoT 데이터
 * gates.ts의 타입/한도를 import하여 pricing 페이지와 모달이 동일 데이터를 참조
 */

import type { TierName, FeatureKey } from "./gates";
import { FEATURE_GATES, getLimitForTier } from "./gates";

export interface TierInfo {
  name: TierName;
  displayName: string;
  priceMonthly: number;
  description: string;
  highlighted: boolean;
  ctaLabel: string;
}

export interface FeatureRow {
  key: FeatureKey;
  label: string;
  unit?: string;
}

export const TIERS: TierInfo[] = [
  {
    name: "free",
    displayName: "무료",
    priceMonthly: 0,
    description: "기본 기능",
    highlighted: false,
    ctaLabel: "현재 플랜",
  },
  {
    name: "reader",
    displayName: "독서가",
    priceMonthly: 3900,
    description: "확장 기능",
    highlighted: true,
    ctaLabel: "준비 중",
  },
  {
    name: "reader_master",
    displayName: "독서마스터",
    priceMonthly: 6900,
    description: "무제한",
    highlighted: false,
    ctaLabel: "준비 중",
  },
];

export const FEATURE_ROWS: FeatureRow[] = [
  { key: "ai_chat", label: "AI 채팅", unit: "회/일" },
  { key: "ocr", label: "OCR 필사", unit: "회/일" },
  { key: "ai_report", label: "AI 독서 리포트", unit: "회/월" },
  { key: "groups_create", label: "모임 생성", unit: "개" },
  { key: "groups_join", label: "모임 참여", unit: "개" },
  { key: "notes_create", label: "노트 작성", unit: "개/월" },
  { key: "bookshelf_create", label: "책장 생성", unit: "개" },
  { key: "advanced_stats", label: "고급 통계" },
  { key: "data_export", label: "데이터 내보내기" },
];

/**
 * 한도 숫자 → 표시 문자열 변환
 * -1 → "무제한", 0 → "—", 그 외 → "{limit}{unit}"
 */
export function formatLimit(limit: number, unit?: string): string {
  if (limit === -1) return "무제한";
  if (limit === 0) return "—";
  return `${limit}${unit ? unit : ""}`;
}

/**
 * 특정 기능의 특정 티어 한도를 표시용 문자열로 반환
 */
export function getDisplayLimit(key: FeatureKey, tier: TierName, unit?: string): string {
  const gate = FEATURE_GATES[key];
  const limit = getLimitForTier(gate, tier);
  return formatLimit(limit, unit);
}

/**
 * 가격을 포맷 (예: 3900 → "₩3,900")
 */
export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString("ko-KR")}`;
}
