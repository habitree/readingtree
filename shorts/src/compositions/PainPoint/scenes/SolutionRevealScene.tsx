import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { Logo } from "../../../components/core/Logo";

interface SolutionRevealSceneProps {
  text: string;
}

/**
 * 해결책 제시 씬 — "이 앱 하나면..."
 */
export const SolutionRevealScene: React.FC<SolutionRevealSceneProps> = ({
  text,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const textOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [20, 40], [20, 0], {
    extrapolateRight: "clamp",
  });

  // 밝아지는 글로우
  const glowOpacity = interpolate(frame, [0, 30], [0, 0.1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${brandColors.forest[500]}20 0%, transparent 60%)`,
          opacity: glowOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          position: "relative",
        }}
      >
        <div style={{ transform: `scale(${logoScale})` }}>
          <Logo size={50} color={brandColors.forest[500]} />
        </div>

        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            fontFamily: fonts.sans,
            color: "rgba(255,255,255,0.95)",
            textAlign: "center",
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            padding: "0 60px",
            lineHeight: 1.5,
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
