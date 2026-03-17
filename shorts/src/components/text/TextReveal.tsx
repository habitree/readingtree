import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, fonts } from "../../config/brand";

interface TextRevealProps {
  text: string;
  fontSize?: number;
  color?: string;
  startFrame?: number;
  mode?: "word" | "char" | "line";
}

/**
 * 텍스트 등장 애니메이션
 * - word: 단어 단위 (기본)
 * - char: 글자 단위
 * - line: 줄 단위 (\n 기준) - 감성 인용구에 적합
 */
export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  fontSize = 48,
  color = brandColors.text,
  startFrame = 0,
  mode = "word",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (mode === "line") {
    const lines = text.split("\n");
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "0 80px",
        }}
      >
        {lines.map((line, i) => {
          const delay = startFrame + i * 20;
          const localFrame = Math.max(0, frame - delay);
          const translateY = interpolate(localFrame, [0, 15], [30, 0], {
            extrapolateRight: "clamp",
          });
          const opacity = interpolate(localFrame, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
          });

          return (
            <span
              key={i}
              style={{
                fontSize,
                fontWeight: 400,
                fontFamily: fonts.serif,
                color,
                opacity,
                transform: `translateY(${translateY}px)`,
                display: "block",
                textAlign: "center",
                lineHeight: 1.7,
                letterSpacing: -0.5,
              }}
            >
              {line}
            </span>
          );
        })}
      </div>
    );
  }

  const units = mode === "word" ? text.split(/(\s+)/) : text.split("");
  const delayPerUnit = mode === "word" ? 6 : 2;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: mode === "word" ? 10 : 2,
        padding: "0 80px",
        lineHeight: 1.7,
      }}
    >
      {units.map((unit, i) => {
        if (mode === "word" && unit.trim() === "") return null;

        const delay = startFrame + i * delayPerUnit;
        const localFrame = Math.max(0, frame - delay);
        const scale = spring({
          frame: localFrame,
          fps,
          config: { damping: 14, stiffness: 160 },
        });
        const opacity = interpolate(localFrame, [0, 8], [0, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight: 400,
              fontFamily: fonts.serif,
              color,
              opacity,
              transform: `scale(${scale})`,
              display: "inline-block",
            }}
          >
            {unit}
          </span>
        );
      })}
    </div>
  );
};
