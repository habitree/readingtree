/**
 * ReadTree 브랜드 컬러 & 폰트 설정
 * tailwind.config.ts의 forest/paper/charcoal 팔레트 매핑
 */

export const forest = {
  50: "#f2fcf5",
  100: "#e1f8e8",
  200: "#c3eed4",
  300: "#94deb8",
  400: "#5ec496",
  500: "#36a678", // 메인 브랜드 컬러
  600: "#24855e",
  700: "#1d6b4d",
  800: "#1a553f",
  900: "#164635",
  950: "#0b271e",
} as const;

export const paper = {
  50: "#FDFBF7",
  100: "#F8F4EE",
  200: "#F0E9DD",
  300: "#E2D7C5",
  400: "#D1C0A8",
  500: "#BFA586",
  600: "#A88B6B",
  700: "#8C7152",
  800: "#735C45",
  900: "#5E4B39",
  950: "#34291F",
} as const;

export const charcoal = {
  50: "#F5F7FA",
  100: "#E4E7EB",
  200: "#CBD2D9",
  300: "#9AA5B1",
  400: "#7B8794",
  500: "#616E7C",
  600: "#52606D",
  700: "#3E4C59",
  800: "#323F4B",
  900: "#1F2933",
  950: "#12171d",
} as const;

export const brandColors = {
  forest,
  paper,
  charcoal,
  primary: forest[500],
  primaryDark: forest[700],
  primaryLight: forest[300],
  background: charcoal[900],
  backgroundLight: paper[50],
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.7)",
  textDark: charcoal[900],
  accent: forest[400],
  overlay: "rgba(0, 0, 0, 0.4)",
} as const;

export const fonts = {
  serif: "Noto Serif KR, serif",
  sans: "Noto Sans KR, sans-serif",
  english: "Inter, sans-serif",
} as const;

export const fontFiles = {
  notoSansKR: "assets/fonts/NotoSansKR-SemiBold.otf",
  notoSerifKR: "assets/fonts/NotoSerifKR-Regular.otf",
} as const;

export const assets = {
  logo: "assets/images/icon.png",
} as const;
