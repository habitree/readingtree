import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, brandColors } from "../../../config/brand";
import { Logo } from "../../../components/core/Logo";

interface IntroSceneProps {
  tagline: string;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [20, 40], [20, 0], {
    extrapolateRight: "clamp",
  });
  const lineWidth = spring({
    frame: frame - 35,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const lineW = interpolate(lineWidth, [0, 1], [0, 240]);

  const fadeOut = interpolate(frame, [110, 130], [1, 0], {
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
          gap: 40,
        }}
      >
        <Logo size={56} showText={true} />

        <div
          style={{
            width: lineW,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${brandColors.primary}, transparent)`,
          }}
        />

        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {tagline.split("\n").map((line, i) => (
            <span
              key={i}
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 34,
                fontFamily: fonts.serif,
                textAlign: "center",
                letterSpacing: 2,
              }}
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
