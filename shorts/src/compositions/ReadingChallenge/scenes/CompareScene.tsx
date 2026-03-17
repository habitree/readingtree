import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface CompareSceneProps {
  percentile: number;
}

/**
 * 비교 씬 — "한국인 평균 대비 당신은..."
 */
export const CompareScene: React.FC<CompareSceneProps> = ({ percentile }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numScale = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const descOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.6)",
            opacity: textOpacity,
          }}
        >
          한국인 평균 대비
        </span>

        <div style={{ transform: `scale(${numScale})` }}>
          <span
            style={{
              fontSize: 100,
              fontWeight: 900,
              fontFamily: fonts.english,
              color: brandColors.forest[400],
            }}
          >
            상위 {percentile}%
          </span>
        </div>

        <span
          style={{
            fontSize: 24,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.5)",
            opacity: descOpacity,
          }}
        >
          독서량을 기록하고 있어요
        </span>
      </div>
    </AbsoluteFill>
  );
};
