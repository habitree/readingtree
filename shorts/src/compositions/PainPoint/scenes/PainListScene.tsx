import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface PainListSceneProps {
  painPoints: string[];
}

/**
 * 문제 나열 씬 — 텍스트 오버레이 + 이모지
 */
export const PainListScene: React.FC<PainListSceneProps> = ({ painPoints }) => {
  const frame = useCurrentFrame();

  const emojis = ["\u{1F4DD}", "\u{1F914}", "\u{1F62E}\u{200D}\u{1F4A8}", "\u{1F625}"];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "0 80px",
        }}
      >
        {painPoints.map((point, i) => {
          const delay = i * 30;
          const localFrame = Math.max(0, frame - delay);
          const opacity = interpolate(localFrame, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
          });
          const x = interpolate(localFrame, [0, 15], [-40, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              <span style={{ fontSize: 36 }}>
                {emojis[i % emojis.length]}
              </span>
              <span
                style={{
                  fontSize: 30,
                  fontFamily: fonts.sans,
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {point}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
