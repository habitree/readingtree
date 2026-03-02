/**
 * 포인트 충전 패키지 및 기능 안내 SSoT 데이터
 */

export interface PointPackageInfo {
  id: string;
  displayName: string;
  points: number;
  bonusPoints: number;
  firstPurchaseBonusPoints: number;
  price: number;
  highlighted: boolean;
}

export interface FeatureInfoRow {
  key: string;
  label: string;
  freeLimit: string;
  pointCost: string;
}

export const POINT_PACKAGES: PointPackageInfo[] = [
  { id: "light", displayName: "라이트", points: 500, bonusPoints: 0, firstPurchaseBonusPoints: 500, price: 1900, highlighted: false },
  { id: "standard", displayName: "스탠다드", points: 1200, bonusPoints: 200, firstPurchaseBonusPoints: 1200, price: 3900, highlighted: true },
  { id: "premium", displayName: "프리미엄", points: 3000, bonusPoints: 800, firstPurchaseBonusPoints: 3000, price: 6900, highlighted: false },
];

export const FEATURE_INFO_ROWS: FeatureInfoRow[] = [
  { key: "ai_chat", label: "AI 채팅", freeLimit: "3회/일", pointCost: "100P/회" },
  { key: "ocr", label: "OCR 필사", freeLimit: "3회/일", pointCost: "80P/회" },
  { key: "ai_report", label: "AI 독서 리포트", freeLimit: "1회/월", pointCost: "150P/회" },
  { key: "notes_create", label: "노트 작성", freeLimit: "100개/월", pointCost: "-" },
  { key: "groups_create", label: "모임 생성", freeLimit: "5개", pointCost: "-" },
  { key: "groups_join", label: "모임 참여", freeLimit: "5개", pointCost: "-" },
  { key: "bookshelf_create", label: "책장 생성", freeLimit: "10개", pointCost: "-" },
  { key: "advanced_stats", label: "고급 통계", freeLimit: "무제한", pointCost: "-" },
  { key: "data_export", label: "데이터 내보내기", freeLimit: "무제한", pointCost: "-" },
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
 * 가격을 포맷 (예: 3900 → "₩3,900")
 */
export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return `₩${price.toLocaleString("ko-KR")}`;
}
