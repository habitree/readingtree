import { useMemo } from "react";
import { brandColors, forest, paper, charcoal } from "../config/brand";

type ColorTheme = "forest" | "paper" | "charcoal";

export function useBrandColors(theme: ColorTheme = "forest") {
  return useMemo(() => {
    const palettes = { forest, paper, charcoal };
    const palette = palettes[theme];

    return {
      ...brandColors,
      palette,
      gradient: `linear-gradient(170deg, ${palette[900]} 0%, ${palette[950]} 100%)`,
      accentGradient: `linear-gradient(135deg, ${palette[500]} 0%, ${palette[700]} 100%)`,
    };
  }, [theme]);
}
