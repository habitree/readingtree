import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Logo } from "../../../components/core/Logo";
import { brandColors, fonts } from "../../../config/brand";

/**
 * 오프닝 씬 - 서비스 헤더와 동일한 로고(Trees + ReadTree) + 시리즈 타이틀
 */
export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();

  const badgeOpacity = interpolate(frame, [40, 58], [0, 1], {
    extrapolateRight: "clamp",
  });
  const badgeY = interpolate(frame, [40, 58], [10, 0], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [50, 75], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* 메인 로고: Trees 아이콘 + ReadTree (가로 배치, 헤더와 동일) */}
        <Logo size={60} color="#36a678" />

        {/* 장식 라인 */}
        <div
          style={{
            width: lineWidth,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${brandColors.forest[400]}60, transparent)`,
          }}
        />

        {/* 시리즈 타이틀 */}
        <span
          style={{
            color: brandColors.forest[300],
            fontSize: 20,
            fontWeight: 400,
            fontFamily: fonts.sans,
            letterSpacing: 6,
            opacity: badgeOpacity,
            transform: `translateY(${badgeY}px)`,
          }}
        >
          오늘의 문장
        </span>
      </div>
    </AbsoluteFill>
  );
};
