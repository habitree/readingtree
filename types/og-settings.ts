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
  color_background: "#F5F2ED",
  color_forest: "#1d6b4d",
  color_forest_light: "#36a678",
  color_forest_lighter: "#5ec496",
  color_text_primary: "#1F2933",
  color_text_secondary: "#7B8794",
  color_text_muted: "#9AA5B1",
  color_card_background: "#FFFFFF",
  color_border: "#c3eed4",
  color_earth: "#b48c50",
  color_earth_light: "#d4a574",
};

/** hex 색상 유효성 검증 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
