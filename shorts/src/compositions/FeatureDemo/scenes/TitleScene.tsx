import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { fonts, brandColors } from "../../../config/brand";
import { Logo } from "../../../components/core/Logo";

interface TitleSceneProps {
  featureTitle: string;
  featureSubtitle: string;
}

export const TitleScene: React.FC<TitleSceneProps> = ({
  featureTitle,
  featureSubtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [15, 35], [30, 0], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [25, 55], [0, 200], { extrapolateRight: "clamp" });

  // fadeout
  const fadeOut = interpolate(frame, [110, 130], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

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
          transform: `scale(${logoScale})`,
        }}
      >
        <Logo size={48} showText={true} />

        <div
          style={{
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${brandColors.primary}, transparent)`,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <span
            style={{
              color: brandColors.primary,
              fontSize: 24,
              fontFamily: fonts.sans,
              fontWeight: 500,
              letterSpacing: 4,
            }}
          >
            FEATURE
          </span>
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 52,
              fontFamily: fonts.serif,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {featureTitle}
          </span>
        </div>

        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 22,
            fontFamily: fonts.sans,
            textAlign: "center",
            opacity: subtitleOpacity,
          }}
        >
          {featureSubtitle}
        </span>
      </div>
    </AbsoluteFill>
  );
};
