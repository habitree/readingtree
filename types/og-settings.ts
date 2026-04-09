/** OG 이미지 설정 — DB 행 타입 */
export interface OgSettings {
  id: string;
  brand_name: string;
  tagline: string;
  keywords: string;
  domain: string;
  description: string;
  brand_icon_url: string | null;
  color_background: string;
  color_forest: string;
  color_forest_light: string;
  color_forest_lighter: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_text_muted: string;
  color_card_background: string;
  color_border: string;
  color_earth: string;
  color_earth_light: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

/** OG 설정 폼 데이터 (관리자 입력용) */
export interface OgSettingsFormData {
  brand_name: string;
  tagline: string;
  keywords: string;
  domain: string;
  description: string;
  brand_icon_url?: string | null;
  color_background: string;
  color_forest: string;
  color_forest_light: string;
  color_forest_lighter: string;
  color_text_primary: string;
  color_text_secondary: string;
  color_text_muted: string;
  color_card_background: string;
  color_border: string;
  color_earth: string;
  color_earth_light: string;
}

/** OG 이미지 생성 시 사용하는 가공된 설정 */
export interface OgConfig {
  brand: {
    name: string;
    tagline: string;
    keywords: string;
    domain: string;
    description: string;
  };
  colors: {
    background: string;
    forest: string;
    forestLight: string;
    forestLighter: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    cardBackground: string;
    border: string;
    earth: string;
    earthLight: string;
  };
  brandIconUrl: string | null;
}

/** OG 설정 기본값 (constants.ts와 동기화) */
export const OG_SETTINGS_DEFAULTS: OgSettingsFormData = {
  brand_name: "Habitree",
  tagline: "읽는 습관이 자라는 곳",
  keywords: "독서 기록 · AI 도우미 · 독서 모임",
  domain: "habitree.app",
  description: "읽는 습관이 자라는 곳 - 독서 기록, AI 도우미, 독서 모임",
  color_background: "#F7F5F0",
  color_forest: "#1A7555",
  color_forest_light: "#3DB87F",
  color_forest_lighter: "#7DD9A8",
  color_text_primary: "#1A1F25",
  color_text_secondary: "#6B7A85",
  color_text_muted: "#9AA5B1",
  color_card_background: "#FFFFFF",
  color_border: "#B8E8CB",
  color_earth: "#C4935A",
  color_earth_light: "#E0B47A",
};

/** hex 색상 유효성 검증 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
