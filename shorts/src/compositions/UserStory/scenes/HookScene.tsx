import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface HookSceneProps {
  userName: string;
  duration: string;
}

/**
 * 후킹 씬 — 패턴 인터럽트: "3개월 전의 저는..."
 */
export const HookScene: React.FC<HookSceneProps> = ({ userName, duration }) => {
  const frame = useCurrentFrame();

  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [10, 30], [30, 0], {
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
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
            fontSize: 52,
            fontWeight: 800,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.95)",
            textAlign: "center",
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            lineHeight: 1.4,
            padding: "0 60px",
          }}
        >
          {duration} 전의 저는...
        </span>
        <span
          style={{
            fontSize: 22,
            fontFamily: fonts.sans,
            color: brandColors.forest[400],
            opacity: subOpacity,
            letterSpacing: 2,
          }}
        >
          {userName}님의 이야기
        </span>
      </div>
    </AbsoluteFill>
  );
};
