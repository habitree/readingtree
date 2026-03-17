import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface EmotionHookSceneProps {
  hookText: string;
}

/**
 * 감정 후킹 씬 — "이 책 읽고 울었습니다"
 */
export const EmotionHookScene: React.FC<EmotionHookSceneProps> = ({
  hookText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const glowPulse = interpolate(frame, [0, 45, 90], [0, 0.08, 0.04], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 따뜻한 글로우 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(191,165,134,${glowPulse}) 0%, transparent 60%)`,
        }}
      />

      <span
        style={{
          fontSize: 54,
          fontWeight: 800,
          fontFamily: fonts.serif,
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
          transform: `scale(${scale})`,
          padding: "0 60px",
          lineHeight: 1.5,
          letterSpacing: -1,
        }}
      >
        {hookText}
      </span>
    </AbsoluteFill>
  );
};
