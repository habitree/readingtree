import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";

interface ProblemSceneProps {
  painPoints: string[];
}

/**
 * 문제 제기 씬 - 흩어진 독서 기록의 불편함을 시각화
 */
export const ProblemScene: React.FC<ProblemSceneProps> = ({ painPoints }) => {
  const frame = useCurrentFrame();

  // 타이틀 등장
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // 페이드 아웃
  const fadeOut = interpolate(frame, [180, 210], [1, 0], {
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
          gap: 48,
          padding: "0 80px",
        }}
      >
        {/* 질문 */}
        <span
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 36,
            fontFamily: fonts.serif,
            fontWeight: 700,
            textAlign: "center",
            opacity: titleOpacity,
            lineHeight: 1.5,
          }}
        >
          독서 기록,{"\n"}어디에 하고 계신가요?
        </span>

        {/* 고통 포인트들 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            alignItems: "center",
          }}
        >
          {painPoints.map((point, i) => {
            const delay = 30 + i * 25;
            const localFrame = Math.max(0, frame - delay);
            const opacity = interpolate(localFrame, [0, 15], [0, 1], {
              extrapolateRight: "clamp",
            });
            const x = interpolate(localFrame, [0, 15], [40, 0], {
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: brandColors.forest[400],
                    opacity: 0.6,
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 24,
                    fontFamily: fonts.sans,
                    fontWeight: 300,
                  }}
                >
                  {point}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
