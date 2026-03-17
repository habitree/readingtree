import { useMemo } from "react";

interface AdaptiveFontOptions {
  text: string;
  maxWidth: number;
  baseFontSize: number;
  minFontSize?: number;
  charsPerLine?: number;
}

export function useAdaptiveFontSize({
  text,
  maxWidth,
  baseFontSize,
  minFontSize = 28,
  charsPerLine = 16,
}: AdaptiveFontOptions): number {
  return useMemo(() => {
    const charCount = text.length;
    if (charCount <= charsPerLine) return baseFontSize;

    const ratio = charsPerLine / charCount;
    const scaledSize = Math.floor(baseFontSize * Math.sqrt(ratio));
    const widthConstraint = Math.floor((maxWidth * 0.85) / (charCount / 2));

    return Math.max(minFontSize, Math.min(scaledSize, widthConstraint, baseFontSize));
  }, [text, maxWidth, baseFontSize, minFontSize, charsPerLine]);
}
