/**
 * 포인트 충전 패키지 및 기능 안내 SSoT 데이터
 */

import { IS_BETA_MODE } from "./beta";

export interface PointPackageInfo {
  id: string;
  displayName: string;
  points: number;
  bonusPoints: number;
  firstPurchaseBonusPoints: number;
  /** KRW 가격 (토스페이먼츠용) */
  price: number;
  /** USD 가격 (Polar용, 센트 단위 아님) */
  priceUsd: number;
  /** Polar Product ID (대시보드에서 생성 후 입력) */
  polarProductId: string;
  highlighted: boolean;
}

export interface FeatureInfoRow {
  key: string;
  label: string;
  freeLimit: string;
  pointCost: string;
}

export const POINT_PACKAGES: PointPackageInfo[] = [
  { id: "light", displayName: "라이트", points: 500, bonusPoints: 0, firstPurchaseBonusPoints: 500, price: 1900, priceUsd: 1.49, polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_LIGHT || "", highlighted: false },
  { id: "standard", displayName: "스탠다드", points: 1200, bonusPoints: 200, firstPurchaseBonusPoints: 1200, price: 3900, priceUsd: 2.99, polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_STANDARD || "", highlighted: true },
  { id: "premium", displayName: "프리미엄", points: 3000, bonusPoints: 800, firstPurchaseBonusPoints: 3000, price: 6900, priceUsd: 4.99, polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PREMIUM || "", highlighted: false },
];

const _FEATURE_INFO_ROWS: FeatureInfoRow[] = [
  { key: "ai_chat", label: "AI 채팅", freeLimit: "10회/월", pointCost: "40P/회" },
  { key: "ocr", label: "OCR 필사", freeLimit: "3회/월", pointCost: "25P/회" },
  { key: "ai_report", label: "AI 독서 리포트", freeLimit: "1회/월", pointCost: "100P/회" },
  { key: "notes_create", label: "노트 작성", freeLimit: "100개/월", pointCost: "-" },
  { key: "groups_create", label: "모임 생성", freeLimit: "5개", pointCost: "-" },
  { key: "groups_join", label: "모임 참여", freeLimit: "5개", pointCost: "-" },
  { key: "bookshelf_create", label: "책장 생성", freeLimit: "10개", pointCost: "-" },
  { key: "advanced_stats", label: "고급 통계", freeLimit: "무제한", pointCost: "-" },
  { key: "data_export", label: "데이터 내보내기", freeLimit: "무제한", pointCost: "-" },
];

const BETA_AI_KEYS = ["ai_chat", "ocr", "ai_report"];

export const FEATURE_INFO_ROWS: FeatureInfoRow[] = IS_BETA_MODE
  ? _FEATURE_INFO_ROWS.map((row) =>
      BETA_AI_KEYS.includes(row.key)
        ? { ...row, freeLimit: "무제한 (베타)", pointCost: "무료" }
        : row
    )
  : _FEATURE_INFO_ROWS;

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
 * 가격을 포맷 (예: 3900 → "₩3,900")
 */
export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString("ko-KR")}`;
}

/**
 * USD 가격을 포맷 (예: 2.99 → "$2.99")
 */
export function formatPriceUsd(price: number): string {
  if (price === 0) return "Free";
  return `$${price.toFixed(2)}`;
}
