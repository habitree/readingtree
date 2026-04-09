/** OG 이미지 브랜드 상수 */

export const OG_BRAND = {
  name: "Habitree",
  tagline: "읽는 습관이 자라는 곳",
  keywords: "독서 기록 · AI 도우미 · 독서 모임",
  domain: "habitree.app",
  description: "읽는 습관이 자라는 곳 - 독서 기록, AI 도우미, 독서 모임",
} as const;

export const OG_COLORS = {
  /** 따뜻한 아이보리 배경 */
  background: "#F7F5F0",
  /** 생동감 있는 에메랄드 (악센트 바, 태그라인) */
  forest: "#1A7555",
  forestLight: "#3DB87F",
  forestLighter: "#7DD9A8",
  /** 텍스트 */
  textPrimary: "#1A1F25",
  textSecondary: "#6B7A85",
  textMuted: "#9AA5B1",
  /** 카드 배경 */
  cardBackground: "#FFFFFF",
  /** 세련된 뮤트 보더 */
  border: "#B8E8CB",
  /** 어스 톤 (리포트용) */
  earth: "#C4935A",
  earthLight: "#E0B47A",
} as const;

/** 텍스트 잘림 방지: 최대 길이 제한 */
export const OG_TEXT_LIMITS = {
  /** OG 메타 title (카카오톡/FB 1줄) */
  metaTitle: 25,
  /** OG 메타 description (카카오톡 2줄) */
  metaDescription: 70,
  /** 이미지 내 본문 텍스트 (22px 4줄 이내) */
  bodyText: 100,
  /** 책 제목 (이미지 내 2줄 이내) */
  bookTitle: 30,
  /** 서재 이름 (이미지 내 1줄 이내) */
  bookshelfName: 20,
  /** 인사이트 미리보기 (3줄 이내) */
  insightPreview: 100,
} as const;

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const FONT_FAMILY = '"NotoSansKR", sans-serif' as const;
