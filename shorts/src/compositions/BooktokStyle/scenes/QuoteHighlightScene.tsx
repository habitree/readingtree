import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TextReveal } from "../../../components/text/TextReveal";

interface QuoteHighlightSceneProps {
  quoteText: string;
}

/**
 * 핵심 인용구 씬 — 타이포그래피 애니메이션
 */
export const QuoteHighlightScene: React.FC<QuoteHighlightSceneProps> = ({
  quoteText,
}) => {
  const frame = useCurrentFrame();

  const lineWidth = interpolate(frame, [5, 30], [0, 60], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          maxWidth: 900,
        }}
      >
        {/* 상단 장식 */}
        <span
          style={{
            fontSize: 64,
            color: `${brandColors.paper[500]}40`,
            fontFamily: `"Georgia", serif`,
            lineHeight: 1,
          }}
        >
          {"\u201C"}
        </span>

        <div
          style={{
            width: lineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${brandColors.paper[500]}50, transparent)`,
          }}
        />

        <TextReveal
          text={quoteText}
          fontSize={42}
          startFrame={15}
          mode="line"
          color="rgba(255,255,255,0.88)"
        />
      </div>
    </AbsoluteFill>
  );
};
