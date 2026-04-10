/**
 * 상품 라인업 SSoT 데이터 (구독 중심 + 탑업 보조 v2.0)
 */

import { IS_BETA_MODE } from "./beta";

// ─── 구독 플랜 ───────────────────────────────────────────

export type SubscriptionTierName = "free" | "reader_v2" | "master_v2";

export interface SubscriptionPlanInfo {
  name: SubscriptionTierName;
  displayName: string;
  priceMonthly: number;      // KRW
  priceYearly: number;       // KRW
  priceMonthlyUsd: number;   // USD
  priceYearlyUsd: number;    // USD
  bonusPointsMonthly: number;
  polarProductIdMonthly: string;
  polarProductIdYearly: string;
  highlighted: boolean;
  features: {
    aiChatMonthly: number;   // -1 = 무제한
    ocrMonthly: number;
    aiReportMonthly: number;
    notesMonthly: number;
    groupsCreate: number;
    groupsJoin: number;
    bookshelfMax: number;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanInfo[] = [
  {
    name: "free",
    displayName: "무료",
    priceMonthly: 0,
    priceYearly: 0,
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    bonusPointsMonthly: 0,
    polarProductIdMonthly: "",
    polarProductIdYearly: "",
    highlighted: false,
    features: {
      aiChatMonthly: 10,
      ocrMonthly: 3,
      aiReportMonthly: 1,
      notesMonthly: 100,
      groupsCreate: 5,
      groupsJoin: 5,
      bookshelfMax: 10,
    },
  },
  {
    name: "reader_v2",
    displayName: "독서가",
    priceMonthly: 4900,
    priceYearly: 49000,
    priceMonthlyUsd: 3.99,
    priceYearlyUsd: 39.99,
    bonusPointsMonthly: 200,
    polarProductIdMonthly: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_READER || "",
    polarProductIdYearly: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_READER_YEARLY || "",
    highlighted: false,
    features: {
      aiChatMonthly: 50,
      ocrMonthly: 20,
      aiReportMonthly: 3,
      notesMonthly: -1,
      groupsCreate: 10,
      groupsJoin: -1,
      bookshelfMax: -1,
    },
  },
  {
    name: "master_v2",
    displayName: "독서마스터",
    priceMonthly: 9900,
    priceYearly: 99000,
    priceMonthlyUsd: 7.99,
    priceYearlyUsd: 79.99,
    bonusPointsMonthly: 500,
    polarProductIdMonthly: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_MASTER || "",
    polarProductIdYearly: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_MASTER_YEARLY || "",
    highlighted: true,
    features: {
      aiChatMonthly: -1,
      ocrMonthly: -1,
      aiReportMonthly: -1,
      notesMonthly: -1,
      groupsCreate: -1,
      groupsJoin: -1,
      bookshelfMax: -1,
    },
  },
];

// ─── 포인트 탑업 패키지 ──────────────────────────────────

export interface PointPackageInfo {
  id: string;
  displayName: string;
  points: number;
  bonusPoints: number;
  firstPurchaseBonusPoints: number;
  /** KRW 가격 */
  price: number;
  /** USD 가격 */
  priceUsd: number;
  /** Polar Product ID */
  polarProductId: string;
  highlighted: boolean;
  /** 레거시 패키지 여부 (UI에서 숨김 처리) */
  legacy?: boolean;
}

export const POINT_PACKAGES: PointPackageInfo[] = [
  {
    id: "mini",
    displayName: "미니",
    points: 200,
    bonusPoints: 0,
    firstPurchaseBonusPoints: 200,
    price: 990,
    priceUsd: 0.79,
    polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_MINI || "",
    highlighted: false,
  },
  {
    id: "light",
    displayName: "라이트",
    points: 500,
    bonusPoints: 0,
    firstPurchaseBonusPoints: 500,
    price: 1900,
    priceUsd: 1.49,
    polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_LIGHT || "",
    highlighted: false,
  },
  // 레거시 패키지 (Phase 2에서 완전 제거 예정)
  {
    id: "standard",
    displayName: "스탠다드",
    points: 1200,
    bonusPoints: 200,
    firstPurchaseBonusPoints: 1200,
    price: 3900,
    priceUsd: 2.99,
    polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_STANDARD || "",
    highlighted: false,
    legacy: true,
  },
  {
    id: "premium",
    displayName: "프리미엄",
    points: 3000,
    bonusPoints: 800,
    firstPurchaseBonusPoints: 3000,
    price: 6900,
    priceUsd: 4.99,
    polarProductId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PREMIUM || "",
    highlighted: false,
    legacy: true,
  },
];

/** 활성 탑업 패키지만 (레거시 제외) */
export const ACTIVE_POINT_PACKAGES = POINT_PACKAGES.filter((p) => !p.legacy);

/** 유료 구독 플랜만 (무료 제외) */
export const PAID_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter((p) => p.priceMonthly > 0);

// ─── 기능 안내 테이블 ────────────────────────────────────

export interface FeatureInfoRow {
  key: string;
  label: string;
  freeLimit: string;
  readerLimit: string;
  masterLimit: string;
  pointCost: string;
}

const _FEATURE_INFO_ROWS: FeatureInfoRow[] = [
  { key: "ai_chat", label: "AI 채팅", freeLimit: "10회/월", readerLimit: "50회/월", masterLimit: "무제한", pointCost: "40P/회" },
  { key: "ocr", label: "OCR 필사", freeLimit: "3회/월", readerLimit: "20회/월", masterLimit: "무제한", pointCost: "25P/회" },
  { key: "ai_report", label: "AI 독서 리포트", freeLimit: "1회/월", readerLimit: "3회/월", masterLimit: "무제한", pointCost: "100P/회" },
  { key: "notes_create", label: "노트 작성", freeLimit: "100개/월", readerLimit: "무제한", masterLimit: "무제한", pointCost: "-" },
  { key: "groups_create", label: "모임 생성", freeLimit: "5개", readerLimit: "10개", masterLimit: "무제한", pointCost: "-" },
  { key: "groups_join", label: "모임 참여", freeLimit: "5개", readerLimit: "무제한", masterLimit: "무제한", pointCost: "-" },
  { key: "bookshelf_create", label: "책장 생성", freeLimit: "10개", readerLimit: "무제한", masterLimit: "무제한", pointCost: "-" },
  { key: "advanced_stats", label: "고급 통계", freeLimit: "무제한", readerLimit: "무제한", masterLimit: "무제한", pointCost: "-" },
  { key: "data_export", label: "데이터 내보내기", freeLimit: "무제한", readerLimit: "무제한", masterLimit: "무제한", pointCost: "-" },
  { key: "bonus_points", label: "월 보너스 포인트", freeLimit: "-", readerLimit: "200P/월", masterLimit: "500P/월", pointCost: "-" },
];

const BETA_AI_KEYS = ["ai_chat", "ocr", "ai_report"];

export const FEATURE_INFO_ROWS: FeatureInfoRow[] = IS_BETA_MODE
  ? _FEATURE_INFO_ROWS.map((row) =>
      BETA_AI_KEYS.includes(row.key)
        ? { ...row, freeLimit: "무제한 (베타)", readerLimit: "무제한 (베타)", masterLimit: "무제한 (베타)", pointCost: "무료" }
        : row
    )
  : _FEATURE_INFO_ROWS;

/**
 * 한도 숫자 → 표시 문자열 변환
 */
export function formatLimit(limit: number, unit?: string): string {
  if (limit === -1) return "무제한";
  if (limit === 0) return "—";
  return `${limit}${unit ? unit : ""}`;
}

/**
 * KRW 가격 포맷 (예: 3900 → "₩3,900")
 */
export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString("ko-KR")}`;
}

/**
 * USD 가격 포맷 (예: 2.99 → "$2.99")
 */
export function formatPriceUsd(price: number): string {
  if (price === 0) return "Free";
  return `$${price.toFixed(2)}`;
}
