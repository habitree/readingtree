import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, brandColors } from "../../../config/brand";

/**
 * 첫 3초 훅 - 강렬한 질문으로 시작
 */
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ["독서 기록,", "어디에", "하고 계세요?"];

  const fadeOut = interpolate(frame, [80, 95], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
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
          gap: 8,
        }}
      >
        {words.map((word, i) => {
          const delay = i * 12;
          const wordSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.8 },
          });
          const scale = interpolate(wordSpring, [0, 1], [1.4, 1]);
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });

          return (
            <span
              key={i}
              style={{
                color: i === 2 ? brandColors.primary : "#FFFFFF",
                fontSize: i === 2 ? 62 : 56,
                fontFamily: fonts.serif,
                fontWeight: 700,
                transform: `scale(${scale})`,
                opacity,
                textAlign: "center",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
