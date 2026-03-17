import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { brandColors, fonts } from "../../config/brand";

interface TreeLevelProps {
  level: number;
  size?: number;
}

export const TreeLevel: React.FC<TreeLevelProps> = ({ level, size = 200 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clampedLevel = Math.max(1, Math.min(10, level));
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        transform: `scale(${scale})`,
      }}
    >
      <Img
        src={staticFile(`images/trees/level-${clampedLevel}.webp`)}
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
      />
      <span
        style={{
          fontSize: 18,
          color: brandColors.textMuted,
          fontFamily: fonts.sans,
        }}
      >
        Lv.{clampedLevel}
      </span>
    </div>
  );
};
