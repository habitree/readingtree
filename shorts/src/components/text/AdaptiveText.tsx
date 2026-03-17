import React from "react";
import { fonts } from "../../config/brand";
import { useAdaptiveFontSize } from "../../hooks/useAdaptiveFontSize";

interface AdaptiveTextProps {
  text: string;
  maxWidth?: number;
  baseFontSize?: number;
  minFontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: "center" | "left" | "right";
  style?: React.CSSProperties;
}

export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  text,
  maxWidth = 900,
  baseFontSize = 48,
  minFontSize = 28,
  color = "white",
  fontFamily = fonts.sans,
  fontWeight = 600,
  textAlign = "center",
  style,
}) => {
  const fontSize = useAdaptiveFontSize({
    text,
    maxWidth,
    baseFontSize,
    minFontSize,
  });

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        fontFamily,
        color,
        textAlign,
        lineHeight: 1.5,
        wordBreak: "keep-all",
        ...style,
      }}
    >
      {text}
    </span>
  );
};
