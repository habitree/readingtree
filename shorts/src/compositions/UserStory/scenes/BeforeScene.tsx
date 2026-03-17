import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TextReveal } from "../../../components/text/TextReveal";

interface BeforeSceneProps {
  text: string;
  stat: string;
}

/**
 * Before 씬 — 어두운 톤, 문제 상황
 */
export const BeforeScene: React.FC<BeforeSceneProps> = ({ text, stat }) => {
  const frame = useCurrentFrame();

  const statOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
  });
  const statScale = interpolate(frame, [60, 80], [0.6, 1], {
    extrapolateRight: "clamp",
  });

  // 어두운 오버레이 효과
  const overlayOpacity = interpolate(frame, [0, 15], [0, 0.3], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 어두운 분위기 오버레이 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(200,50,50,0.04) 0%, transparent 70%)`,
          opacity: overlayOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* BEFORE 배지 */}
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: fonts.english,
            letterSpacing: 6,
            color: "rgba(255,100,100,0.7)",
            textTransform: "uppercase" as const,
          }}
        >
          Before
        </span>

        {/* 문제 상황 텍스트 */}
        <TextReveal
          text={text}
          fontSize={38}
          startFrame={10}
          mode="line"
          color="rgba(255,255,255,0.7)"
        />

        {/* 수치 강조 */}
        <div
          style={{
            opacity: statOpacity,
            transform: `scale(${statScale})`,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              fontFamily: fonts.english,
              color: "rgba(255,100,100,0.6)",
            }}
          >
            {stat}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
