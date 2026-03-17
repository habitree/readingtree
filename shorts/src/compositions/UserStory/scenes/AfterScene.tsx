import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { TextReveal } from "../../../components/text/TextReveal";

interface AfterSceneProps {
  text: string;
  stat: string;
}

/**
 * After 씬 — 밝은 Forest 톤, 변화된 모습
 */
export const AfterScene: React.FC<AfterSceneProps> = ({ text, stat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const statScale = spring({
    frame: Math.max(0, frame - 80),
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  // 밝은 배경 글로우
  const glowOpacity = interpolate(frame, [0, 30], [0.05, 0.12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${brandColors.forest[500]}25 0%, transparent 70%)`,
          opacity: glowOpacity,
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
        {/* AFTER 배지 */}
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: fonts.english,
            letterSpacing: 6,
            color: brandColors.forest[400],
            textTransform: "uppercase" as const,
          }}
        >
          After
        </span>

        {/* 변화 텍스트 */}
        <TextReveal
          text={text}
          fontSize={38}
          startFrame={10}
          mode="line"
          color="rgba(255,255,255,0.92)"
        />

        {/* 수치 강조 */}
        <div style={{ transform: `scale(${statScale})`, textAlign: "center" }}>
          <span
            style={{
              fontSize: 80,
              fontWeight: 900,
              fontFamily: fonts.english,
              color: brandColors.forest[400],
            }}
          >
            {stat}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
