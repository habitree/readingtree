import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { brandColors } from "../../config/brand";

interface ProgressBarProps {
  progress: number; // 0~1
  width?: number;
  height?: number;
  startFrame?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  width = 600,
  height = 12,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - startFrame);

  const animatedWidth = interpolate(localFrame, [0, 30], [0, progress * width], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: "rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: animatedWidth,
          height: "100%",
          borderRadius: height / 2,
          background: `linear-gradient(90deg, ${brandColors.primary} 0%, ${brandColors.primaryLight} 100%)`,
        }}
      />
    </div>
  );
};
