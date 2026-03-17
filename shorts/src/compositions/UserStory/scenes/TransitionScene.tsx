import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TreesIcon } from "../../../components/core/TreesIcon";

interface TransitionSceneProps {
  text: string;
}

/**
 * 전환점 씬 — "그런데 Habitree를 만나고..."
 * 어두운 톤 → 밝은 Forest 톤으로 전환
 */
export const TransitionScene: React.FC<TransitionSceneProps> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 밝아지는 배경 글로우
  const glowOpacity = interpolate(frame, [20, 80], [0, 0.15], {
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [10, 30], [20, 0], {
    extrapolateRight: "clamp",
  });

  const iconScale = spring({
    frame: Math.max(0, frame - 50),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 밝아지는 글로우 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${brandColors.forest[500]}30 0%, transparent 70%)`,
          opacity: glowOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <span
          style={{
            fontSize: 42,
            fontWeight: 700,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.95)",
            textAlign: "center",
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            padding: "0 60px",
            lineHeight: 1.5,
          }}
        >
          {text}
        </span>

        <div style={{ transform: `scale(${iconScale})` }}>
          <TreesIcon size={48} color={brandColors.forest[400]} strokeWidth={2} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
