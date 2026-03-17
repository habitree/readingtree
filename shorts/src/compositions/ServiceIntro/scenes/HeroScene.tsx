import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Logo } from "../../../components/core/Logo";
import { brandColors, fonts } from "../../../config/brand";

interface HeroSceneProps {
  tagline: string;
}

/**
 * 히어로 씬 - 깊은 숲 속에서 로고 등장 + 태그라인
 */
export const HeroScene: React.FC<HeroSceneProps> = ({ tagline }) => {
  const frame = useCurrentFrame();

  const taglineOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [50, 75], [20, 0], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [60, 90], [0, 200], {
    extrapolateRight: "clamp",
  });

  // 페이드 아웃
  const fadeOut = interpolate(frame, [120, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        <Logo size={64} color="#36a678" />

        <div
          style={{
            width: lineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${brandColors.forest[400]}50, transparent)`,
          }}
        />

        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 26,
            fontFamily: fonts.sans,
            fontWeight: 300,
            letterSpacing: 3,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          {tagline}
        </span>
      </div>
    </AbsoluteFill>
  );
};
