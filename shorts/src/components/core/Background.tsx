import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

interface BackgroundProps {
  theme?: "forest-dark" | "forest-light" | "paper";
}

/**
 * 유기적인 숲 배경 - 깊은 숲 밤의 느낌
 * 다층 그라데이션 + 중앙 미세 글로우로 깊이감 부여
 */
export const Background: React.FC<BackgroundProps> = ({
  theme = "forest-dark",
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 중앙 글로우 미세 호흡 (매우 느리게)
  const glowScale = interpolate(frame, [0, 300, 600], [1, 1.08, 1], {
    extrapolateRight: "extend",
  });

  const themes = {
    "forest-dark": {
      base: "radial-gradient(ellipse 120% 80% at 50% 60%, #0f2e1f 0%, #091a11 50%, #050e09 100%)",
      glow: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(54, 166, 120, 0.06) 0%, transparent 70%)",
    },
    "forest-light": {
      base: "radial-gradient(ellipse 120% 80% at 50% 60%, #e1f8e8 0%, #c3eed4 50%, #f2fcf5 100%)",
      glow: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(54, 166, 120, 0.08) 0%, transparent 70%)",
    },
    paper: {
      base: "radial-gradient(ellipse 120% 80% at 50% 60%, #34291F 0%, #1a1410 50%, #0d0a07 100%)",
      glow: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(191, 165, 134, 0.05) 0%, transparent 70%)",
    },
  };

  const t = themes[theme];

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* 기본 배경 */}
      <AbsoluteFill style={{ background: t.base }} />
      {/* 중앙 은은한 글로우 */}
      <AbsoluteFill
        style={{
          background: t.glow,
          transform: `scale(${glowScale})`,
        }}
      />
      {/* 상단 비네팅 */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.25) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
