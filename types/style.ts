/**
 * UI 스타일 타입 정의
 *
 * 4가지 스타일:
 * - minimal: 간결하고 핵심만 (이모지 최소 사용, 모노톤)
 * - warm: 친근하고 응원하는 (이모지 적극 사용, 웜톤)
 * - professional: 격식있고 정돈된 (이모지 사용 안함, 쿨톤)
 * - poetic: 감성적이고 문학적 (이모지 선택적, 퍼플톤)
 */

export type UIStyleKey = "minimal" | "warm" | "professional" | "poetic";

export interface UIStyle {
  key: UIStyleKey;
  name: string;
  description: string;
  emoji: string;
  themeColor: string;
  preview: string;
}

/**
 * UI 스타일 정의
 */
export const UI_STYLES: Record<UIStyleKey, UIStyle> = {
  minimal: {
    key: "minimal",
    name: "미니멀",
    description: "간결하고 핵심만",
    emoji: "◾",
    themeColor: "zinc",
    preview: "기록 없음 · 3일째",
  },
  warm: {
    key: "warm",
    name: "따뜻한",
    description: "친근하고 응원하는",
    emoji: "🌻",
    themeColor: "orange",
    preview: "첫 기록을 남겨볼까요? 🔥",
  },
  professional: {
    key: "professional",
    name: "전문적",
    description: "격식있고 정돈된",
    emoji: "📋",
    themeColor: "slate",
    preview: "기록이 없습니다.",
  },
  poetic: {
    key: "poetic",
    name: "시적인",
    description: "감성적이고 문학적",
    emoji: "🌙",
    themeColor: "violet",
    preview: "첫 문장을 기다리는 중",
  },
};

/**
 * 기본 스타일
 */
export const DEFAULT_STYLE: UIStyleKey = "minimal";

/**
 * 스타일 키 배열 (순서 보장)
 */
export const STYLE_KEYS: UIStyleKey[] = ["minimal", "warm", "professional", "poetic"];
