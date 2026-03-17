import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface HighlightsSceneProps {
  highlights: string[];
}

/**
 * 토론 하이라이트 씬 — 인기 메모/토론
 */
export const HighlightsScene: React.FC<HighlightsSceneProps> = ({
  highlights,
}) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "0 60px",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: fonts.sans,
            color: brandColors.forest[400],
            letterSpacing: 3,
            opacity: titleOpacity,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          HIGHLIGHTS
        </span>

        {highlights.map((text, i) => {
          const delay = 15 + i * 40;
          const localFrame = Math.max(0, frame - delay);
          const opacity = interpolate(localFrame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          });
          const y = interpolate(localFrame, [0, 20], [30, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: "18px 24px",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: `3px solid ${brandColors.forest[500]}`,
                opacity,
                transform: `translateY(${y}px)`,
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontFamily: fonts.sans,
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.5,
                }}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
