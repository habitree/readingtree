import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

/**
 * 랭킹 후킹 씬 — "이번 주 가장 활발한 독서모임은?"
 */
export const RankingHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const crownOpacity = interpolate(frame, [20, 40], [0, 1], {
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
            fontSize: 56,
            opacity: crownOpacity,
          }}
        >
          {"\u{1F451}"}
        </span>

        <span
          style={{
            fontSize: 46,
            fontWeight: 800,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.95)",
            textAlign: "center",
            transform: `scale(${scale})`,
            padding: "0 60px",
            lineHeight: 1.4,
          }}
        >
          이번 주{"\n"}가장 활발한{"\n"}독서모임은?
        </span>
      </div>
    </AbsoluteFill>
  );
};
