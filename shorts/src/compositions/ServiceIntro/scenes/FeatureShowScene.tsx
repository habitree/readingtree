import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { ServiceStat } from "../../../types/service-intro";

interface FeatureShowSceneProps {
  stats: ServiceStat[];
}

/**
 * 기능 하이라이트 씬 - 핵심 키워드 + 통계
 */
export const FeatureShowScene: React.FC<FeatureShowSceneProps> = ({ stats }) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 페이드 아웃
  const fadeOut = interpolate(frame, [200, 240], [1, 0], {
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
          gap: 56,
          padding: "0 80px",
        }}
      >
        {/* 메인 카피 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: titleOpacity,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 36,
              fontFamily: fonts.serif,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            기록은 ReadTree에,{"\n"}기억은 당신에게
          </span>
        </div>

        {/* 통계 카드들 */}
        <div
          style={{
            display: "flex",
            gap: 40,
            justifyContent: "center",
          }}
        >
          {stats.map((stat, i) => {
            const delay = 40 + i * 20;
            const localFrame = Math.max(0, frame - delay);
            const opacity = interpolate(localFrame, [0, 15], [0, 1], {
              extrapolateRight: "clamp",
            });
            const y = interpolate(localFrame, [0, 15], [20, 0], {
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <span
                  style={{
                    color: brandColors.forest[400],
                    fontSize: 40,
                    fontFamily: fonts.english,
                    fontWeight: 800,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 16,
                    fontFamily: fonts.sans,
                    letterSpacing: 1,
                  }}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
