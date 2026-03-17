import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TreesIcon } from "../../../components/core/TreesIcon";

interface ClosingSceneProps {
  ctaText: string;
}

/**
 * 클로징 씬 - 로고 + CTA + 슬로건
 */
export const ClosingScene: React.FC<ClosingSceneProps> = ({ ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const btnScale = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const sloganOpacity = interpolate(frame, [60, 85], [0, 1], {
    extrapolateRight: "clamp",
  });
  const sloganY = interpolate(frame, [60, 85], [15, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
        }}
      >
        {/* 로고 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TreesIcon size={52} color="#36a678" strokeWidth={2} />
          <span
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: 36,
              fontWeight: 700,
              fontFamily: fonts.english,
              letterSpacing: 2,
            }}
          >
            ReadTree
          </span>
        </div>

        {/* CTA 버튼 */}
        <div
          style={{
            background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.forest[600]} 100%)`,
            borderRadius: 60,
            padding: "22px 56px",
            transform: `scale(${btnScale})`,
            boxShadow: `0 8px 40px rgba(54, 166, 120, 0.3)`,
          }}
        >
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 28,
              fontWeight: 600,
              fontFamily: fonts.sans,
              letterSpacing: 0.5,
            }}
          >
            {ctaText}
          </span>
        </div>

        {/* 슬로건 */}
        <span
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 18,
            fontFamily: fonts.sans,
            letterSpacing: 2,
            opacity: sloganOpacity,
            transform: `translateY(${sloganY}px)`,
          }}
        >
          독서 기록이 사라지지 않는 시대
        </span>
      </div>
    </AbsoluteFill>
  );
};
